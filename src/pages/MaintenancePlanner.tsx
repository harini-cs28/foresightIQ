import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, CheckCircle2, User, Wrench, Plus, ChevronRight, AlertTriangle } from 'lucide-react'

interface Task {
  id: string
  machine: string
  type: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  status: 'pending' | 'in-progress' | 'done' | 'overdue'
  assignee: string
  start: string
  duration: string
  savings: string
  aiGenerated: boolean
}

const TASKS: Task[] = [
  { id: 'MT-001', machine: 'CNC-07', type: 'Bearing Replacement', priority: 'critical', status: 'in-progress', assignee: 'Ravi Kumar', start: '10:00 AM', duration: '90 min', savings: '₹8.2L', aiGenerated: true },
  { id: 'MT-002', machine: 'Robot Arm B4', type: 'Coolant System Flush', priority: 'high', status: 'pending', assignee: 'Amit Shah', start: '2:00 PM', duration: '60 min', savings: '₹3.4L', aiGenerated: true },
  { id: 'MT-003', machine: 'Conveyor Line 3', type: 'Belt Tension & Inspection', priority: 'high', status: 'pending', assignee: 'Priya Nair', start: '4:30 PM', duration: '45 min', savings: '₹2.1L', aiGenerated: true },
  { id: 'MT-004', machine: 'Press PM-12', type: 'Lubrication Check', priority: 'medium', status: 'done', assignee: 'Suresh Rao', start: '8:00 AM', duration: '30 min', savings: '₹0.8L', aiGenerated: false },
  { id: 'MT-005', machine: 'Mill-11', type: 'Spindle Calibration', priority: 'medium', status: 'pending', assignee: 'Kiran Mehta', start: 'Thu 9:00 AM', duration: '2 hrs', savings: '₹1.2L', aiGenerated: true },
  { id: 'MT-006', machine: 'Lathe-09', type: 'Chuck Inspection', priority: 'low', status: 'pending', assignee: 'Deepa Iyer', start: 'Fri 11:00 AM', duration: '45 min', savings: '₹0.6L', aiGenerated: false },
  { id: 'MT-007', machine: 'Weld-02', type: 'Full System Restart', priority: 'high', status: 'overdue', assignee: 'Ravi Kumar', start: 'Yesterday', duration: '3 hrs', savings: '₹4.1L', aiGenerated: false },
]

const PRIORITY_CFG = {
  critical: { color: '#EF4444', bg: 'rgba(239,68,68,0.12)', label: 'Critical' },
  high: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', label: 'High' },
  medium: { color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', label: 'Medium' },
  low: { color: '#22C55E', bg: 'rgba(34,197,94,0.12)', label: 'Low' },
}

const STATUS_CFG = {
  pending: { color: '#94A3B8', label: 'Pending' },
  'in-progress': { color: '#3B82F6', label: 'In Progress' },
  done: { color: '#22C55E', label: 'Completed' },
  overdue: { color: '#EF4444', label: 'Overdue' },
}

const TECHNICIANS = [
  { name: 'Ravi Kumar', tasks: 2, status: 'busy', specialty: 'CNC / Bearing' },
  { name: 'Amit Shah', tasks: 1, status: 'available', specialty: 'Hydraulics / Coolant' },
  { name: 'Priya Nair', tasks: 1, status: 'available', specialty: 'Conveyor / Belt' },
  { name: 'Suresh Rao', tasks: 0, status: 'available', specialty: 'Lubrication / Valves' },
  { name: 'Kiran Mehta', tasks: 1, status: 'off-site', specialty: 'Precision / Milling' },
]

const CALENDAR_HOURS = ['8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM']
const GANTT_TASKS = [
  { id: 'MT-001', machine: 'CNC-07', color: '#EF4444', startPct: 25, widthPct: 18 },
  { id: 'MT-002', machine: 'Robot B4', color: '#F59E0B', startPct: 50, widthPct: 12 },
  { id: 'MT-003', machine: 'Conv-L3', color: '#F59E0B', startPct: 70, widthPct: 10 },
  { id: 'MT-004', machine: 'Press-12', color: '#22C55E', startPct: 5, widthPct: 8 },
]

export default function MaintenancePlanner() {
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [filter, setFilter] = useState<string>('all')

  const filtered = TASKS.filter(t => filter === 'all' || t.status === filter)
  const totals = {
    done: TASKS.filter(t => t.status === 'done').length,
    inProgress: TASKS.filter(t => t.status === 'in-progress').length,
    pending: TASKS.filter(t => t.status === 'pending').length,
    overdue: TASKS.filter(t => t.status === 'overdue').length,
  }
  const totalSavings = TASKS.filter(t => t.status !== 'overdue')
    .reduce((acc, t) => acc + parseFloat(t.savings.replace('₹', '').replace('L', '')), 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk', color: '#F8FAFC' }}>Maintenance Planner</h1>
          <p className="text-sm mt-0.5" style={{ color: '#94A3B8' }}>AI-optimized maintenance scheduling & workforce management</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(59,130,246,0.2)' }}>
            {(['list', 'calendar'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className="px-4 py-2 text-sm font-medium capitalize transition-all"
                style={{ background: view === v ? '#3B82F6' : 'transparent', color: view === v ? '#fff' : '#94A3B8' }}>
                {v}
              </button>
            ))}
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #06B6D4)', color: 'white' }}>
            <Plus size={15} /> Add Task
          </motion.button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Completed Today', value: totals.done, color: '#22C55E' },
          { label: 'In Progress', value: totals.inProgress, color: '#3B82F6' },
          { label: 'Pending', value: totals.pending, color: '#F59E0B' },
          { label: 'Overdue', value: totals.overdue, color: '#EF4444' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="p-4 rounded-2xl glass-card text-center">
            <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk', color: s.color }}>{s.value}</div>
            <div className="text-xs" style={{ color: '#94A3B8' }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Task list / Calendar */}
        <div className="lg:col-span-3 space-y-4">
          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            {['all', 'in-progress', 'pending', 'done', 'overdue'].map(f => (
              <motion.button key={f} onClick={() => setFilter(f)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="px-3 py-1.5 rounded-full text-xs font-medium capitalize"
                style={{
                  background: filter === f ? '#3B82F6' : 'rgba(255,255,255,0.04)',
                  color: filter === f ? '#fff' : '#94A3B8',
                  border: '1px solid rgba(59,130,246,0.15)'
                }}>
                {f === 'all' ? 'All Tasks' : f}
              </motion.button>
            ))}
          </div>

          {/* Gantt Preview */}
          {view === 'calendar' && (
            <div className="p-5 rounded-2xl glass-card">
              <div className="text-sm font-semibold mb-4" style={{ color: '#F8FAFC' }}>Today's Schedule (Gantt View)</div>
              <div className="flex gap-0 mb-2">
                {CALENDAR_HOURS.map(h => (
                  <div key={h} className="flex-1 text-xs text-center" style={{ color: '#475569' }}>{h}</div>
                ))}
              </div>
              <div className="space-y-2">
                {GANTT_TASKS.map((t, i) => (
                  <div key={i} className="relative h-8 rounded-lg overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <motion.div
                      className="absolute text-xs font-medium text-white flex items-center px-2 h-full rounded-md"
                      style={{ left: `${t.startPct}%`, background: t.color, minWidth: 60, opacity: 0.85 }}
                      initial={{ width: 0 }}
                      animate={{ width: `${t.widthPct}%` }}
                      transition={{ duration: 0.7, delay: i * 0.15, ease: 'easeOut' }}
                    >
                      {t.machine}
                    </motion.div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Task rows */}
          <div className="space-y-2">
            {filtered.map((task, i) => {
              const pc = PRIORITY_CFG[task.priority]
              const sc = STATUS_CFG[task.status]
              return (
                <motion.div key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.01, y: -1 }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ delay: i * 0.06 }}
                  className="p-4 rounded-2xl glass-card glass-card-hover cursor-pointer"
                  style={task.status === 'overdue'
                    ? { borderColor: 'rgba(239,68,68,0.35)', borderLeft: '3px solid #EF4444' }
                    : {}}
                >
                  <div className="flex items-center gap-3">
                    {/* Status icon */}
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: pc.bg }}>
                      {task.status === 'done' ? <CheckCircle2 size={16} style={{ color: '#22C55E' }} />
                        : task.status === 'in-progress' ? <Wrench size={16} style={{ color: '#3B82F6' }} />
                        : task.status === 'overdue' ? <AlertTriangle size={16} style={{ color: '#EF4444' }} />
                        : <Clock size={16} style={{ color: '#F59E0B' }} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold" style={{ color: '#F8FAFC' }}>{task.machine}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded-md font-mono" style={{ background: 'rgba(255,255,255,0.05)', color: '#94A3B8' }}>{task.id}</span>
                        {task.aiGenerated && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                            style={{ background: 'rgba(6,182,212,0.1)', color: '#06B6D4', border: '1px solid rgba(6,182,212,0.2)' }}>
                            AI Generated
                          </span>
                        )}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{task.type}</div>
                    </div>

                    <div className="hidden lg:flex items-center gap-4 text-xs flex-shrink-0">
                      <div className="flex items-center gap-1.5" style={{ color: '#94A3B8' }}>
                        <Clock size={12} />{task.start} · {task.duration}
                      </div>
                      <div className="flex items-center gap-1.5" style={{ color: '#94A3B8' }}>
                        <User size={12} />{task.assignee}
                      </div>
                      <span className="font-bold" style={{ color: '#22C55E' }}>{task.savings}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: `${sc.color}15`, color: sc.color }}>
                        {sc.label}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: pc.bg, color: pc.color }}>
                        {pc.label}
                      </span>
                    </div>
                    <ChevronRight size={16} style={{ color: '#475569', flexShrink: 0 }} />
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Technicians sidebar */}
        <div className="space-y-4">
          <div className="p-4 rounded-2xl glass-card">
            <div className="text-sm font-semibold mb-4" style={{ color: '#F8FAFC' }}>Technicians</div>
            <div className="space-y-3">
              {TECHNICIANS.map((t, i) => {
                const statusColor = t.status === 'busy' ? '#F59E0B' : t.status === 'available' ? '#22C55E' : '#94A3B8'
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(6,182,212,0.3))' }}>
                        {t.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
                        style={{ background: statusColor, border: '2px solid #0F172A' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold truncate" style={{ color: '#F8FAFC' }}>{t.name}</div>
                      <div className="text-xs truncate" style={{ color: '#94A3B8' }}>{t.specialty}</div>
                    </div>
                    <div className="text-xs font-medium" style={{ color: statusColor }}>
                      {t.tasks > 0 ? `${t.tasks} task${t.tasks > 1 ? 's' : ''}` : 'Free'}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Savings summary */}
          <div className="p-4 rounded-2xl" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <div className="text-xs font-semibold mb-2" style={{ color: '#94A3B8' }}>Total Preventable Loss</div>
            <div className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk', color: '#22C55E' }}>
              ₹{totalSavings.toFixed(1)}L
            </div>
            <div className="text-xs mt-1" style={{ color: '#94A3B8' }}>if all tasks completed today</div>
          </div>
        </div>
      </div>
    </div>
  )
}
