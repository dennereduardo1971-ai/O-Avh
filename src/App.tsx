import { HashRouter, Routes, Route } from 'react-router-dom'
import { ProfileProvider } from './context/ProfileContext'
import Layout from './components/Layout'
import HomePage from './features/home/HomePage'
import MessagesPage from './features/messages/MessagesPage'
import FinancePage from './features/finance/FinancePage'
import TasksPage from './features/tasks/TasksPage'
import LeisurePage from './features/leisure/LeisurePage'
import FunPage from './features/fun/FunPage'
import SettingsPage from './features/settings/SettingsPage'

export default function App() {
  return (
    <ProfileProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="mensagens" element={<MessagesPage />} />
            <Route path="financas" element={<FinancePage />} />
            <Route path="tarefas" element={<TasksPage />} />
            <Route path="lazer" element={<LeisurePage />} />
            <Route path="diversao" element={<FunPage />} />
            <Route path="config" element={<SettingsPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </ProfileProvider>
  )
}
