import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, BarChart2, Brain, CheckCircle2, Clock, Cpu, Lightbulb, Search } from 'lucide-react'

const STEPS = [
  { icon: Search, label: 'Analyzing live sensor telemetry...', color: '#3B82F6' },
  { icon: Activity, label: 'Checking vibration signatures...', color: '#06B6D4' },
  { icon: Brain, label: 'Comparing historical failure patterns...', color: '#8B5CF6' },
  { icon: Clock, label: 'Estimating remaining useful life...', color: '#F59E0B' },
  { icon: Lightbulb, label: 'Generating maintenance recommendation...', color: '#22C55E' },
]

interface ThinkingAnimationProps {
  onComplete?: () => void
  stepDuration?: number // ms per step
}

export default function ThinkingAnimation({ onComplete, stepDuration = 520 }: ThinkingAnimationProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [done, setDone] = useState(false)

  useEffect(() => {
    setCurrentStep(0)
    setCompletedSteps([])
    setDone(false)

    const timers: ReturnType<typeof setTimeout>[] = []

    STEPS.forEach((_, i) => {
      const t1 = setTimeout(() => setCurrentStep(i), i * stepDuration)
      const t2 = setTimeout(() => setCompletedSteps(prev => [...prev, i]), i * stepDuration + stepDuration * 0.8)
      timers.push(t1, t2)
    })

    const totalTime = STEPS.length * stepDuration + 200
    const doneTimer = setTimeout(() => {
      setDone(true)
      onComplete?.()
    }, totalTime)
    timers.push(doneTimer)

    return () => timers.forEach(clearTimeout)
  }, [stepDuration])

  return (
    <div className="space-y-2 py-1">
      {STEPS.map((step, i) => {
        const isActive = currentStep === i && !completedSteps.includes(i)
        const isCompleted = completedSteps.includes(i)
        const isPending = i > currentStep

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: isPending ? 0.3 : 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="flex items-center gap-3"
          >
            {/* Icon / spinner / check */}
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: isCompleted ? `${step.color}20` : isActive ? `${step.color}15` : 'rgba(255,255,255,0.03)', border: `1px solid ${isCompleted ? step.color + '50' : isActive ? step.color + '40' : 'rgba(255,255,255,0.06)'}` }}>
              <AnimatePresence mode="wait">
                {isCompleted ? (
                  <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
                    <CheckCircle2 size={14} style={{ color: step.color }} />
                  </motion.div>
                ) : isActive ? (
                  <motion.div key="spin"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}>
                    <step.icon size={14} style={{ color: step.color }} />
                  </motion.div>
                ) : (
                  <step.icon size={14} style={{ color: 'rgba(148,163,184,0.4)' }} />
                )}
              </AnimatePresence>
            </div>

            {/* Label */}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium" style={{ color: isCompleted ? step.color : isActive ? '#F8FAFC' : '#475569' }}>
                {step.label}
              </div>

              {/* Progress bar */}
              {isActive && (
                <motion.div className="mt-1 h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <motion.div className="h-full rounded-full"
                    style={{ background: step.color }}
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: stepDuration / 1000 * 0.8, ease: 'linear' }} />
                </motion.div>
              )}
            </div>
          </motion.div>
        )
      })}

      {/* Done indicator */}
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 pt-1"
          >
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(34,197,94,0.5), transparent)' }} />
            <span className="text-xs font-semibold" style={{ color: '#22C55E' }}>Analysis complete</span>
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(270deg, rgba(34,197,94,0.5), transparent)' }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
