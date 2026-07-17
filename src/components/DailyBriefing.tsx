import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, BarChart2, Cpu } from 'lucide-react'
import FORESRobot from './FORESRobot'

interface MetricItem {
  label: string
  value: string
  color: string
  prefix?: string
  suffix?: string
}

const METRICS: MetricItem[] = [
  { label: 'Factory Health', value: '92', suffix: '%', color: '#22C55E' },
  { label: 'Machines Running', value: '142 of 148', color: '#3B82F6' },
  { label: 'Critical Machines', value: '3', color: '#EF4444' },
  { label: 'Downtime Prevented', value: '48', suffix: ' hours', color: '#06B6D4' },
  { label: 'Estimated Savings', value: '₹2.6M', color: '#F59E0B' },
]

const BRIEFING_LINES = [
  'Good morning.',
  "I analyzed today's factory operations overnight.",
  'Here is your daily briefing:',
]

interface DailyBriefingProps {
  onComplete: () => void
  onSkip: () => void
}

function useCounter(target: number, duration = 1200, active = false): number {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!active) return
    const start = Date.now()
    const raf = () => {
      const progress = Math.min(1, (Date.now() - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      setVal(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
  }, [active, target, duration])
  return val
}

function MetricCard({ metric, visible, index }: { metric: MetricItem; visible: boolean; index: number }) {
  const numericTarget = parseInt(metric.value.replace(/[^\d]/g, ''), 10)
  const isNumeric = !isNaN(numericTarget) && !metric.value.includes(' of ')
  const count = useCounter(numericTarget, 1000, visible)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={visible ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.5, delay: index * 0.15, type: 'spring', stiffness: 200, damping: 22 }}
      className="px-5 py-4 rounded-2xl text-center"
      style={{
        background: `linear-gradient(135deg, ${metric.color}08, transparent)`,
        border: `1px solid ${metric.color}25`,
        backdropFilter: 'blur(12px)',
      }}>
      <motion.div
        className="text-2xl font-bold mb-1"
        style={{ color: metric.color, fontFamily: 'Space Grotesk' }}
        animate={visible ? { textShadow: [`0 0 0px ${metric.color}00`, `0 0 20px ${metric.color}80`, `0 0 8px ${metric.color}40`] } : {}}
        transition={{ duration: 0.8, delay: index * 0.15 + 0.3 }}>
        {isNumeric ? `${metric.prefix || ''}${count}${metric.suffix || ''}` : metric.value}
      </motion.div>
      <div className="text-xs font-medium" style={{ color: '#94A3B8' }}>{metric.label}</div>
    </motion.div>
  )
}

export default function DailyBriefing({ onComplete, onSkip }: DailyBriefingProps) {
  const [lineIndex, setLineIndex] = useState(-1)
  const [metricsVisible, setMetricsVisible] = useState(false)
  const [actionsVisible, setActionsVisible] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    timers.push(setTimeout(() => setLineIndex(0), 600))
    timers.push(setTimeout(() => setLineIndex(1), 1800))
    timers.push(setTimeout(() => setLineIndex(2), 3000))
    timers.push(setTimeout(() => setMetricsVisible(true), 3800))
    timers.push(setTimeout(() => setActionsVisible(true), 3800 + METRICS.length * 200 + 800))
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'radial-gradient(ellipse at center, #0d1a33 0%, #0B1220 100%)' }}>

      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(59,130,246,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.4) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />

      {/* Scanning line */}
      <motion.div className="absolute left-0 right-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.4), transparent)' }}
        animate={{ top: ['0%', '100%', '0%'] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }} />

      <div className="relative z-10 flex flex-col items-center gap-6 px-6" style={{ maxWidth: 680, width: '100%' }}>

        {/* Skip button */}
        <div className="absolute top-4 right-4">
          <button onClick={onSkip}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs cursor-pointer hover:opacity-80 transition-opacity"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#475569' }}>
            Skip briefing <ArrowRight size={11} />
          </button>
        </div>

        {/* Header */}
        <motion.div className="flex items-center gap-3"
          initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#3B82F6,#06B6D4)', boxShadow: '0 0 24px rgba(59,130,246,0.4)' }}>
            <Cpu size={20} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-xl" style={{ fontFamily: 'Space Grotesk', color: '#F8FAFC' }}>
              Foresight<span style={{ color: '#3B82F6' }}>IQ</span>
            </div>
            <div className="text-xs" style={{ color: '#94A3B8' }}>AI Daily Briefing · Pune Smart Factory</div>
          </div>
        </motion.div>

        {/* FORES robot */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }}>
          <FORESRobot state="briefing" size={160} />
        </motion.div>

        {/* Briefing speech lines */}
        <div className="space-y-2 text-center">
          {BRIEFING_LINES.map((line, i) => (
            <AnimatePresence key={i}>
              {lineIndex >= i && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={i === 0 ? 'text-2xl font-bold' : i === 2 ? 'text-base' : 'text-lg'}
                  style={{
                    color: i === 0 ? '#F8FAFC' : '#CBD5E1',
                    fontFamily: i === 0 ? 'Space Grotesk' : 'Inter',
                  }}>
                  {line}
                </motion.div>
              )}
            </AnimatePresence>
          ))}
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-5 gap-3 w-full">
          {METRICS.map((m, i) => (
            <MetricCard key={i} metric={m} visible={metricsVisible} index={i} />
          ))}
        </div>

        {/* Action buttons */}
        <AnimatePresence>
          {actionsVisible && (
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-3 w-full text-center">

              <div className="text-base font-medium" style={{ color: '#94A3B8' }}>
                Would you like me to explain today's highest-risk machine?
              </div>

              <div className="flex items-center justify-center gap-4">
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={onComplete}
                  className="flex items-center gap-2.5 px-7 py-3 rounded-xl font-bold cursor-pointer"
                  style={{ background: 'linear-gradient(135deg,#EF4444,#DC2626)', boxShadow: '0 0 24px rgba(239,68,68,0.35)', color: 'white', fontSize: 14 }}>
                  Yes, explain it to me
                </motion.button>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={() => navigate('/app/dashboard')}
                  className="flex items-center gap-2 px-7 py-3 rounded-xl font-semibold cursor-pointer"
                  style={{ background: 'linear-gradient(135deg,#3B82F6,#06B6D4)', boxShadow: '0 0 20px rgba(59,130,246,0.3)', color: 'white', fontSize: 14 }}>
                  <BarChart2 size={16} /> View Dashboard
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
