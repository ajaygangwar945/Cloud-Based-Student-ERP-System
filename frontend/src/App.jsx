import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import AdminDashboard from './pages/AdminDashboard';

// Custom Navigation Bar
const NavigationBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const username = localStorage.getItem('username');

  // Do not show navbar on the login page
  if (location.pathname === '/' || !token) return null;

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        <span>🎓</span> Cloud ERP System
      </Link>
      <ul className="nav-links">
        {role === 'student' && (
          <li>
            <Link to="/student" className={`nav-link ${location.pathname === '/student' ? 'active' : ''}`}>
              Student Portal
            </Link>
          </li>
        )}
        {role === 'faculty' && (
          <li>
            <Link to="/faculty" className={`nav-link ${location.pathname === '/faculty' ? 'active' : ''}`}>
              Faculty Portal
            </Link>
          </li>
        )}
        {role === 'admin' && (
          <li>
            <Link to="/admin" className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}>
              Admin Workspace
            </Link>
          </li>
        )}
        <li style={{ marginLeft: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Signed in as <strong>{username}</strong> ({role})
          </span>
          <button onClick={handleLogout} className="logout-btn">
            🚪 Logout
          </button>
        </li>
      </ul>
    </nav>
  );
};

// Route Protector Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) {
    // If not authenticated, redirect to Login
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // If authenticated but wrong role, redirect to appropriate role portal or login
    if (role === 'student') return <Navigate to="/student" replace />;
    if (role === 'faculty') return <Navigate to="/faculty" replace />;
    if (role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <NavigationBar />
        <Routes>
          {/* Public login route */}
          <Route path="/" element={<Login />} />

          {/* Secure Student Dashboard */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          {/* Secure Faculty Dashboard */}
          <Route
            path="/faculty"
            element={
              <ProtectedRoute allowedRoles={['faculty']}>
                <FacultyDashboard />
              </ProtectedRoute>
            }
          />

          {/* Secure Admin Dashboard */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
