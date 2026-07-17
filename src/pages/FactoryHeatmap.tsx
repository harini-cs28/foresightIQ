import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import {
  Thermometer, Zap, Activity, AlertTriangle, Scan, ChevronRight,
  Cpu, Settings2, Package, Truck, Warehouse, FlaskConical, Bot,
  Cog, Drill, Radio, CircleDot, X, Info, BarChart2, Shield,
  GitBranch, Wind, RotateCcw, Layers3, Maximize2, Minimize2,
  Search, Bell, Clock, TrendingUp, Wifi, Database, Sparkles,
  MapPin
} from 'lucide-react'

// ─────────────────────────────────────────────
// DATA TYPES & CONSTANTS
// ─────────────────────────────────────────────

type MachineStatus = 'healthy' | 'warning' | 'critical' | 'offline'

interface Component {
  id: string
  name: string
  status: MachineStatus
  purpose: string
  condition: string
  reason: string
  impact: string
  action: string
}

interface Machine {
  id: string
  name: string
  type: string
  zoneId: string
  status: MachineStatus
  temp: number
  vibration: number
  power: number
  failureProb: number
  rul: number
  confidence: number
  components: Component[]
  x: number
  y: number
  w: number
  h: number
  icon: string
}

interface Zone {
  id: string
  label: string
  sublabel: string
  x: number
  y: number
  w: number
  h: number
  color: string
  iconName: string
  machines: string[]
}

// ─── Constants ──────────────────────────────────────────────────────────────

const W = 1200
const H = 720
const ZONE_HEADER_HEIGHT = 42 // Increased from 24 to 42 for better readability
const ZONE_PADDING = 16
const MACHINE_GAP = 12

const ZONE_COLORS: Record<string, string> = {
  loading:    'rgba(59,130,246,0.08)',
  rawmat:     'rgba(100,116,139,0.1)',
  cnc:        'rgba(239,68,68,0.06)',
  robotics:   'rgba(6,182,212,0.07)',
  conveyor:   'rgba(59,130,246,0.05)',
  quality:    'rgba(245,158,11,0.07)',
  packaging:  'rgba(34,197,94,0.06)',
  warehouse:  'rgba(139,92,246,0.07)',
  shipping:   'rgba(59,130,246,0.08)',
}

// ─── ZONES with adjusted heights for header ──────────────────────────────

const ZONES: Zone[] = [
  { id: 'loading',   label: 'Loading Dock',          sublabel: 'Inbound',        x: 20,  y: 20,  w: 120, h: 100, color: ZONE_COLORS.loading,   iconName: 'Truck',     machines: ['TRK-01','TRK-02'] },
  { id: 'rawmat',    label: 'Raw Material Storage',  sublabel: 'RM Zone A',      x: 20,  y: 140, w: 120, h: 140, color: ZONE_COLORS.rawmat,    iconName: 'Warehouse', machines: ['RACK-01','RACK-02','RACK-03'] },
  { id: 'cnc',       label: 'CNC Machining',         sublabel: 'Bay 1–4',        x: 160, y: 20,  w: 270, h: 260, color: ZONE_COLORS.cnc,       iconName: 'Cog',       machines: ['CNC-01','CNC-02','CNC-03','CNC-04','DRILL-01','MILL-01'] },
  { id: 'robotics',  label: 'Robotic Assembly Line', sublabel: 'Cell A–C',       x: 450, y: 20,  w: 290, h: 260, color: ZONE_COLORS.robotics,  iconName: 'Bot',       machines: ['ROB-01','ROB-02','ROB-03','PRESS-01','WELD-01'] },
  { id: 'conveyor',  label: 'Conveyor System',       sublabel: 'Line 1–3',       x: 160, y: 300, w: 580, h: 70,  color: ZONE_COLORS.conveyor,  iconName: 'GitBranch', machines: ['CONV-01','CONV-02','CONV-03'] },
  { id: 'quality',   label: 'Quality Inspection',    sublabel: 'QC Bay',         x: 760, y: 20,  w: 200, h: 260, color: ZONE_COLORS.quality,   iconName: 'FlaskConical', machines: ['QC-01','QC-02','CAM-01'] },
  { id: 'packaging', label: 'Packaging',             sublabel: 'Pack Station',   x: 760, y: 300, w: 200, h: 140, color: ZONE_COLORS.packaging, iconName: 'Package',   machines: ['PACK-01','PACK-02'] },
  { id: 'warehouse', label: 'Finished Goods Warehouse', sublabel: 'FG Zone B',  x: 980, y: 20,  w: 200, h: 260, color: ZONE_COLORS.warehouse, iconName: 'Warehouse', machines: ['FG-01','FG-02','FG-03'] },
  { id: 'shipping',  label: 'Shipping Dock',         sublabel: 'Outbound',       x: 980, y: 300, w: 200, h: 140, color: ZONE_COLORS.shipping,  iconName: 'Truck',     machines: ['SHIP-01','SHIP-02'] },
]

const FILTER_ZONES = [
  { id: 'all',       label: 'All Zones',    zoneIds: ZONES.map(z => z.id), icon: Layers3 },
  { id: 'machining', label: 'Machining',    zoneIds: ['cnc'], icon: Cog },
  { id: 'robotics',  label: 'Robotics',     zoneIds: ['robotics'], icon: Bot },
  { id: 'assembly',  label: 'Assembly',     zoneIds: ['conveyor','robotics'], icon: GitBranch },
  { id: 'warehouse', label: 'Warehouse',    zoneIds: ['rawmat','warehouse'], icon: Warehouse },
  { id: 'packaging', label: 'Packaging',    zoneIds: ['packaging'], icon: Package },
  { id: 'quality',   label: 'Quality',      zoneIds: ['quality'], icon: FlaskConical },
  { id: 'logistics', label: 'Logistics',    zoneIds: ['loading','shipping'], icon: Truck },
]

const STATUS_COLOR: Record<MachineStatus, string> = {
  healthy:  '#22C55E',
  warning:  '#F59E0B',
  critical: '#EF4444',
  offline:  '#475569',
}

const STATUS_GLOW: Record<MachineStatus, string> = {
  healthy:  'rgba(34,197,94,0.35)',
  warning:  'rgba(245,158,11,0.35)',
  critical: 'rgba(239,68,68,0.4)',
  offline:  'rgba(71,85,105,0.2)',
}

const SCAN_STEPS = [
  'Initializing factory scan...',
  'Analyzing live telemetry from 1,247 sensors...',
  'Detecting anomalies and patterns...',
  'Cross-referencing maintenance history...',
  'Generating predictive insights...',
  '✨ Analysis complete. AI recommendations ready.',
]

const FORES_MESSAGES: Record<string, string> = {
  'CNC-04': '🔴 CRITICAL: CNC-04 bearing vibration has exceeded safe thresholds at 8.9 mm/s. Temperature spike to 89°C indicates imminent bearing failure. Historical patterns show 94% probability of failure within 18 hours. Immediate intervention recommended.',
  'ROB-02': '🔴 CRITICAL: Robot B joint actuator thermal runaway detected. 91°C with 9.2 mm/s vibration suggests imminent mechanical failure. Production stoppage risk is severe. Shutdown and inspection required.',
  'CNC-02': '⚠️ CNC-02 shows early bearing degradation. Vibration trending +18% over 6 hours. Schedule maintenance within 48 hours to prevent escalation.',
  'DRILL-01': '⚠️ Drilling machine vibration at 4.5 mm/s indicates potential bit wear. Recommend inspection during next shift change.',
  'PRESS-01': '⚠️ Hydraulic Press temperature elevated to 72°C. Fluid degradation likely. Pressure micro-oscillations detected. Schedule fluid analysis.',
  'TRK-02':  '⚠️ Forklift B thermal anomaly detected. Battery health at 82%. Recommend battery inspection.',
  'CONV-02': '⚠️ Conveyor Line 2 belt wear pattern detected. Tension likely too low. Schedule tensioning within 24 hours.',
  'QC-02':   '⚠️ QC Station Beta camera calibration drift. Accuracy reduced by 12%. Recalibration recommended.',
  'FG-03':   '⚠️ AGV Unit 01 battery degradation. Range reduced 18%. Cell replacement recommended.',
}

function mkComponents(baseStatus: MachineStatus): Component[] {
  const healthy: Component = { 
    id:'motor', name:'Motor', status:'healthy', 
    purpose:'Drives the primary shaft', 
    condition:'Normal — operating within spec', 
    reason:'No anomalies detected', 
    impact:'None', 
    action:'Continue monitoring' 
  }
  const bearing: Component = { 
    id:'bearing', name:'Bearing', 
    status: baseStatus === 'critical' ? 'critical' : baseStatus === 'warning' ? 'warning' : 'healthy', 
    purpose:'Reduces rotational friction', 
    condition: baseStatus === 'critical' ? 'Severe wear detected' : baseStatus === 'warning' ? 'Early wear signature' : 'Good condition', 
    reason: baseStatus === 'critical' ? 'High vibration, thermal stress' : baseStatus === 'warning' ? 'Slight vibration increase' : 'Normal operation', 
    impact: baseStatus === 'critical' ? 'Machine seizure risk in <18h' : baseStatus === 'warning' ? 'Reduced efficiency' : 'None', 
    action: baseStatus === 'critical' ? 'Replace immediately' : baseStatus === 'warning' ? 'Schedule replacement <72h' : 'No action needed' 
  }
  const rotor: Component = { 
    id:'rotor', name:'Rotor', status:'healthy', 
    purpose:'Rotates to convert energy', 
    condition:'Normal — balanced', 
    reason:'Balanced vibration signature', 
    impact:'None', 
    action:'Continue monitoring' 
  }
  const fan: Component = { 
    id:'fan', name:'Cooling Fan', 
    status: baseStatus === 'critical' ? 'warning' : 'healthy', 
    purpose:'Dissipates heat from motor', 
    condition: baseStatus === 'critical' ? 'Reduced airflow' : 'Good airflow', 
    reason: baseStatus === 'critical' ? 'Partial blockage detected' : 'Clean, unobstructed', 
    impact: baseStatus === 'critical' ? 'Thermal runaway risk' : 'None', 
    action: baseStatus === 'critical' ? 'Clean fan blades' : 'No action needed' 
  }
  const shaft: Component = { 
    id:'shaft', name:'Drive Shaft', status:'healthy', 
    purpose:'Transmits torque to output', 
    condition:'Normal — no eccentricity', 
    reason:'Alignment within tolerance', 
    impact:'None', 
    action:'Continue monitoring' 
  }
  return [healthy, bearing, rotor, fan, shaft]
}

// ─── MACHINES with recalculated positions ─────────────────────────────────

const MACHINES: Machine[] = [
  // Loading Dock (y starts at 20 + ZONE_HEADER_HEIGHT = 62)
  { id:'TRK-01', name:'Forklift A',        type:'Forklift',          zoneId:'loading',   status:'healthy',  temp:42, vibration:1.2, power:12, failureProb:4,  rul:720, confidence:96, icon:'Truck',        x:30,  y:68,  w:44, h:28, components: mkComponents('healthy') },
  { id:'TRK-02', name:'Forklift B',        type:'Forklift',          zoneId:'loading',   status:'warning',  temp:68, vibration:4.1, power:18, failureProb:28, rul:96,  confidence:82, icon:'Truck',        x:82,  y:68,  w:44, h:28, components: mkComponents('warning') },
  
  // Raw Mat (y starts at 140 + ZONE_HEADER_HEIGHT = 182)
  { id:'RACK-01', name:'Storage Rack A1',  type:'Storage Rack',      zoneId:'rawmat',    status:'healthy',  temp:24, vibration:0.1, power:2,  failureProb:2,  rul:999, confidence:99, icon:'Layers3',      x:30,  y:188, w:44, h:30, components: mkComponents('healthy') },
  { id:'RACK-02', name:'Storage Rack A2',  type:'Storage Rack',      zoneId:'rawmat',    status:'healthy',  temp:25, vibration:0.1, power:2,  failureProb:3,  rul:999, confidence:98, icon:'Layers3',      x:82,  y:188, w:44, h:30, components: mkComponents('healthy') },
  { id:'RACK-03', name:'Storage Rack A3',  type:'Storage Rack',      zoneId:'rawmat',    status:'offline',  temp:22, vibration:0.0, power:0,  failureProb:0,  rul:0,   confidence:100,icon:'Layers3',      x:30,  y:230, w:44, h:30, components: mkComponents('offline') },
  
  // CNC (y starts at 20 + ZONE_HEADER_HEIGHT = 62)
  { id:'CNC-01', name:'CNC Machine 01',    type:'CNC Machine',       zoneId:'cnc',       status:'healthy',  temp:55, vibration:2.1, power:38, failureProb:8,  rul:480, confidence:91, icon:'Cog',          x:170, y:68,  w:54, h:44, components: mkComponents('healthy') },
  { id:'CNC-02', name:'CNC Machine 02',    type:'CNC Machine',       zoneId:'cnc',       status:'warning',  temp:74, vibration:5.8, power:52, failureProb:42, rul:48,  confidence:87, icon:'Cog',          x:234, y:68,  w:54, h:44, components: mkComponents('warning') },
  { id:'CNC-03', name:'CNC Machine 03',    type:'CNC Machine',       zoneId:'cnc',       status:'healthy',  temp:51, vibration:1.9, power:35, failureProb:6,  rul:600, confidence:94, icon:'Cog',          x:298, y:68,  w:54, h:44, components: mkComponents('healthy') },
  { id:'CNC-04', name:'CNC Machine 04',    type:'CNC Machine',       zoneId:'cnc',       status:'critical', temp:89, vibration:8.9, power:61, failureProb:78, rul:18,  confidence:94, icon:'Cog',          x:362, y:68,  w:54, h:44, components: mkComponents('critical') },
  { id:'DRILL-01',name:'Drilling Machine', type:'Drilling Machine',  zoneId:'cnc',       status:'warning',  temp:70, vibration:4.5, power:28, failureProb:35, rul:72,  confidence:85, icon:'Drill',        x:170, y:126, w:54, h:44, components: mkComponents('warning') },
  { id:'MILL-01', name:'Milling Machine',  type:'Milling Machine',   zoneId:'cnc',       status:'healthy',  temp:58, vibration:2.4, power:42, failureProb:11, rul:360, confidence:90, icon:'Settings2',    x:298, y:126, w:54, h:44, components: mkComponents('healthy') },
  
  // Robotics (y starts at 20 + ZONE_HEADER_HEIGHT = 62)
  { id:'ROB-01', name:'Industrial Robot A',type:'Industrial Robot',  zoneId:'robotics',  status:'healthy',  temp:48, vibration:3.2, power:55, failureProb:7,  rul:580, confidence:93, icon:'Bot',          x:462, y:68,  w:54, h:54, components: mkComponents('healthy') },
  { id:'ROB-02', name:'Industrial Robot B',type:'Industrial Robot',  zoneId:'robotics',  status:'critical', temp:91, vibration:9.2, power:68, failureProb:82, rul:12,  confidence:96, icon:'Bot',          x:530, y:68,  w:54, h:54, components: mkComponents('critical') },
  { id:'ROB-03', name:'Industrial Robot C',type:'Industrial Robot',  zoneId:'robotics',  status:'healthy',  temp:45, vibration:2.9, power:51, failureProb:5,  rul:620, confidence:95, icon:'Bot',          x:598, y:68,  w:54, h:54, components: mkComponents('healthy') },
  { id:'PRESS-01',name:'Hydraulic Press',  type:'Hydraulic Press',   zoneId:'robotics',  status:'warning',  temp:72, vibration:5.1, power:74, failureProb:38, rul:60,  confidence:83, icon:'Zap',          x:666, y:68,  w:54, h:54, components: mkComponents('warning') },
  { id:'WELD-01', name:'Welding Station',  type:'Welding Robot',     zoneId:'robotics',  status:'healthy',  temp:62, vibration:3.0, power:48, failureProb:9,  rul:400, confidence:92, icon:'Radio',        x:462, y:138, w:54, h:44, components: mkComponents('healthy') },
  
  // Conveyor (y starts at 300 + ZONE_HEADER_HEIGHT = 342)
  { id:'CONV-01', name:'Conveyor Line 1',  type:'Conveyor Belt',     zoneId:'conveyor',  status:'healthy',  temp:38, vibration:1.0, power:22, failureProb:5,  rul:800, confidence:97, icon:'GitBranch',    x:170, y:348, w:140,h:48, components: mkComponents('healthy') },
  { id:'CONV-02', name:'Conveyor Line 2',  type:'Conveyor Belt',     zoneId:'conveyor',  status:'warning',  temp:55, vibration:3.8, power:28, failureProb:31, rul:80,  confidence:88, icon:'GitBranch',    x:324, y:348, w:140,h:48, components: mkComponents('warning') },
  { id:'CONV-03', name:'Conveyor Line 3',  type:'Conveyor Belt',     zoneId:'conveyor',  status:'healthy',  temp:41, vibration:1.2, power:24, failureProb:6,  rul:760, confidence:96, icon:'GitBranch',    x:478, y:348, w:140,h:48, components: mkComponents('healthy') },
  
  // Quality (y starts at 20 + ZONE_HEADER_HEIGHT = 62)
  { id:'QC-01',  name:'QC Station Alpha',  type:'Inspection Camera', zoneId:'quality',   status:'healthy',  temp:33, vibration:0.5, power:8,  failureProb:3,  rul:900, confidence:99, icon:'FlaskConical', x:772, y:68,  w:54, h:44, components: mkComponents('healthy') },
  { id:'QC-02',  name:'QC Station Beta',   type:'Inspection Camera', zoneId:'quality',   status:'warning',  temp:46, vibration:2.1, power:10, failureProb:22, rul:120, confidence:84, icon:'FlaskConical', x:836, y:68,  w:54, h:44, components: mkComponents('warning') },
  { id:'CAM-01', name:'Vision System 01',  type:'Inspection Camera', zoneId:'quality',   status:'healthy',  temp:31, vibration:0.3, power:6,  failureProb:2,  rul:999, confidence:99, icon:'CircleDot',    x:772, y:126, w:54, h:44, components: mkComponents('healthy') },
  
  // Packaging (y starts at 300 + ZONE_HEADER_HEIGHT = 342)
  { id:'PACK-01', name:'Packaging Robot A',type:'Packaging Robot',   zoneId:'packaging', status:'healthy',  temp:44, vibration:2.0, power:32, failureProb:6,  rul:650, confidence:93, icon:'Package',      x:772, y:348, w:80, h:60, components: mkComponents('healthy') },
  { id:'PACK-02', name:'Packaging Robot B',type:'Packaging Robot',   zoneId:'packaging', status:'healthy',  temp:43, vibration:1.8, power:30, failureProb:7,  rul:680, confidence:94, icon:'Package',      x:864, y:348, w:80, h:60, components: mkComponents('healthy') },
  
  // Warehouse (y starts at 20 + ZONE_HEADER_HEIGHT = 62)
  { id:'FG-01',  name:'FG Storage Rack 1', type:'Storage Rack',      zoneId:'warehouse', status:'healthy',  temp:22, vibration:0.0, power:1,  failureProb:1,  rul:999, confidence:100,icon:'Warehouse',    x:992, y:68,  w:54, h:40, components: mkComponents('healthy') },
  { id:'FG-02',  name:'FG Storage Rack 2', type:'Storage Rack',      zoneId:'warehouse', status:'healthy',  temp:23, vibration:0.0, power:1,  failureProb:2,  rul:999, confidence:100,icon:'Warehouse',    x:1056,y:68,  w:54, h:40, components: mkComponents('healthy') },
  { id:'FG-03',  name:'AGV Unit 01',       type:'AGV',               zoneId:'warehouse', status:'warning',  temp:58, vibration:3.2, power:20, failureProb:24, rul:100, confidence:80, icon:'Truck',        x:992, y:122, w:54, h:40, components: mkComponents('warning') },
  
  // Shipping (y starts at 300 + ZONE_HEADER_HEIGHT = 342)
  { id:'SHIP-01', name:'Shipping Dock A',  type:'Shipping Station',  zoneId:'shipping',  status:'healthy',  temp:30, vibration:0.8, power:15, failureProb:5,  rul:850, confidence:97, icon:'Truck',        x:992, y:348, w:80, h:54, components: mkComponents('healthy') },
  { id:'SHIP-02', name:'Shipping Dock B',  type:'Shipping Station',  zoneId:'shipping',  status:'offline',  temp:20, vibration:0.0, power:0,  failureProb:0,  rul:0,   confidence:100,icon:'Truck',        x:1084,y:348, w:80, h:54, components: mkComponents('offline') },
]

function getForesMessage(machine: Machine): string {
  if (FORES_MESSAGES[machine.id]) return FORES_MESSAGES[machine.id]
  if (machine.status === 'healthy')
    return `✅ ${machine.name} is operating within all normal parameters. Temperature, vibration and power draw are all nominal. No maintenance actions required. RUL: ${machine.rul}h.`
  if (machine.status === 'offline')
    return `⏸️ ${machine.name} is currently offline. Unit powered down safely. No active telemetry available.`
  return `⚠️ ${machine.name} requires attention. Sensor readings trending toward alert threshold. Schedule preventive inspection within 72 hours.`
}

// ─── ICON COMPONENTS ──────────────────────────────────────────────────────

function ZoneIcon({ name, size = 14 }: { name: string; size?: number }) {
  const props = { size, color: '#94A3B8' }
  switch (name) {
    case 'Truck':        return <Truck {...props} />
    case 'Warehouse':    return <Warehouse {...props} />
    case 'Cog':          return <Cog {...props} />
    case 'Bot':          return <Bot {...props} />
    case 'GitBranch':    return <GitBranch {...props} />
    case 'FlaskConical': return <FlaskConical {...props} />
    case 'Package':      return <Package {...props} />
    default:             return <Cpu {...props} />
  }
}

function MachineIcon({ name, size = 12, color = '#94A3B8' }: { name: string; size?: number; color?: string }) {
  const props = { size, color }
  switch (name) {
    case 'Truck':        return <Truck {...props} />
    case 'Layers3':      return <Layers3 {...props} />
    case 'Cog':          return <Cog {...props} />
    case 'Bot':          return <Bot {...props} />
    case 'GitBranch':    return <GitBranch {...props} />
    case 'FlaskConical': return <FlaskConical {...props} />
    case 'Package':      return <Package {...props} />
    case 'Radio':        return <Radio {...props} />
    case 'CircleDot':    return <CircleDot {...props} />
    case 'Drill':        return <Drill {...props} />
    case 'Settings2':    return <Settings2 {...props} />
    case 'Zap':          return <Zap {...props} />
    case 'Warehouse':    return <Warehouse {...props} />
    default:             return <Cpu {...props} />
  }
}

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────

function ConveyorArrows() {
  const arrows = Array.from({ length: 12 }, (_, i) => ({
    x: 180 + i * 50,
    y: 370 // Adjusted to match new conveyor position
  }))
  return (
    <>
      {arrows.map((a, i) => (
        <motion.text
          key={i}
          x={a.x} y={a.y}
          fontSize="14"
          fill="rgba(59,130,246,0.6)"
          initial={{ opacity: 0, x: a.x - 10 }}
          animate={{ opacity: [0, 1, 0], x: [a.x - 10, a.x + 10] }}
          transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.1, ease: 'linear' }}
          style={{ fontFamily: 'monospace' }}
        >
          ›
        </motion.text>
      ))}
    </>
  )
}

function ScanLine({ scanning }: { scanning: boolean }) {
  if (!scanning) return null
  return (
    <motion.rect
      x={0} y={0} width={W} height={4}
      fill="url(#scanGradient)"
      initial={{ y: 0, opacity: 0.9 }}
      animate={{ y: H, opacity: [0.9, 0.9, 0] }}
      transition={{ duration: 2.2, ease: 'linear' }}
    />
  )
}

// ─── MACHINE NODE ─────────────────────────────────────────────────────────

function MachineNode({
  machine, selected, scanning, filterActive, onClick
}: {
  machine: Machine
  selected: boolean
  scanning: boolean
  filterActive: boolean
  onClick: () => void
}) {
  const sc = STATUS_COLOR[machine.status]
  const sg = STATUS_GLOW[machine.status]
  const isCritical = machine.status === 'critical'
  const isWarning  = machine.status === 'warning'
  const isOffline  = machine.status === 'offline'

  const centerX = machine.x + machine.w / 2 || 0
  const centerY = machine.y + machine.h / 2 || 0

  return (
    <motion.g
      style={{ cursor: 'pointer' }}
      onClick={onClick}
      initial={false}
      animate={{
        opacity: filterActive ? 1 : 0.15,
        scale: selected ? 1.08 : 1,
      }}
      transition={{ duration: 0.3 }}
    >
      {isCritical && (
        <motion.rect
          x={machine.x - 6 || 0} y={machine.y - 6 || 0}
          width={(machine.w + 12) || 0} height={(machine.h + 12) || 0}
          rx={10} fill={sg}
          animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.04, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          style={{ transformOrigin: `${centerX}px ${centerY}px` }}
        />
      )}
      {isWarning && (
        <motion.rect
          x={machine.x - 4 || 0} y={machine.y - 4 || 0}
          width={(machine.w + 8) || 0} height={(machine.h + 8) || 0}
          rx={8} fill={sg}
          animate={{ opacity: [0.2, 0.7, 0.2] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      {!isOffline && !isCritical && !isWarning && (
        <motion.rect
          x={machine.x - 2 || 0} y={machine.y - 2 || 0}
          width={(machine.w + 4) || 0} height={(machine.h + 4) || 0}
          rx={6} fill={sg}
          animate={{ opacity: [0.1, 0.35, 0.1] }}
          transition={{ duration: 3, repeat: Infinity, delay: (machine.x || 0) * 0.002 }}
        />
      )}

      {scanning && (
        <motion.rect
          x={machine.x || 0} y={machine.y || 0}
          width={machine.w || 0} height={machine.h || 0}
          rx={6} fill="rgba(59,130,246,0.5)"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.8, 0] }}
          transition={{ duration: 0.4, delay: ((machine.x || 0) * 0.0006) + ((machine.y || 0) * 0.001) }}
        />
      )}

      <rect
        x={machine.x || 0} y={machine.y || 0}
        width={machine.w || 0} height={machine.h || 0}
        rx={8}
        fill={selected ? 'rgba(59,130,246,0.2)' : 'rgba(17,24,39,0.92)'}
        stroke={selected ? '#3B82F6' : sc}
        strokeWidth={selected ? 2.5 : 1}
        style={{ 
          filter: selected ? 'drop-shadow(0 0 20px rgba(59,130,246,0.3))' : undefined,
          backdropFilter: 'blur(4px)'
        }}
      />

      <motion.circle
        cx={(machine.x + machine.w - 8) || 0} cy={(machine.y + 8) || 0} 
        r={4}
        fill={sc}
        animate={isCritical ? { opacity: [1, 0.2, 1] } : isWarning ? { r: [4, 5, 4] } : {}}
        transition={{ duration: isCritical ? 0.5 : 1.5, repeat: Infinity }}
        style={{ filter: `drop-shadow(0 0 8px ${sc})` }}
      />

      <text
        x={(machine.x + 8) || 0} y={(machine.y + 14) || 0}
        fontSize="7.5" fontWeight="700"
        fill="#F8FAFC" fontFamily="Inter, sans-serif"
      >
        {machine.id}
      </text>
      
      <text
        x={(machine.x + 8) || 0} y={(machine.y + machine.h - 8) || 0}
        fontSize="6.5" fill="#94A3B8" fontFamily="Inter, sans-serif"
      >
        {machine.temp}°C
      </text>

      <foreignObject x={(machine.x + machine.w - 24) || 0} y={(machine.y + 4) || 0} width={16} height={16}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
          <MachineIcon name={machine.icon} size={10} color="#64748B" />
        </div>
      </foreignObject>

      {selected && (
        <motion.rect
          x={(machine.x - 6) || 0} y={(machine.y - 6) || 0}
          width={(machine.w + 12) || 0} height={(machine.h + 12) || 0}
          rx={12}
          fill="none"
          stroke="#3B82F6"
          strokeWidth={2}
          strokeDasharray="6 4"
          animate={{ strokeDashoffset: [0, -20] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {isCritical && (
        <motion.circle
          cx={centerX} cy={(machine.y - 10) || 0} 
          r={6}
          fill="#EF4444"
          animate={{ scale: [1, 1.8, 1], opacity: [1, 0.3, 1] }}
          transition={{ duration: 0.6, repeat: Infinity }}
          style={{ 
            filter: 'drop-shadow(0 0 12px #EF4444)', 
            transformOrigin: `${centerX}px ${(machine.y - 10) || 0}px` 
          }}
        />
      )}
    </motion.g>
  )
}

// ─── MINI MAP ──────────────────────────────────────────────────────────────

function MiniMap({ viewBox, machines }: { viewBox: { x: number; y: number; w: number; h: number }; machines: Machine[] }) {
  return (
    <div style={{
      position: 'absolute', bottom: 16, left: 16,
      width: 160, height: 100,
      background: 'rgba(15,23,42,0.95)',
      border: '1px solid rgba(59,130,246,0.2)',
      borderRadius: 10,
      overflow: 'hidden',
      backdropFilter: 'blur(12px)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
    }}>
      <svg width={160} height={100} viewBox={`0 0 ${W} ${H}`}>
        {ZONES.map(z => (
          <rect key={z.id} x={z.x} y={z.y} width={z.w} height={z.h} rx={4}
            fill={z.color} stroke="rgba(59,130,246,0.15)" strokeWidth={2} />
        ))}
        {machines.map(m => (
          <rect key={m.id} x={m.x} y={m.y} width={m.w} height={m.h} rx={3}
            fill={STATUS_COLOR[m.status]} opacity={m.status === 'offline' ? 0.3 : 0.7} />
        ))}
        <rect
          x={viewBox.x || 0} 
          y={viewBox.y || 0} 
          width={viewBox.w || W} 
          height={viewBox.h || H}
          rx={6} 
          fill="rgba(59,130,246,0.06)"
          stroke="#3B82F6" 
          strokeWidth={8} 
          strokeDasharray="20 10"
        />
      </svg>
      <div style={{ 
        position: 'absolute', top: 4, left: 6, 
        fontSize: 8, color: '#64748B', fontFamily: 'Inter',
        display: 'flex', alignItems: 'center', gap: 4,
        background: 'rgba(15,23,42,0.8)',
        padding: '1px 6px',
        borderRadius: 4,
      }}>
        <MapPin size={8} /> Factory Overview
      </div>
    </div>
  )
}

// ─── COMPONENT DETAIL ──────────────────────────────────────────────────────

function ComponentDetail({ comp, onClose }: { comp: Component; onClose: () => void }) {
  const sc = STATUS_COLOR[comp.status]
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 8 }}
      style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        background: 'rgba(17,24,39,0.98)',
        border: `1px solid ${sc}40`,
        borderRadius: 14,
        padding: '14px',
        zIndex: 50,
        backdropFilter: 'blur(16px)',
        boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 40px ${sc}15`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, color: '#F8FAFC', fontSize: 13 }}>{comp.name}</span>
        <motion.button 
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
        >
          <X size={14} />
        </motion.button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ 
          width: 10, height: 10, borderRadius: '50%', 
          background: sc, display: 'inline-block', 
          boxShadow: `0 0 12px ${sc}` 
        }} />
        <span style={{ fontSize: 11, color: sc, fontWeight: 700, letterSpacing: '0.04em' }}>
          {comp.status.toUpperCase()}
        </span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 8, color: '#475569' }}>COMPONENT</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { label: 'Purpose', value: comp.purpose },
          { label: 'Condition', value: comp.condition },
          { label: 'Reason', value: comp.reason },
          { label: 'Business Impact', value: comp.impact },
          { label: 'Recommended Action', value: comp.action },
        ].map(r => (
          <div key={r.label} style={{ 
            padding: '6px 8px',
            borderRadius: 6,
            background: 'rgba(255,255,255,0.02)',
          }}>
            <div style={{ fontSize: 8, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
              {r.label}
            </div>
            <div style={{ 
              fontSize: 10.5, 
              color: r.label === 'Recommended Action' ? '#3B82F6' : '#CBD5E1',
              fontWeight: r.label === 'Recommended Action' ? 600 : 400,
              lineHeight: 1.4,
            }}>
              {r.value}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ─── DIGITAL TWIN ─────────────────────────────────────────────────────────

function DigitalTwinIllustration({ machine, onComponentClick }: {
  machine: Machine
  onComponentClick: (c: Component) => void
}) {
  const positions = [
    { id: 'motor',   label: 'Motor',       cx: 60,  cy: 55 },
    { id: 'bearing', label: 'Bearing',     cx: 110, cy: 55 },
    { id: 'rotor',   label: 'Rotor',       cx: 160, cy: 55 },
    { id: 'fan',     label: 'Cooling Fan', cx: 60,  cy: 105 },
    { id: 'shaft',   label: 'Drive Shaft', cx: 110, cy: 105 },
  ]

  return (
    <svg width="230" height="150" style={{ display: 'block', margin: '0 auto' }}>
      <rect x={15} y={15} width={200} height={130} rx={10}
        fill="rgba(17,24,39,0.8)" stroke="rgba(59,130,246,0.15)" strokeWidth={1.5} />
      
      <text x={115} y={12} textAnchor="middle" fontSize="8" fill="#475569" fontFamily="Inter" fontWeight={500}>
        {machine.type} — Digital Twin
      </text>
      
      <line x1={60} y1={55} x2={110} y2={55} stroke="rgba(59,130,246,0.15)" strokeWidth={1.5} />
      <line x1={110} y1={55} x2={160} y2={55} stroke="rgba(59,130,246,0.15)" strokeWidth={1.5} />
      <line x1={60} y1={55} x2={60} y2={105} stroke="rgba(59,130,246,0.15)" strokeWidth={1.5} />
      <line x1={110} y1={55} x2={110} y2={105} stroke="rgba(59,130,246,0.15)" strokeWidth={1.5} />

      {positions.map(pos => {
        const comp = machine.components.find(c => c.id === pos.id)
        if (!comp) return null
        const sc = STATUS_COLOR[comp.status]
        const isCritical = comp.status === 'critical'
        const isWarning = comp.status === 'warning'
        
        return (
          <g key={pos.id} style={{ cursor: 'pointer' }} onClick={() => onComponentClick(comp)}>
            {isCritical && (
              <motion.circle
                cx={pos.cx} cy={pos.cy} 
                r={28}
                fill="none" stroke={sc} strokeWidth={2}
                opacity={0.3}
                animate={{ r: [28, 34, 28], opacity: [0.3, 0.1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
            
            <motion.circle
              cx={pos.cx} cy={pos.cy} 
              r={22}
              fill={`${sc}10`}
              stroke={sc} strokeWidth={isCritical ? 2 : 1.5}
              animate={isCritical ? { r: [22, 25, 22] } : isWarning ? { opacity: [1, 0.6, 1] } : {}}
              transition={{ duration: 0.8, repeat: Infinity }}
              style={{ filter: `drop-shadow(0 0 12px ${sc}40)` }}
            />
            <text 
              x={pos.cx} y={pos.cy + 1} 
              textAnchor="middle" dominantBaseline="middle"
              fontSize="6.5" fontWeight="700" 
              fill={sc} fontFamily="Inter" 
              style={{ pointerEvents: 'none' }}
            >
              {pos.label}
            </text>
            <circle cx={pos.cx + 16} cy={pos.cy - 16} r={4} fill={sc} />
          </g>
        )
      })}
    </svg>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────

export default function FactoryHeatmap() {
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null)
  const [hoveredMachine, setHoveredMachine] = useState<Machine | null>(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const [scanning, setScanning] = useState(false)
  const [scanStep, setScanStep] = useState(-1)
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null)
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: W, h: H })
  const [isMinimapExpanded, setIsMinimapExpanded] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)

  const activeMachineIds = useMemo(() => {
    const filter = FILTER_ZONES.find(f => f.id === activeFilter)
    const zoneIds = filter?.zoneIds ?? ZONES.map(z => z.id)
    return new Set(MACHINES.filter(m => zoneIds.includes(m.zoneId)).map(m => m.id))
  }, [activeFilter])

  const criticals = useMemo(() => MACHINES.filter(m => m.status === 'critical'), [])
  const topRisks = useMemo(() => 
    [...MACHINES].sort((a, b) => b.failureProb - a.failureProb).slice(0, 5),
    []
  )

  const displayMachine = hoveredMachine || selectedMachine

  useEffect(() => {
    const top = [...MACHINES].sort((a, b) => b.failureProb - a.failureProb)[0]
    if (top) setSelectedMachine(top)
  }, [])

  useEffect(() => {
    const filter = FILTER_ZONES.find(f => f.id === activeFilter)
    if (!filter || activeFilter === 'all') {
      setViewBox({ x: 0, y: 0, w: W, h: H })
      return
    }
    const zoneRects = filter.zoneIds.map(zid => ZONES.find(z => z.id === zid)!).filter(Boolean)
    if (!zoneRects.length) return
    const minX = Math.min(...zoneRects.map(z => z.x)) - 30
    const minY = Math.min(...zoneRects.map(z => z.y)) - 30
    const maxX = Math.max(...zoneRects.map(z => z.x + z.w)) + 30
    const maxY = Math.max(...zoneRects.map(z => z.y + z.h)) + 30
    setViewBox({ x: minX, y: minY, w: maxX - minX, h: maxY - minY })
  }, [activeFilter])

  const startScan = useCallback(() => {
    if (scanning) return
    setScanning(true)
    setScanStep(0)
    let step = 0
    const interval = setInterval(() => {
      step++
      if (step < SCAN_STEPS.length) {
        setScanStep(step)
      } else {
        clearInterval(interval)
        setScanning(false)
        const top = criticals.sort((a, b) => b.failureProb - a.failureProb)[0]
        if (top) setSelectedMachine(top)
      }
    }, 700)
    return () => clearInterval(interval)
  }, [scanning, criticals])

  const handleMachineClick = useCallback((machine: Machine) => {
    setSelectedMachine(machine)
    setSelectedComponent(null)
    const pad = 100
    setViewBox({
      x: Math.max(0, machine.x - pad),
      y: Math.max(0, machine.y - pad),
      w: machine.w + pad * 2,
      h: machine.h + pad * 2,
    })
  }, [])

  const getBarWidth = (val: number, max: number) => `${Math.min(100, (val / max) * 100)}%`
  
  const metricColor = (val: number, warn: number, crit: number) => {
    if (val >= crit) return '#EF4444'
    if (val >= warn) return '#F59E0B'
    return '#22C55E'
  }

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      overflow: 'hidden', 
      background: '#0B1220',
      fontFamily: 'Inter, sans-serif',
      color: '#F8FAFC',
    }}>
      <div style={{ 
        flex: '0 0 72%', 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden', 
        position: 'relative',
        background: 'radial-gradient(ellipse at 30% 50%, rgba(59,130,246,0.03) 0%, transparent 70%)'
      }}>
        <div style={{ 
          padding: '16px 24px 12px', 
          flexShrink: 0, 
          borderBottom: '1px solid rgba(59,130,246,0.06)',
          background: 'rgba(11,18,32,0.8)',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'linear-gradient(135deg,#3B82F6,#06B6D4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(59,130,246,0.3)',
                }}>
                  <TrendingUp size={16} color="#fff" />
                </div>
                <div>
                  <h1 style={{ 
                    margin: 0, 
                    fontFamily: 'Space Grotesk', 
                    fontWeight: 800, 
                    fontSize: 20, 
                    color: '#F8FAFC', 
                    letterSpacing: '-0.02em' 
                  }}>
                    Factory Digital Twin
                    <span style={{ 
                      fontSize: 12, 
                      fontWeight: 400, 
                      color: '#475569', 
                      marginLeft: 10,
                      letterSpacing: '0.02em',
                    }}>LIVE</span>
                  </h1>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Wifi size={10} color="#22C55E" />
                      {MACHINES.filter(m => m.status !== 'offline').length}/{MACHINES.length} machines online
                    </span>
                    <span style={{ margin: '0 8px', color: '#1e293b' }}>·</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={10} color="#94A3B8" />
                      {new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {criticals.length > 0 && (
                <motion.div
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '5px 14px', borderRadius: 20,
                    background: 'rgba(239,68,68,0.12)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    fontSize: 11, fontWeight: 700, color: '#EF4444',
                    boxShadow: '0 0 20px rgba(239,68,68,0.1)',
                  }}
                >
                  <AlertTriangle size={12} />
                  {criticals.length} CRITICAL
                </motion.div>
              )}

              <motion.button
                onClick={startScan}
                disabled={scanning}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 20px', borderRadius: 10, 
                  cursor: scanning ? 'default' : 'pointer',
                  background: scanning 
                    ? 'rgba(59,130,246,0.15)' 
                    : 'linear-gradient(135deg,#3B82F6,#2563EB)',
                  border: '1px solid rgba(59,130,246,0.4)',
                  color: '#fff', 
                  fontWeight: 700, 
                  fontSize: 12,
                  fontFamily: 'Inter, sans-serif',
                  boxShadow: scanning ? 'none' : '0 0 30px rgba(59,130,246,0.2)',
                }}
              >
                <motion.div animate={scanning ? { rotate: 360 } : {}} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}>
                  <Sparkles size={14} />
                </motion.div>
                {scanning ? 'Scanning...' : 'AI Scan'}
              </motion.button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
            {FILTER_ZONES.map(f => {
              const Icon = f.icon
              const isActive = activeFilter === f.id
              return (
                <motion.button
                  key={f.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveFilter(f.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 14px', borderRadius: 20, cursor: 'pointer',
                    fontSize: 10, fontWeight: 600, letterSpacing: '0.02em',
                    background: isActive ? 'linear-gradient(135deg,#3B82F6,#2563EB)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isActive ? '#3B82F6' : 'rgba(59,130,246,0.1)'}`,
                    color: isActive ? '#fff' : '#94A3B8',
                    transition: 'all 0.2s',
                    boxShadow: isActive ? '0 0 20px rgba(59,130,246,0.2)' : 'none',
                  }}
                >
                  <Icon size={10} />
                  {f.label}
                </motion.button>
              )
            })}
          </div>
        </div>

        <AnimatePresence>
          {scanning && scanStep >= 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 36 }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                background: 'linear-gradient(90deg, rgba(59,130,246,0.05), rgba(6,182,212,0.05))',
                borderBottom: '1px solid rgba(59,130,246,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, color: '#06B6D4', fontWeight: 600, flexShrink: 0,
                gap: 10,
              }}
            >
              <motion.span 
                animate={{ opacity: [1, 0.3, 1] }} 
                transition={{ duration: 0.5, repeat: Infinity }}
                style={{ width: 6, height: 6, borderRadius: '50%', background: '#06B6D4', display: 'inline-block' }}
              />
              FORES: "{SCAN_STEPS[scanStep]}"
              <div style={{ 
                display: 'flex', gap: 3,
                position: 'absolute', right: 20,
              }}>
                {SCAN_STEPS.map((_, i) => (
                  <div key={i} style={{
                    width: 4, height: 4, borderRadius: '50%',
                    background: i <= scanStep ? '#06B6D4' : 'rgba(6,182,212,0.2)',
                  }} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <motion.svg
            ref={svgRef}
            width="100%"
            height="100%"
            animate={{ viewBox: `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}` }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ display: 'block', userSelect: 'none' }}
          >
            <defs>
              <linearGradient id="scanGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(6,182,212,0)" />
                <stop offset="50%" stopColor="rgba(59,130,246,0.7)" />
                <stop offset="100%" stopColor="rgba(6,182,212,0)" />
              </linearGradient>
              <pattern id="factoryGrid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(59,130,246,0.03)" strokeWidth="0.5" />
              </pattern>
              <filter id="glowBlue">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            <rect x={0} y={0} width={W} height={H} fill="#080E1A" />
            <rect x={0} y={0} width={W} height={H} fill="url(#factoryGrid)" />

            <rect x={10} y={10} width={W - 20} height={H - 20} rx={12}
              fill="none" stroke="rgba(59,130,246,0.1)" strokeWidth={1.5} strokeDasharray="8 6" />

            <defs>
              <marker id="arrowFlow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                <path d="M 0 0 L 8 4 L 0 8 z" fill="#3B82F6" opacity={0.4} />
              </marker>
            </defs>

            {[
              { from: [80, 100], to: [80, 120] },
              { from: [140, 190], to: [160, 190] },
              { from: [430, 140], to: [450, 140] },
              { from: [740, 140], to: [760, 140] },
              { from: [960, 140], to: [980, 140] },
              { from: [960, 380], to: [980, 380] },
            ].map((flow, i) => (
              <motion.path
                key={i}
                d={`M ${flow.from[0]} ${flow.from[1]} L ${flow.to[0]} ${flow.to[1]}`}
                stroke="#3B82F6"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                markerEnd="url(#arrowFlow)"
                opacity={0.4}
                animate={{ strokeDashoffset: [0, -16] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear', delay: i * 0.1 }}
              />
            ))}

            <motion.path
              d="M 80 280 Q 400 370 740 320 Q 900 300 980 380"
              fill="none" stroke="rgba(6,182,212,0.08)" strokeWidth={4}
              strokeDasharray="10 8"
              animate={{ strokeDashoffset: [0, -36] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
            />
            
            <motion.circle 
              r={6} 
              fill="#06B6D4"
              style={{ filter: 'drop-shadow(0 0 12px #06B6D4)' }}
              animate={{ 
                opacity: [1, 0.5, 1],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />

            {ZONES.map(zone => {
              const isZoneActive = FILTER_ZONES.find(f => f.id === activeFilter)?.zoneIds.includes(zone.id) ?? true
              return (
                <g key={zone.id}>
                  <motion.rect
                    x={zone.x} y={zone.y} width={zone.w} height={zone.h} rx={10}
                    fill={zone.color}
                    stroke={isZoneActive ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.04)'}
                    strokeWidth={1.5}
                    animate={{ opacity: isZoneActive ? 1 : 0.25 }}
                    transition={{ duration: 0.3 }}
                  />
                  {/* Zone header with increased height and padding */}
                  <rect 
                    x={zone.x + 4} 
                    y={zone.y + 4} 
                    width={zone.w - 8} 
                    height={ZONE_HEADER_HEIGHT - 8}
                    rx={6}
                    fill="rgba(0,0,0,0.3)"
                    stroke="rgba(59,130,246,0.08)"
                    strokeWidth={0.5}
                  />
                  <text x={zone.x + 10} y={zone.y + 12}
                    fontSize="8.5" fontWeight="700"
                    fill={isZoneActive ? '#94A3B8' : '#2a3441'}
                    fontFamily="Space Grotesk, sans-serif"
                    style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}
                  >
                    {zone.label}
                  </text>
                  <text x={zone.x + 10} y={zone.y + 24}
                    fontSize="6.5" fill={isZoneActive ? '#475569' : '#1e293b'}
                    fontFamily="Inter, sans-serif">
                    {zone.sublabel}
                  </text>
                  <line x1={zone.x + 3} y1={zone.y + 3} x2={zone.x + 3} y2={zone.y + ZONE_HEADER_HEIGHT}
                    stroke={isZoneActive ? 'rgba(59,130,246,0.25)' : 'rgba(59,130,246,0.05)'} strokeWidth={2} />
                </g>
              )
            })}

            {/* Conveyor belt with adjusted y-position */}
            <rect x={162} y={302} width={577} height={56} rx={8}
              fill="rgba(17,24,39,0.8)" stroke="rgba(59,130,246,0.15)" strokeWidth={1} />
            <rect x={170} y={312} width={561} height={14} rx={4} fill="rgba(30,41,59,0.9)" />
            <rect x={170} y={334} width={561} height={14} rx={4} fill="rgba(30,41,59,0.9)" />
            <ConveyorArrows />

            <rect x={155} y={10} width={4} height={H - 20} fill="rgba(100,116,139,0.04)" rx={2} />
            <rect x={745} y={10} width={4} height={H - 20} fill="rgba(100,116,139,0.04)" rx={2} />
            <rect x={970} y={10} width={4} height={H - 20} fill="rgba(100,116,139,0.04)" rx={2} />

            {criticals.map(m => {
              const baseRadius = Math.max(m.w || 0, m.h || 0) * 0.8
              return (
                <motion.circle key={m.id}
                  cx={m.x + m.w / 2} cy={m.y + m.h / 2}
                  r={baseRadius || 10}
                  fill="none" stroke="#EF4444" strokeWidth={2}
                  opacity={0.3}
                  animate={{ r: [baseRadius || 10, (baseRadius || 10) * 2], opacity: [0.3, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                />
              )
            })}

            {MACHINES.map(machine => (
              <MachineNode
                key={machine.id}
                machine={machine}
                selected={selectedMachine?.id === machine.id}
                scanning={scanning}
                filterActive={activeMachineIds.has(machine.id)}
                onClick={() => handleMachineClick(machine)}
              />
            ))}

            <ScanLine scanning={scanning} />
          </motion.svg>

          <MiniMap viewBox={viewBox} machines={MACHINES} />

          <div style={{
            position: 'absolute', bottom: 16, right: 16,
            background: 'rgba(15,23,42,0.95)',
            border: '1px solid rgba(59,130,246,0.12)',
            borderRadius: 10, padding: '10px 14px',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
          }}>
            <div style={{ fontSize: 8, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              Status Legend
            </div>
            {(['healthy','warning','critical','offline'] as MachineStatus[]).map(s => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: STATUS_COLOR[s],
                  boxShadow: `0 0 8px ${STATUS_COLOR[s]}40`,
                  display: 'inline-block',
                }} />
                <span style={{ fontSize: 9.5, color: '#94A3B8', textTransform: 'capitalize' }}>
                  {s}
                </span>
                <span style={{ 
                  fontSize: 7, 
                  color: '#475569', 
                  marginLeft: 'auto',
                  background: 'rgba(255,255,255,0.03)',
                  padding: '0 6px',
                  borderRadius: 3,
                }}>
                  {MACHINES.filter(m => m.status === s).length}
                </span>
              </div>
            ))}
          </div>

          <div style={{
            position: 'absolute', top: 16, right: 16,
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 9, color: '#475569',
            background: 'rgba(15,23,42,0.8)',
            padding: '4px 12px',
            borderRadius: 20,
            border: '1px solid rgba(34,197,94,0.2)',
          }}>
            <motion.span
              style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            LIVE · 24/7 Monitoring
          </div>
        </div>
      </div>

      <div style={{
        flex: '0 0 28%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'rgba(15,23,42,0.95)',
        borderLeft: '1px solid rgba(59,130,246,0.08)',
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{
          padding: '16px 18px 12px',
          borderBottom: '1px solid rgba(59,130,246,0.06)',
          flexShrink: 0,
          background: 'rgba(15,23,42,0.8)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg,#3B82F6,#06B6D4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(59,130,246,0.2)',
            }}>
              <Bot size={16} color="#fff" />
            </div>
            <div>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 14, color: '#F8FAFC' }}>
                AI Inspection
                <span style={{ fontSize: 10, fontWeight: 400, color: '#475569', marginLeft: 6 }}>
                  FORES
                </span>
              </div>
              <div style={{ fontSize: 10, color: '#64748B' }}>
                {MACHINES.filter(m => m.status === 'critical').length} critical · 
                {MACHINES.filter(m => m.status === 'warning').length} warnings
              </div>
            </div>
          </div>
        </div>

        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '12px 16px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 12,
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(59,130,246,0.2) transparent',
        }}>
          <AnimatePresence mode="wait">
            {displayMachine ? (
              <motion.div key={displayMachine.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                <div style={{
                  background: 'rgba(17,24,39,0.9)',
                  border: `1px solid ${STATUS_COLOR[displayMachine.status]}25`,
                  borderRadius: 14, padding: 14,
                  backdropFilter: 'blur(12px)',
                  boxShadow: `0 4px 16px rgba(0,0,0,0.2)`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 16, color: '#F8FAFC' }}>
                        {displayMachine.name}
                      </div>
                      <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>
                        {displayMachine.type} · {displayMachine.id}
                      </div>
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '4px 12px', borderRadius: 20,
                      fontSize: 10, fontWeight: 700,
                      background: `${STATUS_COLOR[displayMachine.status]}18`,
                      border: `1px solid ${STATUS_COLOR[displayMachine.status]}40`,
                      color: STATUS_COLOR[displayMachine.status],
                    }}>
                      <motion.span
                        style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLOR[displayMachine.status], display: 'inline-block' }}
                        animate={displayMachine.status === 'critical' ? { opacity: [1, 0.2, 1] } : {}}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      />
                      {displayMachine.status.toUpperCase()}
                    </div>
                  </div>

                  {[
                    { icon: Thermometer, label: 'Temperature', value: `${displayMachine.temp}°C`, raw: displayMachine.temp, max: 100, warn: 65, crit: 80 },
                    { icon: Activity, label: 'Vibration', value: `${displayMachine.vibration} mm/s`, raw: displayMachine.vibration, max: 12, warn: 4, crit: 7 },
                    { icon: Zap, label: 'Power', value: `${displayMachine.power} kW`, raw: displayMachine.power, max: 80, warn: 55, crit: 70 },
                  ].map(m => {
                    const barColor = metricColor(m.raw, m.warn, m.crit)
                    return (
                      <div key={m.label} style={{ marginBottom: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9.5, color: '#64748B' }}>
                            <m.icon size={9} />
                            {m.label}
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: barColor }}>{m.value}</span>
                        </div>
                        <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                          <motion.div
                            style={{ height: '100%', borderRadius: 2, background: barColor }}
                            initial={{ width: 0 }}
                            animate={{ width: getBarWidth(m.raw, m.max) }}
                            transition={{ duration: 0.7, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div style={{
                  background: 'rgba(17,24,39,0.9)',
                  border: '1px solid rgba(59,130,246,0.1)',
                  borderRadius: 14, padding: 14,
                }}>
                  <div style={{ fontSize: 8, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                    <Database size={10} style={{ display: 'inline', marginRight: 4 }} />
                    AI Predictive Analytics
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {[
                      { label: 'Failure Risk', value: `${displayMachine.failureProb}%`, color: displayMachine.failureProb > 60 ? '#EF4444' : displayMachine.failureProb > 30 ? '#F59E0B' : '#22C55E', icon: Shield },
                      { label: 'RUL', value: `${displayMachine.rul}h`, color: displayMachine.rul < 24 ? '#EF4444' : displayMachine.rul < 100 ? '#F59E0B' : '#22C55E', icon: Clock },
                      { label: 'Confidence', value: `${displayMachine.confidence}%`, color: '#3B82F6', icon: Cpu },
                      { label: 'Health', value: `${Math.round(100 - displayMachine.failureProb)}%`, color: displayMachine.failureProb > 60 ? '#EF4444' : displayMachine.failureProb > 30 ? '#F59E0B' : '#22C55E', icon: Activity },
                    ].map(p => (
                      <div key={p.label} style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        borderRadius: 8, padding: '8px 10px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                          <p.icon size={8} color="#475569" />
                          <span style={{ fontSize: 8, color: '#475569' }}>{p.label}</span>
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: p.color, fontFamily: 'Space Grotesk' }}>
                          {p.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(6,182,212,0.04))',
                  border: '1px solid rgba(59,130,246,0.15)',
                  borderRadius: 14, padding: 14,
                  position: 'relative',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: 6,
                      background: 'linear-gradient(135deg,#3B82F6,#06B6D4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 0 20px rgba(59,130,246,0.2)',
                    }}>
                      <Bot size={12} color="#fff" />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#3B82F6' }}>FORES Analysis</span>
                    <motion.span
                      style={{ width: 4, height: 4, borderRadius: '50%', background: '#22C55E', display: 'inline-block', marginLeft: 'auto' }}
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  </div>
                  <p style={{ 
                    fontSize: 11.5, 
                    lineHeight: 1.7, 
                    color: '#CBD5E1', 
                    margin: 0,
                    background: 'rgba(0,0,0,0.2)',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid rgba(59,130,246,0.05)',
                  }}>
                    {getForesMessage(displayMachine)}
                  </p>
                </div>

                <div style={{
                  background: 'rgba(17,24,39,0.9)',
                  border: '1px solid rgba(59,130,246,0.08)',
                  borderRadius: 14, padding: '10px 8px 12px',
                  position: 'relative',
                }}>
                  <div style={{ 
                    fontSize: 8, 
                    color: '#475569', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.08em', 
                    marginBottom: 6, 
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}>
                    <Layers3 size={10} />
                    Component Explorer — Click to inspect
                  </div>

                  <AnimatePresence>
                    {selectedComponent && (
                      <ComponentDetail
                        comp={selectedComponent}
                        onClose={() => setSelectedComponent(null)}
                      />
                    )}
                  </AnimatePresence>

                  {!selectedComponent && (
                    <DigitalTwinIllustration
                      machine={displayMachine}
                      onComponentClick={setSelectedComponent}
                    />
                  )}
                </div>

                <div style={{
                  background: 'rgba(17,24,39,0.9)',
                  border: '1px solid rgba(59,130,246,0.08)',
                  borderRadius: 14, padding: 14,
                }}>
                  <div style={{ 
                    fontSize: 8, 
                    color: '#475569', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.08em', 
                    marginBottom: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}>
                    <AlertTriangle size={10} />
                    Top Risk Machines
                  </div>
                  {topRisks.map((m, i) => (
                    <motion.div
                      key={m.id}
                      onClick={() => handleMachineClick(m)}
                      whileHover={{ x: 4, background: 'rgba(255,255,255,0.02)' }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '6px 8px', cursor: 'pointer',
                        borderRadius: 6,
                        borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                        transition: 'all 0.2s',
                      }}
                    >
                      <span style={{ 
                        fontSize: 9, 
                        color: '#475569', 
                        width: 16, 
                        textAlign: 'center',
                        fontWeight: 700,
                      }}>
                        #{i + 1}
                      </span>
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: STATUS_COLOR[m.status], flexShrink: 0,
                        boxShadow: `0 0 8px ${STATUS_COLOR[m.status]}40`,
                      }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: '#F8FAFC' }}>{m.name}</div>
                        <div style={{ fontSize: 8, color: '#475569' }}>{m.type}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ 
                          fontSize: 12, 
                          fontWeight: 800, 
                          color: STATUS_COLOR[m.status],
                          fontFamily: 'Space Grotesk',
                        }}>
                          {m.failureProb}%
                        </div>
                      </div>
                      <ChevronRight size={10} color="#334155" />
                    </motion.div>
                  ))}
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 6,
                  marginTop: 4,
                }}>
                  {[
                    { label: 'View History', icon: Clock, color: '#3B82F6' },
                    { label: 'Maintenance Plan', icon: Settings2, color: '#F59E0B' },
                    { label: 'Alert Details', icon: Bell, color: '#EF4444' },
                    { label: 'Export Report', icon: TrendingUp, color: '#22C55E' },
                  ].map(action => (
                    <motion.button
                      key={action.label}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '6px 10px', borderRadius: 8,
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        color: '#94A3B8',
                        fontSize: 9,
                        fontWeight: 600,
                        cursor: 'pointer',
                        justifyContent: 'center',
                      }}
                    >
                      <action.icon size={10} color={action.color} />
                      {action.label}
                    </motion.button>
                  ))}
                </div>

              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', height: '100%', textAlign: 'center', padding: 32,
                }}
              >
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'rgba(59,130,246,0.06)',
                  border: '1px solid rgba(59,130,246,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16,
                }}>
                  <Search size={28} color="#1E293B" />
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#64748B' }}>Select a Machine</div>
                <div style={{ fontSize: 11, color: '#334155', marginTop: 6, maxWidth: 200 }}>
                  Click on any machine in the factory floor to view AI-powered insights
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}