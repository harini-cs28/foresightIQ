import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import CopilotLanding from './pages/CopilotLanding'
import EndOfDay from './pages/EndOfDay'
import Dashboard from './pages/Dashboard'
import FactoryOverview from './pages/FactoryOverview'
import AICopilot from './pages/AICopilot'
import FailureIntelligence from './pages/FailureIntelligence'
import MaintenancePlanner from './pages/MaintenancePlanner'
import FactoryHeatmap from './pages/FactoryHeatmap'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

function App() {
  return (
    <Routes>
      <Route path="/" element={<CopilotLanding />} />
      <Route path="/end-of-day" element={<EndOfDay />} />
      <Route path="/app" element={<Layout />}>
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="factory-overview" element={<FactoryOverview />} />
        <Route path="copilot" element={<AICopilot />} />
        <Route path="failure-intelligence" element={<FailureIntelligence />} />
        <Route path="maintenance" element={<MaintenancePlanner />} />
        <Route path="heatmap" element={<FactoryHeatmap />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

export default App
