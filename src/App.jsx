import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Account from './pages/Account'
import ChangePassword from './pages/ChangePassword'
import AutoEvaluation from './pages/AutoEvaluation'
import AdminDashboard from './pages/AdminDashboard'
import StudentRegistration from './pages/StudentRegistration'



function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/account" element={<Account />} />
      <Route path="/change-password" element={<ChangePassword />} />
      <Route path="/auto-evaluation" element={<AutoEvaluation />} />
      <Route path="/student-registration" element={<StudentRegistration />} />
      </Routes>
  )
}

export default App
