import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import AttendancePage from './pages/attendance/AttendancePage';
import AssignmentListPage from './pages/assignments/AssignmentListPage';
import AnnouncementsPage from './pages/communication/AnnouncementsPage';
import ClassesPage from './pages/classes/ClassesPage';
import AIAssistantPage from './pages/ai/AIAssistantPage';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/classes" element={<ClassesPage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/assignments" element={<AssignmentListPage />} />
          <Route path="/announcements" element={<AnnouncementsPage />} />
          <Route path="/ai-assistant" element={<AIAssistantPage />} />
        </Route>

        {/* Redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
