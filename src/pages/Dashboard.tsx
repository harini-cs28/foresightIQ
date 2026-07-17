import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import {
  Activity, AlertTriangle, CheckCircle2, TrendingDown, TrendingUp,
  Zap, Cpu, Thermometer, Wrench, ChevronRight, Bot, ArrowUpRight
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// Data
const healthData = [
  { time: '00:00', health: 94, anomaly: 2 }, { time: '02:00', health: 91, anomaly: 3 },
  { time: '04:00', health: 88, anomaly: 5 }, { time: '06:00', health: 85, anomaly: 7 },
  { time: '08:00', health: 87, anomaly: 6 }, { time: '10:00', health: 82, anomaly: 9 },
  { time: '12:00', health: 79, anomaly: 11 }, { time: 'Now', health: 84, anomaly: 8 },
]

const failureProbData = [
  { machine: 'CNC-07', prob: 87, status: 'critical' },
  { machine: 'Robot B4', prob: 63, status: 'warning' },
  { machine: 'Conv-L3', prob: 54, status: 'warning' },
  { machine: 'Press-12', prob: 28, status: 'healthy' },
  { machine: 'Lathe-09', prob: 19, status: 'healthy' },
  { machine: 'Drill-04', prob: 12, status: 'healthy' },
]

const energyData = [
  { day: 'Mon', actual: 4200, target: 4000 }, { day: 'Tue', actual: 3800, target: 4000 },
  { day: 'Wed', actual: 4500, target: 4000 }, { day: 'Thu', actual: 3900, target: 4000 },
  { day: 'Fri', actual: 4100, target: 4000 }, { day: 'Sat', actual: 3600, target: 4000 },
  { day: 'Today', actual: 3750, target: 4000 },
]

const machineStatusDist = [
  { name: 'Healthy', value: 127, color: '#22C55E' },
  { name: 'Warning', value: 12, color: '#F59E0B' },
  { name: 'Critical', value: 3, color: '#EF4444' },
  { name: 'Offline', value: 6, color: '#475569' },
]

const alerts = [
  { id: 1, machine: 'CNC-07', type: 'critical', msg: 'Vibration anomaly detected — bearing failure predicted in 4h', time: '2m ago', icon: AlertTriangle },
  { id: 2, machine: 'Robot Arm B4', type: 'warning', msg: 'Temperature rising above threshold (72°C)', time: '8m ago', icon: Thermometer },
  { id: 3, machine: 'Conveyor Line 3', type: 'warning', msg: 'Belt wear detected — 68% probability of failure in 24h', time: '15m ago', icon: Zap },
  { id: 4, machine: 'Press Machine PM-12', type: 'healthy', msg: 'Preventive maintenance completed successfully', time: '1h ago', icon: CheckCircle2 },
]

const aiRecs = [
  { title: 'Immediate: Inspect CNC-07', detail: 'High vibration pattern matches bearing failure profile. Replace bearing in next 2 hours.', priority: 'critical', savings: '₹8.2L' },
  { title: 'Schedule: Robot Arm B4 Coolant', detail: 'Temperature spike correlates with coolant degradation. Service by EOD.', priority: 'warning', savings: '₹3.4L' },
  { title: 'Optimize: Conveyor Line 3 Speed', detail: 'Reduce belt speed by 12% to extend service life by 3 weeks.', priority: 'info', savings: '₹1.8L' },
]

const METRIC_CARDS = [
  { label: 'Factory Health Score', value: 84, suffix: '%', prefix: '', trend: -3, trendLabel: 'vs yesterday', color: '#3B82F6', icon: Activity, isStatic: false },
  { label: 'Active Machines', value: 142, suffix: '/148', prefix: '', trend: +2, trendLabel: 'vs yesterday', color: '#22C55E', icon: Cpu, isStatic: false },
  { label: 'Critical Machines', value: 3, suffix: '', prefix: '', trend: +1, trendLabel: 'new alerts', color: '#EF4444', icon: AlertTriangle, isStatic: false },
  { label: 'Downtime Prevented', value: 48, suffix: 'h', prefix: '', trend: +12, trendLabel: 'this week', color: '#06B6D4', icon: TrendingDown, isStatic: false },
  { label: 'Est. Savings Today', value: 0, suffix: '', prefix: '₹2.6M', trend: +8, trendLabel: 'above target', color: '#F59E0B', icon: TrendingUp, isStatic: true },
]

function AnimatedCounter({ target, duration = 1200 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const start = Date.now()
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(target * ease))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration])
  return <>{count}</>
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="px-3 py-2 rounded-xl text-xs" style={{ background: '#111827', border: '1px solid rgba(59,130,246,0.2)' }}>
        <div className="font-medium mb-1" style={{ color: '#94A3B8' }}>{label}</div>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span style={{ color: '#F8FAFC' }}>{p.name}: <strong>{p.value}</strong></span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [selectedCard, setSelectedCard] = useState<number | null>(null)

  // Heatmap mini preview — frozen with useMemo to prevent re-randomization
  const heatmapData = useMemo(() => {
    const vals = [0.1, 0.2, 0.3, 0.5, 0.6, 0.8, 0.9, 0.95]
    return Array.from({ length: 10 * 8 }, () => vals[Math.floor(Math.random() * vals.length)])
  }, [])
  const getHeatColor = (v: number) => {
    if (v < 0.3) return '#22C55E'
    if (v < 0.6) return '#F59E0B'
    if (v < 0.85) return '#EF4444'
    return '#7F1D1D'
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk', color: '#F8FAFC' }}>
            Operations Dashboard
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#94A3B8' }}>
            Real-time factory intelligence — Pune Manufacturing Unit
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#22C55E' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Live
          </div>
          <button
            onClick={() => navigate('/app/copilot')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #06B6D4)' }}>
            <Bot size={15} />
            Ask AI Copilot
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {METRIC_CARDS.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -3, boxShadow: `0 8px 32px ${card.color}18` }}
            whileTap={{ scale: 0.98 }}
            transition={{ delay: i * 0.07,duration: 0.2}}
            onClick={() => setSelectedCard(selectedCard === i ? null : i)}
            className="p-4 rounded-2xl glass-card glass-card-hover cursor-pointer"
            style={selectedCard === i ? { borderColor: card.color, boxShadow: `0 0 24px ${card.color}22` } : {}}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `${card.color}18` }}>
                <card.icon size={18} style={{ color: card.color }} />
              </div>
              <div className="flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-full"
                style={{
                  color: card.label === 'Critical Machines' && card.trend > 0 ? '#EF4444' : card.trend > 0 ? '#22C55E' : '#EF4444',
                  background: card.label === 'Critical Machines' && card.trend > 0 ? 'rgba(239,68,68,0.1)' : card.trend > 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'
                }}>
                {card.trend > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {Math.abs(card.trend)}
              </div>
            </div>
            <div className="text-2xl font-bold mb-0.5" style={{ color: '#F8FAFC', fontFamily: 'Space Grotesk' }}>
              {card.isStatic ? (
                card.prefix
              ) : (
                <>
                  {card.prefix}
                  <AnimatedCounter target={card.value} duration={800 + i * 100} />
                  {card.suffix}
                </>
              )}
            </div>
            <div className="text-xs font-medium" style={{ color: '#94A3B8' }}>{card.label}</div>
            <div className="text-xs mt-0.5" style={{ color: '#475569' }}>{card.trendLabel}</div>
          </motion.div>
        ))}
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Factory Health Trend */}
        <div className="lg:col-span-2 p-5 rounded-2xl glass-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold" style={{ color: '#F8FAFC' }}>Factory Health Index</div>
              <div className="text-xs" style={{ color: '#94A3B8' }}>24-hour rolling average</div>
            </div>
            <div className="text-2xl font-bold" style={{ color: '#3B82F6', fontFamily: 'Space Grotesk' }}>84%</div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={healthData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="anomalyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="health" name="Health %" stroke="#3B82F6" fill="url(#healthGrad)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="anomaly" name="Anomalies" stroke="#EF4444" fill="url(#anomalyGrad)" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Machine Status Distribution */}
        <div className="p-5 rounded-2xl glass-card flex flex-col">
          <div className="text-sm font-semibold mb-1" style={{ color: '#F8FAFC' }}>Machine Status</div>
          <div className="text-xs mb-4" style={{ color: '#94A3B8' }}>148 machines total</div>
          <div className="flex-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={machineStatusDist} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {machineStatusDist.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ background: '#111827', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {machineStatusDist.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                <span className="text-xs" style={{ color: '#94A3B8' }}>{d.name}: <strong style={{ color: '#F8FAFC' }}>{d.value}</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Failure Prob + Energy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Failure Probability */}
        <div className="p-5 rounded-2xl glass-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold" style={{ color: '#F8FAFC' }}>Failure Probability</div>
              <div className="text-xs" style={{ color: '#94A3B8' }}>Top 6 at-risk machines</div>
            </div>
            <button onClick={() => navigate('/app/failure-intelligence')}
              className="text-xs flex items-center gap-1 cursor-pointer transition-colors hover:opacity-80" style={{ color: '#3B82F6' }}>
              View all <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {failureProbData.map((m, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="text-xs font-medium w-16 flex-shrink-0" style={{ color: '#94A3B8' }}>{m.machine}</div>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${m.prob}%` }}
                    transition={{ delay: 0.3 + i * 0.08, duration: 0.7, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: m.status === 'critical' ? '#EF4444' : m.status === 'warning' ? '#F59E0B' : '#22C55E' }}
                  />
                </div>
                <div className="text-xs font-bold w-10 text-right"
                  style={{ color: m.status === 'critical' ? '#EF4444' : m.status === 'warning' ? '#F59E0B' : '#22C55E' }}>
                  {m.prob}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Energy Consumption */}
        <div className="p-5 rounded-2xl glass-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold" style={{ color: '#F8FAFC' }}>Energy Consumption</div>
              <div className="text-xs" style={{ color: '#94A3B8' }}>kWh vs daily target</div>
            </div>
            <div className="text-xs px-2 py-1 rounded-full font-medium"
              style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)' }}>
              6.25% below target
            </div>
          </div>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={energyData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="actual" name="Actual kWh" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="target" name="Target kWh" fill="rgba(6,182,212,0.25)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 4: AI Recs + Alerts + Heatmap Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* AI Recommendations */}
        <div className="p-5 rounded-2xl glass-card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(6,182,212,0.2))' }}>
              <Bot size={14} style={{ color: '#06B6D4' }} />
            </div>
            <div className="text-sm font-semibold" style={{ color: '#F8FAFC' }}>AI Recommendations</div>
          </div>
          <div className="space-y-3">
            {aiRecs.map((rec, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="p-3 rounded-xl"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: `1px solid ${rec.priority === 'critical' ? 'rgba(239,68,68,0.2)' : rec.priority === 'warning' ? 'rgba(245,158,11,0.2)' : 'rgba(59,130,246,0.15)'}`
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="text-xs font-semibold" style={{ color: '#F8FAFC' }}>{rec.title}</div>
                  <span className="text-xs font-bold flex-shrink-0" style={{ color: '#22C55E' }}>{rec.savings}</span>
                </div>
                <div className="text-xs leading-relaxed" style={{ color: '#94A3B8' }}>{rec.detail}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="p-5 rounded-2xl glass-card">
          <div className="text-sm font-semibold mb-4" style={{ color: '#F8FAFC' }}>Recent Alerts</div>
          <div className="space-y-2">
            {alerts.map((alert, i) => {
              const colors = { critical: '#EF4444', warning: '#F59E0B', healthy: '#22C55E' }
              const color = colors[alert.type as keyof typeof colors]
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ x: 3, background: 'rgba(59,130,246,0.04)' }}
                  transition={{delay: 0.3 + i * 0.08,duration: 0.15}}
                  className="flex items-start gap-3 p-2 rounded-xl cursor-pointer"
                  style={{ borderBottom: i < alerts.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${color}15` }}>
                    <alert.icon size={14} style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate" style={{ color: '#F8FAFC' }}>{alert.machine}</div>
                    <div className="text-xs leading-relaxed mt-0.5" style={{ color: '#94A3B8' }}>{alert.msg}</div>
                    <div className="text-xs mt-1" style={{ color: '#475569' }}>{alert.time}</div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Heatmap Preview */}
        <div className="p-5 rounded-2xl glass-card">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold" style={{ color: '#F8FAFC' }}>Factory Heatmap</div>
            <button onClick={() => navigate('/app/heatmap')}
              className="flex items-center gap-1 text-xs cursor-pointer transition-opacity hover:opacity-80" style={{ color: '#3B82F6' }}>
              Full view <ArrowUpRight size={12} />
            </button>
          </div>
          <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
            {heatmapData.map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.02 * i, duration: 0.2 }}
                className="heatmap-cell aspect-square"
                style={{ background: getHeatColor(v), opacity: 0.7 + v * 0.3 }}
                title={`Zone ${i + 1}: ${Math.round(v * 100)}%`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-3">
              {[{ c: '#22C55E', l: 'Normal' }, { c: '#F59E0B', l: 'Warning' }, { c: '#EF4444', l: 'Critical' }].map(({ c, l }) => (
                <div key={l} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm" style={{ background: c }} />
                  <span className="text-xs" style={{ color: '#94A3B8' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 p-2 rounded-lg text-xs" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#94A3B8' }}>
            <span style={{ color: '#EF4444' }}>3 zones</span> require immediate inspection
          </div>
        </div>
      </div>
    </div>
  )
}
