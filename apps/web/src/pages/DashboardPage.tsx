import { useAuth } from '../context/AuthContext';

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="dashboard-page">
      <h1>Dashboard</h1>
      <div className="welcome-card">
        <h2>Welcome, {user?.name || user?.email}!</h2>
        <p>You are logged in as <strong>{user?.role}</strong></p>
      </div>
    </div>
  );
}
