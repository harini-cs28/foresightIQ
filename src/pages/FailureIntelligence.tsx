import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ScatterChart, Scatter, ZAxis
} from 'recharts'
import { AlertTriangle, TrendingUp, Zap, Clock, Info, ChevronDown } from 'lucide-react'

const FAILURE_EVENTS = [
  { id: 'F001', machine: 'CNC-07', type: 'Bearing Failure', prob: 87, eta: '~4 hours', impact: '₹8.2L', signals: ['High vibration (8.7mm/s)', 'Temperature spike (+12°C)', 'Acoustic anomaly detected'], trend: 'rising', severity: 'critical' },
  { id: 'F002', machine: 'Robot Arm B4', type: 'Coolant System', prob: 63, eta: '12–24 hours', impact: '₹3.4L', signals: ['Temperature: 72°C', 'Coolant pressure drop 18%', 'Thermal camera anomaly'], trend: 'rising', severity: 'warning' },
  { id: 'F003', machine: 'Conveyor Line 3', type: 'Belt Wear', prob: 54, eta: '18–30 hours', impact: '₹2.1L', signals: ['Belt elongation +3.2%', 'Tension deviation 12%', 'Surface crack detected'], trend: 'stable', severity: 'warning' },
  { id: 'F004', machine: 'Mill-11', type: 'Spindle Bearing', prob: 28, eta: '48–72 hours', impact: '₹1.2L', signals: ['Micro-vibration pattern', 'Lubrication viscosity drop'], trend: 'rising', severity: 'low' },
  { id: 'F005', machine: 'Lathe-09', type: 'Chuck Wear', prob: 19, eta: '60–72 hours', impact: '₹0.8L', signals: ['Positioning error +0.02mm'], trend: 'stable', severity: 'low' },
]

const historicalData = [
  { month: 'Jan', predicted: 8, actual: 7, prevented: 6 },
  { month: 'Feb', predicted: 12, actual: 10, prevented: 9 },
  { month: 'Mar', predicted: 6, actual: 5, prevented: 5 },
  { month: 'Apr', predicted: 15, actual: 13, prevented: 11 },
  { month: 'May', predicted: 9, actual: 8, prevented: 7 },
  { month: 'Jun', predicted: 11, actual: 9, prevented: 8 },
]

const radarData = [
  { axis: 'Vibration', value: 87 },
  { axis: 'Temperature', value: 72 },
  { axis: 'Acoustics', value: 63 },
  { axis: 'Power Draw', value: 45 },
  { axis: 'Pressure', value: 38 },
  { axis: 'Lubrication', value: 55 },
]

const scatterData = [
  { x: 2, y: 12, z: 8200, name: 'CNC-07' },
  { x: 14, y: 63, z: 3400, name: 'Robot B4' },
  { x: 22, y: 54, z: 2100, name: 'Conv-L3' },
  { x: 48, y: 28, z: 1200, name: 'Mill-11' },
  { x: 64, y: 19, z: 800, name: 'Lathe-09' },
]

const SEVERITY_CONFIG = {
  critical: { color: '#EF4444', bg: 'rgba(239,68,68,0.08)', badge: 'rgba(239,68,68,0.15)', label: 'Critical' },
  warning: { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', badge: 'rgba(245,158,11,0.15)', label: 'Warning' },
  low: { color: '#3B82F6', bg: 'rgba(59,130,246,0.08)', badge: 'rgba(59,130,246,0.15)', label: 'Low Risk' },
}

export default function FailureIntelligence() {
  const [selected, setSelected] = useState(FAILURE_EVENTS[0])
  const [expanded, setExpanded] = useState<string | null>('F001')

  const cfg = SEVERITY_CONFIG[selected.severity as keyof typeof SEVERITY_CONFIG]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk', color: '#F8FAFC' }}>Failure Intelligence</h1>
          <p className="text-sm mt-0.5" style={{ color: '#94A3B8' }}>AI-powered predictive failure analysis — 72-hour horizon</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium"
          style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#3B82F6' }}>
          <TrendingUp size={14} />
          Model Accuracy: 94.7%
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Failures Predicted', value: '5', icon: Zap, color: '#EF4444' },
          { label: 'Avg. Lead Time', value: '28h', icon: Clock, color: '#F59E0B' },
          { label: 'Total Risk Value', value: '₹15.7L', icon: AlertTriangle, color: '#3B82F6' },
          { label: 'Model Confidence', value: '94.7%', icon: Info, color: '#22C55E' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2, boxShadow: `0 8px 28px ${s.color}15` }}
            transition={{ delay: i * 0.08 }}
            className="p-4 rounded-2xl glass-card glass-card-hover flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${s.color}15` }}>
              <s.icon size={20} style={{ color: s.color }} />
            </div>
            <div>
              <div className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk', color: '#F8FAFC' }}>{s.value}</div>
              <div className="text-xs" style={{ color: '#94A3B8' }}>{s.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Failure list */}
        <div className="space-y-2">
          <div className="text-sm font-semibold mb-3" style={{ color: '#94A3B8' }}>Predicted Events</div>
          {FAILURE_EVENTS.map((f, i) => {
            const sc = SEVERITY_CONFIG[f.severity as keyof typeof SEVERITY_CONFIG]
            const isExp = expanded === f.id
            return (
              <motion.div key={f.id} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}
                whileHover={{ x: 2 }}
                transition={{ delay: i * 0.07 }}
                className="rounded-xl overflow-hidden cursor-pointer transition-all"
                style={{ background: selected.id === f.id ? sc.bg : 'rgba(17,24,39,0.8)', border: `1px solid ${selected.id === f.id ? `${sc.color}30` : 'rgba(59,130,246,0.1)'}` }}
                onClick={() => { setSelected(f); setExpanded(isExp ? null : f.id) }}
              >
                <div className="p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(255,255,255,0.05)', color: '#94A3B8' }}>{f.id}</span>
                      <span className="text-sm font-semibold" style={{ color: '#F8FAFC' }}>{f.machine}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold" style={{ color: sc.color }}>{f.prob}%</span>
                      <motion.div
                        animate={{ rotate: isExp ? 180 : 0 }}
                        transition={{ duration: 0.2 }}>
                        <ChevronDown size={14} style={{ color: '#94A3B8' }} />
                      </motion.div>
                    </div>
                  </div>
                  <div className="text-xs mb-2" style={{ color: '#94A3B8' }}>{f.type} · ETA: {f.eta}</div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ width: `${f.prob}%`, background: sc.color }}
                      animate={f.severity === 'critical' ? { opacity: [0.7, 1, 0.7] } : {}}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </div>
                </div>
                <AnimatePresence>
                  {isExp && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      style={{ overflow: 'hidden' }}
                      className="px-3 pb-3"
                    >
                      <div className="pt-2 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        {f.signals.map((sig, j) => (
                          <div key={j} className="flex items-center gap-1.5 text-xs" style={{ color: '#94A3B8' }}>
                            <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: sc.color }} />
                            {sig}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>

        {/* Detail + charts */}
        <div className="lg:col-span-2 space-y-4">
          {/* Radar chart */}
          <div className="p-5 rounded-2xl glass-card">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-semibold" style={{ color: '#F8FAFC' }}>{selected.machine} — Anomaly Signature</div>
                <div className="text-xs" style={{ color: '#94A3B8' }}>Multi-sensor deviation from baseline</div>
              </div>
              <div className="px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: cfg.badge, color: cfg.color }}>{cfg.label} — {selected.prob}%</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <PolarGrid stroke="rgba(255,255,255,0.06)" />
                  <PolarAngleAxis dataKey="axis" tick={{ fill: '#94A3B8', fontSize: 10 }} />
                  <Radar name="Anomaly" dataKey="value" stroke={cfg.color} fill={cfg.color} fillOpacity={0.15} strokeWidth={1.5} />
                </RadarChart>
              </ResponsiveContainer>
              <div className="flex flex-col justify-center space-y-3">
                {[
                  { label: 'Failure ETA', value: selected.eta, color: cfg.color },
                  { label: 'Financial Impact', value: selected.impact, color: '#22C55E' },
                  { label: 'Failure Type', value: selected.type, color: '#F8FAFC' },
                  { label: 'Trend', value: selected.trend === 'rising' ? '↑ Rising' : '→ Stable', color: selected.trend === 'rising' ? '#EF4444' : '#F59E0B' },
                ].map((m, i) => (
                  <div key={i}>
                    <div className="text-xs" style={{ color: '#94A3B8' }}>{m.label}</div>
                    <div className="text-sm font-semibold" style={{ color: m.color }}>{m.value}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Signal list */}
            <div className="mt-4 flex flex-wrap gap-2">
              {selected.signals.map((s, i) => (
                <span key={i} className="px-2 py-1 rounded-lg text-xs"
                  style={{ background: `${cfg.color}10`, border: `1px solid ${cfg.color}20`, color: '#94A3B8' }}>
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Historical accuracy */}
          <div className="p-5 rounded-2xl glass-card">
            <div className="text-sm font-semibold mb-4" style={{ color: '#F8FAFC' }}>Historical Prediction Accuracy (6 months)</div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={historicalData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="prevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="predicted" name="Predicted" stroke="#3B82F6" fill="url(#predGrad)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="prevented" name="Prevented" stroke="#22C55E" fill="url(#prevGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
