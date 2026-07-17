import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, CheckCircle2, X } from 'lucide-react'

export interface ComponentInfo {
  id: string
  name: string
  shortName: string
  status: 'healthy' | 'faulty' | 'warning'
  purpose: string
  condition: string
  reason: string
  businessImpact: string
  action: string
  urgency: 'immediate' | 'soon' | 'monitor'
  stats: { label: string; value: string }[]
  position: { x: number; y: number; width: number; height: number } // in SVG coords
}

export const MACHINE_COMPONENTS: ComponentInfo[] = [
  {
    id: 'motor',
    name: 'Drive Motor',
    shortName: 'MOTOR',
    status: 'healthy',
    purpose: 'Converts electrical energy into mechanical rotation, driving the machine\'s primary spindle.',
    condition: 'Operating Normally',
    reason: 'All electrical parameters within spec. Current draw is 4.2A vs rated 4.5A — optimal.',
    businessImpact: 'Motor failure would stop production immediately. Replacement takes 4–6 hours.',
    action: 'Continue monitoring. Schedule thermal inspection in 30 days.',
    urgency: 'monitor',
    stats: [{ label: 'Current Draw', value: '4.2A' }, { label: 'Temp', value: '48°C' }, { label: 'Health', value: '97%' }],
    position: { x: 60, y: 50, width: 80, height: 70 },
  },
  {
    id: 'bearing',
    name: 'Front Bearing Assembly',
    shortName: 'BEARING',
    status: 'faulty',
    purpose: 'Allows the rotating shaft to spin with minimal friction. Critical for smooth machine operation.',
    condition: 'High Wear Detected — Critical',
    reason: 'Vibration resonance at 8.7 mm/s indicates advanced bearing wear. Lubrication degraded over 30 operating days. Adjacent conveyor is amplifying resonance.',
    businessImpact: 'Without replacement within 18 hours, production Line A will halt. Estimated unplanned repair: ₹8.2 lakh vs ₹0.4 lakh for planned replacement.',
    action: 'Replace bearing assembly immediately. Ravi Kumar (CNC Specialist) is available from 2 PM.',
    urgency: 'immediate',
    stats: [{ label: 'Vibration', value: '8.7 mm/s' }, { label: 'Wear Level', value: 'Critical' }, { label: 'Life Left', value: '<18h' }],
    position: { x: 155, y: 55, width: 75, height: 65 },
  },
  {
    id: 'temp_sensor',
    name: 'Temperature Sensor',
    shortName: 'TEMP',
    status: 'warning',
    purpose: 'Monitors internal machine temperature. Triggers automatic shutdown if thresholds are crossed to prevent damage.',
    condition: 'Elevated Reading — Warning',
    reason: 'Reporting 94°C — up from 52°C baseline. The heat is a consequence of the bearing wear, not a primary failure. Sensor itself is accurate.',
    businessImpact: 'If temperature rises above 110°C, automatic emergency shutdown will trigger — halting Line A and impacting 3 downstream machines.',
    action: 'The temperature will normalize once the bearing is replaced. Monitor closely until maintenance is complete.',
    urgency: 'soon',
    stats: [{ label: 'Current Temp', value: '94°C' }, { label: 'Baseline', value: '52°C' }, { label: 'Threshold', value: '110°C' }],
    position: { x: 245, y: 60, width: 60, height: 55 },
  },
  {
    id: 'coolant',
    name: 'Coolant Pump',
    shortName: 'COOLANT',
    status: 'healthy',
    purpose: 'Circulates coolant fluid through the machine to dissipate heat from cutting operations and maintain optimal operating temperature.',
    condition: 'Operating Normally',
    reason: 'Flow rate is 12.3 L/min vs rated 12.0 L/min. Coolant temperature differential is within spec.',
    businessImpact: 'Coolant failure would cause thermal runaway within 45 minutes, potentially damaging the spindle motor and cutting tools.',
    action: 'Schedule fluid replacement in 15 days (due at 500h operating hours).',
    urgency: 'monitor',
    stats: [{ label: 'Flow Rate', value: '12.3 L/min' }, { label: 'Fluid Level', value: '87%' }, { label: 'Health', value: '94%' }],
    position: { x: 325, y: 55, width: 70, height: 60 },
  },
]

interface DigitalTwinProps {
  onVisionComplete?: () => void
  runVisionMode?: boolean
}

type VisionStep = { componentId: string; message: string; delay: number }

const VISION_SEQUENCE: VisionStep[] = [
  { componentId: 'motor', message: 'Drive motor — operating normally. Electrical parameters within spec.', delay: 0 },
  { componentId: 'bearing', message: 'Front bearing assembly — CRITICAL wear detected. Vibration at 8.7 mm/s.', delay: 2200 },
  { componentId: 'temp_sensor', message: 'Temperature sensor reporting 94°C — elevated due to bearing friction heat.', delay: 4400 },
  { componentId: 'coolant', message: 'Coolant pump — healthy. Circulating at 12.3 L/min.', delay: 6200 },
]

export default function DigitalTwin({ onVisionComplete, runVisionMode = false }: DigitalTwinProps) {
  const [activeComponent, setActiveComponent] = useState<string | null>(null)
  const [visionStep, setVisionStep] = useState(-1)
  const [visionMessage, setVisionMessage] = useState('')
  const [selectedInfo, setSelectedInfo] = useState<ComponentInfo | null>(null)

  const startVision = () => {
    setVisionStep(0)
    VISION_SEQUENCE.forEach((step, i) => {
      setTimeout(() => {
        setActiveComponent(step.componentId)
        setVisionMessage(step.message)
        setVisionStep(i)
      }, step.delay)
    })
    setTimeout(() => {
      setActiveComponent('bearing')
      onVisionComplete?.()
    }, VISION_SEQUENCE[VISION_SEQUENCE.length - 1].delay + 2000)
  }

  const handleComponentClick = (comp: ComponentInfo) => {
    setActiveComponent(comp.id)
    setSelectedInfo(comp)
  }

  const statusColor = (s: ComponentInfo['status']) =>
    s === 'faulty' ? '#EF4444' : s === 'warning' ? '#F59E0B' : '#22C55E'

  const urgencyLabel = (u: ComponentInfo['urgency']) =>
    u === 'immediate' ? 'Immediate Action' : u === 'soon' ? 'Action within 24h' : 'Monitor'

  return (
    <div className="space-y-3">
      {/* Vision Mode trigger */}
      {!runVisionMode && (
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#94A3B8' }}>
            Interactive Digital Twin — Click any component
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={startVision}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
            style={{ background: 'linear-gradient(135deg,rgba(59,130,246,0.2),rgba(6,182,212,0.2))', border: '1px solid rgba(6,182,212,0.35)', color: '#06B6D4' }}>
            ⚡ Run AI Vision Analysis
          </motion.button>
        </div>
      )}

      {/* Vision message */}
      <AnimatePresence mode="wait">
        {visionMessage && (
          <motion.div
            key={visionMessage}
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="px-4 py-2 rounded-xl text-xs font-medium"
            style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: '#94A3B8' }}>
            🔍 {visionMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Machine SVG */}
      <div className="relative rounded-xl overflow-hidden" style={{ background: 'rgba(11,18,32,0.9)', border: '1px solid rgba(59,130,246,0.12)' }}>
        <svg viewBox="0 0 480 190" width="100%" style={{ maxHeight: 190 }}>
          <defs>
            <linearGradient id="dtMachineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1E3A5F" />
              <stop offset="100%" stopColor="#0F2040" />
            </linearGradient>
            <filter id="dtGlow">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Machine chassis */}
          <rect x="45" y="30" width="390" height="140" rx="14" fill="url(#dtMachineGrad)" stroke="rgba(59,130,246,0.3)" strokeWidth="1.5" />
          <text x="240" y="22" textAnchor="middle" fill="rgba(148,163,184,0.7)" fontSize="9" fontFamily="Space Grotesk" letterSpacing="1.5">
            MACHINE M-104 — CNC MACHINING CENTER (DIGITAL TWIN)
          </text>

          {/* Drive shaft */}
          <rect x="65" y="94" width="350" height="12" rx="4" fill="rgba(59,130,246,0.06)" stroke="rgba(59,130,246,0.2)" strokeWidth="1" strokeDasharray="6 3" />
          <line x1="65" y1="100" x2="415" y2="100" stroke="rgba(59,130,246,0.25)" strokeWidth="1" strokeDasharray="4 4" />

          {/* Connection lines */}
          <line x1="140" y1="100" x2="155" y2="100" stroke="rgba(59,130,246,0.4)" strokeWidth="2.5" />
          <line x1="230" y1="100" x2="245" y2="100" stroke="rgba(59,130,246,0.4)" strokeWidth="2.5" />
          <line x1="305" y1="100" x2="325" y2="100" stroke="rgba(59,130,246,0.4)" strokeWidth="2.5" />

          {/* Render each component */}
          {MACHINE_COMPONENTS.map(comp => {
            const isActive = activeComponent === comp.id
            const color = statusColor(comp.status)
            const { x, y, width, height } = comp.position

            return (
              <motion.g
                key={comp.id}
                onClick={() => handleComponentClick(comp)}
                style={{ cursor: 'pointer' }}
                animate={{ filter: isActive ? 'brightness(1.4)' : 'brightness(1)' }}
              >
                {/* Outer glow on active */}
                {isActive && (
                  <motion.rect
                    x={x - 4} y={y - 4} width={width + 8} height={height + 8} rx="12"
                    fill="none" stroke={color} strokeWidth="2"
                    animate={{ strokeOpacity: [0.8, 0.2, 0.8], scale: [1, 1.03, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    style={{ originX: `${x + width / 2}px`, originY: `${y + height / 2}px` }}
                  />
                )}

                {/* Component body */}
                <rect x={x} y={y} width={width} height={height} rx="9"
                  fill={`${color}${isActive ? '18' : '08'}`}
                  stroke={`${color}${isActive ? '80' : '45'}`}
                  strokeWidth={isActive ? 2 : 1.5} />

                {/* Component internals */}
                {comp.id === 'motor' && (
                  <motion.g animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    style={{ originX: `${x + width / 2}px`, originY: `${y + height / 2}px` }}>
                    <circle cx={x + width / 2} cy={y + height / 2} r={Math.min(width, height) * 0.3} fill="none" stroke={`${color}60`} strokeWidth="2" strokeDasharray="6 3" />
                    <circle cx={x + width / 2} cy={y + height / 2} r={Math.min(width, height) * 0.12} fill={color} />
                  </motion.g>
                )}
                {comp.id === 'bearing' && [0, 60, 120, 180, 240, 300].map((deg, i) => {
                  const rad = deg * Math.PI / 180
                  const r = Math.min(width, height) * 0.25
                  return <circle key={i} cx={x + width / 2 + r * Math.cos(rad)} cy={y + height / 2 + r * Math.sin(rad)} r="3" fill={color} opacity="0.8" />
                })}
                {comp.id === 'temp_sensor' && (
                  <motion.rect x={x + width * 0.35} y={y + height * 0.25} width={width * 0.3} height={height * 0.5} rx="3"
                    fill={`${color}40`} animate={{ height: [`${height * 0.3}`, `${height * 0.55}`, `${height * 0.3}`] as any }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ originY: `${y + height}px` }} />
                )}
                {comp.id === 'coolant' && (
                  <motion.g animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    style={{ originX: `${x + width / 2}px`, originY: `${y + height / 2}px` }}>
                    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
                      const rad = deg * Math.PI / 180; const r = 12
                      return <ellipse key={i} cx={x + width / 2 + r * Math.cos(rad)} cy={y + height / 2 + r * Math.sin(rad)} rx="5" ry="2.5" fill={`${color}${i % 2 === 0 ? '70' : '40'}`} transform={`rotate(${deg}, ${x + width / 2 + r * Math.cos(rad)}, ${y + height / 2 + r * Math.sin(rad)})`} />
                    })}
                    <circle cx={x + width / 2} cy={y + height / 2} r="5" fill={color} />
                  </motion.g>
                )}

                {/* Label */}
                <text x={x + width / 2} y={y + height + 11} textAnchor="middle" fill={color} fontSize="7.5" fontFamily="Inter" fontWeight="600">{comp.shortName}</text>
                <motion.text x={x + width / 2} y={y + height + 20} textAnchor="middle"
                  fill={comp.status === 'faulty' ? color : comp.status === 'warning' ? color : 'rgba(34,197,94,0.7)'}
                  fontSize="6.5" fontFamily="Inter"
                  animate={comp.status === 'faulty' ? { opacity: [1, 0.4, 1] } : {}}
                  transition={{ duration: 0.8, repeat: Infinity }}>
                  {comp.status === 'faulty' ? '⚠ CRITICAL' : comp.status === 'warning' ? '⚡ WARNING' : '✓ OK'}
                </motion.text>
              </motion.g>
            )
          })}
        </svg>
      </div>

      {/* Component Knowledge Panel */}
      <AnimatePresence>
        {selectedInfo && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className="rounded-2xl overflow-hidden"
            style={{ border: `1px solid ${statusColor(selectedInfo.status)}30`, background: 'rgba(11,18,32,0.95)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3"
              style={{ background: `${statusColor(selectedInfo.status)}0A`, borderBottom: `1px solid ${statusColor(selectedInfo.status)}18` }}>
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full"
                  style={{ background: statusColor(selectedInfo.status), boxShadow: `0 0 8px ${statusColor(selectedInfo.status)}` }} />
                <div>
                  <div className="font-bold text-sm" style={{ color: '#F8FAFC', fontFamily: 'Space Grotesk' }}>{selectedInfo.name}</div>
                  <div className="text-xs" style={{ color: statusColor(selectedInfo.status) }}>{selectedInfo.condition}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-2.5 py-1 rounded-full text-xs font-bold"
                  style={{ background: `${statusColor(selectedInfo.status)}15`, color: statusColor(selectedInfo.status), border: `1px solid ${statusColor(selectedInfo.status)}30` }}>
                  {urgencyLabel(selectedInfo.urgency)}
                </div>
                <button onClick={() => setSelectedInfo(null)} style={{ color: '#475569', cursor: 'pointer' }}>
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Stat row */}
            <div className="flex gap-0 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              {selectedInfo.stats.map((s, i) => (
                <div key={i} className="flex-1 px-4 py-2 text-center" style={{ borderRight: i < selectedInfo.stats.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div className="text-sm font-bold" style={{ color: statusColor(selectedInfo.status), fontFamily: 'Space Grotesk' }}>{s.value}</div>
                  <div className="text-xs" style={{ color: '#475569' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3 p-4">
              {[
                { label: '📘 Purpose', text: selectedInfo.purpose },
                { label: '🔍 Reason', text: selectedInfo.reason },
                { label: '⚡ Business Impact', text: selectedInfo.businessImpact },
                { label: '✅ Recommended Action', text: selectedInfo.action },
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="text-xs font-bold mb-1" style={{ color: '#94A3B8' }}>{item.label}</div>
                  <div className="text-xs leading-relaxed" style={{ color: '#CBD5E1' }}>{item.text}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
