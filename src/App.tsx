import { HashRouter, Routes, Route } from 'react-router-dom'
import { SyncProvider } from './context/SyncContext'
import { ProfileProvider } from './context/ProfileContext'
import { ToastProvider } from './context/ToastContext'
import { GameProvider } from './context/GameContext'
import Layout from './components/Layout'
import DashboardPage from './features/home/DashboardPage'
import DashboardPrototipo from './features/home/DashboardPrototipo'
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
                {/* Protótipo do layout novo — fora do Layout de propósito,
                    pra comparar lado a lado sem misturar as duas cascas.
                    Remover esta rota (e o arquivo DashboardPrototipo) quando
                    o layout novo for aprovado e espalhado pro resto do app,
                    ou descartado. */}
                <Route path="prototipo" element={<DashboardPrototipo />} />
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
