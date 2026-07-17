import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, BarChart2, CheckCircle2, Clock,
  Download, Moon, Shield, TrendingUp, Zap,
} from 'lucide-react'
import FORESRobot, { type RobotState } from '../components/FORESRobot'
import { useVoice } from '../hooks/useVoice'

// ─── Animated Counter ─────────────────────────────────────────────────────────
function Counter({
  target, prefix = '', suffix = '', duration = 1400, decimals = 0,
  color = '#F8FAFC', size = 'xl',
}: {
  target: number; prefix?: string; suffix?: string; duration?: number
  decimals?: number; color?: string; size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
}) {
  const [val, setVal] = useState(0)
  const sizeClass = { sm: 'text-sm', md: 'text-base', lg: 'text-lg', xl: 'text-xl', '2xl': 'text-2xl', '3xl': 'text-3xl' }[size]

  useEffect(() => {
    const start = Date.now()
    const raf = () => {
      const p = Math.min(1, (Date.now() - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(eased * target)
      if (p < 1) requestAnimationFrame(raf)
    }
    const id = requestAnimationFrame(raf)
    return () => cancelAnimationFrame(id)
  }, [target, duration])

  const display = decimals > 0 ? val.toFixed(decimals) : Math.round(val).toLocaleString('en-IN')
  return (
    <span style={{ color, fontFamily: 'Space Grotesk', fontWeight: 700 }} className={sizeClass}>
      {prefix}{display}{suffix}
    </span>
  )
}

// ─── Radial Health Arc ────────────────────────────────────────────────────────
function HealthArc({ value, color, label, sub, delay = 0, size = 88 }: {
  value: number; color: string; label: string; sub: string; delay?: number; size?: number
}) {
  const [live, setLive] = useState(0)
  const circumference = 2 * Math.PI * 32

  useEffect(() => {
    const t = setTimeout(() => {
      const start = Date.now()
      const dur = 1200
      const raf = () => {
        const p = Math.min(1, (Date.now() - start) / dur)
        setLive(p * value)
        if (p < 1) requestAnimationFrame(raf)
      }
      requestAnimationFrame(raf)
    }, delay)
    return () => clearTimeout(t)
  }, [value, delay])

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 88 88" width={size} height={size}>
          <circle cx="44" cy="44" r="32" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
          <motion.circle cx="44" cy="44" r="32" fill="none" stroke={color} strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{
              strokeDashoffset: circumference * (1 - live / 100),
              transform: 'rotate(-90deg)', transformOrigin: '44px 44px',
            }} />
          <motion.circle cx="44" cy="44" r="22" fill={`${color}10`}
            animate={{ r: [22, 24, 22] }} transition={{ duration: 2.5, repeat: Infinity }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-bold leading-none" style={{ color, fontSize: 18, fontFamily: 'Space Grotesk' }}>
            {Math.round(live)}%
          </span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-xs font-bold" style={{ color: '#F8FAFC' }}>{label}</div>
        <div className="text-xs" style={{ color: '#475569' }}>{sub}</div>
      </div>
    </div>
  )
}

// ─── Timeline Item ────────────────────────────────────────────────────────────
function TimelineItem({ time, label, desc, color, last = false, delay }: {
  time: string; label: string; desc: string; color: string; last?: boolean; delay: number
}) {
  return (
    <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="flex items-start gap-2.5">
      <div className="flex flex-col items-center flex-shrink-0">
        <motion.div className="w-2.5 h-2.5 rounded-full mt-0.5"
          style={{ background: color, boxShadow: `0 0 8px ${color}80` }}
          animate={{ scale: [1, 1.25, 1] }} transition={{ duration: 1.8, repeat: Infinity, delay: delay * 0.3 }} />
        {!last && <div className="w-px flex-1" style={{ background: 'rgba(255,255,255,0.06)', minHeight: 22, marginTop: 3 }} />}
      </div>
      <div className="pb-3 min-w-0">
        <div className="text-xs font-bold" style={{ color }}>{time}</div>
        <div className="text-xs font-semibold" style={{ color: '#E2E8F0' }}>{label}</div>
        <div className="text-xs leading-tight mt-0.5" style={{ color: '#475569' }}>{desc}</div>
      </div>
    </motion.div>
  )
}

// ─── Stat Row ─────────────────────────────────────────────────────────────────
function StatRow({ label, value, color, delay }: { label: string; value: string; color: string; delay: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="flex items-center justify-between py-1.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
      <span className="text-xs" style={{ color: '#64748B' }}>{label}</span>
      <span className="text-xs font-bold" style={{ color, fontFamily: 'Space Grotesk' }}>{value}</span>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EndOfDay() {
  const navigate = useNavigate()
  const [robotState, setRobotState] = useState<RobotState>('celebrating')
  const [monitoringActive, setMonitoringActive] = useState(false)

  const voice = useVoice({
    onSpeakStart: () => setRobotState('speaking'),
    onSpeakEnd: () => setRobotState(monitoringActive ? 'idle' : 'celebrating'),
  })

  // Auto-speak on mount
  useEffect(() => {
    const t = setTimeout(() => {
      voice.speak(
        'Mission accomplished. Today\'s factory operations have been completed successfully. Five potential failures were prevented, saving two point six million rupees. Your factory is fully prepared for tomorrow.'
      )
    }, 800)
    return () => clearTimeout(t)
  }, [])

  const handleOvernightMonitoring = useCallback(() => {
    setMonitoringActive(true)
    setRobotState('speaking')
    voice.stopSpeaking()
    setTimeout(() => {
      voice.speak(
        "I'll continue monitoring your factory throughout the night. If any anomaly is detected, I'll prepare recommendations before tomorrow's shift begins. Have a productive evening."
      )
    }, 200)
  }, [voice])

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ background: '#0B1220', fontFamily: 'Inter, sans-serif', height: '100vh' }}>

      {/* ── Ambient particles ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(18)].map((_, i) => (
          <motion.div key={i}
            className="absolute rounded-full"
            style={{
              width: 2 + (i % 3), height: 2 + (i % 3),
              background: ['#3B82F6', '#06B6D4', '#22C55E', '#8B5CF6'][i % 4],
              left: `${5 + i * 5.2}%`,
              opacity: 0.3 + (i % 3) * 0.15,
            }}
            animate={{ y: [0, -28, 0], opacity: [0.15, 0.5, 0.15] }}
            transition={{ duration: 4 + (i % 4), repeat: Infinity, delay: i * 0.3, ease: 'easeInOut' }}
          />
        ))}
        {/* Radial glow */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(34,197,94,0.04) 0%, transparent 65%)'
        }} />
      </div>

      {/* ════════════════════════════════════════
          ROW 1 — TOP BAR (logo + status)
          ════════════════════════════════════════ */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-2 z-20"
        style={{ borderBottom: '1px solid rgba(34,197,94,0.08)', background: 'rgba(11,18,32,0.8)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-2.5">
          <motion.div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#22C55E,#06B6D4)', boxShadow: '0 0 14px rgba(34,197,94,0.4)' }}
            animate={{ boxShadow: ['0 0 14px rgba(34,197,94,0.4)', '0 0 26px rgba(6,182,212,0.5)', '0 0 14px rgba(34,197,94,0.4)'] }}
            transition={{ duration: 3, repeat: Infinity }}>
            <Shield size={15} className="text-white" />
          </motion.div>
          <div>
            <div className="font-bold text-sm leading-none" style={{ fontFamily: 'Space Grotesk', color: '#F8FAFC' }}>
              Foresight<span style={{ color: '#22C55E' }}>IQ</span>
            </div>
            <div className="text-xs" style={{ color: '#475569' }}>Daily Operations Summary</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AnimatePresence>
            {monitoringActive && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22C55E' }}>
                <motion.span className="w-1.5 h-1.5 rounded-full" style={{ background: '#22C55E' }}
                  animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
                Overnight Monitoring Active · 1,247 Sensors
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22C55E' }}>
            <motion.span className="w-1.5 h-1.5 rounded-full" style={{ background: '#22C55E' }}
              animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
            Daily Operations Complete
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          MAIN CONTENT — flex col, fills rest
          ════════════════════════════════════════ */}
      <div className="flex-1 grid grid-rows-[auto_auto_1fr_auto_auto] min-h-0 px-5 py-3 gap-3 relative z-10">

        {/* ════ ROW A — FORES Robot Hero ════ */}
        <motion.div
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="flex flex-col items-center justify-center gap-1">

          {/* Status badge above */}
          <div className="flex items-center gap-2 px-4 py-1 rounded-full text-xs font-bold tracking-widest mb-1"
            style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', color: '#22C55E', letterSpacing: '0.15em' }}>
            <motion.span className="w-1.5 h-1.5 rounded-full" style={{ background: '#22C55E' }}
              animate={{ opacity: [1, 0.3, 1], scale: [1, 1.4, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
            DAILY OPERATIONS COMPLETE
          </div>

          {/* Robot + title */}
          <div className="flex items-center gap-6">
            <FORESRobot state={robotState} size={130} />
            <div>
              <motion.h1
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                className="font-bold leading-tight mb-1"
                style={{ fontFamily: 'Space Grotesk', color: '#F8FAFC', fontSize: 26 }}>
                Mission Accomplished
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 }}
                className="text-sm" style={{ color: '#94A3B8' }}>
                Factory Operations Completed Successfully
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
                className="mt-1.5 text-xs italic" style={{ color: '#475569' }}>
                "Today's factory is operating safely. Have a productive day."
              </motion.p>
            </div>
          </div>
        </motion.div>

        {/* ════ ROW B — 5 KPI Cards ════ */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: 'Factory Health', value: 92, suffix: '%', color: '#22C55E', icon: Shield, delay: 0.1 },
            { label: 'Failures Prevented', value: 5, suffix: '', color: '#EF4444', icon: Zap, delay: 0.2 },
            { label: 'Downtime Prevented', value: 48, suffix: ' hrs', color: '#3B82F6', icon: Clock, delay: 0.3 },
            { label: 'Money Saved', value: 2.6, suffix: 'M', prefix: '₹', color: '#F59E0B', decimals: 1, icon: TrendingUp, delay: 0.4 },
            { label: 'Maintenance Done', value: 8, suffix: ' tasks', color: '#8B5CF6', icon: CheckCircle2, delay: 0.5 },
          ].map((kpi, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 16, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: kpi.delay, duration: 0.45, type: 'spring', stiffness: 220, damping: 22 }}
              whileHover={{ scale: 1.04, y: -2, boxShadow: `0 0 24px ${kpi.color}30` }}
              className="relative flex flex-col items-center justify-center py-3 px-3 rounded-2xl overflow-hidden cursor-default"
              style={{
                background: `linear-gradient(135deg, ${kpi.color}0C, rgba(17,24,39,0.9))`,
                border: `1px solid ${kpi.color}22`,
                backdropFilter: 'blur(10px)',
              }}>
              {/* Corner glow */}
              <div className="absolute top-0 right-0 w-12 h-12 rounded-full pointer-events-none"
                style={{ background: `radial-gradient(circle, ${kpi.color}15 0%, transparent 70%)` }} />
              <kpi.icon size={16} style={{ color: kpi.color, marginBottom: 4, opacity: 0.8 }} />
              <Counter target={kpi.value} prefix={kpi.prefix || ''} suffix={kpi.suffix}
                decimals={kpi.decimals || 0} color={kpi.color} size="2xl" duration={1200 + i * 100} />
              <div className="text-xs text-center mt-1 leading-tight" style={{ color: '#64748B' }}>{kpi.label}</div>
            </motion.div>
          ))}
        </div>

        {/* ════ ROW C — Two-column main section ════ */}
        <div className="grid grid-cols-2 gap-3 min-h-0">

          {/* LEFT — FORES Reflection */}
          <motion.div
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.5 }}
            className="relative rounded-2xl p-4 flex flex-col overflow-hidden"
            style={{ background: 'rgba(17,24,39,0.9)', border: '1px solid rgba(6,182,212,0.15)', backdropFilter: 'blur(12px)' }}>

            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,rgba(6,182,212,0.3),rgba(59,130,246,0.25))', border: '1px solid rgba(6,182,212,0.4)' }}>
                <span className="text-xs font-bold" style={{ color: '#06B6D4' }}>F</span>
              </div>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#06B6D4' }}>FORES — Daily Reflection</span>
            </div>

            {/* Reflection bullets */}
            <div className="flex-1 space-y-2">
              {[
                { text: 'Monitored over 1,247 sensors across all factory zones.', icon: '📡', color: '#3B82F6' },
                { text: 'Predicted and prevented 5 potential machine failures today.', icon: '🛡', color: '#22C55E' },
                { text: 'Production continued without interruption throughout the shift.', icon: '⚡', color: '#06B6D4' },
                { text: 'Estimated savings reached ₹2.6 million in unplanned repair costs.', icon: '💰', color: '#F59E0B' },
                { text: 'No critical risks remain active. All alerts resolved.', icon: '✅', color: '#22C55E' },
                { text: 'Factory is fully prepared for tomorrow\'s morning shift.', icon: '🌅', color: '#8B5CF6' },
              ].map((item, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.12, duration: 0.35 }}
                  className="flex items-start gap-2.5 p-2 rounded-xl"
                  style={{ background: `${item.color}06`, border: `1px solid ${item.color}12` }}>
                  <span className="text-sm flex-shrink-0 leading-none mt-0.5">{item.icon}</span>
                  <span className="text-xs leading-relaxed" style={{ color: '#CBD5E1' }}>{item.text}</span>
                </motion.div>
              ))}
            </div>

            {/* Bottom glow line */}
            <div className="absolute bottom-0 left-6 right-6 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.4), transparent)' }} />
          </motion.div>

          {/* RIGHT — Before vs After + stats */}
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5, duration: 0.5 }}
            className="rounded-2xl p-4 flex flex-col gap-3"
            style={{ background: 'rgba(17,24,39,0.9)', border: '1px solid rgba(59,130,246,0.14)', backdropFilter: 'blur(12px)' }}>

            <div className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>Health Improvement</div>

            {/* Health arcs */}
            <div className="flex items-center justify-center gap-5">
              <HealthArc value={76} color="#F59E0B" label="Morning" sub="08:00 AM" delay={400} size={82} />

              <div className="flex flex-col items-center gap-1">
                <motion.div
                  animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}>
                  <ArrowRight size={20} style={{ color: '#22C55E' }} />
                </motion.div>
                <div className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22C55E' }}>
                  +16%
                </div>
              </div>

              <HealthArc value={92} color="#22C55E" label="Evening" sub="06:00 PM" delay={600} size={82} />
            </div>

            {/* Improvement stats */}
            <div className="space-y-0.5 mt-1">
              {[
                { label: '⬇ Risk Reduced', value: '76% → 8%', color: '#22C55E' },
                { label: '⏱ Downtime Prevented', value: '48 hours', color: '#3B82F6' },
                { label: '🔧 Maintenance Completed', value: '8 tasks', color: '#8B5CF6' },
                { label: '💡 AI Interventions', value: '17 successful', color: '#06B6D4' },
              ].map((s, i) => (
                <StatRow key={i} label={s.label} value={s.value} color={s.color} delay={0.7 + i * 0.1} />
              ))}
            </div>
          </motion.div>
        </div>

        {/* ════ ROW D — Timeline + AI Performance ════ */}
        <div className="grid grid-cols-2 gap-3">

          {/* Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="rounded-2xl px-4 py-3"
            style={{ background: 'rgba(17,24,39,0.9)', border: '1px solid rgba(59,130,246,0.1)' }}>
            <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#94A3B8' }}>Today's Timeline</div>
            <div className="space-y-0">
              {[
                { time: '08:15', label: 'Anomaly Detected', desc: 'Vibration spike on M-104', color: '#F59E0B', delay: 0.6 },
                { time: '08:45', label: 'AI Predicted Failure', desc: '94% failure probability confirmed', color: '#EF4444', delay: 0.8 },
                { time: '09:30', label: 'Maintenance Scheduled', desc: 'Ravi Kumar assigned — WO-2024-0847', color: '#3B82F6', delay: 1.0 },
                { time: '11:00', label: 'Machine Restored', desc: 'Factory health rose to 92%', color: '#22C55E', delay: 1.2, last: true },
              ].map((ev, i) => (
                <TimelineItem key={i} {...ev} />
              ))}
            </div>
          </motion.div>

          {/* AI Performance */}
          <motion.div
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            className="rounded-2xl px-4 py-3"
            style={{ background: 'rgba(17,24,39,0.9)', border: '1px solid rgba(139,92,246,0.12)' }}>
            <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#94A3B8' }}>AI Performance</div>
            <div className="space-y-2">
              {/* Prediction accuracy arc — compact */}
              <div className="flex items-center gap-3 p-2.5 rounded-xl"
                style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.15)' }}>
                <div className="relative flex-shrink-0" style={{ width: 52, height: 52 }}>
                  <svg viewBox="0 0 56 56" width={52} height={52}>
                    <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
                    <motion.circle cx="28" cy="28" r="22" fill="none" stroke="#8B5CF6" strokeWidth="5"
                      strokeLinecap="round" strokeDasharray={2 * Math.PI * 22}
                      initial={{ strokeDashoffset: 2 * Math.PI * 22 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 22 * (1 - 0.968) }}
                      transition={{ delay: 0.8, duration: 1.2, ease: 'easeOut' }}
                      style={{ transform: 'rotate(-90deg)', transformOrigin: '28px 28px' }} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-bold" style={{ color: '#8B5CF6', fontSize: 11, fontFamily: 'Space Grotesk' }}>96.8%</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold" style={{ color: '#F8FAFC' }}>Prediction Accuracy</div>
                  <div className="text-xs" style={{ color: '#64748B' }}>Industry avg: 82%</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Predictions', value: 18, color: '#3B82F6', suffix: '' },
                  { label: 'Successful', value: 17, color: '#22C55E', suffix: '' },
                  { label: 'Response', value: 12, color: '#06B6D4', suffix: 'ms' },
                ].map((s, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9 + i * 0.1 }}
                    className="text-center p-2 rounded-xl"
                    style={{ background: `${s.color}0A`, border: `1px solid ${s.color}1A` }}>
                    <Counter target={s.value} suffix={s.suffix} color={s.color} size="xl" duration={1000 + i * 150} />
                    <div className="text-xs mt-0.5" style={{ color: '#475569' }}>{s.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Model confidence bar */}
              <div className="space-y-1.5">
                {[
                  { label: 'Model Confidence', value: 97, color: '#22C55E' },
                  { label: 'Sensor Coverage', value: 94, color: '#3B82F6' },
                  { label: 'Data Quality', value: 99, color: '#8B5CF6' },
                ].map((bar, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="text-xs w-28 flex-shrink-0" style={{ color: '#64748B' }}>{bar.label}</div>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <motion.div className="h-full rounded-full"
                        style={{ background: bar.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${bar.value}%` }}
                        transition={{ delay: 1 + i * 0.15, duration: 0.8, ease: 'easeOut' }} />
                    </div>
                    <div className="text-xs font-bold w-8 text-right" style={{ color: bar.color }}>{bar.value}%</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* ════ ROW E — Action Buttons ════ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          className="flex items-center justify-center gap-4 pb-1">

          <motion.button
            whileHover={{ scale: 1.04, boxShadow: '0 0 24px rgba(59,130,246,0.35)' }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/app/reports')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm cursor-pointer"
            style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.28)', color: '#3B82F6' }}>
            <Download size={14} /> Download Executive Report
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.04, boxShadow: '0 0 24px rgba(6,182,212,0.35)' }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/app/dashboard')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm cursor-pointer"
            style={{ background: 'linear-gradient(135deg,#3B82F6,#06B6D4)', color: 'white', boxShadow: '0 0 16px rgba(59,130,246,0.25)' }}>
            <BarChart2 size={14} /> Return to Dashboard <ArrowRight size={13} />
          </motion.button>

          <AnimatePresence mode="wait">
            {!monitoringActive ? (
              <motion.button key="start"
                whileHover={{ scale: 1.04, boxShadow: '0 0 24px rgba(34,197,94,0.4)' }}
                whileTap={{ scale: 0.96 }}
                onClick={handleOvernightMonitoring}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm cursor-pointer"
                style={{ background: 'linear-gradient(135deg,#22C55E,#16A34A)', color: 'white', boxShadow: '0 0 16px rgba(34,197,94,0.3)' }}>
                <Moon size={14} /> Continue Overnight Monitoring
              </motion.button>
            ) : (
              <motion.div key="active"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm"
                style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.35)', color: '#22C55E' }}>
                <motion.span className="w-2 h-2 rounded-full" style={{ background: '#22C55E' }}
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }} />
                Overnight Monitoring Active
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

      </div>
    </div>
  )
}
