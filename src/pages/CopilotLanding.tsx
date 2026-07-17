import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle, ArrowRight, BarChart2, CheckCircle2,
  Clock, Cpu, MessageSquare, Mic, MicOff,
  Moon, TrendingUp, Volume2, VolumeX, Wrench, Zap,
  Thermometer, X, Shield, Activity, Bell, Calendar,
  Radio, Factory, Wifi, Users, Download, Send, ChevronRight, Sparkles,
} from 'lucide-react'

import FORESRobot, { type RobotState } from '../components/FORESRobot'
import ThinkingAnimation from '../components/ThinkingAnimation'
import ConfidenceCard from '../components/ConfidenceCard'
import AutomationFlow from '../components/AutomationFlow'
import { useAIMemory } from '../hooks/useAIMemory'
import { useVoice } from '../hooks/useVoice'

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase = 'greeting' | 'thinking' | 'explaining' | 'automating' | 'followup_thinking' | 'followup' | 'celebrated'
type Severity = 'warning' | 'critical' | 'info'

interface TimelineEvent {
  time: string
  label: string
  detail: string
  severity: Severity
}

interface MachineComponent {
  id: string
  name: string
  status: 'healthy' | 'warning' | 'critical'
  purpose: string
  condition: string
  reason: string
  businessImpact: string
  action: string
  position: { x: number; y: number; w: number; h: number }
}

interface KPI {
  label: string
  color: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  target: number
  suffix: string
  prefix: string
  decimals: number
}

// ─── Constants ──────────────────────────────────────────────────────────────
const TIMELINE_EVENTS: TimelineEvent[] = [
  { time: '08:15', label: 'Vibration exceeded normal range', detail: 'Sensor S-42 recorded 8.7 mm/s', severity: 'warning' },
  { time: '08:22', label: 'Temperature crossed safe threshold', detail: '+12°C above baseline', severity: 'warning' },
  { time: '08:45', label: 'AI detected abnormal resonance', detail: '94.2% bearing pattern match', severity: 'critical' },
  { time: '09:00', label: 'Failure probability exceeded 80%', detail: 'Alert escalated — 18h to failure', severity: 'critical' },
]

const COMPONENTS: MachineComponent[] = [
  { id: 'motor', name: 'Drive Motor', status: 'healthy', purpose: 'Converts electrical energy into mechanical rotation.', condition: 'Operating normally at 4.2A / 48°C', reason: 'All parameters within spec.', businessImpact: 'Motor failure stops the production line instantly.', action: 'Continue operation. Inspect in 30 days.', position: { x: 8, y: 20, w: 18, h: 60 } },
  { id: 'stator', name: 'Stator Winding', status: 'healthy', purpose: 'Creates rotating magnetic field that drives the rotor.', condition: 'Electrical integrity intact — 0.2% deviation', reason: 'No anomaly in current draw or insulation.', businessImpact: 'Stator failure requires full motor rebuild — 3–5 days.', action: 'Monitor quarterly. Inspection in 45 days.', position: { x: 28, y: 20, w: 16, h: 60 } },
  { id: 'rotor', name: 'Rotor Assembly', status: 'healthy', purpose: 'Rotates inside the stator field, transferring torque.', condition: 'Balanced — eccentricity within 0.01mm', reason: 'Vibration signature shows no imbalance.', businessImpact: 'Rotor failure: 4 hours + ₹2.8L to repair.', action: 'No action. Balance check in 60 days.', position: { x: 46, y: 20, w: 16, h: 60 } },
  { id: 'bearing', name: 'Front Bearing', status: 'critical', purpose: 'Allows shaft rotation with minimal friction.', condition: '⚠ HIGH WEAR — Immediate replacement required', reason: 'Lubrication degraded after 30 days. Conveyor C-3 amplifying resonance at 47 Hz.', businessImpact: 'Failure in 18h will halt Line A. Unplanned cost: ₹8.2L vs ₹0.4L planned.', action: '🔴 Replace before 2 PM. Ravi Kumar is available.', position: { x: 64, y: 20, w: 18, h: 60 } },
  { id: 'shaft', name: 'Drive Shaft', status: 'warning', purpose: 'Transmits torque from motor to cutting spindle.', condition: '⚡ Minor misalignment — 0.08mm deviation', reason: 'Bearing wear transferring load asymmetrically.', businessImpact: 'Misalignment worsens rapidly if bearing is not replaced.', action: 'Self-corrects after bearing replacement.', position: { x: 8, y: 82, w: 74, h: 10 } },
  { id: 'coolant', name: 'Coolant System', status: 'healthy', purpose: 'Circulates coolant to dissipate machining heat.', condition: 'Flow 12.3 L/min — compensating for heat', reason: 'Auto-increased flow rate due to bearing friction heat.', businessImpact: 'Failure would trigger emergency shutdown in <45 min.', action: 'Fluid replacement due in 15 days.', position: { x: 84, y: 20, w: 8, h: 60 } },
]

const FOLLOWUP_QS = [
  { icon: MessageSquare, text: 'Why did this happen?', color: '#3B82F6' },
  { icon: TrendingUp, text: 'How much money can we save?', color: '#22C55E' },
  { icon: Thermometer, text: 'Explain the temperature trend', color: '#F59E0B' },
  { icon: BarChart2, text: "Summarize today's factory health", color: '#06B6D4' },
  { icon: Zap, text: 'What caused the bearing failure?', color: '#8B5CF6' },
  { icon: Wrench, text: "Generate today's maintenance plan", color: '#F59E0B' },
]

const FOLLOWUP_RESPONSES: Record<string, string> = {
  'Why did this happen?': 'Three compounding causes: (1) Lubrication overdue by 5 days — standard is 25 days. (2) Conveyor C-3 amplifying resonance at 47 Hz matching the bearing natural frequency. (3) Last week\'s temperature spike added 18% thermal stress. Together they accelerated failure by ~3 weeks.',
  'How much money can we save?': 'Total preventable loss today: ₹13.7L across 3 machines. M-104 bearing (₹8.2L), Robot Arm B4 coolant (₹3.4L), Conveyor L3 belt (₹2.1L). All three repairs cost just ₹1.8L — a 662% return on maintenance investment.',
  'Explain the temperature trend': 'M-104 temperature rose from 52°C to 94°C between 7 AM and 9 AM — a 42°C surge. The sharp acceleration at 08:22 matches exactly when bearing resonance crossed critical threshold. Thermal hotspot is confirmed at the front bearing housing.',
  "Summarize today's factory health": 'Health Score: 84%, down 3% from yesterday. Of 148 machines: 127 healthy, 12 early-warning, 3 critical, 6 scheduled-offline. Energy is 6.25% below daily target. Resolving the 3 critical machines will restore health above 90%.',
  'What caused the bearing failure?': 'Root cause: (1) Missed lubrication — 5 days overdue. (2) Vibration resonance amplification from Conveyor C-3 at 47 Hz. (3) Thermal stress from ambient temperature spike. A predictive lubrication alert would have prevented this entirely.',
  "Generate today's maintenance plan": 'AI-Optimized Schedule:\n• 10:00 AM — M-104 Bearing Replacement · Ravi Kumar · 90 min · ₹8.2L saved\n• 2:00 PM — Robot Arm B4 Coolant Flush · Amit Shah · 60 min · ₹3.4L saved\n• 4:30 PM — Conveyor L3 Belt Inspection · Priya Nair · 45 min · ₹2.1L saved\nTotal productivity impact: < 0.8%',
}

const KPI_DATA: KPI[] = [
  { label: 'Factory Health', color: '#22C55E', icon: Shield, target: 84, suffix: '%', prefix: '', decimals: 0 },
  { label: 'Active Machines', color: '#3B82F6', icon: Activity, target: 142, suffix: '/148', prefix: '', decimals: 0 },
  { label: 'Critical Alerts', color: '#EF4444', icon: AlertTriangle, target: 3, suffix: '', prefix: '', decimals: 0 },
  { label: 'Downtime Prevented', color: '#06B6D4', icon: Clock, target: 48, suffix: ' hrs', prefix: '', decimals: 0 },
  { label: 'Estimated Savings', color: '#F59E0B', icon: TrendingUp, target: 2.6, suffix: 'M', prefix: '₹', decimals: 1 },
]

// ─── Hero KPI Cards ─────────────────────────────────────────────────────────
const HERO_KPI_CARDS = [
  { label: 'Connected Sensors', value: '1,248', icon: Wifi, color: '#06B6D4' },
  { label: 'Machines Monitored', value: '327', icon: Factory, color: '#3B82F6' },
  { label: 'Prediction Accuracy', value: '98.6%', icon: TrendingUp, color: '#22C55E' },
  { label: 'Downtime Prevented', value: '12.4 hrs', icon: Clock, color: '#F59E0B' },
]

// ─── Trust Indicators ────────────────────────────────────────────────────────
const TRUST_INDICATORS = [
  { label: 'Real-Time Monitoring', icon: Radio },
  { label: 'Predictive Maintenance', icon: Wrench },
  { label: 'AI Decision Support', icon: Cpu },
  { label: 'Human-in-the-Loop Approval', icon: Users },
]

// ─── Quick Actions ───────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  {
    id: 'explain',
    emoji: '🚨',
    label: 'Explain Highest Risk Machine',
    description: 'View AI analysis, failure probability, anomalies, root cause, and recommended preventive actions.',
    badge: 'CRITICAL',
    badgeColor: '#EF4444',
    icon: AlertTriangle,
    style: 'filled-red' as const,
    bg: 'linear-gradient(135deg, rgba(239,68,68,0.18), rgba(220,38,38,0.1))',
    border: 'rgba(239,68,68,0.4)',
    glow: 'rgba(239,68,68,0.45)',
    color: '#EF4444',
  },
  {
    id: 'maintenance',
    emoji: '🛠',
    label: 'Generate Maintenance Plan',
    description: 'AI-powered preventive maintenance schedule based on machine health and production priorities.',
    badge: 'RECOMMENDED',
    badgeColor: '#3B82F6',
    icon: Calendar,
    style: 'filled-blue' as const,
    bg: 'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(6,182,212,0.1))',
    border: 'rgba(59,130,246,0.4)',
    glow: 'rgba(59,130,246,0.4)',
    color: '#3B82F6',
  },
  {
    id: 'dashboard',
    emoji: '📊',
    label: 'Open Operations Dashboard',
    description: 'Live KPIs, machine health, heatmaps, alerts, and production status in real time.',
    badge: 'LIVE',
    badgeColor: '#06B6D4',
    icon: BarChart2,
    style: 'glass-cyan' as const,
    bg: 'rgba(6,182,212,0.07)',
    border: 'rgba(6,182,212,0.35)',
    glow: 'rgba(6,182,212,0.35)',
    color: '#06B6D4',
  },
  {
    id: 'report',
    emoji: '📄',
    label: 'Download AI Report',
    description: 'Professional PDF — factory health, predicted risks, maintenance plan, business impact, AI insights.',
    badge: 'PDF',
    badgeColor: '#8B5CF6',
    icon: Download,
    style: 'glass-purple' as const,
    bg: 'rgba(139,92,246,0.07)',
    border: 'rgba(139,92,246,0.3)',
    glow: 'rgba(139,92,246,0.3)',
    color: '#8B5CF6',
  },
]

// ─── Suggestion Chips ─────────────────────────────────────────────────────────
const SUGGESTION_CHIPS = [
  'Which machine has the highest failure probability?',
  'Why is Machine M-104 critical?',
  "Show today's maintenance schedule.",
  'Which machines require immediate attention?',
  'How much downtime can be prevented today?',
  "Show factory health summary.",
  'What caused today\'s alerts?',
  'Predict failures for the next 48 hours.',
  'Show energy consumption analysis.',
  'Which department has the highest operational risk?',
  'Explain the AI prediction confidence.',
  'Compare today\'s performance with yesterday.',
  'What maintenance tasks are pending?',
  'Show active sensor anomalies.',
  'Generate executive summary.',
]

// ─── AI Chip Responses ────────────────────────────────────────────────────────
const AI_CHIP_RESPONSES: Record<string, string> = {
  'Which machine has the highest failure probability?': 'Machine M-104 (Front Bearing) has the highest failure probability at 94% within 18 hours.\n• Vibration: 8.7 mm/s (threshold: 4.5 mm/s)\n• Temperature: 94°C (threshold: 70°C)\n• Lubrication: 5 days overdue\n\nImmediate replacement is recommended before 2 PM today to prevent Line A shutdown.',
  'Why is Machine M-104 critical?': 'M-104 is critical due to three compounding factors:\n• Front bearing lubrication failed 5 days overdue\n• Conveyor C-3 amplifying resonance at 47 Hz (matches bearing natural frequency)\n• Thermal stress from last week\'s temperature spike added 18% fatigue\n\nFailure probability: 94%. Estimated failure window: within 18 hours.',
  "Show today's maintenance schedule.": 'AI-Optimized Maintenance Schedule:\n• 10:00 AM — M-104 Bearing Replacement · Ravi Kumar · 90 min · ₹8.2L saved\n• 2:00 PM — Robot Arm B4 Coolant Flush · Amit Shah · 60 min · ₹3.4L saved\n• 4:30 PM — Conveyor L3 Belt Inspection · Priya Nair · 45 min · ₹2.1L saved\n\nTotal productivity impact: < 0.8%',
  'Which machines require immediate attention?': '3 machines require immediate attention today:\n• M-104 — Critical: Bearing failure in 18h (94% probability)\n• Robot Arm B4 — Warning: Coolant leak detected, 68% failure probability\n• Conveyor L3 — Warning: Belt wear at 78%, replacement due\n\nAddressing all 3 today prevents ₹13.7L in losses.',
  'How much downtime can be prevented today?': 'Preventable downtime today: 12.4 hours\n• M-104 bearing failure: 8 hours production halt\n• Robot Arm B4 coolant issue: 2.8 hours\n• Conveyor L3 belt: 1.6 hours\n\nEstimated cost savings: ₹26 Lakhs\nTotal repair cost: ₹1.8L only — 1344% ROI on maintenance investment.',
  "Show factory health summary.": 'Factory Health Score: 84% (↓3% from yesterday)\n• Machines: 127 healthy · 12 early-warning · 3 critical · 6 offline\n• Sensors Active: 1,248 of 1,260\n• Energy Efficiency: 6.25% below daily target\n• AI Confidence: 98.6%\n\nResolving 3 critical machines will restore health score above 91%.',
  "What caused today's alerts?": '3 critical alerts triggered today:\n• 08:15 — M-104 vibration exceeded 8.7 mm/s (threshold: 4.5)\n• 08:22 — M-104 temperature crossed 94°C (safe limit: 70°C)\n• 09:00 — AI escalated: failure probability exceeded 80%\n\nRoot cause: missed lubrication schedule + resonance amplification from Conveyor C-3.',
  'Predict failures for the next 48 hours.': 'AI Failure Predictions (next 48h):\n• M-104 Front Bearing: 94% failure within 18h — CRITICAL\n• Robot Arm B4: 68% failure within 36h — HIGH\n• Conveyor L3: 52% failure within 48h — MEDIUM\n• Pump Station P-7: 38% failure within 48h — WATCH\n\nTotal exposed value: ₹18.4L if unaddressed.',
  'Show energy consumption analysis.': 'Energy Analysis — Today:\n• Total consumption: 847 kWh (target: 904 kWh)\n• Savings: 57 kWh (6.3% below target)\n• M-104 consuming 18% above baseline due to bearing friction\n• Peak demand period: 10 AM–2 PM\n\nFixing M-104 will reduce energy consumption by ~12 kWh/day.',
  'Which department has the highest operational risk?': 'Department Risk Assessment:\n🔴 Line A — HIGH RISK (M-104 critical, 3 warnings)\n🟡 Assembly B — MEDIUM (Robot Arm B4 at risk)\n🟡 Logistics C — MEDIUM (Conveyor L3 wear)\n🟢 Paint Shop D — LOW (all machines healthy)\n\nLine A accounts for 68% of today\'s total operational risk.',
  'Explain the AI prediction confidence.': 'AI Confidence Score: 98.6%\n\nBased on:\n• 3 years of historical maintenance data (14,240 records)\n• Live sensor telemetry (1,248 sensors, 12ms latency)\n• Vibration signature match: 94.2% pattern match to known bearing failures\n• Temperature trend correlation: 99.1% match\n• Power consumption anomaly: 87.3% match\n\nModel last retrained: 6 hours ago.',
  'Compare today\'s performance with yesterday.': 'Performance Comparison:\n• Health Score: 84% (yesterday: 87%) ↓3%\n• Machines active: 142/148 (yesterday: 145/148) ↓3\n• Critical alerts: 3 (yesterday: 1) ↑2\n• Energy efficiency: 93.75% (yesterday: 97.2%) ↓3.45%\n• Downtime prevented: 12.4h (yesterday: 8.1h) ↑4.3h\n\nOverall trend: Slight decline due to M-104 anomaly.',
  'What maintenance tasks are pending?': 'Pending Maintenance Tasks (today):\n• 🔴 M-104 Bearing Replacement — URGENT (before 2 PM)\n• 🟡 Robot Arm B4 Coolant Flush — HIGH (before 4 PM)\n• 🟡 Conveyor L3 Belt Inspection — MEDIUM (before EOD)\n• 🔵 Pump P-7 Routine Check — SCHEDULED (3 PM)\n• 🔵 Coolant fluid replacement (15 machines) — DUE this week',
  'Show active sensor anomalies.': 'Active Sensor Anomalies (live):\n• S-42 — M-104 Vibration: 8.7 mm/s (threshold: 4.5) 🔴\n• T-18 — M-104 Temperature: 94°C (limit: 70°C) 🔴\n• V-31 — Robot Arm B4 coolant flow: 6.2 L/min (normal: 12) 🟡\n• W-09 — Conveyor L3 belt tension: 78% wear 🟡\n\n1,244 sensors operating normally.',
  'Generate executive summary.': 'Executive Summary — Today:\n📊 Factory Health: 84% | 3 Critical | 12 Early-Warning\n💰 Preventable Loss: ₹26 Lakhs if unaddressed\n✅ Repair Cost: ₹1.8L total\n📈 ROI on Maintenance: 1,344%\n⏱ Downtime at Risk: 12.4 hours\n🤖 AI Confidence: 98.6%\n\nKey Action: Schedule M-104 bearing replacement before 2 PM today to protect Line A and save ₹8.2L.',
}

// ─── Utility Hooks ──────────────────────────────────────────────────────────
const useScrollToBottom = (deps: any[]) => {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (ref.current) {
        ref.current.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' })
      }
    }, 150)
    return () => clearTimeout(timer)
  }, deps)
  return ref
}

// ─── Sub-components ─────────────────────────────────────────────────────────

const Typewriter: React.FC<{ text: string; speed?: number; onDone?: () => void }> = ({ text, speed = 16, onDone }) => {
  const [chars, setChars] = useState(0)
  const [done, setDone] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    setChars(0)
    setDone(false)
    let i = 0
    const tick = () => {
      i++
      setChars(i)
      if (i < text.length) {
        timer.current = setTimeout(tick, speed)
      } else {
        setDone(true)
        onDone?.()
      }
    }
    timer.current = setTimeout(tick, speed)
    return () => clearTimeout(timer.current)
  }, [text, speed, onDone])

  return (
    <span>
      {text.slice(0, chars).split('\n').map((line, i) => (
        <span key={i}>{i > 0 && <br />}{line}</span>
      ))}
      {!done && (
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="inline-block w-0.5 h-[1em] ml-0.5 align-middle rounded-full"
          style={{ background: '#06B6D4' }}
        />
      )}
    </span>
  )
}

const KpiCounter: React.FC<{ target: number; prefix?: string; suffix?: string; decimals?: number; color?: string }> = ({
  target, prefix = '', suffix = '', decimals = 0, color = '#F8FAFC'
}) => {
  const [val, setVal] = useState(0)
  useEffect(() => {
    const dur = 1400
    const start = Date.now()
    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / dur)
      const ease = 1 - Math.pow(1 - p, 3)
      setVal(ease * target)
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target])

  return (
    <span style={{ color, fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13 }}>
      {prefix}
      {decimals > 0 ? val.toFixed(decimals) : Math.round(val).toLocaleString('en-IN')}
      {suffix}
    </span>
  )
}

const AudioWaveform: React.FC<{ active: boolean }> = ({ active }) => (
  <div className="flex items-center gap-0.5" style={{ height: 18 }}>
    {Array.from({ length: 10 }).map((_, i) => (
      <motion.div
        key={i}
        className="rounded-full"
        style={{
          width: 2,
          background: '#06B6D4',
          opacity: active ? 1 : 0.1,
        }}
        animate={active ? { height: [3, 8 + Math.sin(i) * 7, 12, 6 + Math.cos(i) * 5, 3] } : { height: 3 }}
        transition={active ? {
          duration: 0.55 + i * 0.05,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: i * 0.04
        } : { duration: 0.3 }}
      />
    ))}
  </div>
)

const MachineTwin: React.FC<{ onSelect: (c: MachineComponent | null) => void }> = ({ onSelect }) => {
  const [hovered, setHovered] = useState<string | null>(null)
  const getStatusColor = (status: MachineComponent['status']) =>
    status === 'critical' ? '#EF4444' : status === 'warning' ? '#F59E0B' : '#22C55E'

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: 'rgba(11,18,32,0.95)', border: '1px solid rgba(59,130,246,0.13)' }}
    >
      <div
        className="text-center py-1 font-semibold tracking-widest"
        style={{
          color: '#2D3748',
          borderBottom: '1px solid rgba(59,130,246,0.06)',
          fontSize: 9,
        }}
      >
        MACHINE M-104 · DIGITAL TWIN · CLICK TO INSPECT
      </div>

      <svg viewBox="0 0 100 110" width="100%" style={{ maxHeight: 140, display: 'block' }}>
        <defs>
          <linearGradient id="machineBg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E3A5F" />
            <stop offset="100%" stopColor="#0F2040" />
          </linearGradient>
        </defs>

        <rect x="5" y="10" width="90" height="75" rx="5" fill="url(#machineBg)" stroke="rgba(59,130,246,0.25)" strokeWidth="0.5" />

        {COMPONENTS.map((comp) => {
          const isHovered = hovered === comp.id
          const color = getStatusColor(comp.status)
          const { x, y, w, h } = comp.position

          return (
            <motion.g
              key={comp.id}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHovered(comp.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelect(comp)}
            >
              {comp.status === 'critical' && (
                <motion.rect
                  x={x - 1}
                  y={y - 1}
                  width={w + 2}
                  height={h + 2}
                  rx="3"
                  fill="none"
                  stroke={color}
                  strokeWidth="0.8"
                  animate={{ strokeOpacity: [1, 0.2, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
              )}

              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                rx="2.5"
                fill={`${color}${isHovered ? '20' : '10'}`}
                stroke={`${color}${isHovered ? 'BB' : '50'}`}
                strokeWidth={isHovered ? 1 : 0.6}
              />

              {/* Motor rotation indicator */}
              {comp.id === 'motor' && (
                <motion.circle
                  cx={x + w / 2}
                  cy={y + h / 2}
                  r={w * 0.28}
                  fill="none"
                  stroke={`${color}70`}
                  strokeWidth="0.8"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  style={{ originX: `${x + w / 2}px`, originY: `${y + h / 2}px` }}
                />
              )}

              {/* Bearing roller indicators */}
              {comp.id === 'bearing' && [0, 60, 120, 180, 240, 300].map((deg) => {
                const r = Math.min(w, h) * 0.22
                const rad = deg * Math.PI / 180
                return (
                  <circle
                    key={deg}
                    cx={x + w / 2 + r * Math.cos(rad)}
                    cy={y + h / 2 + r * Math.sin(rad)}
                    r="1.2"
                    fill={color}
                    opacity="0.85"
                  />
                )
              })}

              <text
                x={x + w / 2}
                y={comp.id === 'shaft' ? y - 2 : y + h + 5}
                textAnchor="middle"
                fill={color}
                fontSize="4"
                fontFamily="Inter"
                fontWeight="600"
              >
                {comp.name.split(' ')[0].toUpperCase()}
              </text>

              {comp.status === 'critical' && (
                <motion.text
                  x={x + w / 2}
                  y={y + h + 9}
                  textAnchor="middle"
                  fill={color}
                  fontSize="3"
                  fontFamily="Inter"
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  ⚠
                </motion.text>
              )}
            </motion.g>
          )
        })}

        <rect x="8" y="88" width="84" height="5" rx="2" fill="rgba(245,158,11,0.1)" stroke="rgba(245,158,11,0.35)" strokeWidth="0.4" />
      </svg>
    </div>
  )
}

const ComponentPanel: React.FC<{ comp: MachineComponent; onClose: () => void }> = ({ comp, onClose }) => {
  const color = comp.status === 'critical' ? '#EF4444' : comp.status === 'warning' ? '#F59E0B' : '#22C55E'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="rounded-xl overflow-hidden"
      style={{ border: `1px solid ${color}28`, background: 'rgba(11,18,32,0.98)' }}
    >
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ background: `${color}07`, borderBottom: `1px solid ${color}14` }}
      >
        <div className="flex items-center gap-2">
          <motion.div
            className="w-2 h-2 rounded-full"
            style={{ background: color }}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
          <span className="text-xs font-bold" style={{ color: '#F8FAFC', fontFamily: 'Space Grotesk' }}>
            {comp.name}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: `${color}15`, color, border: `1px solid ${color}28`, fontSize: 10 }}
          >
            {comp.condition}
          </span>
        </div>
        <button onClick={onClose} style={{ color: '#475569', cursor: 'pointer' }}>
          <X size={12} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 p-3">
        {[
          ['📘 Purpose', comp.purpose],
          ['🔍 Reason', comp.reason],
          ['⚡ Impact', comp.businessImpact],
          ['✅ Action', comp.action],
        ].map(([label, text]) => (
          <div
            key={label as string}
            className="p-2 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
          >
            <div className="text-xs font-bold mb-0.5" style={{ color: '#64748B', fontSize: 10 }}>
              {label}
            </div>
            <div className="text-xs leading-relaxed" style={{ color: '#CBD5E1', fontSize: 10 }}>
              {text}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

const ForcesBubble: React.FC<{
  children: React.ReactNode
  color?: string
  label?: string
  isSpeaking?: boolean
}> = ({ children, color = '#06B6D4', label = 'FORES — AI Operations Copilot', isSpeaking = false }) => (
  <div className="flex items-start gap-2.5">
    <div
      className="w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5"
      style={{
        background: `linear-gradient(135deg,${color}28,${color}18)`,
        border: `1px solid ${color}40`
      }}
    >
      <span className="text-xs font-bold" style={{ color }}>F</span>
    </div>
    <div
      className="flex-1 p-4 rounded-2xl"
      style={{
        background: 'rgba(17,24,39,0.92)',
        border: `1px solid ${color}14`,
        borderRadius: '4px 18px 18px 18px',
        backdropFilter: 'blur(12px)'
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color, fontSize: 10 }}>
          {label}
        </span>
        <AudioWaveform active={isSpeaking} />
      </div>
      {children}
    </div>
  </div>
)

const UserBubble: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex justify-end">
    <div
      className="px-3 py-2 rounded-2xl text-xs max-w-xs"
      style={{
        background: 'rgba(59,130,246,0.18)',
        border: '1px solid rgba(59,130,246,0.28)',
        borderRadius: '18px 4px 18px 18px',
        color: '#F8FAFC'
      }}
    >
      {text}
    </div>
  </div>
)

// ─── Main Component ─────────────────────────────────────────────────────────

export default function CopilotLanding() {
  // ─── Hooks (must be called in same order every render) ──────────────────
  const navigate = useNavigate()
  const aiMemory = useAIMemory()

  // ─── All useState declarations first ──────────────────────────────────────
  const [phase, setPhase] = useState<Phase>('greeting')
  const [greetingDone, setGreetingDone] = useState(false)
  const [selectedComp, setSelectedComp] = useState<MachineComponent | null>(null)
  const [showAutomation, setShowAutomation] = useState(false)
  const [automationDone, setAutomationDone] = useState(false)
  const [activeFollowup, setActiveFollowup] = useState<string | null>(null)
  const [followupDone, setFollowupDone] = useState(false)
  const [robotState, setRobotState] = useState<RobotState>('speaking')
  const [timelineVisible, setTimelineVisible] = useState<number[]>([])
  const [chatInput, setChatInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // ─── All hooks that depend on state go after useState ──────────────────
  const chatRef = useScrollToBottom([
    phase,
    activeFollowup,
    showAutomation,
    timelineVisible.length,
  ])

  const voice = useVoice({
    onSpeakStart: () => setRobotState('speaking'),
    onSpeakEnd: () => setRobotState(['thinking', 'followup_thinking'].includes(phase) ? 'thinking' : 'idle'),
    onTranscript: handleVoice,
  })

  // ─── All computed values go after hooks ──────────────────────────────────
  const hour = new Date().getHours()
  const timeGreet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const isReturn = aiMemory.isReturningUser

  const greetText = useMemo(() => {
    if (isReturn && aiMemory.hasDeferredMachines) {
      return `Welcome back.\n\nYesterday you postponed maintenance for Machine M-104. Since then vibration has increased by 14%. Failure probability is now 94%.\n\nScheduling maintenance before 2 PM is strongly recommended.`
    }
    if (isReturn) {
      return `Welcome back.\n\nOne new anomaly has been detected since your last visit — Machine M-104 shows critical bearing wear.\n\nWould you like me to explain what's happening?`
    }
    return `${timeGreet}.\n\nI completed today's overnight analysis — 1,247 sensors, maintenance records, production trends, and machine telemetry.\n\nThree machines require immediate attention. Preventive maintenance today could prevent 12 hours of downtime and save ₹2.6 million.\n\nWould you like me to explain the highest-risk machine?`
  }, [isReturn, aiMemory.hasDeferredMachines, timeGreet])

  // ─── All useEffect declarations go after computed values ────────────────
  useEffect(() => {
    aiMemory.recordSession()
    const todayKey = new Date().toDateString()
    const lastSpoken = localStorage.getItem('foresight_last_greeting')

    if (lastSpoken !== todayKey) {
      localStorage.setItem('foresight_last_greeting', todayKey)
      const timer = setTimeout(() => voice.speak(greetText), 700)
      return () => clearTimeout(timer)
    } else {
      const timer = setTimeout(() => setGreetingDone(true), 800)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── All handlers go after useEffect ─────────────────────────────────────
  function handleExplain() {
    voice.stopSpeaking()
    setPhase('thinking')
    setRobotState('thinking')
    aiMemory.deferMaintenance('M-104')
  }

  function handleThinkingDone() {
    setPhase('explaining')
    setRobotState('speaking')

    TIMELINE_EVENTS.forEach((_, i) => {
      setTimeout(() => setTimelineVisible(prev => [...prev, i]), 600 + i * 550)
    })

    setTimeout(() => {
      voice.speak('Machine M-104 is experiencing increasing bearing vibration combined with elevated temperature. Based on historical failure patterns, I predict a bearing failure within eighteen hours without maintenance.')
    }, 200)
  }

  function handleFollowup(q: string) {
    setActiveFollowup(q)
    setFollowupDone(false)
    setPhase('followup_thinking')
    setRobotState('thinking')
    voice.stopSpeaking()
  }

  function handleFollowupDone() {
    setPhase('followup')
    setRobotState('speaking')
    const resp = FOLLOWUP_RESPONSES[activeFollowup!] || AI_CHIP_RESPONSES[activeFollowup!] || ''
    setTimeout(() => {
      voice.speak(resp.replace(/\n•/g, ',').replace(/\n/g, ' '))
    }, 150)
  }

  function handleSchedule() {
    setShowAutomation(true)
    setPhase('automating')
    setRobotState('thinking')
    voice.stopSpeaking()
    aiMemory.scheduleMaintenance('M-104', '2:00 PM', 'Ravi Kumar')
  }

  function handleAutomationComplete() {
    setAutomationDone(true)
    setPhase('celebrated')
    setRobotState('celebrating')
    voice.speak('Maintenance scheduled successfully. Ravi Kumar begins at 2 PM. This prevents the production halt and saves 7.8 lakh rupees.')
  }

  function handleVoice(transcript: string) {
    const lower = transcript.toLowerCase()
    if (lower.includes('explain') || lower.includes('machine') || lower.includes('risk')) {
      handleExplain()
    } else if (lower.includes('dashboard')) {
      navigate('/app/dashboard')
    } else if (lower.includes('maintenance') && lower.includes('plan')) {
      handleFollowup("Generate today's maintenance plan")
    } else if (lower.includes('health') || lower.includes('summary')) {
      handleFollowup("Summarize today's factory health")
    } else if (lower.includes('money') || lower.includes('save')) {
      handleFollowup('How much money can we save?')
    } else if (lower.includes('temperature')) {
      handleFollowup('Explain the temperature trend')
    } else if (lower.includes('cause') || lower.includes('why')) {
      handleFollowup('What caused the bearing failure?')
    }
  }

  function handleChipClick(chip: string) {
    setChatInput(chip)
    inputRef.current?.focus()
    // Map chip to existing followup or AI chip response
    const existingKey = Object.keys(FOLLOWUP_RESPONSES).find(k => chip.toLowerCase().includes(k.toLowerCase().slice(0, 20)))
    if (existingKey) {
      handleFollowup(existingKey)
    } else {
      // Use chip response system
      setActiveFollowup(chip)
      setFollowupDone(false)
      setPhase('followup_thinking')
      setRobotState('thinking')
      voice.stopSpeaking()
    }
    setChatInput('')
  }

  function handleChipFollowupDone() {
    setPhase('followup')
    setRobotState('speaking')
    const resp = AI_CHIP_RESPONSES[activeFollowup!] || FOLLOWUP_RESPONSES[activeFollowup!] || ''
    setTimeout(() => {
      voice.speak(resp.replace(/\n•/g, ',').replace(/\n/g, ' '))
    }, 150)
  }

  function handleSendInput() {
    if (!chatInput.trim()) return
    handleChipClick(chatInput.trim())
  }

  function handleQuickAction(id: string) {
    if (id === 'explain') handleExplain()
    else if (id === 'maintenance') handleFollowup("Generate today's maintenance plan")
    else if (id === 'dashboard') navigate('/app/dashboard')
    else if (id === 'report') handleFollowup('Generate executive summary.')
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const isExplaining = ['explaining', 'automating', 'followup', 'followup_thinking', 'celebrated'].includes(phase)
  const getSeverityColor = (severity: Severity) =>
    severity === 'critical' ? '#EF4444' : '#F59E0B'

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ background: '#0B1220', fontFamily: 'Inter, sans-serif', overflow: 'hidden' }}
    >
      {/* ── Subtle Background Elements ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        {/* Factory silhouette low-opacity */}
        <svg width="100%" height="100%" viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" style={{ opacity: 0.025, position: 'absolute', bottom: 0 }}>
          {/* Factory building silhouette */}
          <rect x="50" y="600" width="200" height="300" fill="#06B6D4" />
          <rect x="100" y="550" width="40" height="60" fill="#06B6D4" />
          <rect x="170" y="540" width="40" height="70" fill="#06B6D4" />
          <rect x="270" y="580" width="300" height="320" fill="#3B82F6" />
          <rect x="300" y="530" width="60" height="60" fill="#3B82F6" />
          <rect x="400" y="510" width="60" height="80" fill="#3B82F6" />
          <rect x="590" y="560" width="250" height="340" fill="#06B6D4" />
          {/* Robotic arm 1 */}
          <line x1="900" y1="700" x2="900" y2="550" stroke="#3B82F6" strokeWidth="8" />
          <line x1="900" y1="550" x2="970" y2="480" stroke="#3B82F6" strokeWidth="6" />
          <line x1="970" y1="480" x2="1020" y2="510" stroke="#3B82F6" strokeWidth="4" />
          <circle cx="900" cy="700" r="12" fill="#06B6D4" />
          <circle cx="900" cy="550" r="8" fill="#06B6D4" />
          <circle cx="970" cy="480" r="6" fill="#06B6D4" />
          {/* Robotic arm 2 */}
          <line x1="1100" y1="720" x2="1100" y2="560" stroke="#3B82F6" strokeWidth="8" />
          <line x1="1100" y1="560" x2="1040" y2="490" stroke="#3B82F6" strokeWidth="6" />
          <line x1="1040" y1="490" x2="990" y2="520" stroke="#3B82F6" strokeWidth="4" />
          <circle cx="1100" cy="720" r="12" fill="#06B6D4" />
          <circle cx="1100" cy="560" r="8" fill="#06B6D4" />
          {/* AI Network lines */}
          <line x1="200" y1="200" x2="600" y2="400" stroke="#06B6D4" strokeWidth="1" strokeDasharray="6,10" />
          <line x1="600" y1="400" x2="1000" y2="250" stroke="#3B82F6" strokeWidth="1" strokeDasharray="6,10" />
          <line x1="1000" y1="250" x2="1300" y2="450" stroke="#06B6D4" strokeWidth="1" strokeDasharray="6,10" />
          <circle cx="200" cy="200" r="4" fill="#06B6D4" />
          <circle cx="600" cy="400" r="4" fill="#06B6D4" />
          <circle cx="1000" cy="250" r="4" fill="#3B82F6" />
          <circle cx="1300" cy="450" r="4" fill="#06B6D4" />
          {/* Circuit pattern */}
          <rect x="1150" y="100" width="2" height="80" fill="#06B6D4" />
          <rect x="1150" y="180" width="60" height="2" fill="#06B6D4" />
          <rect x="1210" y="180" width="2" height="50" fill="#06B6D4" />
          <rect x="1210" y="230" width="40" height="2" fill="#06B6D4" />
          <circle cx="1150" cy="100" r="3" fill="#06B6D4" />
          <circle cx="1250" cy="230" r="3" fill="#06B6D4" />
        </svg>
        {/* Floating data particles */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: i % 3 === 0 ? 3 : 2,
              height: i % 3 === 0 ? 3 : 2,
              background: i % 2 === 0 ? '#06B6D4' : '#3B82F6',
              left: `${8 + i * 7.5}%`,
              top: `${15 + (i % 5) * 14}%`,
              opacity: 0.18,
            }}
            animate={{ y: [0, -18, 0], opacity: [0.18, 0.35, 0.18] }}
            transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
          />
        ))}
        {/* Radial glow top-left */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: 600, height: 500, background: 'radial-gradient(ellipse at 20% 20%, rgba(59,130,246,0.055) 0%, transparent 65%)', pointerEvents: 'none' }} />
        {/* Radial glow bottom-right */}
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 700, height: 500, background: 'radial-gradient(ellipse at 80% 80%, rgba(6,182,212,0.04) 0%, transparent 65%)', pointerEvents: 'none' }} />
      </div>
      {/* ── Nav Bar ── */}
      <header
        className="flex-shrink-0 flex items-center justify-between px-5 h-12 z-30"
        style={{
          borderBottom: '1px solid rgba(59,130,246,0.1)',
          background: 'rgba(11,18,32,0.97)',
          backdropFilter: 'blur(16px)'
        }}
      >
        <div className="flex items-center gap-2.5">
          <motion.div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#3B82F6,#06B6D4)' }}
            animate={{ boxShadow: ['0 0 10px rgba(59,130,246,0.4)', '0 0 22px rgba(6,182,212,0.55)', '0 0 10px rgba(59,130,246,0.4)'] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Cpu size={14} className="text-white" />
          </motion.div>
          <div>
            <div className="font-bold text-sm leading-none" style={{ fontFamily: 'Space Grotesk', color: '#F8FAFC' }}>
              Foresight<span style={{ color: '#3B82F6' }}>IQ</span>
            </div>
            <div style={{ color: '#475569', fontSize: 10 }}>AI Operations Copilot · Industry 4.0</div>
          </div>
        </div>

        {/* Live Status Bar */}
        <div className="hidden md:flex items-center gap-1.5">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.18)', fontSize: 10 }}>
            <motion.span className="w-1.5 h-1.5 rounded-full" style={{ background: '#22C55E' }} animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
            <span style={{ color: '#22C55E', fontWeight: 600 }}>Live Factory Monitoring</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.15)', fontSize: 10, color: '#94A3B8' }}>
            <Factory size={9} style={{ color: '#3B82F6' }} /> Pune Smart Factory
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(6,182,212,0.07)', border: '1px solid rgba(6,182,212,0.15)', fontSize: 10, color: '#94A3B8' }}>
            <Radio size={9} style={{ color: '#06B6D4' }} /> 1,248 Sensors Active
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.15)', fontSize: 10, color: '#94A3B8' }}>
            <Zap size={9} style={{ color: '#8B5CF6' }} /> AI Engine Running
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 10, color: '#475569' }}>
            <Clock size={9} /> Last Updated: 10s ago
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isReturn && (
            <div
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
              style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.22)', color: '#8B5CF6', fontSize: 11 }}
            >
              <Moon size={10} /> Memory Active
            </div>
          )}

          <button
            onClick={voice.toggleMute}
            className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${voice.isMuted ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.07)'}`
            }}
          >
            {voice.isMuted ? <VolumeX size={12} style={{ color: '#EF4444' }} /> : <Volume2 size={12} style={{ color: '#94A3B8' }} />}
          </button>

          <button
            onClick={() => navigate('/end-of-day')}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity"
            style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22C55E', fontSize: 11 }}
          >
            <BarChart2 size={11} /> End of Day
          </button>

          <button
            onClick={() => navigate('/app/dashboard')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity"
            style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.22)', color: '#3B82F6', fontSize: 11 }}
          >
            Dashboard <ArrowRight size={11} />
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Panel - 30% */}
        <div
          className="flex-shrink-0 flex flex-col items-center justify-center gap-2 relative"
          style={{
            width: '30%',
            borderRight: '1px solid rgba(6,182,212,0.12)',
            background: 'rgba(11,18,32,0.85)',
            padding: '8px 14px',
            overflow: 'hidden',
          }}
        >
          {/* ── Layer 1: Real factory photograph with dark overlay ── */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'url(/factory-bg.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center 40%',
              backgroundRepeat: 'no-repeat',
              opacity: 0.13,
              filter: 'blur(2px) grayscale(25%) contrast(0.85)',
            }}
          />
          {/* Dark navy overlay on top of image */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'rgba(15,23,42,0.82)' }}
          />

          {/* ── Layer 2: Digital grid overlay ── */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width="100%"
            height="100%"
            style={{ opacity: 0.06 }}
          >
            <defs>
              <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
                <path d="M 28 0 L 0 0 0 28" fill="none" stroke="#06B6D4" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* ── Layer 3: Glowing circuit trace lines ── */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width="100%"
            height="100%"
            viewBox="0 0 280 700"
            style={{ opacity: 0.22 }}
            preserveAspectRatio="xMidYMid slice"
          >
            {/* Left vertical trace */}
            <line x1="18" y1="60" x2="18" y2="320" stroke="#06B6D4" strokeWidth="0.6" strokeDasharray="4,8" />
            <circle cx="18" cy="60" r="2" fill="#06B6D4" opacity="0.7" />
            <circle cx="18" cy="190" r="1.5" fill="#06B6D4" opacity="0.5" />
            <circle cx="18" cy="320" r="2" fill="#06B6D4" opacity="0.7" />
            {/* Horizontal branch left */}
            <line x1="18" y1="190" x2="55" y2="190" stroke="#06B6D4" strokeWidth="0.6" />
            <circle cx="55" cy="190" r="1.5" fill="#3B82F6" opacity="0.6" />
            {/* Right vertical trace */}
            <line x1="262" y1="80" x2="262" y2="400" stroke="#3B82F6" strokeWidth="0.6" strokeDasharray="4,8" />
            <circle cx="262" cy="80" r="2" fill="#3B82F6" opacity="0.7" />
            <circle cx="262" cy="240" r="1.5" fill="#3B82F6" opacity="0.5" />
            <circle cx="262" cy="400" r="2" fill="#3B82F6" opacity="0.7" />
            {/* Horizontal branch right */}
            <line x1="225" y1="240" x2="262" y2="240" stroke="#3B82F6" strokeWidth="0.6" />
            <circle cx="225" cy="240" r="1.5" fill="#06B6D4" opacity="0.6" />
            {/* Bottom corner trace */}
            <line x1="18" y1="580" x2="18" y2="640" stroke="#06B6D4" strokeWidth="0.5" strokeDasharray="3,6" />
            <line x1="18" y1="640" x2="80" y2="640" stroke="#06B6D4" strokeWidth="0.5" />
            <circle cx="80" cy="640" r="1.5" fill="#06B6D4" opacity="0.5" />
            {/* Top right corner trace */}
            <line x1="262" y1="60" x2="210" y2="60" stroke="#3B82F6" strokeWidth="0.5" strokeDasharray="3,6" />
            <line x1="210" y1="60" x2="210" y2="100" stroke="#3B82F6" strokeWidth="0.5" />
            <circle cx="210" cy="100" r="1.5" fill="#3B82F6" opacity="0.5" />
          </svg>

          {/* ── Layer 4: Holographic scanning ring (behind robot area) ── */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 260,
              height: 260,
              zIndex: 1,
            }}
          >
            {/* Outer slow-spin ring */}
            <motion.div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: '1px solid rgba(6,182,212,0.18)',
                boxShadow: '0 0 18px rgba(6,182,212,0.12), inset 0 0 18px rgba(6,182,212,0.06)',
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            />
            {/* Inner dashed rotating ring */}
            <motion.div
              style={{
                position: 'absolute',
                inset: 24,
                borderRadius: '50%',
                border: '1px dashed rgba(6,182,212,0.22)',
              }}
              animate={{ rotate: -360 }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            />
            {/* Scanning sweep line */}
            <motion.div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: 'conic-gradient(from 0deg, transparent 0deg, rgba(6,182,212,0.08) 30deg, transparent 60deg)',
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            />
            {/* Four cardinal tick marks */}
            {[0, 90, 180, 270].map((deg) => (
              <div
                key={deg}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: 8,
                  height: 1.5,
                  background: 'rgba(6,182,212,0.5)',
                  transformOrigin: '0 50%',
                  transform: `rotate(${deg}deg) translateX(120px) translateY(-50%)`,
                  borderRadius: 1,
                }}
              />
            ))}
          </div>

          {/* ── Layer 5: Soft cyan ambient glow (centered) ── */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 60% 55% at 50% 48%, rgba(6,182,212,0.09) 0%, rgba(59,130,246,0.05) 40%, transparent 70%)',
              zIndex: 2,
            }}
          />

          {/* ── Layer 6: Floating data particles ── */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={`lp-${i}`}
              className="absolute pointer-events-none rounded-full"
              style={{
                width: i % 2 === 0 ? 3 : 2,
                height: i % 2 === 0 ? 3 : 2,
                background: i % 3 === 0 ? '#06B6D4' : '#3B82F6',
                left: `${12 + i * 10}%`,
                top: `${20 + (i % 4) * 18}%`,
                opacity: 0.35,
                zIndex: 2,
              }}
              animate={{
                y: [0, -14, 0],
                opacity: [0.35, 0.65, 0.35],
              }}
              transition={{
                duration: 2.8 + i * 0.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.35,
              }}
            />
          ))}

          {/* ONLINE badge */}
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center gap-0.5 z-10"
          >
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full font-bold tracking-widest"
              style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.35)', color: '#22C55E', letterSpacing: '0.15em', fontSize: 10 }}
            >
              <motion.span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: '#22C55E' }}
                animate={{ opacity: [1, 0.25, 1], scale: [1, 1.3, 1] }}
                transition={{ duration: 1.0, repeat: Infinity }}
              />
              ONLINE
            </div>
            <div style={{ color: '#475569', fontSize: 9, letterSpacing: '0.08em' }}>Monitoring Factory Operations</div>
          </motion.div>

          {/* Robot with animated pulse ring */}
          <div className="relative z-10">
            {/* Outer animated pulse rings */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ border: '1.5px solid rgba(6,182,212,0.35)', borderRadius: '50%', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 180, height: 180 }}
              animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.1, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ border: '1px solid rgba(59,130,246,0.2)', borderRadius: '50%', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 210, height: 210 }}
              animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0.05, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            />
            <FORESRobot state={robotState} size={260} />
          </div>

          <div className="flex flex-col items-center gap-0.5 z-10">
            <AudioWaveform active={voice.isSpeaking} />
            <AnimatePresence>
              {voice.isSpeaking && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs font-medium"
                  style={{ color: '#06B6D4', fontSize: 10 }}
                >
                  Speaking...
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="w-full space-y-1 z-10">
            {[
              { label: 'AI Engine', value: 'Online', color: '#22C55E', pulse: true },
              { label: 'Sensors', value: '1,248 active', color: '#06B6D4', pulse: false },
              { label: 'Latency', value: '12 ms', color: '#3B82F6', pulse: false },
              { label: 'Confidence', value: '98.6%', color: '#8B5CF6', pulse: false },
            ].map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.08 }}
                className="flex items-center justify-between px-2.5 py-1 rounded-xl"
                style={{
                  background: `linear-gradient(135deg, ${item.color}08, rgba(17,24,39,0.6))`,
                  border: `1px solid ${item.color}18`,
                }}
              >
                <div className="flex items-center gap-1.5">
                  {item.pulse && (
                    <motion.span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: item.color }}
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    />
                  )}
                  <span style={{ color: '#64748B', fontSize: 10 }}>{item.label}</span>
                </div>
                <span className="font-bold" style={{ color: item.color, fontFamily: 'Space Grotesk', fontSize: 10 }}>
                  {item.value}
                </span>
              </motion.div>
            ))}
          </div>

          {voice.isSupported && (
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0 0 18px rgba(6,182,212,0.35)' }}
              whileTap={{ scale: 0.96 }}
              onClick={voice.isListening ? voice.stopListening : voice.startListening}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl font-semibold cursor-pointer z-10"
              style={{
                background: voice.isListening ? 'rgba(34,197,94,0.13)' : 'rgba(6,182,212,0.09)',
                border: `1px solid ${voice.isListening ? 'rgba(34,197,94,0.4)' : 'rgba(6,182,212,0.3)'}`,
                color: voice.isListening ? '#22C55E' : '#06B6D4',
                fontSize: 12,
              }}
              animate={voice.isListening ? {
                boxShadow: ['0 0 0 0 rgba(34,197,94,0.3)', '0 0 0 8px rgba(34,197,94,0)', '0 0 0 0 rgba(34,197,94,0)']
              } : {}}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              {voice.isListening ? <MicOff size={13} /> : <Mic size={13} />}
              {voice.isListening ? 'Listening...' : 'Speak to FORES'}
            </motion.button>
          )}
        </div>

        {/* Right Panel - 70% */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ padding: '12px 16px 8px' }}>
          {/* Hero Heading */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex-shrink-0 pt-1 pb-2"
          >
            <h1
              className="font-extrabold leading-tight mb-1"
              style={{ fontFamily: 'Space Grotesk', color: '#F8FAFC', fontSize: 22 }}
            >
              Welcome to{' '}
              <span style={{
                background: 'linear-gradient(90deg, #3B82F6, #06B6D4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>ForesightIQ</span>
            </h1>
            <p style={{ color: '#64748B', fontSize: 12, lineHeight: 1.5, maxWidth: 540 }}>
              Your AI Operations Copilot for Predictive Maintenance, Risk Intelligence, and Smarter Manufacturing Decisions
            </p>
          </motion.div>

          {/* Conversation */}
          <div
            ref={chatRef}
            className="flex-1 overflow-y-auto rounded-2xl space-y-3 pr-1"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(59,130,246,0.2) transparent',
            }}
          >
            {/* Greeting */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <ForcesBubble isSpeaking={voice.isSpeaking && phase === 'greeting'}>
                {/* Richer AI response card */}
                <div className="space-y-2">
                  <div className="text-sm leading-relaxed" style={{ color: '#E2E8F0' }}>
                    <Typewriter text={greetText} speed={18} onDone={() => setGreetingDone(true)} />
                  </div>
                  {/* AI Confidence Score badge */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
                    style={{
                      background: 'rgba(34,197,94,0.08)',
                      border: '1px solid rgba(34,197,94,0.35)',
                      boxShadow: '0 0 14px rgba(34,197,94,0.2)',
                    }}
                  >
                    <motion.div
                      className="w-2 h-2 rounded-full"
                      style={{ background: '#22C55E' }}
                      animate={{ boxShadow: ['0 0 4px #22C55E', '0 0 10px #22C55E', '0 0 4px #22C55E'] }}
                      transition={{ duration: 1.6, repeat: Infinity }}
                    />
                    <span className="font-bold" style={{ color: '#22C55E', fontFamily: 'Space Grotesk', fontSize: 11 }}>
                      AI Confidence Score: 98.6%
                    </span>
                  </motion.div>
                </div>
                {isReturn && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', color: '#8B5CF6', fontSize: 10 }}
                  >
                    <Moon size={9} /> FORES remembers your previous session
                  </motion.div>
                )}
              </ForcesBubble>
            </motion.div>

            {/* Thinking */}
            <AnimatePresence>
              {phase === 'thinking' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2"
                >
                  <UserBubble text="Explain Highest Risk Machine" />
                  <ForcesBubble color="#F59E0B" label="FORES — AI Reasoning Engine">
                    <ThinkingAnimation onComplete={handleThinkingDone} stepDuration={460} />
                  </ForcesBubble>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Explanation */}
            <AnimatePresence>
              {isExplaining && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <UserBubble text="Explain Highest Risk Machine" />

                  <ForcesBubble
                    color="#EF4444"
                    label="FORES — Machine M-104 Diagnosis"
                    isSpeaking={voice.isSpeaking && isExplaining}
                  >
                    <div className="space-y-3">
                      <p className="text-sm leading-relaxed" style={{ color: '#E2E8F0' }}>
                        Machine <strong style={{ color: '#EF4444' }}>M-104</strong> has a{' '}
                        <strong style={{ color: '#EF4444' }}>94% failure probability</strong> within{' '}
                        <strong style={{ color: '#F59E0B' }}>18 hours</strong> if maintenance is not scheduled.
                      </p>

                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: 'Failure Probability', value: '94%', color: '#EF4444' },
                          { label: 'Estimated Failure', value: '18 Hours', color: '#F59E0B' },
                          { label: 'Confidence', value: '96.8%', color: '#22C55E' },
                        ].map((kpi, index) => (
                          <motion.div
                            key={kpi.label}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className="text-center p-2.5 rounded-xl"
                            style={{ background: `${kpi.color}0A`, border: `1px solid ${kpi.color}22` }}
                          >
                            <div className="font-bold text-base" style={{ color: kpi.color, fontFamily: 'Space Grotesk' }}>
                              {kpi.value}
                            </div>
                            <div style={{ color: '#64748B', fontSize: 10 }}>{kpi.label}</div>
                          </motion.div>
                        ))}
                      </div>

                      <div
                        className="p-3 rounded-xl"
                        style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)' }}
                      >
                        <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#EF4444', fontSize: 10 }}>
                          ⚡ Business Impact — If Ignored
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { label: 'Downtime', value: '8 Hours', color: '#EF4444' },
                            { label: 'Production Loss', value: '₹8.2 Lakhs', color: '#EF4444' },
                            { label: 'Delayed Orders', value: '3', color: '#F59E0B' },
                            { label: 'Extra Repair Cost', value: '₹65,000', color: '#F59E0B' },
                          ].map((item) => (
                            <div
                              key={item.label}
                              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg"
                              style={{ background: 'rgba(255,255,255,0.02)' }}
                            >
                              <span style={{ color: '#64748B', fontSize: 10 }}>{item.label}</span>
                              <span className="font-bold" style={{ color: item.color, fontFamily: 'Space Grotesk', fontSize: 12 }}>
                                {item.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#64748B', fontSize: 10 }}>
                          Failure Timeline
                        </div>
                        <div className="space-y-0">
                          {TIMELINE_EVENTS.map((event, index) => (
                            <AnimatePresence key={event.time}>
                              {timelineVisible.includes(index) && (
                                <motion.div
                                  initial={{ opacity: 0, x: -14 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className="flex items-start gap-2.5"
                                >
                                  <div className="flex flex-col items-center flex-shrink-0">
                                    <motion.div
                                      className="w-2 h-2 rounded-full mt-0.5"
                                      style={{ background: getSeverityColor(event.severity), boxShadow: `0 0 6px ${getSeverityColor(event.severity)}` }}
                                      animate={event.severity === 'critical' ? { scale: [1, 1.3, 1] } : {}}
                                      transition={{ duration: 0.8, repeat: Infinity }}
                                    />
                                    {index < 3 && (
                                      <div className="w-px" style={{ background: 'rgba(255,255,255,0.06)', minHeight: 22, marginTop: 2 }} />
                                    )}
                                  </div>
                                  <div className="pb-2.5">
                                    <div className="font-bold" style={{ color: getSeverityColor(event.severity), fontSize: 10 }}>
                                      {event.time}
                                    </div>
                                    <div className="font-medium" style={{ color: '#E2E8F0', fontSize: 11 }}>
                                      {event.label}
                                    </div>
                                    <div style={{ color: '#475569', fontSize: 10 }}>{event.detail}</div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          ))}
                        </div>
                      </div>

                      <ConfidenceCard
                        value={96.8}
                        delay={0.3}
                        sources={[
                          'Historical maintenance data (3 years)',
                          'Live sensor telemetry (1,276 readings)',
                          'Temperature trend analysis',
                          'Vibration signature (94.2% match)',
                          'Power consumption anomaly'
                        ]}
                      />

                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#64748B', fontSize: 10 }}>
                          AI Vision — Interactive Digital Twin
                        </div>
                        <MachineTwin onSelect={setSelectedComp} />
                        <AnimatePresence>
                          {selectedComp && (
                            <motion.div className="mt-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                              <ComponentPanel comp={selectedComp} onClose={() => setSelectedComp(null)} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {!showAutomation && phase !== 'celebrated' && (
                        <div
                          className="flex items-center gap-3 p-3 rounded-xl"
                          style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}
                        >
                          <div className="flex-1">
                            <div className="text-sm font-semibold mb-0.5" style={{ color: '#F8FAFC' }}>
                              Replace bearing before 2 PM · Ravi Kumar · 90 min · Save ₹7.8L
                            </div>
                            <div style={{ color: '#64748B', fontSize: 11 }}>
                              Would you like FORES to schedule this automatically?
                            </div>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={handleSchedule}
                            className="px-4 py-2 rounded-xl font-bold cursor-pointer flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg,#22C55E,#16A34A)', color: 'white', boxShadow: '0 0 14px rgba(34,197,94,0.3)', fontSize: 12 }}
                          >
                            Yes, Schedule It
                          </motion.button>
                        </div>
                      )}

                      <AnimatePresence>
                        {showAutomation && (
                          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                            <AutomationFlow machineId="M-104" onComplete={handleAutomationComplete} />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <AnimatePresence>
                        {phase === 'celebrated' && automationDone && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-3 rounded-xl text-center"
                            style={{ background: 'linear-gradient(135deg,rgba(34,197,94,0.1),rgba(6,182,212,0.08))', border: '1px solid rgba(34,197,94,0.3)' }}
                          >
                            <div className="text-xl mb-0.5">🎉</div>
                            <div className="font-bold text-sm" style={{ color: '#22C55E', fontFamily: 'Space Grotesk' }}>
                              Mission Accomplished!
                            </div>
                            <div style={{ color: '#94A3B8', fontSize: 11 }}>
                              Line A protected · ₹7.8L saved · WO-2024-0847 generated
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {!showAutomation && (
                        <div>
                          <div style={{ color: '#374151', fontSize: 10 }} className="mb-1.5">
                            Continue the conversation:
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {FOLLOWUP_QS.map((q, index) => (
                              <motion.button
                                key={q.text}
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={() => handleFollowup(q.text)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-full cursor-pointer"
                                style={{ background: `${q.color}0F`, border: `1px solid ${q.color}25`, color: q.color, fontSize: 10 }}
                              >
                                <q.icon size={9} /> {q.text}
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </ForcesBubble>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Followup Thinking */}
            <AnimatePresence>
              {phase === 'followup_thinking' && activeFollowup && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2"
                >
                  <UserBubble text={activeFollowup} />
                  <ForcesBubble color="#8B5CF6" label="FORES — Analyzing">
                    <ThinkingAnimation onComplete={handleFollowupDone} stepDuration={360} />
                  </ForcesBubble>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Followup Response */}
            <AnimatePresence>
              {phase === 'followup' && activeFollowup && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <UserBubble text={activeFollowup} />
                  <ForcesBubble isSpeaking={voice.isSpeaking}>
                    <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#CBD5E1' }}>
                      <Typewriter
                        text={FOLLOWUP_RESPONSES[activeFollowup] || AI_CHIP_RESPONSES[activeFollowup] || ''}
                        speed={14}
                        onDone={() => { setFollowupDone(true); setRobotState('idle') }}
                      />
                    </div>
                    <AnimatePresence>
                      {followupDone && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className="mt-2.5 flex flex-wrap gap-1.5"
                        >
                          {FOLLOWUP_QS
                            .filter(q => q.text !== activeFollowup)
                            .slice(0, 4)
                            .map(q => (
                              <motion.button
                                key={q.text}
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={() => handleFollowup(q.text)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-full cursor-pointer"
                                style={{ background: `${q.color}0F`, border: `1px solid ${q.color}25`, color: q.color, fontSize: 10 }}
                              >
                                <q.icon size={9} /> {q.text}
                              </motion.button>
                            ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </ForcesBubble>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── AI Quick Actions ── */}
          <AnimatePresence>
            {greetingDone && phase === 'greeting' && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.45 }}
                className="flex-shrink-0 pt-3"
              >
                {/* Section header */}
                <div className="flex items-center gap-2 mb-2.5">
                  <div
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)' }}
                  >
                    <motion.div
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <Sparkles size={9} style={{ color: '#8B5CF6' }} />
                    </motion.div>
                    <span style={{ color: '#8B5CF6', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em' }}>SUGGESTED ACTIONS</span>
                  </div>
                  <div style={{ color: '#374151', fontSize: 10, flex: 1 }}>
                    Based on today's factory analysis
                  </div>
                </div>

                {/* 2×2 Quick Action Cards */}
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_ACTIONS.map((action, index) => (
                    <motion.button
                      key={action.id}
                      initial={{ opacity: 0, scale: 0.94, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: index * 0.07, duration: 0.35 }}
                      whileHover={{
                        scale: 1.03,
                        y: -3,
                        boxShadow: `0 0 28px ${action.glow}, 0 6px 20px rgba(0,0,0,0.35)`,
                      }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleQuickAction(action.id)}
                      className="relative flex flex-col items-start gap-1.5 p-3 cursor-pointer text-left"
                      style={{
                        background: action.bg,
                        border: `1px solid ${action.border}`,
                        borderRadius: 18,
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.22s ease',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Badge */}
                      <div
                        className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full"
                        style={{
                          background: `${action.badgeColor}18`,
                          border: `1px solid ${action.badgeColor}35`,
                          color: action.badgeColor,
                          fontSize: 8,
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                        }}
                      >
                        {action.badge}
                      </div>

                      {/* Icon + Emoji */}
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: `${action.color}18`, border: `1px solid ${action.color}30` }}
                        >
                          <action.icon size={13} style={{ color: action.color }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#F1F5F9', fontFamily: 'Space Grotesk', lineHeight: 1.2, paddingRight: 28 }}>
                          {action.label}
                        </span>
                      </div>

                      {/* Description */}
                      <p style={{ color: '#64748B', fontSize: 9.5, lineHeight: 1.45, margin: 0 }}>
                        {action.description}
                      </p>

                      {/* Arrow */}
                      <div className="flex items-center gap-1 mt-0.5">
                        <span style={{ color: action.color, fontSize: 9, fontWeight: 600 }}>Take Action</span>
                        <ChevronRight size={9} style={{ color: action.color }} />
                      </div>

                      {/* Bottom glow line */}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: 1.5,
                          background: `linear-gradient(90deg, transparent, ${action.color}60, transparent)`,
                        }}
                      />
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Input Bar + Suggestion Chips ── */}
          <div
            className="flex-shrink-0 mt-2 pt-2"
            style={{ borderTop: '1px solid rgba(59,130,246,0.06)' }}
          >
            {/* Input row */}
            <div className="flex items-center gap-2">
              <div
                className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-xl"
                style={{
                  background: 'rgba(17,24,39,0.8)',
                  border: `1px solid ${chatInput ? 'rgba(6,182,212,0.35)' : 'rgba(59,130,246,0.12)'}`,
                  transition: 'border-color 0.2s',
                }}
              >
                <MessageSquare size={11} style={{ color: '#374151', flexShrink: 0 }} />
                <input
                  ref={inputRef}
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendInput()}
                  placeholder={voice.isListening ? '🎙 Listening...' : 'Ask FORES anything about your factory...'}
                  className="flex-1 bg-transparent outline-none"
                  style={{
                    color: '#CBD5E1',
                    fontSize: 11,
                    border: 'none',
                    caretColor: '#06B6D4',
                  }}
                />
                {chatInput && (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleSendInput}
                    className="flex-shrink-0 w-5 h-5 rounded-lg flex items-center justify-center cursor-pointer"
                    style={{ background: 'linear-gradient(135deg,#3B82F6,#06B6D4)', boxShadow: '0 0 8px rgba(6,182,212,0.4)' }}
                  >
                    <Send size={10} style={{ color: 'white' }} />
                  </motion.button>
                )}
              </div>

              {voice.isSupported && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={voice.isListening ? voice.stopListening : voice.startListening}
                  className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer flex-shrink-0"
                  style={{
                    background: voice.isListening ? 'rgba(34,197,94,0.16)' : 'rgba(59,130,246,0.1)',
                    border: `1px solid ${voice.isListening ? 'rgba(34,197,94,0.4)' : 'rgba(59,130,246,0.22)'}`,
                  }}
                  animate={voice.isListening ? {
                    boxShadow: ['0 0 0 0 rgba(34,197,94,0.3)', '0 0 0 6px rgba(34,197,94,0)', '0 0 0 0 rgba(34,197,94,0)']
                  } : {}}
                  transition={{ duration: 1.2, repeat: Infinity }}
                >
                  {voice.isListening ? <MicOff size={12} style={{ color: '#22C55E' }} /> : <Mic size={12} style={{ color: '#3B82F6' }} />}
                </motion.button>
              )}
            </div>

            {/* Suggestion chips */}
            <div className="mt-2">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles size={8} style={{ color: '#475569' }} />
                <span style={{ color: '#374151', fontSize: 9.5, fontWeight: 600 }}>Try asking FORES</span>
              </div>
              <div
                className="flex gap-1.5 overflow-x-auto pb-1"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {SUGGESTION_CHIPS.map((chip, i) => (
                  <motion.button
                    key={chip}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.03 }}
                    whileHover={{
                      scale: 1.04,
                      boxShadow: '0 0 12px rgba(6,182,212,0.2)',
                      borderColor: 'rgba(6,182,212,0.4)',
                    }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleChipClick(chip)}
                    className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full cursor-pointer"
                    style={{
                      background: 'rgba(6,182,212,0.05)',
                      border: '1px solid rgba(6,182,212,0.18)',
                      color: '#94A3B8',
                      fontSize: 9.5,
                      whiteSpace: 'nowrap',
                      transition: 'all 0.18s ease',
                    }}
                  >
                    <ChevronRight size={8} style={{ color: '#06B6D4', flexShrink: 0 }} />
                    {chip}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Hero KPI Cards ── */}
      <div
        className="flex-shrink-0 flex items-center gap-2.5 px-5 py-2"
        style={{ borderTop: '1px solid rgba(6,182,212,0.1)', background: 'rgba(11,18,32,0.85)', backdropFilter: 'blur(10px)' }}
      >
        {HERO_KPI_CARDS.map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + index * 0.09 }}
            whileHover={{
              scale: 1.05,
              y: -3,
              boxShadow: `0 0 24px ${card.color}35, 0 4px 12px rgba(0,0,0,0.3)`
            }}
            className="flex-1 flex items-center gap-2.5 px-3.5 py-2 rounded-2xl cursor-default"
            style={{
              background: `linear-gradient(135deg, ${card.color}10, rgba(17,24,39,0.75))`,
              border: `1px solid ${card.color}28`,
              borderRadius: 18,
              minWidth: 0,
              backdropFilter: 'blur(8px)',
              boxShadow: `0 0 12px ${card.color}12`,
            }}
          >
            <div
              className="flex-shrink-0 w-7 h-7 rounded-xl flex items-center justify-center"
              style={{ background: `${card.color}18`, border: `1px solid ${card.color}30` }}
            >
              <card.icon size={13} style={{ color: card.color }} />
            </div>
            <div className="min-w-0">
              <div className="font-extrabold truncate" style={{ color: card.color, fontFamily: 'Space Grotesk', fontSize: 15, lineHeight: 1.1 }}>
                {card.value}
              </div>
              <div className="truncate" style={{ color: '#475569', fontSize: 9.5 }}>
                {card.label}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Trust Indicators Strip ── */}
      <div
        className="flex-shrink-0 flex items-center justify-center gap-6 px-5 py-1.5"
        style={{ borderTop: '1px solid rgba(59,130,246,0.06)', background: 'rgba(11,18,32,0.92)', backdropFilter: 'blur(8px)' }}
      >
        {TRUST_INDICATORS.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + index * 0.08 }}
            className="flex items-center gap-1.5"
            style={{ color: '#475569', fontSize: 10 }}
          >
            <div
              className="w-4 h-4 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(59,130,246,0.09)', border: '1px solid rgba(59,130,246,0.15)' }}
            >
              <item.icon size={8} style={{ color: '#3B82F6' }} />
            </div>
            <span style={{ whiteSpace: 'nowrap', fontSize: 9.5, color: '#64748B', fontWeight: 500 }}>{item.label}</span>
            {index < TRUST_INDICATORS.length - 1 && (
              <div className="w-px h-3 ml-4" style={{ background: 'rgba(59,130,246,0.1)' }} />
            )}
          </motion.div>
        ))}

        {/* Live KPIs compact row on right */}
        <div className="ml-auto flex items-center gap-2">
          <div className="flex-shrink-0 flex items-center gap-1">
            <motion.span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: '#22C55E' }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            <span style={{ color: '#475569', fontSize: 9, whiteSpace: 'nowrap', fontWeight: 600 }}>LIVE KPIs</span>
          </div>
          <div className="w-px self-stretch" style={{ background: 'rgba(59,130,246,0.1)' }} />
          {KPI_DATA.map((kpi, index) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.08 }}
              whileHover={{ scale: 1.06, y: -1, boxShadow: `0 0 14px ${kpi.color}30` }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl cursor-default"
              style={{
                background: `linear-gradient(135deg,${kpi.color}0A,rgba(17,24,39,0.7))`,
                border: `1px solid ${kpi.color}1E`,
              }}
            >
              <kpi.icon size={11} className="flex-shrink-0"/>
              <div>
                <KpiCounter target={kpi.target} prefix={kpi.prefix} suffix={kpi.suffix} decimals={kpi.decimals} color={kpi.color} />
                <div className="truncate" style={{ color: '#374151', fontSize: 8.5 }}>{kpi.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}