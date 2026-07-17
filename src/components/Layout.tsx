import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Factory, Bot, Zap, Wrench, Map, BarChart3,
  Settings, Bell, ChevronLeft, ChevronRight, Activity, LogOut,
  Shield, Cpu
} from 'lucide-react'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/app/dashboard' },
  { icon: Factory, label: 'Factory Overview', path: '/app/factory-overview' },
  { icon: Bot, label: 'AI Copilot', path: '/app/copilot' },
  { icon: Zap, label: 'Failure Intelligence', path: '/app/failure-intelligence' },
  { icon: Wrench, label: 'Maintenance Planner', path: '/app/maintenance' },
  { icon: Map, label: 'Factory Digital Twin', path: '/app/heatmap' },
  { icon: BarChart3, label: 'Reports', path: '/app/reports' },
  { icon: Settings, label: 'Settings', path: '/app/settings' },
]

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0B1220' }}>
      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="relative flex-shrink-0 flex flex-col z-20"
        style={{ background: '#0F172A', borderRight: '1px solid rgba(59,130,246,0.1)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5" style={{ height: 72 }}>
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3B82F6, #06B6D4)' }}>
              <Cpu size={18} className="text-white" />
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-400" style={{ boxShadow: '0 0 6px #22C55E' }} />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                <div className="font-bold text-lg leading-none" style={{ fontFamily: 'Space Grotesk', color: '#F8FAFC' }}>
                  Foresight<span style={{ color: '#3B82F6' }}>IQ</span>
                </div>
                <div className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>Operations AI</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Collapse button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-8 w-6 h-6 rounded-full flex items-center justify-center z-30 cursor-pointer transition-all hover:scale-110"
          style={{ background: '#1E293B', border: '1px solid rgba(59,130,246,0.3)' }}
        >
          {collapsed ? <ChevronRight size={12} color="#3B82F6" /> : <ChevronLeft size={12} color="#3B82F6" />}
        </button>

        {/* Nav items */}
        <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto">
          {navItems.map(({ icon: Icon, label, path }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                  isActive ? 'sidebar-item-active' : 'hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={20}
                    className="flex-shrink-0 transition-colors"
                    style={{ color: isActive ? '#3B82F6' : '#94A3B8' }}
                  />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.15 }}
                        className="text-sm font-medium whitespace-nowrap"
                        style={{ color: isActive ? '#F8FAFC' : '#94A3B8' }}
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {/* Tooltip for collapsed */}
                  {collapsed && (
                    <div className="absolute left-full ml-3 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50"
                      style={{ background: '#1E293B', color: '#F8FAFC', border: '1px solid rgba(59,130,246,0.2)' }}>
                      {label}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="p-3 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {/* System status */}
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl mb-2"
                style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}
              >
                <Shield size={14} style={{ color: '#22C55E' }} />
                <span className="text-xs font-medium" style={{ color: '#22C55E' }}>All Systems Nominal</span>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 px-3 py-2 rounded-xl w-full transition-all hover:bg-white/5 group"
          >
            <LogOut size={18} style={{ color: '#94A3B8' }} />
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-sm" style={{ color: '#94A3B8' }}>
                  Back to Copilot
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 flex items-center justify-between px-6 h-[72px]"
          style={{ borderBottom: '1px solid rgba(59,130,246,0.08)', background: 'rgba(11,18,32,0.8)', backdropFilter: 'blur(8px)' }}>
          <div>
            <div className="text-xs font-medium mb-0.5" style={{ color: '#94A3B8' }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <div className="flex items-center gap-2">
              <Activity size={14} style={{ color: '#22C55E' }} />
              <span className="text-sm font-medium" style={{ color: '#22C55E' }}>Live Operations — Pune Smart Factory</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/5 cursor-pointer"
                style={{ border: '1px solid rgba(59,130,246,0.15)' }}
              >
                <Bell size={16} style={{ color: '#94A3B8' }} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                  style={{ background: '#EF4444', boxShadow: '0 0 6px #EF4444' }} />
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 w-80 rounded-2xl p-4 z-50"
                    style={{ background: '#111827', border: '1px solid rgba(59,130,246,0.2)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
                  >
                    <div className="text-sm font-semibold mb-3" style={{ color: '#F8FAFC' }}>Live Alerts</div>
                    {[
                      { type: 'critical', msg: 'CNC-07 vibration anomaly detected', time: '2m ago' },
                      { type: 'warning', msg: 'Robot Arm B4 temperature rising', time: '8m ago' },
                      { type: 'warning', msg: 'Conveyor Line 3 belt wear detected', time: '15m ago' },
                      { type: 'healthy', msg: 'Press Machine PM-12 maintenance done', time: '1h ago' },
                    ].map((a, i) => (
                      <div key={i} className="flex items-start gap-3 py-2.5" style={{ borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                        <span className={`status-dot mt-1 flex-shrink-0 ${a.type}`} />
                        <div className="flex-1">
                          <div className="text-xs" style={{ color: '#F8FAFC' }}>{a.msg}</div>
                          <div className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{a.time}</div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User avatar */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl cursor-pointer transition-all hover:bg-white/5"
              style={{ border: '1px solid rgba(59,130,246,0.15)' }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, #3B82F6, #06B6D4)' }}>
                FM
              </div>
              <div>
                <div className="text-xs font-medium" style={{ color: '#F8FAFC' }}>Factory Manager</div>
                <div className="text-xs" style={{ color: '#94A3B8' }}>Admin</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
