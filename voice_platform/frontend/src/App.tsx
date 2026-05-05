import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TTSPage from './pages/TTSPage';
import VoiceClonePage from './pages/VoiceClonePage';
import VoiceDesignPage from './pages/VoiceDesignPage';
import SettingsPage from './pages/SettingsPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import SystemConfig from './pages/admin/SystemConfig';
import UsageAnalytics from './pages/admin/UsageAnalytics';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/conversations/:id" element={<DashboardPage />} />
            <Route path="/tts" element={<TTSPage />} />
            <Route path="/voice-clone" element={<VoiceClonePage />} />
            <Route path="/voice-design" element={<VoiceDesignPage />} />
            <Route path="/settings" element={<SettingsPage />} />

            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/config" element={<SystemConfig />} />
              <Route path="/admin/analytics" element={<UsageAnalytics />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
