const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const client = require('prom-client');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

// Create a Registry which registers the metrics
const register = new client.Registry();

// Add a default label which is added to all metrics
client.collectDefaultMetrics({ register });

// Create a custom gauge for active users (demo purpose)
const activeUsers = new client.Gauge({
    name: 'erp_active_users_total',
    help: 'The total number of active users in the ERP system',
});
register.registerMetric(activeUsers);
activeUsers.set(125); 

// Simulate traffic spikes for the dashboard
let userCount = 125;
setInterval(() => {
    userCount += Math.floor(Math.random() * 21) - 10; // Change by -10 to +10
    if (userCount < 50) userCount = 50;
    if (userCount > 500) userCount = 500;
    activeUsers.set(userCount);
}, 3000);

// Database connection pool (much more resilient than single connections)
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '2112',
  database: process.env.DB_NAME || 'student_erp',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test the connection pool on startup
db.getConnection((err, conn) => {
  if (err) {
    console.error('⚠️ Database connection failed: ' + err.message);
  } else {
    console.log('✅ Connected to MySQL database pool.');
    conn.release();
  }
});

// Basic route
app.get('/', (req, res) => {
    res.send('Cloud-Based Student ERP API is running...');
});

// Security Phase: JWT Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(401).json({ message: 'Invalid credentials' });
        
        const user = results[0];
        
        // Safe password verification (Plaintext fallback + BCrypt comparison)
        let isMatch = false;
        if (password === user.password) {
            isMatch = true;
        } else {
            try {
                isMatch = bcrypt.compareSync(password, user.password);
            } catch (e) {
                isMatch = false;
            }
        }
        
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT Token
        const token = jwt.sign({ id: user.id, role: user.role, username: user.username }, JWT_SECRET, { expiresIn: '2h' });
        res.json({ message: 'Login successful', token, role: user.role, username: user.username });
    });
});

// Middleware for JWT Protection
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access Denied: Missing Token' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid Token' });
        req.user = user;
        next();
    });
};

// --- API ROUTES ---

// 1. Get profile (student profile or all students)
app.get('/api/students', authenticateToken, (req, res) => {
    const { id, role } = req.user;
    if (role === 'student') {
        db.query(
            'SELECT s.*, u.username, d.name AS department_name FROM students s JOIN users u ON s.user_id = u.id LEFT JOIN departments d ON s.department_id = d.id WHERE s.user_id = ?', 
            [id], 
            (err, results) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(results);
            }
        );
    } else {
        // Faculty / Admin get all students
        db.query(
            'SELECT s.*, d.name AS department_name FROM students s LEFT JOIN departments d ON s.department_id = d.id', 
            (err, results) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(results);
            }
        );
    }
});

// 2. Attendance Routes
app.get('/api/attendance', authenticateToken, (req, res) => {
    const { id, role } = req.user;
    if (role === 'student') {
        db.query('SELECT id FROM students WHERE user_id = ?', [id], (err, students) => {
            if (err) return res.status(500).json({ error: err.message });
            if (students.length === 0) return res.status(404).json({ message: 'Student profile not found' });
            
            db.query('SELECT * FROM attendance WHERE student_id = ? ORDER BY attendance_date DESC', [students[0].id], (err, results) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(results);
            });
        });
    } else {
        // Faculty/Admin can view all attendance
        db.query('SELECT a.*, s.name AS student_name FROM attendance a JOIN students s ON a.student_id = s.id ORDER BY a.attendance_date DESC', (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
    }
});

app.post('/api/attendance', authenticateToken, (req, res) => {
    const { role } = req.user;
    if (role !== 'faculty' && role !== 'admin') {
        return res.status(403).json({ message: 'Access denied: Faculty or Admin role required' });
    }
    const { student_id, subject, attendance_date, status } = req.body;
    if (!student_id || !subject || !attendance_date || !status) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    db.query(
        'INSERT INTO attendance (student_id, subject, attendance_date, status) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE status = ?',
        [student_id, subject, attendance_date, status, status],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Attendance marked successfully', id: result.insertId });
        }
    );
});

// 3. Marks Routes
app.get('/api/marks', authenticateToken, (req, res) => {
    const { id, role } = req.user;
    if (role === 'student') {
        db.query('SELECT id FROM students WHERE user_id = ?', [id], (err, students) => {
            if (err) return res.status(500).json({ error: err.message });
            if (students.length === 0) return res.status(404).json({ message: 'Student profile not found' });
            
            db.query('SELECT * FROM marks WHERE student_id = ? ORDER BY semester DESC, subject ASC', [students[0].id], (err, results) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(results);
            });
        });
    } else {
        // Faculty/Admin can view all marks
        db.query('SELECT m.*, s.name AS student_name FROM marks m JOIN students s ON m.student_id = s.id ORDER BY s.name ASC, m.semester DESC', (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
    }
});

app.post('/api/marks', authenticateToken, (req, res) => {
    const { role } = req.user;
    if (role !== 'faculty' && role !== 'admin') {
        return res.status(403).json({ message: 'Access denied: Faculty or Admin role required' });
    }
    const { student_id, subject, marks_obtained, max_marks, semester } = req.body;
    if (!student_id || !subject || marks_obtained === undefined || !max_marks || !semester) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    db.query(
        'INSERT INTO marks (student_id, subject, marks_obtained, max_marks, semester) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE marks_obtained = ?, max_marks = ?',
        [student_id, subject, marks_obtained, max_marks, semester, marks_obtained, max_marks],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Marks uploaded successfully', id: result.insertId });
        }
    );
});

// 4. Fees Routes
app.get('/api/fees', authenticateToken, (req, res) => {
    const { id, role } = req.user;
    if (role === 'student') {
        db.query('SELECT id FROM students WHERE user_id = ?', [id], (err, students) => {
            if (err) return res.status(500).json({ error: err.message });
            if (students.length === 0) return res.status(404).json({ message: 'Student profile not found' });
            
            db.query('SELECT * FROM fees WHERE student_id = ?', [students[0].id], (err, results) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(results);
            });
        });
    } else {
        // Admin/Faculty can view all fees
        db.query('SELECT f.*, s.name AS student_name FROM fees f JOIN students s ON f.student_id = s.id', (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
    }
});

app.post('/api/fees/pay', authenticateToken, (req, res) => {
    const { id, role } = req.user;
    if (role !== 'student') {
        return res.status(403).json({ message: 'Only students can pay their fees' });
    }
    const { amount } = req.body;
    if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Invalid payment amount' });
    }
    
    db.query('SELECT id FROM students WHERE user_id = ?', [id], (err, students) => {
        if (err) return res.status(500).json({ error: err.message });
        if (students.length === 0) return res.status(404).json({ message: 'Student profile not found' });
        
        const studentId = students[0].id;
        db.query('SELECT * FROM fees WHERE student_id = ?', [studentId], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.length === 0) return res.status(404).json({ message: 'Fee record not found' });
            
            const fee = results[0];
            const newPaid = parseFloat(fee.amount_paid) + parseFloat(amount);
            let newStatus = 'pending';
            if (newPaid >= parseFloat(fee.amount_due)) {
                newStatus = 'paid';
            } else if (newPaid > 0) {
                newStatus = 'partial';
            }
            
            db.query(
                'UPDATE fees SET amount_paid = ?, status = ? WHERE student_id = ?',
                [newPaid, newStatus, studentId],
                (err, updateResult) => {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ message: 'Payment simulated successfully', amount_paid: newPaid, status: newStatus });
                }
            );
        });
    });
});

// 5. Notices Routes (Public fetch, Admin/Faculty write)
app.get('/api/notices', (req, res) => {
    db.query('SELECT * FROM notices ORDER BY date_posted DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/notices', authenticateToken, (req, res) => {
    const { id, role } = req.user;
    if (role !== 'admin' && role !== 'faculty') {
        return res.status(403).json({ message: 'Access denied: Admin or Faculty role required' });
    }
    const { title, content } = req.body;
    if (!title || !content) {
        return res.status(400).json({ message: 'Title and content are required' });
    }
    db.query(
        'INSERT INTO notices (title, content, posted_by) VALUES (?, ?, ?)',
        [title, content, id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Notice posted successfully', id: result.insertId });
        }
    );
});

// 6. Admin System Stats Dashboard Route
app.get('/api/stats', authenticateToken, (req, res) => {
    const { role } = req.user;
    if (role !== 'admin') {
        return res.status(403).json({ message: 'Access denied: Admins only' });
    }
    db.query('SELECT COUNT(*) AS student_count FROM students', (err, sRes) => {
        if (err) return res.status(500).json({ error: err.message });
        db.query('SELECT COUNT(*) AS faculty_count FROM faculty', (err, fRes) => {
            if (err) return res.status(500).json({ error: err.message });
            db.query('SELECT COUNT(*) AS dept_count FROM departments', (err, dRes) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({
                    students: sRes[0].student_count,
                    faculty: fRes[0].faculty_count,
                    departments: dRes[0].dept_count
                });
            });
        });
    });
});

// Metrics Endpoint for Prometheus
app.get('/metrics', async (req, res) => {
    res.setHeader('Content-Type', register.contentType);
    res.send(await register.metrics());
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
