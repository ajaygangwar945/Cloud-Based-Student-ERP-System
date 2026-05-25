import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FacultyDashboard = () => {
  const hostname = window.location.hostname;
  const API_BASE = hostname === 'localhost' || hostname === '127.0.0.1' 
    ? 'http://localhost:5000' 
    : `http://${hostname}:30001`;
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Attendance Form State
  const [attStudentId, setAttStudentId] = useState('');
  const [attSubject, setAttSubject] = useState('Cloud Computing');
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [attStatus, setAttStatus] = useState('present');
  const [attSuccess, setAttSuccess] = useState('');

  // Marks Form State
  const [markStudentId, setMarkStudentId] = useState('');
  const [markSubject, setMarkSubject] = useState('Cloud Computing');
  const [markObtained, setMarkObtained] = useState('');
  const [markMax, setMarkMax] = useState('100');
  const [markSem, setMarkSem] = useState('6');
  const [markSuccess, setMarkSuccess] = useState('');

  const token = localStorage.getItem('token');

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_BASE}/api/students`, { headers });
      setStudents(res.data);
      if (res.data.length > 0) {
        setAttStudentId(res.data[0].id);
        setMarkStudentId(res.data[0].id);
      }
      setLoading(false);
    } catch (err) {
      console.error('Faculty fetch error:', err);
      setError('Could not connect to ERP backend. Verify Node API is online.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    if (!attStudentId || !attSubject || !attDate || !attStatus) return;

    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(
        `${API_BASE}/api/attendance`,
        {
          student_id: parseInt(attStudentId),
          subject: attSubject,
          attendance_date: attDate,
          status: attStatus
        },
        { headers }
      );
      setAttSuccess('Attendance logged successfully!');
      setTimeout(() => setAttSuccess(''), 4000);
    } catch (err) {
      console.error('Attendance post error:', err);
      alert('Failed to mark attendance. Check backend console logs.');
    }
  };

  const handleUploadMarks = async (e) => {
    e.preventDefault();
    if (!markStudentId || !markSubject || !markObtained || !markMax || !markSem) return;

    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(
        `${API_BASE}/api/marks`,
        {
          student_id: parseInt(markStudentId),
          subject: markSubject,
          marks_obtained: parseFloat(markObtained),
          max_marks: parseFloat(markMax),
          semester: parseInt(markSem)
        },
        { headers }
      );
      setMarkSuccess('Marks uploaded successfully!');
      setMarkObtained('');
      setTimeout(() => setMarkSuccess(''), 4000);
    } catch (err) {
      console.error('Marks post error:', err);
      alert('Failed to upload marks. Check backend console logs.');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <h2>⏳ Loading Faculty Workspace...</h2>
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
        <h1>Faculty Administration Hub</h1>
        <p>Log student class attendance registries and upload mid/end term grades dynamically.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Mark Attendance */}
        <div className="card">
          <h2>📅 Lecture Attendance Register</h2>
          <p style={{ marginBottom: '1.5rem' }}>Log lecture presence status for any enrolled student.</p>

          {attSuccess && (
            <div className="badge badge-success" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', display: 'block', textAlign: 'center' }}>
              🎉 {attSuccess}
            </div>
          )}

          <form onSubmit={handleMarkAttendance}>
            <div className="form-group">
              <label htmlFor="att_student">Select Student</label>
              <select
                id="att_student"
                className="form-select"
                value={attStudentId}
                onChange={(e) => setAttStudentId(e.target.value)}
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.enrollment_no})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="att_subject">Subject</label>
              <input
                type="text"
                id="att_subject"
                className="form-input"
                value={attSubject}
                onChange={(e) => setAttSubject(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="att_date">Lecture Date</label>
              <input
                type="date"
                id="att_date"
                className="form-input"
                value={attDate}
                onChange={(e) => setAttDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Attendance Status</label>
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontWeight: 500 }}>
                  <input
                    type="radio"
                    name="att_status"
                    value="present"
                    checked={attStatus === 'present'}
                    onChange={() => setAttStatus('present')}
                  />
                  🟢 Present
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontWeight: 500 }}>
                  <input
                    type="radio"
                    name="att_status"
                    value="absent"
                    checked={attStatus === 'absent'}
                    onChange={() => setAttStatus('absent')}
                  />
                  🔴 Absent
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontWeight: 500 }}>
                  <input
                    type="radio"
                    name="att_status"
                    value="late"
                    checked={attStatus === 'late'}
                    onChange={() => setAttStatus('late')}
                  />
                  🟡 Late
                </label>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              Submit Attendance Status
            </button>
          </form>
        </div>

        {/* Upload Marks */}
        <div className="card">
          <h2>📝 Upload Grade Marks</h2>
          <p style={{ marginBottom: '1.5rem' }}>Release marks and performance grades for course subjects.</p>

          {markSuccess && (
            <div className="badge badge-success" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', display: 'block', textAlign: 'center' }}>
              🎉 {markSuccess}
            </div>
          )}

          <form onSubmit={handleUploadMarks}>
            <div className="form-group">
              <label htmlFor="mark_student">Select Student</label>
              <select
                id="mark_student"
                className="form-select"
                value={markStudentId}
                onChange={(e) => setMarkStudentId(e.target.value)}
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.enrollment_no})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="mark_subject">Course Subject</label>
              <input
                type="text"
                id="mark_subject"
                className="form-input"
                value={markSubject}
                onChange={(e) => setMarkSubject(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="mark_obtained">Marks Obtained</label>
                <input
                  type="number"
                  id="mark_obtained"
                  className="form-input"
                  placeholder="e.g. 85"
                  value={markObtained}
                  onChange={(e) => setMarkObtained(e.target.value)}
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="mark_max">Maximum Marks</label>
                <input
                  type="number"
                  id="mark_max"
                  className="form-input"
                  value={markMax}
                  onChange={(e) => setMarkMax(e.target.value)}
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="mark_sem">Academic Semester</label>
              <select
                id="mark_sem"
                className="form-select"
                value={markSem}
                onChange={(e) => setMarkSem(e.target.value)}
              >
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
                <option value="3">Semester 3</option>
                <option value="4">Semester 4</option>
                <option value="5">Semester 5</option>
                <option value="6">Semester 6</option>
                <option value="7">Semester 7</option>
                <option value="8">Semester 8</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              Upload Subject Grade
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;
