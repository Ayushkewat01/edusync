import useAuthStore from '../../store/authStore';
import TeacherDashboard from './TeacherDashboard';
import StudentDashboard from './StudentDashboard';

export default function DashboardPage() {
  const { user } = useAuthStore();
  return user?.role === 'teacher' ? <TeacherDashboard /> : <StudentDashboard />;
}
