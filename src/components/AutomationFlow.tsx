import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, CheckCircle2, ClipboardList, Search, Send, User } from 'lucide-react'

const STEPS = [
  { icon: Search, label: 'Finding available technician...', result: 'Ravi Kumar · CNC Specialist · Available from 2 PM', color: '#3B82F6' },
  { icon: Calendar, label: 'Reserving maintenance window...', result: 'Window: 2:00 PM – 3:30 PM · Production impact: ~0.4%', color: '#06B6D4' },
  { icon: ClipboardList, label: 'Generating work order...', result: 'Work Order WO-2024-0847 created · Priority: Critical', color: '#8B5CF6' },
  { icon: Send, label: 'Sending technician notification...', result: 'SMS + App notification sent to Ravi Kumar', color: '#F59E0B' },
  { icon: CheckCircle2, label: 'Updating maintenance calendar...', result: 'Calendar synced · Supervisor notified', color: '#22C55E' },
]

interface AutomationFlowProps {
  onComplete?: () => void
  machineId?: string
}

export default function AutomationFlow({ onComplete, machineId = 'M-104' }: AutomationFlowProps) {
  const [currentStep, setCurrentStep] = useState(-1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [done, setDone] = useState(false)
  const STEP_MS = 1100

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    // Small initial pause
    timers.push(setTimeout(() => setCurrentStep(0), 300))

    STEPS.forEach((_, i) => {
      timers.push(setTimeout(() => setCurrentStep(i), 300 + i * STEP_MS))
      timers.push(setTimeout(() => setCompletedSteps(p => [...p, i]), 300 + i * STEP_MS + STEP_MS * 0.75))
    })

    const totalTime = 300 + STEPS.length * STEP_MS + 400
    timers.push(setTimeout(() => { setDone(true); onComplete?.() }, totalTime))

    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="p-4 rounded-2xl space-y-4"
      style={{ background: 'rgba(11,18,32,0.95)', border: '1px solid rgba(59,130,246,0.15)' }}>

      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full" style={{ background: '#3B82F6', boxShadow: '0 0 6px #3B82F6' }} />
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#3B82F6' }}>
          AI Automation — Scheduling {machineId} Maintenance
        </span>
      </div>

      <div className="space-y-3">
        {STEPS.map((step, i) => {
          const isActive = currentStep === i && !completedSteps.includes(i)
          const isCompleted = completedSteps.includes(i)
          const isPending = i > currentStep

          return (
            <motion.div key={i}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: isPending ? 0.25 : 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}>

              <div className="flex items-start gap-3">
                {/* Step icon */}
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{
                    background: isCompleted ? `${step.color}20` : isActive ? `${step.color}12` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isCompleted ? step.color + '50' : isActive ? step.color + '35' : 'rgba(255,255,255,0.05)'}`
                  }}>
                  <AnimatePresence mode="wait">
                    {isCompleted ? (
                      <motion.div key="check" initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}>
                        <CheckCircle2 size={15} style={{ color: step.color }} />
                      </motion.div>
                    ) : isActive ? (
                      <motion.div key="spin" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}>
                        <step.icon size={15} style={{ color: step.color }} />
                      </motion.div>
                    ) : (
                      <step.icon size={15} style={{ color: 'rgba(148,163,184,0.2)' }} />
                    )}
                  </AnimatePresence>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold" style={{ color: isCompleted ? '#F8FAFC' : isActive ? '#E2E8F0' : '#475569' }}>
                    {step.label}
                  </div>

                  {/* Result */}
                  <AnimatePresence>
                    {isCompleted && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        className="mt-1 text-xs leading-relaxed" style={{ color: step.color }}>
                        ✓ {step.result}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Active progress bar */}
                  {isActive && (
                    <motion.div className="mt-1.5 h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <motion.div className="h-full rounded-full" style={{ background: step.color }}
                        initial={{ width: '0%' }} animate={{ width: '100%' }}
                        transition={{ duration: STEP_MS / 1000 * 0.7, ease: 'linear' }} />
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Success card */}
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="mt-2 p-4 rounded-xl"
            style={{ background: 'linear-gradient(135deg,rgba(34,197,94,0.12),rgba(6,182,212,0.08))', border: '1px solid rgba(34,197,94,0.3)' }}>
            <div className="flex items-center gap-2 mb-3">
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5 }}>
                <CheckCircle2 size={18} style={{ color: '#22C55E' }} />
              </motion.div>
              <span className="font-bold text-sm" style={{ color: '#22C55E', fontFamily: 'Space Grotesk' }}>
                Maintenance Scheduled Successfully!
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Machine', value: machineId },
                { label: 'Technician', value: 'Ravi Kumar' },
                { label: 'Time', value: '2:00 PM' },
                { label: 'Work Order', value: 'WO-2024-0847' },
                { label: 'Duration', value: '90 minutes' },
                { label: 'Savings', value: '₹7.8L' },
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}
                  className="p-2 rounded-lg text-center" style={{ background: 'rgba(34,197,94,0.06)' }}>
                  <div className="text-xs font-bold" style={{ color: '#22C55E' }}>{item.value}</div>
                  <div className="text-xs" style={{ color: '#475569' }}>{item.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
