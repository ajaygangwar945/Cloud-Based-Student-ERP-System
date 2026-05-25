import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Connect to Node.js ERP backend api
      const hostname = window.location.hostname;
      const API_BASE = hostname === 'localhost' || hostname === '127.0.0.1' 
        ? 'http://localhost:5000' 
        : `http://${hostname}:30001`;
      const response = await axios.post(`${API_BASE}/api/login`, {
        username,
        password
      });

      const { token, role } = response.data;
      
      // Save details to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('username', username);

      // Redirect to correct dashboard
      if (role === 'student') {
        navigate('/student');
      } else if (role === 'faculty') {
        navigate('/faculty');
      } else if (role === 'admin') {
        navigate('/admin');
      } else {
        setError('Unknown role returned. Contact system admin.');
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Database connection or API server is offline.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">🎓</div>
          <h1>Student ERP Portal</h1>
          <p>Sign in to access your modules</p>
        </div>

        {error && (
          <div className="badge badge-danger" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.25rem', display: 'block', textAlign: 'center' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              className="form-input"
              placeholder="e.g. student_john or admin_user"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <p>Demo Accounts:</p>
          <p style={{ fontFamily: 'monospace', marginTop: '0.25rem' }}>
            admin_user / password123 <br/>
            student_john / password123 <br/>
            faculty_smith / password123
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
