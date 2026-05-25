-- Step 5: Setup MySQL Database
-- Initialize the Database
CREATE DATABASE IF NOT EXISTS student_erp;
USE student_erp;

-- Users Table (for authentication and roles)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'student', 'faculty') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students Table
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    enrollment_no VARCHAR(50) UNIQUE NOT NULL,
    department_id INT,
    semester INT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- Faculty Table
CREATE TABLE IF NOT EXISTS faculty (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    department_id INT,
    designation VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    subject VARCHAR(100) NOT NULL,
    attendance_date DATE NOT NULL,
    status ENUM('present', 'absent', 'late') NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Marks Table
CREATE TABLE IF NOT EXISTS marks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    subject VARCHAR(100) NOT NULL,
    marks_obtained DECIMAL(5,2),
    max_marks DECIMAL(5,2),
    semester INT NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Fees Table
CREATE TABLE IF NOT EXISTS fees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    amount_due DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) DEFAULT 0.00,
    status ENUM('paid', 'pending', 'partial') DEFAULT 'pending',
    due_date DATE NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Notices Table
CREATE TABLE IF NOT EXISTS notices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    posted_by INT,
    date_posted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (posted_by) REFERENCES users(id) ON DELETE SET NULL
);
-- Sample Data
INSERT INTO users (username, password, role) VALUES 
('admin_user', '$2b$10$7v6v6v6v6v6v6v6v6v6v6u8v6v6v6v6v6v6v6v6v6v6v6v6v6v6', 'admin'),
('student_john', '$2b$10$7v6v6v6v6v6v6v6v6v6v6u8v6v6v6v6v6v6v6v6v6v6v6v6v6v6', 'student'),
('student_jane', '$2b$10$7v6v6v6v6v6v6v6v6v6v6u8v6v6v6v6v6v6v6v6v6v6v6v6v6v6', 'student'),
('faculty_smith', '$2b$10$7v6v6v6v6v6v6v6v6v6v6u8v6v6v6v6v6v6v6v6v6v6v6v6v6v6', 'faculty');

INSERT INTO departments (name) VALUES ('Computer Science'), ('Electrical'), ('Mechanical');

INSERT INTO students (user_id, name, enrollment_no, department_id, semester) VALUES 
(2, 'John Doe', 'ENR001', 1, 6),
(3, 'Jane Watson', 'ENR002', 2, 4);

INSERT INTO faculty (user_id, name, department_id, designation) VALUES 
(4, 'Dr. Smith', 1, 'Professor');

INSERT INTO attendance (student_id, subject, attendance_date, status) VALUES 
(1, 'Cloud Computing', '2026-05-12', 'present'),
(1, 'Kubernetes', '2026-05-13', 'present'),
(2, 'Circuit Theory', '2026-05-13', 'absent');

INSERT INTO marks (student_id, subject, marks_obtained, max_marks, semester) VALUES 
(1, 'Database Systems', 85, 100, 5),
(1, 'OS', 92, 100, 5),
(2, 'Digital Electronics', 78, 100, 4);

INSERT INTO fees (student_id, amount_due, amount_paid, status, due_date) VALUES 
(1, 50000.00, 25000.00, 'partial', '2026-06-30'),
(2, 45000.00, 45000.00, 'paid', '2026-05-15');

INSERT INTO notices (title, content, posted_by) VALUES 
('Final Exams Schedule', 'Exams will start from June 1st. Check portal for timetable.', 1),
('Lab Submissions', 'Submit your Kubernetes project by May 20th.', 1);
