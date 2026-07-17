import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts'
import { 
  Download, FileText, TrendingUp, Calendar, ChevronDown, BarChart2, 
  Activity, Check, AlertCircle, Clock, Zap, Shield, Printer,
  FileSpreadsheet, FileJson, Mail, Eye
} from 'lucide-react'

const MONTHLY_DATA = [
  { month: 'Jan', failures: 8, prevented: 6, savings: 24, downtime: 18, oee: 82 },
  { month: 'Feb', failures: 12, prevented: 10, savings: 38, downtime: 24, oee: 79 },
  { month: 'Mar', failures: 6, prevented: 5, savings: 18, downtime: 10, oee: 88 },
  { month: 'Apr', failures: 15, prevented: 13, savings: 52, downtime: 28, oee: 76 },
  { month: 'May', failures: 9, prevented: 8, savings: 31, downtime: 16, oee: 85 },
  { month: 'Jun', failures: 11, prevented: 9, savings: 35, downtime: 20, oee: 84 },
]

const WEEKLY_OEE = [
  { day: 'Mon', oee: 88, target: 85 }, { day: 'Tue', oee: 91, target: 85 },
  { day: 'Wed', oee: 82, target: 85 }, { day: 'Thu', oee: 87, target: 85 },
  { day: 'Fri', oee: 84, target: 85 }, { day: 'Sat', oee: 79, target: 85 },
  { day: 'Today', oee: 84, target: 85 },
]

const REPORT_TYPES = [
  { 
    id: 'daily', 
    label: 'Daily Summary', 
    icon: FileText, 
    color: '#3B82F6', 
    desc: 'Automated daily ops report',
    format: 'PDF',
    size: '2.4 MB'
  },
  { 
    id: 'weekly', 
    label: 'Weekly Analytics', 
    icon: BarChart2, 
    color: '#06B6D4', 
    desc: '7-day performance analysis',
    format: 'PDF',
    size: '4.8 MB'
  },
  { 
    id: 'maintenance', 
    label: 'Maintenance Log', 
    icon: Activity, 
    color: '#22C55E', 
    desc: 'All maintenance activities',
    format: 'Excel',
    size: '1.2 MB'
  },
  { 
    id: 'failure', 
    label: 'Failure Analysis', 
    icon: TrendingUp, 
    color: '#F59E0B', 
    desc: 'AI prediction accuracy report',
    format: 'PDF',
    size: '3.1 MB'
  },
  { 
    id: 'oee', 
    label: 'OEE Report', 
    icon: Zap, 
    color: '#8B5CF6', 
    desc: 'Equipment effectiveness analysis',
    format: 'PDF',
    size: '2.8 MB'
  },
  { 
    id: 'comprehensive', 
    label: 'Comprehensive', 
    icon: Shield, 
    color: '#EC4899', 
    desc: 'Full factory health report',
    format: 'PDF',
    size: '8.5 MB'
  },
]

const FAILURE_CATEGORIES = [
  { name: 'Mechanical', value: 38, color: '#EF4444' },
  { name: 'Electrical', value: 22, color: '#F59E0B' },
  { name: 'Software', value: 15, color: '#3B82F6' },
  { name: 'Hydraulic', value: 14, color: '#06B6D4' },
  { name: 'Other', value: 11, color: '#475569' },
]

// ─── Custom Tooltip ────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="px-4 py-3 rounded-xl text-xs" style={{ 
        background: 'rgba(17,24,39,0.95)', 
        border: '1px solid rgba(59,130,246,0.2)',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
      }}>
        <div className="font-medium mb-1.5" style={{ color: '#94A3B8' }}>{label}</div>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2.5 py-0.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
            <span style={{ color: '#F8FAFC' }}>{p.name}: <strong>{p.value}</strong></span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

// ─── Report Generation Functions ──────────────────────────────────────────

const generateReportContent = (type: string, data: any) => {
  const date = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const titles: Record<string, string> = {
    daily: 'Daily Operations Summary Report',
    weekly: 'Weekly Analytics & Performance Report',
    maintenance: 'Maintenance Activity Log Report',
    failure: 'Failure Analysis & Prediction Report',
    oee: 'Overall Equipment Effectiveness (OEE) Report',
    comprehensive: 'Comprehensive Factory Health Report'
  }

  return {
    title: titles[type] || 'Report',
    date,
    content: `
      ${titles[type] || 'Report'}
      Generated: ${date}
      
      Executive Summary
      -----------------
      • Total Machines: ${data.totalMachines || 148}
      • Active Machines: ${data.activeMachines || 142}
      • Critical Alerts: ${data.criticalAlerts || 3}
      • Warning Alerts: ${data.warningAlerts || 12}
      
      Performance Metrics
      -------------------
      • Average OEE: ${data.avgOEE || 84}%
      • Failures Prevented: ${data.totalPrevented || 41}
      • Cost Savings: ₹${data.totalSavings || 198}L
      • AI Accuracy: ${data.aiAccuracy || 94.7}%
      
      Failure Categories
      ------------------
      ${FAILURE_CATEGORIES.map(c => `• ${c.name}: ${c.value}%`).join('\n')}
      
      Monthly Trends
      --------------
      ${MONTHLY_DATA.map(m => 
        `• ${m.month}: ${m.failures} failures, ${m.prevented} prevented, ₹${m.savings}L savings, ${m.oee}% OEE`
      ).join('\n')}
      
      Recommendations
      ---------------
      • Schedule maintenance for critical machines
      • Review warning alerts for early intervention
      • Optimize production schedule for OEE improvement
      
      Report generated by FORES AI Copilot
      ${date}
    `
  }
}

// ─── Main Component ───────────────────────────────────────────────────────

export default function Reports() {
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'quarterly'>('monthly')
  const [generating, setGenerating] = useState<string | null>(null)
  const [generatedReport, setGeneratedReport] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const totalSavings = MONTHLY_DATA.reduce((a, b) => a + b.savings, 0)
  const totalPrevented = MONTHLY_DATA.reduce((a, b) => a + b.prevented, 0)
  const avgOEE = Math.round(MONTHLY_DATA.reduce((a, b) => a + b.oee, 0) / MONTHLY_DATA.length)

  // ─── Report Generation ───────────────────────────────────────────────────

  const handleGenerate = async (id: string) => {
    setError(null)
    setSuccess(null)
    setGenerating(id)
    setDownloadProgress(0)

    try {
      for (let i = 0; i <= 100; i += 20) {
        setDownloadProgress(i)
        await new Promise(resolve => setTimeout(resolve, 300))
      }

      const reportData = {
        totalMachines: 148,
        activeMachines: 142,
        criticalAlerts: 3,
        warningAlerts: 12,
        avgOEE,
        totalPrevented,
        totalSavings,
        aiAccuracy: 94.7,
        monthlyData: MONTHLY_DATA,
        failureCategories: FAILURE_CATEGORIES,
        weeklyOEE: WEEKLY_OEE,
        generatedAt: new Date().toISOString(),
      }

      const report = generateReportContent(id, reportData)
      setGeneratedReport(JSON.stringify(report))
      downloadReport(id, report)

      setSuccess(`${REPORT_TYPES.find(r => r.id === id)?.label} generated successfully!`)
      
      setTimeout(() => {
        setGenerating(null)
        setSuccess(null)
      }, 3000)

    } catch (err) {
      setError('Failed to generate report. Please try again.')
      setGenerating(null)
      setTimeout(() => setError(null), 4000)
    }
  }

  const downloadReport = (id: string, report: any) => {
    const reportType = REPORT_TYPES.find(r => r.id === id)
    const fileName = `${reportType?.label.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`
    
    let content = ''
    let mimeType = ''
    let extension = ''

    switch (id) {
      case 'maintenance':
        content = generateCSVReport(report)
        mimeType = 'text/csv'
        extension = 'csv'
        break
      default:
        content = generateTextReport(report)
        mimeType = 'text/plain'
        extension = 'txt'
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${fileName}.${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const generateCSVReport = (report: any) => {
    const lines = [
      'Report Type,Generated Date',
      `${report.title},${report.date}`,
      '',
      'Month,Failures,Prevented,Savings (₹L),OEE (%)',
      ...MONTHLY_DATA.map(m => 
        `${m.month},${m.failures},${m.prevented},${m.savings},${m.oee}`
      ),
      '',
      'Failure Category,Percentage',
      ...FAILURE_CATEGORIES.map(c => `${c.name},${c.value}`),
    ]
    return lines.join('\n')
  }

  const generateTextReport = (report: any) => {
    return `
╔═══════════════════════════════════════════════════════════╗
║                   ${report.title.padEnd(46)}║
╚═══════════════════════════════════════════════════════════╝

📅 Generated: ${report.date}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 EXECUTIVE SUMMARY
───────────────────────────────────────────────────────────
• Total Machines:           148
• Active Machines:          142
• Critical Alerts:          3
• Warning Alerts:           12

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 PERFORMANCE METRICS
───────────────────────────────────────────────────────────
• Average OEE:              ${avgOEE}%
• Failures Prevented:       ${totalPrevented}
• Cost Savings:             ₹${totalSavings}L
• AI Accuracy:              94.7%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 FAILURE CATEGORIES
───────────────────────────────────────────────────────────
${FAILURE_CATEGORIES.map(c => `• ${c.name.padEnd(15)} ${c.value}%`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 MONTHLY TRENDS
───────────────────────────────────────────────────────────
${MONTHLY_DATA.map(m => 
  `• ${m.month.padEnd(6)} ${m.failures} failures · ${m.prevented} prevented · ₹${m.savings}L savings · ${m.oee}% OEE`
).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 RECOMMENDATIONS
───────────────────────────────────────────────────────────
1. Schedule maintenance for critical machines
2. Review warning alerts for early intervention
3. Optimize production schedule for OEE improvement

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤖 Generated by FORES AI Copilot
📅 ${report.date}

    `
  }

  const handlePreview = (id: string) => {
    const reportData = {
      totalMachines: 148,
      activeMachines: 142,
      criticalAlerts: 3,
      warningAlerts: 12,
      avgOEE,
      totalPrevented,
      totalSavings,
      aiAccuracy: 94.7,
    }
    const report = generateReportContent(id, reportData)
    setGeneratedReport(JSON.stringify(report))
    setShowPreview(true)
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk', color: '#F8FAFC' }}>
            Reports & Analytics
          </h1>
          <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>
            Comprehensive operational intelligence and performance tracking
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(59,130,246,0.15)' }}>
            {(['weekly', 'monthly', 'quarterly'] as const).map((p, index) => (
              <button 
                key={p} 
                onClick={() => setPeriod(p)}
                className="px-5 py-2.5 text-xs font-medium capitalize transition-all"
                style={{ 
                  background: period === p ? 'rgba(59,130,246,0.2)' : 'transparent', 
                  color: period === p ? '#3B82F6' : '#94A3B8',
                  borderRight: index < 2 ? '1px solid rgba(59,130,246,0.08)' : 'none',
                  paddingLeft: '20px',
                  paddingRight: '20px',
                }}
              >
                {p}
              </button>
            ))}
          </div>
          <button 
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-medium transition-all"
            style={{ 
              border: '1px solid rgba(59,130,246,0.12)', 
              color: '#94A3B8',
              paddingLeft: '16px',
              paddingRight: '16px',
            }}
          >
            <Calendar size={14} /> 
            <span>{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Failures Prevented', value: `${totalPrevented}`, sub: 'last 6 months', color: '#22C55E', change: '+18%', icon: Shield },
          { label: 'Cost Savings', value: `₹${totalSavings}L`, sub: 'preventive ROI', color: '#3B82F6', change: '+24%', icon: TrendingUp },
          { label: 'Average OEE', value: `${avgOEE}%`, sub: 'equipment effectiveness', color: '#06B6D4', change: '+6%', icon: Zap },
          { label: 'AI Accuracy', value: '94.7%', sub: 'prediction model', color: '#F59E0B', change: '+2.3%', icon: Activity },
        ].map((k, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -3, boxShadow: `0 8px 28px ${k.color}14` }}
            transition={{ delay: i * 0.07 }}
            className="p-5 rounded-2xl transition-all"
            style={{ 
              background: 'rgba(17,24,39,0.6)',
              border: '1px solid rgba(59,130,246,0.06)',
              backdropFilter: 'blur(8px)'
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-2xl font-bold mb-0.5" style={{ fontFamily: 'Space Grotesk', color: k.color }}>{k.value}</div>
                <div className="text-xs font-medium" style={{ color: '#F8FAFC' }}>{k.label}</div>
              </div>
              <div className="p-2 rounded-lg flex-shrink-0" style={{ background: `${k.color}15` }}>
                <k.icon size={14} style={{ color: k.color }} />
              </div>
            </div>
            <div className="flex items-center justify-between mt-2.5">
              <div className="text-xs" style={{ color: '#94A3B8' }}>{k.sub}</div>
              <span className="text-xs font-bold" style={{ color: '#22C55E' }}>{k.change}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Error/Success Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl text-sm flex items-center gap-3"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}
          >
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl text-sm flex items-center gap-3"
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#22C55E' }}
          >
            <Check size={16} className="flex-shrink-0" />
            <span>{success}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Failures & Savings */}
        <div className="lg:col-span-2 p-5 rounded-2xl" style={{ 
          background: 'rgba(17,24,39,0.6)',
          border: '1px solid rgba(59,130,246,0.06)',
          backdropFilter: 'blur(8px)'
        }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold" style={{ color: '#F8FAFC' }}>Failures Prevented vs Savings</div>
              <div className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>6-month trend (₹L)</div>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: '#22C55E' }} />
                <span style={{ color: '#94A3B8' }}>Prevented</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: '#3B82F6' }} />
                <span style={{ color: '#94A3B8' }}>Savings</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={MONTHLY_DATA} margin={{ top: 5, right: 5, bottom: 0, left: -20 }} barGap={6}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="prevented" name="Prevented" fill="#22C55E" radius={[4, 4, 0, 0]} />
              <Bar dataKey="savings" name="Savings (₹L)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Failure Categories */}
        <div className="p-5 rounded-2xl" style={{ 
          background: 'rgba(17,24,39,0.6)',
          border: '1px solid rgba(59,130,246,0.06)',
          backdropFilter: 'blur(8px)'
        }}>
          <div className="text-sm font-semibold mb-3" style={{ color: '#F8FAFC' }}>Failure Categories</div>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie 
                data={FAILURE_CATEGORIES} 
                cx="50%" 
                cy="50%" 
                innerRadius={45} 
                outerRadius={68} 
                paddingAngle={3} 
                dataKey="value" 
                strokeWidth={0}
              >
                {FAILURE_CATEGORIES.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1.5 mt-3">
            {FAILURE_CATEGORIES.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-xs px-1.5 py-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                  <span style={{ color: '#94A3B8' }}>{c.name}</span>
                </div>
                <span style={{ color: '#F8FAFC', fontWeight: 600 }}>{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* OEE Trend */}
      <div className="p-5 rounded-2xl" style={{ 
        background: 'rgba(17,24,39,0.6)',
        border: '1px solid rgba(59,130,246,0.06)',
        backdropFilter: 'blur(8px)'
      }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="text-sm font-semibold" style={{ color: '#F8FAFC' }}>OEE Trend — This Week</div>
            <div className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>Target: 85%</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk', color: '#06B6D4' }}>84%</div>
            <div className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E' }}>
              -1% vs target
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={130}>
          <AreaChart data={WEEKLY_OEE} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="oeeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
            <YAxis domain={[70, 95]} tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="oee" name="OEE %" stroke="#06B6D4" fill="url(#oeeGrad)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="target" name="Target" stroke="rgba(245,158,11,0.6)" strokeDasharray="5 3" strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Report Generator */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-semibold" style={{ color: '#F8FAFC' }}>Generate Reports</div>
            <div className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>Download detailed reports for analysis and documentation</div>
          </div>
          <span className="text-xs px-3 py-1.5 rounded-full" style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}>
            {REPORT_TYPES.length} available
          </span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {REPORT_TYPES.map((r, i) => (
            <motion.div 
              key={r.id} 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -2, boxShadow: '0 8px 28px rgba(59,130,246,0.08)' }}
              transition={{ delay: 0.5 + i * 0.08 }}
              className="p-5 rounded-2xl transition-all"
              style={{ 
                background: 'rgba(17,24,39,0.6)',
                border: '1px solid rgba(59,130,246,0.06)',
                backdropFilter: 'blur(8px)'
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${r.color}15` }}>
                  <r.icon size={18} style={{ color: r.color }} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded" style={{ 
                    background: 'rgba(255,255,255,0.04)',
                    color: '#475569'
                  }}>
                    {r.format}
                  </span>
                  <span className="text-[10px]" style={{ color: '#334155' }}>{r.size}</span>
                </div>
              </div>
              <div className="text-sm font-semibold mb-1" style={{ color: '#F8FAFC' }}>{r.label}</div>
              <div className="text-xs mb-4" style={{ color: '#94A3B8', lineHeight: 1.5 }}>{r.desc}</div>
              <div className="flex items-center gap-2.5">
                <motion.button
                  onClick={() => handleGenerate(r.id)}
                  whileHover={generating !== r.id ? { scale: 1.02 } : {}}
                  whileTap={generating !== r.id ? { scale: 0.98 } : {}}
                  className="flex-1 flex items-center justify-center gap-2.5 py-2.5 rounded-xl text-xs font-medium transition-all"
                  style={{ 
                    background: `${r.color}12`, 
                    border: `1px solid ${r.color}25`, 
                    color: r.color,
                    opacity: generating === r.id ? 0.7 : 1,
                    paddingLeft: '20px',
                    paddingRight: '20px',
                  }}
                >
                  {generating === r.id ? (
                    <span className="flex items-center gap-2">
                      <motion.span
                        className="inline-block w-3.5 h-3.5 border-2 rounded-full"
                        style={{ borderColor: `${r.color}40`, borderTopColor: r.color }}
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
                      />
                      {downloadProgress}%
                    </span>
                  ) : (
                    <>
                      <Download size={14} className="flex-shrink-0" />
                      <span>Download</span>
                    </>
                  )}
                </motion.button>
                <motion.button
                  onClick={() => handlePreview(r.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2.5 rounded-xl transition-all flex items-center justify-center"
                  style={{ 
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: '#94A3B8',
                    width: '40px',
                    height: '40px',
                  }}
                >
                  <Eye size={15} />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Report Preview Modal */}
      <AnimatePresence>
        {showPreview && generatedReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-2xl w-full max-h-[80vh] overflow-y-auto rounded-2xl"
              style={{ 
                background: 'rgba(17,24,39,0.98)',
                border: '1px solid rgba(59,130,246,0.1)',
                backdropFilter: 'blur(12px)'
              }}
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 flex items-center justify-between p-5 border-b" style={{ borderColor: 'rgba(59,130,246,0.06)' }}>
                <div>
                  <div className="text-sm font-semibold" style={{ color: '#F8FAFC' }}>Report Preview</div>
                  <div className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>Review before downloading</div>
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 rounded-lg transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', color: '#94A3B8' }}
                >
                  <ChevronDown size={16} />
                </button>
              </div>
              <div className="p-5">
                <pre className="text-xs whitespace-pre-wrap font-mono" style={{ 
                  color: '#94A3B8',
                  background: 'rgba(0,0,0,0.3)',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid rgba(59,130,246,0.06)',
                  maxHeight: '400px',
                  overflow: 'auto',
                  lineHeight: 1.6,
                }}>
                  {JSON.parse(generatedReport).content}
                </pre>
              </div>
              <div className="sticky bottom-0 flex items-center justify-end gap-3 p-5 border-t" style={{ borderColor: 'rgba(59,130,246,0.06)' }}>
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{ border: '1px solid rgba(255,255,255,0.06)', color: '#94A3B8' }}
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const report = JSON.parse(generatedReport)
                    const reportType = REPORT_TYPES.find(r => r.id === 'comprehensive')
                    downloadReport('comprehensive', report)
                    setShowPreview(false)
                  }}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2.5"
                  style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)', color: 'white' }}
                >
                  <Download size={14} /> Download
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}