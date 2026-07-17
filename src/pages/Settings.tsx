import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bell, Shield, Cpu, Wifi, User, ChevronRight, Check, Save, 
  RefreshCw, Zap, Mail, Smartphone, Clock, Database, Cloud,
  Key, Lock, Eye, EyeOff, Globe, AlertCircle, CheckCircle,
  Settings as SettingsIcon, Sliders, TrendingUp, Activity,
  Moon, Sun, Monitor, Calendar, Users, FileText, Download,
  LogOut, HelpCircle
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

interface ToggleProps {
  enabled: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}

interface SettingItem {
  key: string
  label: string
  desc: string
  icon?: React.ComponentType<{ size?: number; className?: string }>
}

interface Section {
  id: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  description: string
}

// ─── Sub-components ────────────────────────────────────────────────────────

function Toggle({ enabled, onChange, disabled = false }: ToggleProps) {
  return (
    <motion.button
      role="switch"
      aria-checked={enabled}
      onClick={() => !disabled && onChange(!enabled)}
      className={`relative w-11 h-6 rounded-full flex-shrink-0 transition-opacity ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
      animate={{ backgroundColor: enabled ? '#3B82F6' : 'rgba(71,85,105,0.4)' }}
      transition={{ duration: 0.2 }}
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
    >
      <motion.div
        className="absolute top-1 w-4 h-4 rounded-full shadow-lg"
        style={{ background: '#fff' }}
        animate={{ 
          left: enabled ? 'calc(100% - 1.25rem)' : '0.25rem',
          boxShadow: enabled ? '0 0 20px rgba(59,130,246,0.4)' : '0 2px 4px rgba(0,0,0,0.2)'
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
      />
    </motion.button>
  )
}

function SettingCard({ 
  item, 
  value, 
  onChange, 
  disabled = false 
}: { 
  item: SettingItem
  value: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  const Icon = item.icon
  return (
    <motion.div 
      whileHover={{ scale: 1.005 }}
      className="flex items-center justify-between p-4 rounded-xl transition-all"
      style={{ 
        background: 'rgba(255,255,255,0.02)', 
        border: '1px solid rgba(59,130,246,0.06)',
        backdropFilter: 'blur(4px)',
        minHeight: '64px',
      }}
    >
      <div className="flex items-start gap-4 flex-1">
        {Icon && (
          <div className="mt-0.5 p-2 rounded-lg flex-shrink-0" style={{ background: 'rgba(59,130,246,0.08)' }}>
            <Icon size={16} style={{ color: '#3B82F6' }} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium" style={{ color: '#F8FAFC' }}>{item.label}</div>
          <div className="text-xs mt-1" style={{ color: '#94A3B8', lineHeight: 1.4 }}>{item.desc}</div>
        </div>
      </div>
      <Toggle enabled={value} onChange={onChange} disabled={disabled} />
    </motion.div>
  )
}

function RangeControl({ 
  label, 
  value, 
  min, 
  max, 
  step, 
  unit, 
  onChange,
  color = '#3B82F6'
}: { 
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (v: number) => void
  color?: string
}) {
  const percentage = ((value - min) / (max - min)) * 100
  
  return (
    <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(59,130,246,0.06)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-medium" style={{ color: '#F8FAFC' }}>{label}</div>
        <motion.span 
          key={value}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-sm font-bold px-3 py-0.5 rounded-lg"
          style={{ color, background: `${color}15` }}
        >
          {value}{unit || ''}
        </motion.span>
      </div>
      <div className="relative">
        <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <motion.div 
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${color}, ${color}80)` }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step || 1}
          value={value}
          onChange={e => onChange(parseInt(e.target.value))}
          className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer"
        />
        <div className="flex justify-between mt-2">
          <span className="text-xs" style={{ color: '#475569' }}>{min}{unit}</span>
          <span className="text-xs" style={{ color: '#475569' }}>{max}{unit}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Constants ─────────────────────────────────────────────────────────────

const SECTIONS: Section[] = [
  { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Alert preferences and communication' },
  { id: 'ai', label: 'AI Engine', icon: Cpu, description: 'Model configuration and predictions' },
  { id: 'security', label: 'Security', icon: Shield, description: 'Access control and authentication' },
  { id: 'connectivity', label: 'Connectivity', icon: Wifi, description: 'Network and data management' },
  { id: 'profile', label: 'User Profile', icon: User, description: 'Personal information and preferences' },
  { id: 'advanced', label: 'Advanced', icon: SettingsIcon, description: 'System administration' },
]

const NOTIFICATION_ITEMS: SettingItem[] = [
  { key: 'criticalAlerts', label: 'Critical Machine Alerts', desc: 'Immediate alerts for critical failure risk (>80%)', icon: AlertCircle },
  { key: 'warningAlerts', label: 'Warning Alerts', desc: 'Alerts for machines in warning state (50-80%)', icon: Activity },
  { key: 'maintenanceReminders', label: 'Maintenance Reminders', desc: 'Scheduled maintenance task reminders', icon: Calendar },
  { key: 'dailyDigest', label: 'Daily Summary Digest', desc: 'Morning summary of factory status', icon: TrendingUp },
  { key: 'smsAlerts', label: 'SMS Alerts', desc: 'Critical alerts via SMS to registered number', icon: Smartphone },
  { key: 'emailAlerts', label: 'Email Reports', desc: 'Automated reports to registered email', icon: Mail },
]

const AI_ITEMS: SettingItem[] = [
  { key: 'autoPrediction', label: 'Auto Failure Prediction', desc: 'Continuously analyze sensor data for anomalies', icon: Zap },
  { key: 'autoSchedule', label: 'Auto Maintenance Scheduling', desc: 'AI automatically generates maintenance recommendations', icon: Calendar },
  { key: 'anomalyDetection', label: 'Anomaly Detection', desc: 'Detect unusual patterns in machine behavior', icon: Activity },
  { key: 'predictiveAnalytics', label: 'Predictive Analytics', desc: 'Generate failure probability forecasts', icon: TrendingUp },
]

const SECURITY_ITEMS: SettingItem[] = [
  { key: 'twoFactor', label: 'Two-Factor Authentication', desc: 'Require 2FA for all logins', icon: Key },
  { key: 'auditLog', label: 'Audit Logging', desc: 'Log all user actions and system events', icon: FileText },
  { key: 'ipWhitelist', label: 'IP Whitelist', desc: 'Restrict access to trusted IP addresses', icon: Lock },
  { key: 'sessionTracking', label: 'Session Tracking', desc: 'Monitor active user sessions', icon: Users },
]

const CONNECTIVITY_ITEMS: SettingItem[] = [
  { key: 'cloudSync', label: 'Cloud Sync', desc: 'Sync data to ForesightIQ cloud for backup and analytics', icon: Cloud },
  { key: 'realTimeStreaming', label: 'Real-Time Streaming', desc: 'Continuous data streaming to dashboards', icon: Database },
  { key: 'autoBackup', label: 'Auto Backup', desc: 'Automated backup of all system data', icon: Save },
  { key: 'remoteAccess', label: 'Remote Access', desc: 'Allow secure remote monitoring', icon: Globe },
]

// ─── Main Component ───────────────────────────────────────────────────────

export default function Settings() {
  const [activeSection, setActiveSection] = useState('notifications')
  const [saved, setSaved] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // ─── Settings State ──────────────────────────────────────────────────────
  
  const [settings, setSettings] = useState({
    // Notifications
    criticalAlerts: true,
    warningAlerts: true,
    maintenanceReminders: true,
    dailyDigest: false,
    smsAlerts: true,
    emailAlerts: true,
    // AI
    autoPrediction: true,
    autoSchedule: true,
    anomalyDetection: true,
    predictiveAnalytics: true,
    aiConfidenceThreshold: 75,
    predictionHorizon: 72,
    modelUpdateFrequency: 24,
    // Security
    twoFactor: true,
    auditLog: true,
    ipWhitelist: false,
    sessionTracking: true,
    sessionTimeout: 30,
    // Connectivity
    cloudSync: true,
    realTimeStreaming: true,
    autoBackup: true,
    remoteAccess: false,
    iotPollingRate: 5,
    dataRetention: 90,
    // Profile
    name: 'Factory Manager',
    email: 'factory.manager@pune-mfg.com',
    role: 'Senior Operations Manager',
    timezone: 'Asia/Kolkata',
    theme: 'dark',
    notificationsEnabled: true,
    // Advanced
    debugMode: false,
    betaFeatures: false,
    performanceLogging: true,
    autoUpdate: true,
  })

  // ─── Computed values ──────────────────────────────────────────────────────

  const getSectionCount = useCallback((sectionId: string) => {
    switch (sectionId) {
      case 'notifications':
        return Object.keys(settings).filter(k => 
          NOTIFICATION_ITEMS.some(item => item.key === k)
        ).length
      case 'ai':
        return Object.keys(settings).filter(k => 
          AI_ITEMS.some(item => item.key === k)
        ).length + 3
      case 'security':
        return Object.keys(settings).filter(k => 
          SECURITY_ITEMS.some(item => item.key === k)
        ).length + 1
      case 'connectivity':
        return Object.keys(settings).filter(k => 
          CONNECTIVITY_ITEMS.some(item => item.key === k)
        ).length + 2
      case 'profile':
        return 5
      case 'advanced':
        return 4
      default:
        return 0
    }
  }, [settings])

  const sectionCounts = useMemo(() => {
    return SECTIONS.reduce((acc, section) => {
      acc[section.id] = getSectionCount(section.id)
      return acc
    }, {} as Record<string, number>)
  }, [getSectionCount])

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleToggle = useCallback((key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleRangeChange = useCallback((key: string, value: number) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleInputChange = useCallback((key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 800))
    setSaved(true)
    setIsSaving(false)
    setTimeout(() => setSaved(false), 2500)
  }, [])

  const handleReset = useCallback(() => {
    setShowResetConfirm(true)
  }, [])

  const confirmReset = useCallback(() => {
    setSettings({
      criticalAlerts: true,
      warningAlerts: true,
      maintenanceReminders: true,
      dailyDigest: false,
      smsAlerts: true,
      emailAlerts: true,
      autoPrediction: true,
      autoSchedule: true,
      anomalyDetection: true,
      predictiveAnalytics: true,
      aiConfidenceThreshold: 75,
      predictionHorizon: 72,
      modelUpdateFrequency: 24,
      twoFactor: true,
      auditLog: true,
      ipWhitelist: false,
      sessionTracking: true,
      sessionTimeout: 30,
      cloudSync: true,
      realTimeStreaming: true,
      autoBackup: true,
      remoteAccess: false,
      iotPollingRate: 5,
      dataRetention: 90,
      name: 'Factory Manager',
      email: 'factory.manager@pune-mfg.com',
      role: 'Senior Operations Manager',
      timezone: 'Asia/Kolkata',
      theme: 'dark',
      notificationsEnabled: true,
      debugMode: false,
      betaFeatures: false,
      performanceLogging: true,
      autoUpdate: true,
    })
    setShowResetConfirm(false)
    setSaved(false)
  }, [])

  // ─── Render Functions ────────────────────────────────────────────────────

  const renderNotifications = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4 pb-2" style={{ borderBottom: '1px solid rgba(59,130,246,0.06)' }}>
        <div>
          <div className="text-sm font-semibold" style={{ color: '#F8FAFC' }}>Notification Preferences</div>
          <div className="text-xs mt-1" style={{ color: '#94A3B8' }}>Configure how you want to be alerted</div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg flex-shrink-0" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
          <Bell size={12} style={{ color: '#3B82F6' }} />
          <span className="text-xs font-medium" style={{ color: '#3B82F6' }}>
            {Object.values(settings).filter(v => typeof v === 'boolean' && v).length} active
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {NOTIFICATION_ITEMS.map(item => (
          <SettingCard
            key={item.key}
            item={item}
            value={settings[item.key as keyof typeof settings] as boolean}
            onChange={(v) => handleToggle(item.key, v)}
          />
        ))}
      </div>

      <div className="mt-6 p-4 rounded-xl" style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.12)' }}>
        <div className="flex items-center gap-3 text-xs" style={{ color: '#22C55E' }}>
          <CheckCircle size={16} className="flex-shrink-0" />
          <span>Email and SMS alerts will be sent to your registered contact information</span>
        </div>
      </div>
    </div>
  )

  const renderAI = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4 pb-2" style={{ borderBottom: '1px solid rgba(59,130,246,0.06)' }}>
        <div>
          <div className="text-sm font-semibold" style={{ color: '#F8FAFC' }}>AI Engine Configuration</div>
          <div className="text-xs mt-1" style={{ color: '#94A3B8' }}>Fine-tune your AI copilot's behavior</div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg flex-shrink-0" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
          <Zap size={12} style={{ color: '#8B5CF6' }} />
          <span className="text-xs font-medium" style={{ color: '#8B5CF6' }}>Active</span>
        </div>
      </div>

      <div className="space-y-3">
        {AI_ITEMS.map(item => (
          <SettingCard
            key={item.key}
            item={item}
            value={settings[item.key as keyof typeof settings] as boolean}
            onChange={(v) => handleToggle(item.key, v)}
          />
        ))}
      </div>

      <div className="space-y-3 mt-4">
        <RangeControl
          label="Alert Confidence Threshold"
          value={settings.aiConfidenceThreshold}
          min={50}
          max={95}
          step={5}
          unit="%"
          onChange={(v) => handleRangeChange('aiConfidenceThreshold', v)}
          color="#3B82F6"
        />

        <RangeControl
          label="Prediction Horizon"
          value={settings.predictionHorizon}
          min={24}
          max={168}
          step={24}
          unit="h"
          onChange={(v) => handleRangeChange('predictionHorizon', v)}
          color="#8B5CF6"
        />

        <RangeControl
          label="Model Update Frequency"
          value={settings.modelUpdateFrequency}
          min={6}
          max={72}
          step={6}
          unit="h"
          onChange={(v) => handleRangeChange('modelUpdateFrequency', v)}
          color="#06B6D4"
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 p-4 rounded-xl"
        style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.06), rgba(6,182,212,0.04))', border: '1px solid rgba(34,197,94,0.15)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg flex-shrink-0" style={{ background: 'rgba(34,197,94,0.1)' }}>
              <Cpu size={16} style={{ color: '#22C55E' }} />
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: '#22C55E' }}>AI Model: Active & Learning</div>
              <div className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>Last trained: 2 hours ago · 1,247 sensors connected</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="text-xs" style={{ color: '#94A3B8' }}>
              Accuracy: <strong style={{ color: '#22C55E' }}>94.7%</strong>
            </div>
            <div className="text-xs" style={{ color: '#94A3B8' }}>
              Version: <strong style={{ color: '#3B82F6' }}>v3.2</strong>
            </div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {['Predictions', 'Anomalies', 'Maintenance'].map((label) => (
            <div key={label} className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color: '#94A3B8' }}>{label}:</span>
              <span style={{ color: '#F8FAFC' }} className="ml-1 font-medium">
                {Math.floor(Math.random() * 100) + 1}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )

  const renderSecurity = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4 pb-2" style={{ borderBottom: '1px solid rgba(59,130,246,0.06)' }}>
        <div>
          <div className="text-sm font-semibold" style={{ color: '#F8FAFC' }}>Security Settings</div>
          <div className="text-xs mt-1" style={{ color: '#94A3B8' }}>Protect your factory data and access</div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg flex-shrink-0" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <Shield size={12} style={{ color: '#EF4444' }} />
          <span className="text-xs font-medium" style={{ color: '#EF4444' }}>Secure</span>
        </div>
      </div>

      <div className="space-y-3">
        {SECURITY_ITEMS.map(item => (
          <SettingCard
            key={item.key}
            item={item}
            value={settings[item.key as keyof typeof settings] as boolean}
            onChange={(v) => handleToggle(item.key, v)}
          />
        ))}
      </div>

      <div className="mt-4">
        <RangeControl
          label="Session Timeout"
          value={settings.sessionTimeout}
          min={15}
          max={120}
          step={15}
          unit=" min"
          onChange={(v) => handleRangeChange('sessionTimeout', v)}
          color="#EF4444"
        />
      </div>

      <div className="mt-4 p-4 rounded-xl" style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.08)' }}>
        <div className="flex items-center gap-3 text-xs" style={{ color: '#94A3B8' }}>
          <Lock size={16} style={{ color: '#3B82F6' }} className="flex-shrink-0" />
          <span>All security logs are stored for <strong style={{ color: '#F8FAFC' }}>90 days</strong> and can be exported</span>
        </div>
      </div>
    </div>
  )

  const renderConnectivity = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4 pb-2" style={{ borderBottom: '1px solid rgba(59,130,246,0.06)' }}>
        <div>
          <div className="text-sm font-semibold" style={{ color: '#F8FAFC' }}>Connectivity & Data</div>
          <div className="text-xs mt-1" style={{ color: '#94A3B8' }}>Network settings and data management</div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg flex-shrink-0" style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.15)' }}>
          <Wifi size={12} style={{ color: '#06B6D4' }} />
          <span className="text-xs font-medium" style={{ color: '#06B6D4' }}>Connected</span>
        </div>
      </div>

      <div className="space-y-3">
        {CONNECTIVITY_ITEMS.map(item => (
          <SettingCard
            key={item.key}
            item={item}
            value={settings[item.key as keyof typeof settings] as boolean}
            onChange={(v) => handleToggle(item.key, v)}
          />
        ))}
      </div>

      <div className="space-y-3 mt-4">
        <RangeControl
          label="IoT Polling Rate"
          value={settings.iotPollingRate}
          min={1}
          max={30}
          unit="s"
          onChange={(v) => handleRangeChange('iotPollingRate', v)}
          color="#06B6D4"
        />

        <RangeControl
          label="Data Retention"
          value={settings.dataRetention}
          min={30}
          max={365}
          step={30}
          unit=" days"
          onChange={(v) => handleRangeChange('dataRetention', v)}
          color="#3B82F6"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Data Usage', value: '2.4 TB', color: '#3B82F6' },
          { label: 'Connected Devices', value: '48', color: '#22C55E' },
          { label: 'Sync Status', value: 'Active', color: '#06B6D4' },
        ].map(stat => (
          <div key={stat.label} className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="text-lg font-bold" style={{ color: stat.color, fontFamily: 'Space Grotesk' }}>{stat.value}</div>
            <div className="text-xs mt-1" style={{ color: '#94A3B8' }}>{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderProfile = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4 pb-2" style={{ borderBottom: '1px solid rgba(59,130,246,0.06)' }}>
        <div>
          <div className="text-sm font-semibold" style={{ color: '#F8FAFC' }}>User Profile</div>
          <div className="text-xs mt-1" style={{ color: '#94A3B8' }}>Manage your personal information</div>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-5 p-5 rounded-xl"
        style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(6,182,212,0.04))', border: '1px solid rgba(59,130,246,0.1)' }}
      >
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #3B82F6, #06B6D4)' }}
        >
          FM
        </motion.div>
        <div className="flex-1 min-w-0">
          <div className="text-base font-semibold" style={{ color: '#F8FAFC' }}>{settings.name}</div>
          <div className="text-sm mt-0.5" style={{ color: '#94A3B8' }}>{settings.role}</div>
          <div className="text-sm mt-0.5" style={{ color: '#94A3B8' }}>{settings.email}</div>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-xs px-3 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E' }}>
              Active
            </span>
            <span className="text-xs" style={{ color: '#475569' }}>Last login: 2 hours ago</span>
          </div>
        </div>
      </motion.div>

      <div className="space-y-3">
        {[
          { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Enter your full name' },
          { label: 'Email Address', key: 'email', type: 'email', placeholder: 'Enter your email' },
          { label: 'Role', key: 'role', type: 'text', placeholder: 'Enter your role', disabled: true },
          { label: 'Timezone', key: 'timezone', type: 'text', placeholder: 'Select timezone' },
        ].map(field => (
          <div key={field.key} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(59,130,246,0.06)' }}>
            <label className="text-xs font-medium block mb-2" style={{ color: '#94A3B8' }}>{field.label}</label>
            <input
              type={field.type}
              value={settings[field.key as keyof typeof settings] as string}
              onChange={e => handleInputChange(field.key, e.target.value)}
              disabled={field.disabled}
              placeholder={field.placeholder}
              className="w-full bg-transparent outline-none text-sm disabled:opacity-50"
              style={{ 
                color: '#F8FAFC', 
                borderBottom: '1px solid rgba(59,130,246,0.12)', 
                paddingBottom: '6px',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = '#3B82F6'}
              onBlur={e => e.target.style.borderColor = 'rgba(59,130,246,0.12)'}
            />
          </div>
        ))}
      </div>

      <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(59,130,246,0.06)' }}>
        <label className="text-xs font-medium block mb-3" style={{ color: '#94A3B8' }}>Theme Preference</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'dark', icon: Moon, label: 'Dark' },
            { id: 'light', icon: Sun, label: 'Light' },
            { id: 'system', icon: Monitor, label: 'System' },
          ].map(theme => (
            <motion.button
              key={theme.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleInputChange('theme', theme.id)}
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: settings.theme === theme.id ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${settings.theme === theme.id ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.05)'}`,
                color: settings.theme === theme.id ? '#3B82F6' : '#94A3B8',
              }}
            >
              <theme.icon size={14} />
              {theme.label}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )

  const renderAdvanced = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4 pb-2" style={{ borderBottom: '1px solid rgba(59,130,246,0.06)' }}>
        <div>
          <div className="text-sm font-semibold" style={{ color: '#F8FAFC' }}>Advanced Settings</div>
          <div className="text-xs mt-1" style={{ color: '#94A3B8' }}>System administration and debugging</div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg flex-shrink-0" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
          <SettingsIcon size={12} style={{ color: '#F59E0B' }} />
          <span className="text-xs font-medium" style={{ color: '#F59E0B' }}>Admin</span>
        </div>
      </div>

      <div className="space-y-3">
        {[
          { key: 'debugMode', label: 'Debug Mode', desc: 'Enable verbose logging for troubleshooting', icon: AlertCircle },
          { key: 'betaFeatures', label: 'Beta Features', desc: 'Enable early access to experimental features', icon: Zap },
          { key: 'performanceLogging', label: 'Performance Logging', desc: 'Log performance metrics for analysis', icon: Activity },
          { key: 'autoUpdate', label: 'Auto Update', desc: 'Automatically install system updates', icon: RefreshCw },
        ].map(item => (
          <SettingCard
            key={item.key}
            item={item}
            value={settings[item.key as keyof typeof settings] as boolean}
            onChange={(v) => handleToggle(item.key, v)}
          />
        ))}
      </div>

      <div className="mt-4 p-4 rounded-xl" style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.12)' }}>
        <div className="flex items-start gap-3 text-xs" style={{ color: '#F59E0B' }}>
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>Changes to advanced settings may affect system stability. Proceed with caution.</span>
        </div>
      </div>
    </div>
  )

  const renderSection = () => {
    switch (activeSection) {
      case 'notifications': return renderNotifications()
      case 'ai': return renderAI()
      case 'security': return renderSecurity()
      case 'connectivity': return renderConnectivity()
      case 'profile': return renderProfile()
      case 'advanced': return renderAdvanced()
      default: return null
    }
  }

  // ─── Main Render ─────────────────────────────────────────────────────────

  return (
    <div className="p-6 h-full overflow-hidden">
      {/* Header - Consistent 24px spacing */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4" style={{ borderBottom: '1px solid rgba(59,130,246,0.06)' }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk', color: '#F8FAFC' }}>
            Settings
          </h1>
          <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>
            System preferences and configuration · {sectionCounts[activeSection]} options
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all h-10"
            style={{ 
              border: '1px solid rgba(59,130,246,0.12)', 
              color: '#94A3B8',
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            <RefreshCw size={14} /> Reset Defaults
          </motion.button>
          
          <motion.button
            onClick={handleSave}
            disabled={isSaving}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: isSaving ? 1 : 1.02 }}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-all disabled:opacity-60 h-10"
            style={{ 
              background: saved 
                ? 'linear-gradient(135deg, #22C55E, #16A34A)' 
                : 'linear-gradient(135deg, #3B82F6, #2563EB)',
              boxShadow: saved ? '0 0 30px rgba(34,197,94,0.2)' : '0 0 30px rgba(59,130,246,0.15)',
            }}
          >
            {isSaving ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <RefreshCw size={14} />
              </motion.div>
            ) : saved ? (
              <><Check size={14} /> Saved!</>
            ) : (
              <><Save size={14} /> Save Changes</>
            )}
          </motion.button>
        </div>
      </div>

      {/* Main Grid - Consistent 16px gap */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100%-80px)]">
        {/* Sidebar Navigation - Consistent spacing */}
        <div className="space-y-2 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
          {SECTIONS.map((section) => {
            const isActive = activeSection === section.id
            const Icon = section.icon
            return (
              <motion.button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.97 }}
                className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-left transition-all group"
                style={{
                  background: isActive 
                    ? 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(6,182,212,0.06))' 
                    : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isActive ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.04)'}`,
                  minHeight: '56px',
                }}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${isActive ? 'bg-blue-500/20' : 'bg-transparent'}`}>
                    <Icon 
                      size={16} 
                      style={{ color: isActive ? '#3B82F6' : '#94A3B8' }} 
                    />
                  </div>
                  <div className="min-w-0">
                    <span className={`text-sm font-medium transition-colors ${isActive ? 'text-white' : 'text-gray-400'}`}>
                      {section.label}
                    </span>
                    <div className="text-[10px] mt-0.5 truncate" style={{ color: '#475569' }}>
                      {section.description}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ 
                    background: isActive ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
                    color: isActive ? '#3B82F6' : '#475569'
                  }}>
                    {sectionCounts[section.id]}
                  </span>
                  <motion.div 
                    animate={{ rotate: isActive ? 90 : 0 }} 
                    transition={{ duration: 0.2 }}
                    style={{ color: isActive ? '#3B82F6' : '#475569' }}
                  >
                    <ChevronRight size={14} />
                  </motion.div>
                </div>
              </motion.button>
            )
          })}
        </div>

        {/* Content Area - Consistent internal padding */}
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="lg:col-span-3 p-6 rounded-2xl overflow-y-auto"
          style={{ 
            background: 'rgba(17,24,39,0.6)',
            border: '1px solid rgba(59,130,246,0.06)',
            backdropFilter: 'blur(8px)',
            scrollbarWidth: 'thin',
          }}
        >
          {renderSection()}
        </motion.div>
      </div>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowResetConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="p-6 rounded-2xl max-w-md w-full"
              style={{ background: 'rgba(17,24,39,0.98)', border: '1px solid rgba(59,130,246,0.1)' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="p-2 rounded-lg flex-shrink-0" style={{ background: 'rgba(239,68,68,0.1)' }}>
                  <AlertCircle size={20} style={{ color: '#EF4444' }} />
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: '#F8FAFC' }}>Reset All Settings?</div>
                  <div className="text-xs mt-1" style={{ color: '#94A3B8' }}>This action cannot be undone</div>
                </div>
              </div>
              <p className="text-sm mb-6" style={{ color: '#94A3B8', lineHeight: 1.6 }}>
                Are you sure you want to reset all settings to their default values? All your customizations will be lost.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium order-2 sm:order-1"
                  style={{ border: '1px solid rgba(255,255,255,0.06)', color: '#94A3B8' }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={confirmReset}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold order-1 sm:order-2"
                  style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)', color: 'white' }}
                >
                  Reset Everything
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification - Proper positioning */}
      <AnimatePresence>
        {saved && !isSaving && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 z-50"
            style={{ 
              background: 'rgba(34,197,94,0.95)', 
              backdropFilter: 'blur(8px)',
              minWidth: '200px',
            }}
          >
            <Check size={18} color="#fff" className="flex-shrink-0" />
            <span className="text-sm font-medium" style={{ color: '#fff' }}>Settings saved successfully</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}