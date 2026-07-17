import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Download, RotateCcw } from 'lucide-react'
import FORESRobot from './FORESRobot'

const SUMMARY_ITEMS = [
  { label: 'Failures Prevented', value: 5, suffix: '', color: '#22C55E' },
  { label: 'Downtime Prevented', value: 48, suffix: 'h', color: '#3B82F6' },
  { label: 'Money Saved', value: 2.6, suffix: 'M', prefix: '₹', color: '#F59E0B', isDecimal: true },
  { label: 'Factory Health', value: 92, suffix: '%', color: '#06B6D4' },
  { label: 'Maintenance Tasks', value: 8, suffix: '', color: '#8B5CF6' },
  { label: 'Alerts Resolved', value: 3, suffix: '', color: '#22C55E' },
]

interface EndOfDaySummaryProps {
  onClose: () => void
}

function useCounter(target: number, duration = 1500, active = false, isDecimal = false) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!active) return
    const start = Date.now()
    const raf = () => {
      const progress = Math.min(1, (Date.now() - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      setVal(isDecimal ? Math.round(eased * target * 10) / 10 : Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
  }, [active, target, duration, isDecimal])
  return val
}

function SummaryCard({ item, visible, index }: { item: typeof SUMMARY_ITEMS[0]; visible: boolean; index: number }) {
  const count = useCounter(item.value, 1200, visible, item.isDecimal)
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={visible ? { opacity: 1, scale: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.12, type: 'spring', stiffness: 240, damping: 22 }}
      className="flex flex-col items-center justify-center py-5 px-4 rounded-2xl"
      style={{ background: `linear-gradient(135deg,${item.color}10,${item.color}05)`, border: `1px solid ${item.color}25` }}>
      <motion.div
        className="text-3xl font-bold mb-1"
        style={{ color: item.color, fontFamily: 'Space Grotesk' }}
        animate={visible ? { textShadow: [`0 0 0px ${item.color}00`, `0 0 30px ${item.color}90`, `0 0 12px ${item.color}50`] } : {}}
        transition={{ duration: 0.8, delay: index * 0.12 + 0.4 }}>
        {item.prefix}{item.isDecimal ? count.toFixed(1) : count}{item.suffix}
      </motion.div>
      <div className="text-xs font-medium text-center" style={{ color: '#94A3B8' }}>{item.label}</div>
    </motion.div>
  )
}

export default function EndOfDaySummary({ onClose }: EndOfDaySummaryProps) {
  const navigate = useNavigate()
  const [cardsVisible, setCardsVisible] = useState(false)
  const [speechVisible, setSpeechVisible] = useState(false)
  const [confettiActive, setConfettiActive] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setConfettiActive(true), 400)
    const t2 = setTimeout(() => setCardsVisible(true), 800)
    const t3 = setTimeout(() => setSpeechVisible(true), 800 + SUMMARY_ITEMS.length * 130 + 1400)
    return () => [t1, t2, t3].forEach(clearTimeout)
  }, [])

  const confettiColors = ['#22C55E', '#3B82F6', '#F59E0B', '#EF4444', '#06B6D4', '#8B5CF6', '#F8FAFC']

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'radial-gradient(ellipse at center, #0d1a2e 0%, #0B1220 100%)' }}>

      {/* Confetti */}
      <AnimatePresence>
        {confettiActive && confettiColors.flatMap((color, ci) =>
          [0, 1, 2, 3].map((j) => (
            <motion.div key={`${ci}-${j}`}
              className="absolute rounded-sm pointer-events-none"
              style={{ width: 6, height: 10, background: color, left: `${10 + ci * 12 + j * 3}%`, top: 0, rotate: Math.random() * 360 }}
              animate={{
                y: ['0vh', '110vh'],
                x: [(j % 2 === 0 ? -1 : 1) * (20 + j * 15)],
                rotate: [0, 360 * (j % 2 === 0 ? 1 : -1)],
                opacity: [1, 1, 0],
              }}
              transition={{ duration: 2.5 + Math.random(), delay: Math.random() * 1.5, ease: 'linear' }}
            />
          ))
        )}
      </AnimatePresence>

      <div className="relative z-10 flex flex-col items-center gap-6 px-6 py-8" style={{ maxWidth: 680, width: '100%' }}>

        {/* Title */}
        <motion.div className="text-center"
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#06B6D4' }}>
            ForesightIQ · AI Operations Summary
          </div>
          <div className="text-3xl font-bold" style={{ fontFamily: 'Space Grotesk', color: '#F8FAFC' }}>
            Today's Summary
          </div>
        </motion.div>

        {/* FORES celebrating */}
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }}>
          <FORESRobot state="celebrating" size={150} />
        </motion.div>

        {/* Summary grid */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {SUMMARY_ITEMS.map((item, i) => (
            <SummaryCard key={i} item={item} visible={cardsVisible} index={i} />
          ))}
        </div>

        {/* FORES speech */}
        <AnimatePresence>
          {speechVisible && (
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-4 rounded-2xl w-full"
              style={{ background: 'rgba(17,24,39,0.9)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,rgba(34,197,94,0.25),rgba(6,182,212,0.25))', border: '1px solid rgba(34,197,94,0.3)' }}>
                <span className="text-xs font-bold" style={{ color: '#22C55E' }}>F</span>
              </div>
              <div>
                <div className="text-xs font-semibold mb-1" style={{ color: '#22C55E' }}>FORES — End of Session</div>
                <div className="text-sm leading-relaxed" style={{ color: '#CBD5E1' }}>
                  Today's factory is operating safely. 5 potential failures were prevented, saving ₹2.6 million in production losses. The team maintained 92% factory health. Great work today — have a productive evening!
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <AnimatePresence>
          {speechVisible && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              className="flex items-center gap-4">
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={onClose}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8' }}>
                <RotateCcw size={14} /> New Session
              </motion.button>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => navigate('/app/reports')}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm cursor-pointer"
                style={{ background: 'linear-gradient(135deg,#22C55E,#06B6D4)', color: 'white' }}>
                <Download size={14} /> Export Report <ArrowRight size={13} />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
