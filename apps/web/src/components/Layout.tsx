import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <header className="header">
        <nav className="nav">
          <div className="nav-brand">
            <Link to="/">Continente Stamps Share</Link>
          </div>
          <div className="nav-links">
            <Link to="/">Dashboard</Link>
            <Link to="/users">Users</Link>
          </div>
          <div className="nav-user">
            <span>{user?.email}</span>
            <button onClick={handleLogout} className="btn btn-secondary">
              Logout
            </button>
          </div>
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
