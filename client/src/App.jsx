import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AIChat from './components/AIChat';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Accounts from './pages/Accounts';
import Budgets from './pages/Budgets';
import Categories from './pages/Categories';
import './index.css';

function AppRoutes() {
  const { user } = useAuth();

  return (
    <>
      <Navbar />
      {/* Offset content for desktop sidebar (w-60) and mobile top bar (h-14) */}
      <main className={`${user ? 'md:ml-60 pt-14 md:pt-0' : ''} min-h-screen`}>
        <Routes>
          <Route path="/login"    element={user ? <Navigate to="/" /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
          <Route path="/"             element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
          <Route path="/accounts"     element={<ProtectedRoute><Accounts /></ProtectedRoute>} />
          <Route path="/budgets"      element={<ProtectedRoute><Budgets /></ProtectedRoute>} />
          <Route path="/categories"   element={<ProtectedRoute><Categories /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      {/* AI Chat bubble — only shown when logged in */}
      {user && <AIChat />}
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
