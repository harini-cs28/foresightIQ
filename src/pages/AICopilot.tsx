import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Send, Mic, Paperclip, Sparkles, TrendingUp, AlertTriangle, Wrench, BarChart2, ChevronRight, RefreshCw } from 'lucide-react'

interface Message {
  id: number
  role: 'user' | 'ai'
  content: string
  timestamp: Date
  type?: 'normal' | 'alert' | 'insight' | 'chart'
  chips?: string[]
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 1,
    role: 'ai',
    content: "Good Morning! I'm your ForesightIQ AI Copilot — your intelligent operations assistant. I've already analyzed today's factory data.\n\n**Current Status Summary:**\n• 🔴 3 machines require immediate attention\n• ⚠️ 12 machines in early warning state\n• ✅ 127 machines operating normally\n\nPreventive action today could **prevent 12 hours of downtime** and save approximately **₹2.6 million**.\n\nHow can I assist you today?",
    timestamp: new Date(),
    type: 'normal',
    chips: ['Show critical machines', 'Maintenance schedule', 'Energy report', 'Failure predictions'],
  },
]

const AI_RESPONSES: Record<string, Message> = {
  'Show critical machines': {
    id: 0, role: 'ai', timestamp: new Date(),
    content: "🔴 **3 Critical Machines Identified:**\n\n**1. CNC-07 — CRITICAL (87% failure probability)**\nVibration: 8.7 mm/s (threshold: 4.5)\nPredicted bearing failure in **~4 hours**\nRecommended action: Immediate shutdown & bearing replacement\n\n**2. Robot Arm B4 — WARNING (63% failure probability)**\nTemperature: 72°C (threshold: 70°C)\nCoolant system degradation detected\nRecommended: Coolant flush by 5:00 PM today\n\n**3. Conveyor Line 3 — WARNING (54% failure probability)**\nBelt wear index: 68%\nEstimated remaining life: 22–28 hours\nRecommended: Belt replacement during next shift break\n\n💰 Addressing all three: **Save ₹2.6M, prevent 12h downtime**",
    type: 'alert', chips: ['Schedule maintenance', 'Notify team', 'Full failure analysis', 'Risk assessment'],
  },
  'Maintenance schedule': {
    id: 0, role: 'ai', timestamp: new Date(),
    content: "📅 **Today's AI-Optimized Maintenance Schedule:**\n\n**Immediate (Next 2 hours)**\n• CNC-07: Bearing replacement — Technician: Ravi Kumar\n• Estimated time: 90 minutes\n\n**This Afternoon (2:00 PM – 4:00 PM)**\n• Robot Arm B4: Coolant system flush\n• Conveyor L3: Belt tension adjustment\n\n**This Week (Planned)**\n• Press PM-12: Lubrication check (Thursday)\n• Lathe-09: Calibration (Friday)\n• Drill-04: Filter replacement (Saturday)\n\nAll scheduled during **low-production windows** to minimize impact. Estimated productivity loss: **<0.8%**",
    type: 'insight', chips: ['Confirm schedule', 'Assign technicians', 'Export to calendar', 'Prioritize differently'],
  },
  'Energy report': {
    id: 0, role: 'ai', timestamp: new Date(),
    content: "⚡ **Energy Intelligence Report — Today:**\n\n**Total Consumption:** 3,750 kWh (6.25% below target ✅)\n**Peak Load:** 11:30 AM — 487 kW\n**Lowest Load:** 3:00 AM — 121 kW\n\n**Top Energy Consumers:**\n1. Press Machine PM-12: 18.2% of total\n2. CNC Machines (avg): 14.7% of total\n3. Robot Arms: 11.3% of total\n\n**AI Insights:**\n• Shifting Press-12 operations to off-peak hours could save **₹42,000/month**\n• CNC-07's anomaly is causing **23% excess energy draw** — further reason for immediate repair\n• Predicted today's total: **3,980 kWh** (within budget)",
    type: 'insight', chips: ['Optimize schedule', 'Full energy dashboard', 'Cost breakdown'],
  },
  'Failure predictions': {
    id: 0, role: 'ai', timestamp: new Date(),
    content: "🔮 **AI Failure Predictions — Next 72 Hours:**\n\nMachine | Probability | Timeframe | Impact\nCNC-07 | 87% 🔴 | 2–6 hours | ₹8.2L\nRobot B4 | 63% ⚠️ | 12–24 hours | ₹3.4L\nConv-L3 | 54% ⚠️ | 18–30 hours | ₹2.1L\nMill-11 | 28% 🟡 | 48–72 hours | ₹1.2L\nLathe-09 | 19% 🟢 | 60–72 hours | ₹0.8L\n\n**Total potential loss if unaddressed: ₹15.7L**\n**Cost of preventive action: ₹2.1L**\n**ROI of acting now: 648%**",
    type: 'chart', chips: ['Schedule all maintenance', 'Drill down CNC-07', 'Export predictions PDF'],
  },
  'default': {
    id: 0, role: 'ai', timestamp: new Date(),
    content: "I've analyzed your query and cross-referenced it with the live factory data.\n\nBased on current sensor readings and historical patterns, I can provide detailed analysis on any machine, production line, or operational metric.\n\n**Try asking me:**\n• \"What's the risk level for Line B this week?\"\n• \"Compare energy usage across all lines\"\n• \"Which maintenance saves the most money today?\"\n• \"Show me the vibration history for CNC-07\"",
    type: 'normal', chips: ['Show critical machines', 'Maintenance schedule', 'Energy report', 'Failure predictions'],
  },
}

const QUICK_ACTIONS = [
  { icon: AlertTriangle, label: 'Critical Alerts', color: '#EF4444', query: 'Show critical machines' },
  { icon: Wrench, label: 'Maintenance', color: '#F59E0B', query: 'Maintenance schedule' },
  { icon: TrendingUp, label: 'Energy Report', color: '#22C55E', query: 'Energy report' },
  { icon: BarChart2, label: 'Predictions', color: '#3B82F6', query: 'Failure predictions' },
]

function formatContent(text: string, isAI: boolean) {
  const lines = text.split('\n')
  const result: JSX.Element[] = []
  let tableRows: string[][] = []
  let inTable = false

  const flushTable = (key: string) => {
    if (tableRows.length < 2) {
      // Treat as regular lines
      tableRows.forEach((cells, idx) => {
        result.push(
          <div key={key + 'tr' + idx} className="flex gap-0 text-xs" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            {cells.map((c, j) => (
              <div key={j} className="flex-1 px-2 py-1.5" style={{ color: c.includes('🔴') || c.includes('87%') ? '#EF4444' : c.includes('⚠️') ? '#F59E0B' : '#94A3B8' }}>
                {c.trim()}
              </div>
            ))}
          </div>
        )
      })
    } else {
      result.push(
        <div key={key} className="rounded-xl overflow-hidden my-2" style={{ border: '1px solid rgba(59,130,246,0.12)' }}>
          {tableRows.map((cells, idx) => {
            const isSep = cells.every(c => c.trim().match(/^-+$/))
            if (isSep) return null
            const isHeader = idx === 0
            return (
              <div key={idx} className="flex" style={{ borderBottom: idx < tableRows.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', background: isHeader ? 'rgba(59,130,246,0.07)' : 'transparent' }}>
                {cells.map((c, j) => (
                  <div key={j} className={`flex-1 px-3 py-2 text-xs ${isHeader ? 'font-semibold' : ''}`}
                    style={{ color: isHeader ? '#94A3B8' : c.trim().includes('87%') || c.trim().includes('🔴') ? '#EF4444' : c.trim().includes('⚠️') || c.trim().includes('63%') || c.trim().includes('54%') ? '#F59E0B' : '#94A3B8' }}>
                    {c.trim()}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )
    }
    tableRows = []
    inTable = false
  }

  lines.forEach((line, i) => {
    const key = `l${i}`
    const isTableLine = line.trimStart().startsWith('|') || (line.includes(' | ') && !line.startsWith('•'))

    if (isTableLine) {
      if (!inTable) inTable = true
      tableRows.push(line.split('|').filter(c => c !== ''))
      return
    }

    if (inTable && !isTableLine) {
      flushTable(`t${i}`)
    }

    if (line === '') {
      result.push(<div key={key} className="h-2" />)
      return
    }

    if (line.startsWith('**') && line.endsWith('**')) {
      result.push(<div key={key} className="font-bold text-sm my-1" style={{ color: '#F8FAFC' }}>{line.slice(2, -2)}</div>)
      return
    }

    if (line.includes('**')) {
      const parts = line.split(/\*\*(.*?)\*\*/g)
      result.push(
        <div key={key} className="text-sm leading-relaxed" style={{ color: isAI ? '#CBD5E1' : '#F8FAFC' }}>
          {parts.map((part, j) => j % 2 === 1 ? <strong key={j} style={{ color: '#F8FAFC' }}>{part}</strong> : part)}
        </div>
      )
      return
    }

    if (line.startsWith('•') || /^\d+\./.test(line)) {
      result.push(
        <div key={key} className="text-sm pl-3 leading-relaxed flex gap-2" style={{ color: '#94A3B8' }}>
          <span style={{ color: '#475569', flexShrink: 0 }}>›</span>
          <span>{line.replace(/^[•\d+\.]\s*/, '')}</span>
        </div>
      )
      return
    }

    result.push(<div key={key} className="text-sm leading-relaxed" style={{ color: isAI ? '#CBD5E1' : '#F8FAFC' }}>{line}</div>)
  })

  if (inTable) flushTable(`tend`)
  return result
}

function MessageBubble({ msg, onChipClick }: { msg: Message; onChipClick: (t: string) => void }) {
  const isAI = msg.role === 'ai'
  const borderColors: Record<string, string> = {
    alert: 'rgba(239,68,68,0.2)',
    insight: 'rgba(6,182,212,0.2)',
    chart: 'rgba(59,130,246,0.2)',
    normal: 'rgba(59,130,246,0.1)',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`flex gap-3 ${isAI ? '' : 'flex-row-reverse'}`}
    >
      {/* Avatar */}
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
        style={isAI
          ? { background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(6,182,212,0.3))', border: '1px solid rgba(6,182,212,0.3)' }
          : { background: 'linear-gradient(135deg, #3B82F6, #06B6D4)' }
        }>
        {isAI ? <Bot size={16} style={{ color: '#06B6D4' }} /> : <span className="text-xs font-bold text-white">FM</span>}
      </div>

      <div className="flex-1 max-w-xl space-y-2">
        <div className="p-4 rounded-2xl"
          style={{
            background: isAI ? 'rgba(17,24,39,0.92)' : 'rgba(59,130,246,0.15)',
            border: `1px solid ${isAI ? borderColors[msg.type || 'normal'] : 'rgba(59,130,246,0.3)'}`,
            borderRadius: isAI ? '4px 18px 18px 18px' : '18px 4px 18px 18px'
          }}>
          <div className="space-y-0.5">{formatContent(msg.content, isAI)}</div>
        </div>

        {/* Chips */}
        {msg.chips && (
          <div className="flex flex-wrap gap-1.5">
            {msg.chips.map(chip => (
              <motion.button
                key={chip}
                onClick={() => onChipClick(chip)}
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.96 }}
                className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#3B82F6' }}>
                {chip}
              </motion.button>
            ))}
          </div>
        )}

        <div className="text-xs" style={{ color: '#475569' }}>
          {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </motion.div>
  )
}

export default function AICopilot() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const sendMessage = (text: string) => {
    if (!text.trim() || isTyping) return
    const userMsg: Message = { id: Date.now(), role: 'user', content: text, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    setTimeout(() => {
      setIsTyping(false)
      const response = AI_RESPONSES[text] || AI_RESPONSES['default']
      setMessages(prev => [...prev, { ...response, id: Date.now(), timestamp: new Date() }])
    }, 1000 + Math.random() * 800)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="flex h-full" style={{ height: 'calc(100vh - 72px)' }}>
      {/* Sidebar */}
      <div className="w-60 flex-shrink-0 p-4 space-y-4 overflow-y-auto" style={{ borderRight: '1px solid rgba(59,130,246,0.08)' }}>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#94A3B8' }}>Quick Actions</div>
          <div className="space-y-1.5">
            {QUICK_ACTIONS.map((a, i) => (
              <motion.button key={i} onClick={() => sendMessage(a.query)}
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.97 }}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors hover:bg-white/5"
                style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${a.color}15` }}>
                  <a.icon size={15} style={{ color: a.color }} />
                </div>
                <span className="text-sm font-medium flex-1" style={{ color: '#F8FAFC' }}>{a.label}</span>
                <ChevronRight size={14} style={{ color: '#475569' }} />
              </motion.button>
            ))}
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16 }}>
          <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#94A3B8' }}>System Status</div>
          <div className="space-y-2">
            {[
              { label: 'AI Model', value: 'GPT-4 Turbo', color: '#22C55E' },
              { label: 'Sensors Active', value: '1,247', color: '#3B82F6' },
              { label: 'Data Latency', value: '12ms', color: '#06B6D4' },
              { label: 'Confidence', value: '98.4%', color: '#F59E0B' },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span style={{ color: '#94A3B8' }}>{s.label}</span>
                <span className="font-semibold" style={{ color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        <motion.button
          onClick={() => { setMessages(INITIAL_MESSAGES); setInput('') }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium transition-all hover:bg-white/5"
          style={{ border: '1px solid rgba(59,130,246,0.2)', color: '#94A3B8' }}>
          <RefreshCw size={13} /> New conversation
        </motion.button>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map(msg => (
            <MessageBubble key={msg.id} msg={msg} onChipClick={sendMessage} />
          ))}

          {/* Typing indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(6,182,212,0.3))', border: '1px solid rgba(6,182,212,0.3)' }}>
                  <Bot size={16} style={{ color: '#06B6D4' }} />
                </div>
                <div className="px-4 py-3 rounded-2xl flex items-center gap-1.5"
                  style={{ background: 'rgba(17,24,39,0.92)', border: '1px solid rgba(59,130,246,0.12)', borderRadius: '4px 18px 18px 18px' }}>
                  {[0, 1, 2].map(i => (
                    <motion.span key={i} className="w-2 h-2 rounded-full"
                      style={{ background: '#06B6D4' }}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 0.75, repeat: Infinity, delay: i * 0.18 }} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(59,130,246,0.08)' }}>
          <motion.div
            className="flex items-center gap-3 p-3 rounded-2xl"
            style={{ background: 'rgba(17,24,39,0.92)', border: '1px solid rgba(59,130,246,0.2)' }}
            whileFocusWithin={{ borderColor: 'rgba(59,130,246,0.45)', boxShadow: '0 0 0 3px rgba(59,130,246,0.08)' }}
          >
            <Sparkles size={17} style={{ color: '#3B82F6', flexShrink: 0 }} />
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about your factory operations..."
              className="flex-1 bg-transparent outline-none text-sm min-w-0"
              style={{ color: '#F8FAFC' }}
            />
            <div className="flex items-center gap-1 flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/5"
                aria-label="Attach file"
              >
                <Paperclip size={14} style={{ color: '#475569' }} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/5"
                aria-label="Voice input"
              >
                <Mic size={14} style={{ color: '#475569' }} />
              </motion.button>
              <motion.button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isTyping}
                whileHover={input.trim() && !isTyping ? { scale: 1.05 } : {}}
                whileTap={input.trim() && !isTyping ? { scale: 0.93 } : {}}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                style={{ background: input.trim() && !isTyping ? 'linear-gradient(135deg, #3B82F6, #06B6D4)' : 'rgba(59,130,246,0.15)' }}
                aria-label="Send message"
              >
                <Send size={14} className="text-white" />
              </motion.button>
            </div>
          </motion.div>
          <div className="text-xs text-center mt-2" style={{ color: '#374151' }}>
            ForesightIQ Copilot analyzes 1,247 live sensors · Responses based on real-time data
          </div>
        </div>
      </div>
    </div>
  )
}
