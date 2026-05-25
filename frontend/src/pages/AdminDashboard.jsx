import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
  const hostname = window.location.hostname;
  const API_BASE = hostname === 'localhost' || hostname === '127.0.0.1' 
    ? 'http://localhost:5000' 
    : `http://${hostname}:30001`;
  const [stats, setStats] = useState({ students: 0, faculty: 0, departments: 0 });
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Post Notice Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [success, setSuccess] = useState('');

  const token = localStorage.getItem('token');

  const fetchAdminData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const [statsRes, noticesRes] = await Promise.all([
        axios.get(`${API_BASE}/api/stats`, { headers }),
        axios.get(`${API_BASE}/api/notices`)
      ]);

      setStats(statsRes.data);
      setNotices(noticesRes.data);
      setLoading(false);
    } catch (err) {
      console.error('Admin fetch error:', err);
      setError('Could not connect to ERP backend. Verify API server and database pool are running.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handlePostNotice = async (e) => {
    e.preventDefault();
    if (!title || !content) return;

    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(
        `${API_BASE}/api/notices`,
        { title, content },
        { headers }
      );
      setSuccess('Notice published successfully!');
      setTitle('');
      setContent('');
      
      // Refresh notices
      const res = await axios.get(`${API_BASE}/api/notices`);
      setNotices(res.data);

      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Post notice error:', err);
      alert('Failed to post notice. Check backend log.');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <h2>⏳ Loading System Workspace...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '3rem', maxWidth: '600px', margin: '0 auto' }}>
        <div className="card" style={{ padding: '2rem', borderLeft: '4px solid var(--danger)' }}>
          <h2 style={{ color: 'var(--danger)' }}>⚠️ API Offline</h2>
          <p style={{ marginTop: '0.5rem' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div style={{ marginBottom: '2.5rem' }}>
        <h1>Administrative Command Console</h1>
        <p>Monitor system enrollment statistics and broadcast official university notices globally.</p>
      </div>

      {/* Stats Widgets */}
      <div className="stats-grid">
        <div className="stat-card stat-primary">
          <div className="stat-info">
            <h4>Total Enrolled Students</h4>
            <div className="stat-value">{stats.students}</div>
          </div>
          <div className="stat-icon">👨‍🎓</div>
        </div>

        <div className="stat-card stat-secondary">
          <div className="stat-info">
            <h4>Active Faculty Members</h4>
            <div className="stat-value">{stats.faculty}</div>
          </div>
          <div className="stat-icon">👨‍🏫</div>
        </div>

        <div className="stat-card stat-success">
          <div className="stat-info">
            <h4>Academic Departments</h4>
            <div className="stat-value">{stats.departments}</div>
          </div>
          <div className="stat-icon">🏛️</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '2rem' }}>
        {/* Publish Announcement Card */}
        <div className="card">
          <h2>📢 Broadcast Public Announcement</h2>
          <p style={{ marginBottom: '1.5rem' }}>Publish new notices visible to all student portals instantly.</p>

          {success && (
            <div className="badge badge-success" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', display: 'block', textAlign: 'center' }}>
              🎉 {success}
            </div>
          )}

          <form onSubmit={handlePostNotice}>
            <div className="form-group">
              <label htmlFor="title">Notice Title</label>
              <input
                type="text"
                id="title"
                className="form-input"
                placeholder="e.g. End Semester Schedule Release"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="content">Notice Content Details</label>
              <textarea
                id="content"
                className="form-textarea"
                rows="6"
                placeholder="Write announcement body message here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              Publish Announcement Notice
            </button>
          </form>
        </div>

        {/* Notices Registry Log */}
        <div className="card">
          <h2>📝 Active Announcements Registry</h2>
          <p style={{ marginBottom: '1.5rem' }}>Historical record of announcements currently active in the database.</p>

          {notices.length === 0 ? (
            <p>No active notices in database.</p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date Posted</th>
                    <th>Announcement Title</th>
                    <th>Detail Summary</th>
                    <th>Posted By ID</th>
                  </tr>
                </thead>
                <tbody>
                  {notices.map(notice => (
                    <tr key={notice.id}>
                      <td>{new Date(notice.date_posted).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{notice.title}</td>
                      <td style={{ fontSize: '0.85rem' }}>{notice.content}</td>
                      <td>User {notice.posted_by || '1'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
