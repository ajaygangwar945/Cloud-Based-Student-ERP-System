const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '2112',
  database: process.env.DB_NAME || 'student_erp'
});

connection.connect((err) => {
  if (err) {
    console.error("❌ Seeding database connection failed:", err.message);
    process.exit(1);
  }
  
  console.log("Seeding dummy data into database...");

  const seedQueries = [
    // Users
    `INSERT IGNORE INTO users (id, username, password, role) VALUES 
      (1, 'admin_user', 'password123', 'admin'), 
      (2, 'student_john', 'password123', 'student'),
      (3, 'student_jane', 'password123', 'student'),
      (4, 'faculty_smith', 'password123', 'faculty')`,
    
    // Departments
    `INSERT IGNORE INTO departments (id, name) VALUES 
      (1, 'Computer Science'),
      (2, 'Electrical'),
      (3, 'Mechanical')`,
    
    // Students
    `INSERT IGNORE INTO students (id, user_id, name, enrollment_no, department_id, semester) VALUES 
      (1, 2, 'John Doe', 'ENR001', 1, 6),
      (2, 3, 'Jane Watson', 'ENR002', 2, 4)`,
    
    // Faculty
    `INSERT IGNORE INTO faculty (id, user_id, name, department_id, designation) VALUES 
      (1, 4, 'Dr. Smith', 1, 'Professor')`,
    
    // Attendance
    `INSERT IGNORE INTO attendance (id, student_id, subject, attendance_date, status) VALUES 
      (1, 1, 'Cloud Computing', '2026-05-12', 'present'),
      (2, 1, 'Kubernetes', '2026-05-13', 'present'),
      (3, 2, 'Circuit Theory', '2026-05-13', 'absent')
      ON DUPLICATE KEY UPDATE id=id`,

    // Marks
    `INSERT IGNORE INTO marks (id, student_id, subject, marks_obtained, max_marks, semester) VALUES 
      (1, 1, 'Database Systems', 85, 100, 5),
      (2, 1, 'OS', 92, 100, 5),
      (3, 2, 'Digital Electronics', 78, 100, 4)
      ON DUPLICATE KEY UPDATE id=id`,

    // Fees
    `INSERT IGNORE INTO fees (id, student_id, amount_due, amount_paid, status, due_date) VALUES 
      (1, 1, 50000.00, 25000.00, 'partial', '2026-06-30'),
      (2, 2, 45000.00, 45000.00, 'paid', '2026-05-15')
      ON DUPLICATE KEY UPDATE id=id`,

    // Notices
    `INSERT IGNORE INTO notices (id, title, content, posted_by) VALUES 
      (1, 'Final Exams Schedule', 'Exams will start from June 1st. Check portal for timetable.', 1),
      (2, 'Lab Submissions', 'Submit your Kubernetes project by May 20th.', 1)`
  ];

  let completed = 0;
  seedQueries.forEach((query, idx) => {
    connection.query(query, (error) => {
      if (error) {
        console.error(`Error executing seed query #${idx + 1}:`, error.message);
      }
      completed++;
      if (completed === seedQueries.length) {
        console.log("✅ Dummy data inserted successfully!");
        connection.end();
      }
    });
  });
});
