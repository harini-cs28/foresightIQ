import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'

const DATA_SOURCES = [
  '1,276 live sensor readings',
  'Historical maintenance records (3 years)',
  'Temperature trend analysis',
  'Vibration signature matching',
  'Power consumption pattern',
]

interface ConfidenceCardProps {
  value?: number // 0–100
  label?: string
  sources?: string[]
  delay?: number
}

export default function ConfidenceCard({
  value = 96.8,
  label = 'Prediction Confidence',
  sources = DATA_SOURCES,
  delay = 0,
}: ConfidenceCardProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const [shownSources, setShownSources] = useState<number[]>([])

  useEffect(() => {
    const start = Date.now()
    const duration = 1400
    const raf = () => {
      const elapsed = Date.now() - start - delay * 1000
      if (elapsed < 0) { requestAnimationFrame(raf); return }
      const progress = Math.min(1, elapsed / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayValue(Math.round(eased * value * 10) / 10)
      if (progress < 1) requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
  }, [value, delay])

  // Reveal sources one by one
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    sources.forEach((_, i) => {
      const t = setTimeout(() => setShownSources(p => [...p, i]), delay * 1000 + 800 + i * 200)
      timers.push(t)
    })
    return () => timers.forEach(clearTimeout)
  }, [sources, delay])

  const color = value >= 90 ? '#22C55E' : value >= 75 ? '#06B6D4' : '#F59E0B'
  const level = value >= 90 ? 'Very High' : value >= 75 ? 'High' : 'Moderate'
  const circumference = 2 * Math.PI * 36
  const dashOffset = circumference * (1 - displayValue / 100)

  return (
    <div className="p-4 rounded-2xl" style={{ background: 'rgba(11,18,32,0.85)', border: `1px solid ${color}25` }}>
      <div className="flex items-center gap-5">

        {/* Radial arc */}
        <div className="relative flex-shrink-0" style={{ width: 88, height: 88 }}>
          <svg viewBox="0 0 88 88" width={88} height={88}>
            <circle cx="44" cy="44" r="36" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
            <motion.circle
              cx="44" cy="44" r="36"
              fill="none" stroke={color} strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transform: 'rotate(-90deg)', transformOrigin: '44px 44px' }}
              transition={{ duration: 0.05 }}
            />
            <motion.circle cx="44" cy="44" r="28" fill={`${color}10`}
              animate={{ r: [28, 30, 28] }} transition={{ duration: 2, repeat: Infinity }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-bold text-lg leading-none" style={{ color, fontFamily: 'Space Grotesk' }}>
              {displayValue.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#94A3B8' }}>{label}</div>
          <div className="flex items-center gap-2 mb-3">
            <div className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
              {level} Confidence
            </div>
          </div>
          <div className="text-xs font-semibold mb-2" style={{ color: '#475569' }}>PREDICTION BASED ON</div>
          <div className="space-y-1">
            {sources.map((src, i) => (
              <AnimatePresence key={i}>
                {shownSources.includes(i) && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 text-xs"
                    style={{ color: '#94A3B8' }}
                  >
                    <CheckCircle2 size={11} style={{ color: '#22C55E', flexShrink: 0 }} />
                    {src}
                  </motion.div>
                )}
              </AnimatePresence>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
