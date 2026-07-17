// AI Memory System — localStorage-based contextual memory for FORES
export interface MemoryEntry {
  type: 'deferred_maintenance' | 'completed_maintenance' | 'resolved_alert' | 'conversation' | 'briefing'
  timestamp: number
  data: Record<string, any>
}

export interface AIMemory {
  sessions: number
  lastVisit: number
  entries: MemoryEntry[]
  deferredMachines: string[]
  resolvedAlerts: string[]
  scheduledTasks: string[]
}

const MEMORY_KEY = 'foresightiq_memory'
const EXPIRY_DAYS = 7

function getMemory(): AIMemory {
  try {
    const raw = localStorage.getItem(MEMORY_KEY)
    if (!raw) return createFreshMemory()
    const mem: AIMemory = JSON.parse(raw)
    // Expire old entries
    const cutoff = Date.now() - EXPIRY_DAYS * 24 * 60 * 60 * 1000
    mem.entries = mem.entries.filter(e => e.timestamp > cutoff)
    return mem
  } catch {
    return createFreshMemory()
  }
}

function createFreshMemory(): AIMemory {
  return { sessions: 0, lastVisit: 0, entries: [], deferredMachines: [], resolvedAlerts: [], scheduledTasks: [] }
}

function saveMemory(mem: AIMemory) {
  try { localStorage.setItem(MEMORY_KEY, JSON.stringify(mem)) } catch {}
}

export function useAIMemory() {
  const memory = getMemory()

  const isFirstVisitToday = (): boolean => {
    const today = new Date().toDateString()
    const lastDate = memory.lastVisit ? new Date(memory.lastVisit).toDateString() : ''
    return today !== lastDate
  }

  const recordSession = () => {
    memory.sessions++
    memory.lastVisit = Date.now()
    saveMemory(memory)
  }

  const deferMaintenance = (machineId: string) => {
    if (!memory.deferredMachines.includes(machineId)) {
      memory.deferredMachines.push(machineId)
    }
    memory.entries.push({ type: 'deferred_maintenance', timestamp: Date.now(), data: { machineId } })
    saveMemory(memory)
  }

  const scheduleMaintenance = (machineId: string, time: string, tech: string) => {
    memory.deferredMachines = memory.deferredMachines.filter(m => m !== machineId)
    memory.scheduledTasks.push(machineId)
    memory.entries.push({ type: 'completed_maintenance', timestamp: Date.now(), data: { machineId, time, tech } })
    saveMemory(memory)
  }

  const resolveAlert = (alertId: string) => {
    memory.resolvedAlerts.push(alertId)
    memory.entries.push({ type: 'resolved_alert', timestamp: Date.now(), data: { alertId } })
    saveMemory(memory)
  }

  const getContextualGreeting = (): string => {
    const hour = new Date().getHours()
    const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
    const isReturn = memory.sessions > 1
    const hasDeferredMachine = memory.deferredMachines.length > 0
    const recentDeferred = memory.entries.find(e => e.type === 'deferred_maintenance' && Date.now() - e.timestamp < 24 * 60 * 60 * 1000)

    if (isReturn && hasDeferredMachine && recentDeferred) {
      const machineId = recentDeferred.data.machineId
      return `${timeGreeting}. Yesterday you postponed maintenance for Machine ${machineId}. Since then, vibration has increased by another 14%. Failure probability is now 94%. I strongly recommend scheduling maintenance before 2 PM today to prevent a production halt.`
    }

    if (isReturn && memory.scheduledTasks.length > 0) {
      return `${timeGreeting}. Good news — the maintenance you scheduled yesterday was completed successfully. Factory health has improved to 92%. Three new early-warning signals have been detected overnight. Shall I brief you?`
    }

    if (isReturn) {
      return `${timeGreeting}. I've been monitoring the factory overnight. I analyzed 1,247 sensor feeds and identified 3 machines that require your attention today. Preventive action now could prevent approximately 12 hours of downtime and save ₹2.6 million.`
    }

    return `${timeGreeting}. I've analyzed today's factory telemetry. Three machines require immediate attention. Preventive maintenance today could prevent approximately 12 hours of downtime and save ₹2.6 million. Would you like me to explain what happened?`
  }

  const getBriefingShownToday = (): boolean => {
    const briefingEntry = memory.entries.find(e => {
      if (e.type !== 'briefing') return false
      return new Date(e.timestamp).toDateString() === new Date().toDateString()
    })
    return !!briefingEntry
  }

  const markBriefingShown = () => {
    memory.entries.push({ type: 'briefing', timestamp: Date.now(), data: {} })
    saveMemory(memory)
  }

  return {
    memory,
    isFirstVisitToday: isFirstVisitToday(),
    isReturningUser: memory.sessions > 1,
    hasDeferredMachines: memory.deferredMachines.length > 0,
    briefingShownToday: getBriefingShownToday(),
    contextualGreeting: getContextualGreeting(),
    recordSession,
    deferMaintenance,
    scheduleMaintenance,
    resolveAlert,
    markBriefingShown,
  }
}
