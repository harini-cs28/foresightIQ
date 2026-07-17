import { useState } from 'react'
import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Cpu, Thermometer, Zap, Activity, AlertTriangle, CheckCircle2, Clock, Settings } from 'lucide-react'

const MACHINES = [
  { id: 'CNC-07', name: 'CNC Machining Center 07', line: 'Line A', status: 'critical', health: 23, temp: 94, vibration: 8.7, power: 42, uptime: '18h 42m', lastMaint: '32 days ago' },
  { id: 'ROB-B4', name: 'Robot Arm Unit B4', line: 'Line B', status: 'warning', health: 67, temp: 72, vibration: 3.2, power: 28, uptime: '6d 4h', lastMaint: '12 days ago' },
  { id: 'CONV-L3', name: 'Conveyor System Line 3', line: 'Line C', status: 'warning', health: 58, temp: 61, vibration: 5.1, power: 35, uptime: '2d 14h', lastMaint: '18 days ago' },
  { id: 'PRESS-12', name: 'Hydraulic Press PM-12', line: 'Line A', status: 'healthy', health: 91, temp: 48, vibration: 0.8, power: 55, uptime: '14d 3h', lastMaint: '2 days ago' },
  { id: 'LATHE-09', name: 'CNC Lathe Machine 09', line: 'Line B', status: 'healthy', health: 88, temp: 52, vibration: 1.1, power: 38, uptime: '7d 22h', lastMaint: '5 days ago' },
  { id: 'DRILL-04', name: 'Precision Drill Unit 04', line: 'Line C', status: 'healthy', health: 94, temp: 44, vibration: 0.6, power: 22, uptime: '21d 8h', lastMaint: '1 day ago' },
  { id: 'WELD-02', name: 'MIG Welding Station 02', line: 'Line D', status: 'offline', health: 0, temp: 28, vibration: 0, power: 0, uptime: '0h', lastMaint: '45 days ago' },
  { id: 'MILL-11', name: 'Vertical Milling Machine 11', line: 'Line D', status: 'healthy', health: 79, temp: 58, vibration: 2.1, power: 45, uptime: '3d 11h', lastMaint: '9 days ago' },
]

const vibrationTrend = [
  { t: '0h', v: 1.2 }, { t: '4h', v: 1.8 }, { t: '8h', v: 2.4 }, { t: '12h', v: 3.5 },
  { t: '16h', v: 5.2 }, { t: '20h', v: 7.1 }, { t: 'Now', v: 8.7 }
]

const STATUS_CONFIG = {
  critical: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)', label: 'Critical', icon: AlertTriangle },
  warning: { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', label: 'Warning', icon: AlertTriangle },
  healthy: { color: '#22C55E', bg: 'rgba(34,197,94,0.1)', label: 'Healthy', icon: CheckCircle2 },
  offline: { color: '#475569', bg: 'rgba(71,85,105,0.1)', label: 'Offline', icon: Clock },
}

export default function FactoryOverview() {
  const [selected, setSelected] = useState<typeof MACHINES[0] | null>(MACHINES[0])
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterLine, setFilterLine] = useState<string>('all')

  const filtered = MACHINES.filter(m =>
    (filterStatus === 'all' || m.status === filterStatus) &&
    (filterLine === 'all' || m.line === filterLine)
  )

  const cfg = selected ? STATUS_CONFIG[selected.status as keyof typeof STATUS_CONFIG] : null

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk', color: '#F8FAFC' }}>Factory Overview</h1>
          <p className="text-sm mt-0.5" style={{ color: '#94A3B8' }}>Live status of all machines across production lines</p>
        </div>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm"
            style={{ background: '#111827', border: '1px solid rgba(59,130,246,0.2)', color: '#F8FAFC' }}>
            <option value="all">All Status</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="healthy">Healthy</option>
            <option value="offline">Offline</option>
          </select>
          <select
            value={filterLine}
            onChange={e => setFilterLine(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm"
            style={{ background: '#111827', border: '1px solid rgba(59,130,246,0.2)', color: '#F8FAFC' }}>
            <option value="all">All Lines</option>
            <option value="Line A">Line A</option>
            <option value="Line B">Line B</option>
            <option value="Line C">Line C</option>
            <option value="Line D">Line D</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Machine list */}
        <div className="lg:col-span-1 space-y-2">
          {filtered.map((m, i) => {
            const sc = STATUS_CONFIG[m.status as keyof typeof STATUS_CONFIG]
            const StatusIcon = sc.icon
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => setSelected(m)}
                className="p-4 rounded-xl cursor-pointer"
                style={{
                  background: selected?.id === m.id ? `${sc.color}10` : 'rgba(17,24,39,0.8)',
                  border: `1px solid ${selected?.id === m.id ? `${sc.color}40` : 'rgba(59,130,246,0.1)'}`,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-sm font-semibold" style={{ color: '#F8FAFC' }}>{m.id}</div>
                    <div className="text-xs" style={{ color: '#94A3B8' }}>{m.line}</div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ background: sc.bg, color: sc.color }}>
                    <StatusIcon size={10} />
                    {sc.label}
                  </div>
                </div>
                {m.status !== 'offline' && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs" style={{ color: '#94A3B8' }}>
                      <span>Health</span><span style={{ color: '#F8FAFC' }}>{m.health}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${m.health}%` }}
                        transition={{ delay: 0.3 + i * 0.06, duration: 0.7 }}
                        className="h-full rounded-full"
                        style={{ background: sc.color }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Machine detail */}
        {selected && cfg && (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-2 space-y-4"
          >
            {/* Header */}
            <div className="p-5 rounded-2xl glass-card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${cfg.color}15` }}>
                      <Cpu size={20} style={{ color: cfg.color }} />
                    </div>
                    <div>
                      <div className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk', color: '#F8FAFC' }}>{selected.name}</div>
                      <div className="text-xs" style={{ color: '#94A3B8' }}>{selected.id} · {selected.line} · Uptime: {selected.uptime}</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold"
                  style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
                  <cfg.icon size={14} />
                  {cfg.label}
                </div>
              </div>

              {/* Live metrics */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Health', value: `${selected.health}%`, icon: Activity, color: cfg.color },
                  { label: 'Temperature', value: `${selected.temp}°C`, icon: Thermometer, color: selected.temp > 80 ? '#EF4444' : selected.temp > 65 ? '#F59E0B' : '#22C55E' },
                  { label: 'Vibration', value: `${selected.vibration} mm/s`, icon: Zap, color: selected.vibration > 6 ? '#EF4444' : selected.vibration > 3 ? '#F59E0B' : '#22C55E' },
                  { label: 'Power Draw', value: `${selected.power} kW`, icon: Settings, color: '#3B82F6' },
                ].map((m, i) => (
                  <div key={i} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <m.icon size={13} style={{ color: m.color }} />
                      <span className="text-xs" style={{ color: '#94A3B8' }}>{m.label}</span>
                    </div>
                    <div className="text-lg font-bold" style={{ color: m.color, fontFamily: 'Space Grotesk' }}>{m.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vibration Trend Chart */}
            <div className="p-5 rounded-2xl glass-card">
              <div className="text-sm font-semibold mb-4" style={{ color: '#F8FAFC' }}>
                Vibration Trend (24h) — {selected.id}
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={vibrationTrend} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="t" tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, fontSize: 12 }} />
                  <Line type="monotone" dataKey="v" name="Vibration (mm/s)" stroke={cfg.color} strokeWidth={2} dot={{ fill: cfg.color, r: 3 }} />
                  {/* Threshold line */}
                  <Line type="monotone" data={vibrationTrend.map(d => ({ ...d, threshold: 4.5 }))} dataKey="threshold" stroke="rgba(245,158,11,0.5)" strokeDasharray="5 3" strokeWidth={1.5} dot={false} name="Threshold" />
                </LineChart>
              </ResponsiveContainer>
              {selected.status === 'critical' && (
                <div className="mt-3 p-3 rounded-xl flex items-center gap-2 text-sm"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <AlertTriangle size={15} style={{ color: '#EF4444' }} />
                  <span style={{ color: '#94A3B8' }}>
                    Vibration exceeded safe threshold 4 hours ago.{' '}
                    <strong style={{ color: '#EF4444' }}>Immediate maintenance required.</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Info row */}
            <div className="p-4 rounded-2xl glass-card flex items-center justify-between">
              <div className="text-sm" style={{ color: '#94A3B8' }}>
                Last maintenance: <strong style={{ color: '#F8FAFC' }}>{selected.lastMaint}</strong>
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{ background: 'linear-gradient(135deg, #3B82F6, #06B6D4)', color: 'white' }}>
                Schedule Maintenance
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
