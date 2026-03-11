import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="brand-icon">💰</span>
        <span className="brand-text">FinTrack</span>
      </div>

      <div className="navbar-links">
        <NavLink to="/"              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <span className="nav-icon">📊</span> Dashboard
        </NavLink>
        <NavLink to="/transactions"  className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <span className="nav-icon">💸</span> Transactions
        </NavLink>
        <NavLink to="/accounts"      className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <span className="nav-icon">🏦</span> Accounts
        </NavLink>
        <NavLink to="/budgets"       className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <span className="nav-icon">📋</span> Budgets
        </NavLink>
        <NavLink to="/categories"    className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <span className="nav-icon">🏷️</span> Categories
        </NavLink>
      </div>

      <div className="navbar-user">
        <span className="user-greeting">Hi, {user.name?.split(' ')[0]}</span>
        <button className="btn-logout" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}
