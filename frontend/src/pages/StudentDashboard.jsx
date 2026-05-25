import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StudentDashboard = () => {
  const hostname = window.location.hostname;
  const API_BASE = hostname === 'localhost' || hostname === '127.0.0.1' 
    ? 'http://localhost:5000' 
    : `http://${hostname}:30001`;
  const [profile, setProfile] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [marks, setMarks] = useState([]);
  const [fees, setFees] = useState(null);
  const [notices, setNotices] = useState([]);
  const [payAmount, setPayAmount] = useState('');
  const [paySuccess, setPaySuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  const fetchDashboardData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // Make API calls in parallel
      const [profileRes, attendanceRes, marksRes, feesRes, noticesRes] = await Promise.all([
        axios.get(`${API_BASE}/api/students`, { headers }),
        axios.get(`${API_BASE}/api/attendance`, { headers }),
        axios.get(`${API_BASE}/api/marks`, { headers }),
        axios.get(`${API_BASE}/api/fees`, { headers }),
        axios.get(`${API_BASE}/api/notices`)
      ]);

      if (profileRes.data && profileRes.data.length > 0) {
        setProfile(profileRes.data[0]);
      }
      setAttendance(attendanceRes.data);
      setMarks(marksRes.data);
      if (feesRes.data && feesRes.data.length > 0) {
        setFees(feesRes.data[0]);
      }
      setNotices(noticesRes.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching student dashboard:', err);
      setError('Could not connect to ERP backend. Please ensure the API server and MySQL database are running.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!payAmount || parseFloat(payAmount) <= 0) return;

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post(
        `${API_BASE}/api/fees/pay`,
        { amount: parseFloat(payAmount) },
        { headers }
      );

      setPaySuccess(`Successfully paid ₹${payAmount}!`);
      setPayAmount('');
      
      // Refresh fee data
      const feesRes = await axios.get(`${API_BASE}/api/fees`, { headers });
      if (feesRes.data && feesRes.data.length > 0) {
        setFees(feesRes.data[0]);
      }

      setTimeout(() => setPaySuccess(''), 4000);
    } catch (err) {
      console.error('Payment error:', err);
      alert('Simulated payment failed. Check backend log.');
    }
  };

  // Helper to calculate attendance percentage
  const calculateAttendanceRate = () => {
    if (attendance.length === 0) return 0;
    const present = attendance.filter(a => a.status === 'present').length;
    return Math.round((present / attendance.length) * 100);
  };

  const attendanceRate = calculateAttendanceRate();

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <h2>⏳ Loading Student Portal...</h2>
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
        <h1>Welcome Back, {profile ? profile.name : 'Student'}!</h1>
        <p>Enrollment: <strong>{profile ? profile.enrollment_no : 'N/A'}</strong> | Semester: <strong>{profile ? profile.semester : 'N/A'}</strong></p>
      </div>

      {/* Stats Widgets */}
      <div className="stats-grid">
        <div className="stat-card stat-primary">
          <div className="stat-info">
            <h4>Attendance Rate</h4>
            <div className="stat-value">{attendanceRate}%</div>
          </div>
          <div className="stat-icon">📊</div>
        </div>

        <div className="stat-card stat-secondary">
          <div className="stat-info">
            <h4>Enrolled Course</h4>
            <div className="stat-value" style={{ fontSize: '1.25rem', whiteSpace: 'nowrap' }}>
              {profile ? profile.department_name : 'Computer Science'}
            </div>
          </div>
          <div className="stat-icon">🏛️</div>
        </div>

        <div className="stat-card stat-success">
          <div className="stat-info">
            <h4>Outstanding Fees</h4>
            <div className="stat-value">
              ₹{fees ? (parseFloat(fees.amount_due) - parseFloat(fees.amount_paid)).toLocaleString() : '0'}
            </div>
          </div>
          <div className="stat-icon">💰</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
        {/* Academic Profile & Grades */}
        <div className="card">
          <h2>📝 Academic Performance</h2>
          <p style={{ marginBottom: '1.5rem' }}>Grades transcript for current and previous semesters.</p>
          
          {marks.length === 0 ? (
            <p>No academic grades recorded yet.</p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Semester</th>
                    <th>Score Obtained</th>
                    <th>Max Limit</th>
                    <th>Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {marks.map(mark => {
                    const pct = (mark.marks_obtained / mark.max_marks) * 100;
                    let badgeClass = 'badge-danger';
                    if (pct >= 80) badgeClass = 'badge-success';
                    else if (pct >= 50) badgeClass = 'badge-warning';

                    return (
                      <tr key={mark.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{mark.subject}</td>
                        <td>Sem {mark.semester}</td>
                        <td>{mark.marks_obtained}</td>
                        <td>{mark.max_marks}</td>
                        <td>
                          <span className={`badge ${badgeClass}`}>
                            {pct >= 85 ? 'Outstanding' : pct >= 70 ? 'First Div' : pct >= 50 ? 'Average' : 'Fail'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Notices Board */}
        <div className="card">
          <h2>📢 Announcements</h2>
          <p style={{ marginBottom: '1.5rem' }}>Latest college notices and campus warnings.</p>
          
          {notices.length === 0 ? (
            <p>No active public notices.</p>
          ) : (
            <div className="notice-list">
              {notices.slice(0, 3).map(notice => (
                <div key={notice.id} className="notice-item">
                  <div className="notice-header">
                    <h3>{notice.title}</h3>
                  </div>
                  <p style={{ fontSize: '0.9rem' }}>{notice.content}</p>
                  <div className="notice-meta">Posted on {new Date(notice.date_posted).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Attendance Grid */}
        <div className="card">
          <h2>📅 Attendance History</h2>
          <p style={{ marginBottom: '1.5rem' }}>Log of subject lectures attended.</p>

          {attendance.length === 0 ? (
            <p>No attendance registers captured yet.</p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Lecture Subject</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map(att => (
                    <tr key={att.id}>
                      <td>{new Date(att.attendance_date).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{att.subject}</td>
                      <td>
                        <span className={`badge ${
                          att.status === 'present' ? 'badge-success' : att.status === 'absent' ? 'badge-danger' : 'badge-warning'
                        }`}>
                          {att.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Fee Management */}
        <div className="card">
          <h2>💳 Fee Statements</h2>
          <p style={{ marginBottom: '1.5rem' }}>Track outstanding college fees and clear dues securely.</p>

          {!fees ? (
            <p>No active fee allocations defined.</p>
          ) : (
            <div>
              <div style={{ padding: '1.25rem', backgroundColor: 'rgba(99,102,241,0.03)', borderRadius: '12px', border: '1px dashed var(--border)', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Total Bill Amount:</span>
                  <strong>₹{parseFloat(fees.amount_due).toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Amount Credited:</span>
                  <span style={{ color: 'var(--success)' }}>₹{parseFloat(fees.amount_paid).toLocaleString()}</span>
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0.5rem 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 700 }}>
                  <span>Unpaid Balance:</span>
                  <span style={{ color: fees.status === 'paid' ? 'var(--success)' : 'var(--danger)' }}>
                    ₹{(parseFloat(fees.amount_due) - parseFloat(fees.amount_paid)).toLocaleString()}
                  </span>
                </div>
                <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Payment Condition:</span>
                  <span className={`badge ${
                    fees.status === 'paid' ? 'badge-success' : fees.status === 'partial' ? 'badge-warning' : 'badge-danger'
                  }`}>
                    {fees.status}
                  </span>
                </div>
              </div>

              {fees.status !== 'paid' && (
                <form onSubmit={handlePayment}>
                  {paySuccess && (
                    <div className="badge badge-success" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', display: 'block', textAlign: 'center' }}>
                      🎉 {paySuccess}
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="amount">Payable Value (INR)</label>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <input
                        type="number"
                        id="amount"
                        className="form-input"
                        placeholder="e.g. 5000"
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        max={parseFloat(fees.amount_due) - parseFloat(fees.amount_paid)}
                        required
                      />
                      <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                        Simulate Payment
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
