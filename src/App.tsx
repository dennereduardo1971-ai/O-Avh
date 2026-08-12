import { HashRouter, Routes, Route } from 'react-router-dom'
import { SyncProvider } from './context/SyncContext'
import { ProfileProvider } from './context/ProfileContext'
import { ToastProvider } from './context/ToastContext'
import { GameProvider } from './context/GameContext'
import Layout from './components/Layout'
import DashboardPage from './features/home/DashboardPage'
import MessagesPage from './features/messages/MessagesPage'
import FinancePage from './features/finance/FinancePage'
import TasksPage from './features/tasks/TasksPage'
import LeisurePage from './features/leisure/LeisurePage'
import FunPage from './features/fun/FunPage'
import ZenPage from './features/zen/ZenPage'
import AchievementsPage from './features/achievements/AchievementsPage'
import SettingsPage from './features/settings/SettingsPage'

export default function App() {
  return (
    <SyncProvider>
      <ProfileProvider>
        <ToastProvider>
          <GameProvider>
            <HashRouter>
              <Routes>
                <Route element={<Layout />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="mensagens" element={<MessagesPage />} />
                  <Route path="financas" element={<FinancePage />} />
                  <Route path="tarefas" element={<TasksPage />} />
                  <Route path="lazer" element={<LeisurePage />} />
                  <Route path="diversao" element={<FunPage />} />
                  <Route path="calma" element={<ZenPage />} />
                  <Route path="conquistas" element={<AchievementsPage />} />
                  <Route path="config" element={<SettingsPage />} />
                </Route>
              </Routes>
            </HashRouter>
          </GameProvider>
        </ToastProvider>
      </ProfileProvider>
    </SyncProvider>
  )
}
