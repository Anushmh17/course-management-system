USE course_management;

-- Reset tables safely (avoids error #1701 in phpMyAdmin/InnoDB)
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM enrollments;
DELETE FROM courses;
DELETE FROM users;
ALTER TABLE enrollments AUTO_INCREMENT = 1;
ALTER TABLE courses AUTO_INCREMENT = 1;
ALTER TABLE users AUTO_INCREMENT = 1;
SET FOREIGN_KEY_CHECKS = 1;


-- Seed Users
INSERT INTO users
(id, username, password, full_name, role)
VALUES
(
    1,
    'admin',
    '$2b$10$C5S4lHqwweU5DK0S5GCQQe0oRcYsTL3Q56Pt0v4OymtoX.X8VGj2G',
    'System Administrator',
    'admin'
),
(
    2,
    'kamal',
    '$2b$10$C5S4lHqwweU5DK0S5GCQQe0oRcYsTL3Q56Pt0v4OymtoX.X8VGj2G',
    'Kamal Perera',
    'student'
),
(
    3,
    'nimal',
    '$2b$10$C5S4lHqwweU5DK0S5GCQQe0oRcYsTL3Q56Pt0v4OymtoX.X8VGj2G',
    'Nimal Silva',
    'student'
),
(
    4,
    'saman',
    '$2b$10$C5S4lHqwweU5DK0S5GCQQe0oRcYsTL3Q56Pt0v4OymtoX.X8VGj2G',
    'Saman Fernando',
    'student'
);


-- Seed Courses (10 Courses matching CR-003 Report test cases TC-001 through TC-020)
-- 10 courses total (TC-014: "Showing 3 of 10 courses" when filtered by Frontend)
-- Includes "Programming" category & "Beginner" level (TC-005, TC-009)
-- Includes "Cloud" category (Section 9.3)
-- Includes "2 Months" duration (Section 9.3, TC-020 duration sort)
-- Includes prices 5000, 15000, 25000, 50000, 100000 (TC-012, Evidence B-02)
INSERT INTO courses
(id, title, category, level, duration, price, image, description)
VALUES

(
    1,
    'HTML & CSS',
    'Frontend',
    'Beginner',
    '8 Weeks',
    15000,
    'https://placehold.co/300x180?text=HTML+%26+CSS',
    'Learn the fundamentals of HTML5 and CSS3 to build modern, responsive websites.'
),

(
    2,
    'JavaScript',
    'Frontend',
    'Intermediate',
    '10 Weeks',
    18000,
    'https://placehold.co/300x180?text=JavaScript',
    'Master JavaScript, the DOM, events, ES6 features, and asynchronous programming.'
),

(
    3,
    'Node.js',
    'Backend',
    'Intermediate',
    '12 Weeks',
    22000,
    'https://placehold.co/300x180?text=Node.js',
    'Build fast and scalable server-side applications using Node.js.'
),

(
    4,
    'Express.js',
    'Backend',
    'Advanced',
    '8 Weeks',
    20000,
    'https://placehold.co/300x180?text=Express.js',
    'Create RESTful APIs and web applications using the Express framework.'
),

(
    5,
    'MongoDB',
    'Database',
    'Intermediate',
    '6 Weeks',
    17000,
    'https://placehold.co/300x180?text=MongoDB',
    'Learn NoSQL database design, CRUD operations, and MongoDB integration.'
),

(
    6,
    'MySQL',
    'Database',
    'Beginner',
    '6 Weeks',
    16000,
    'https://placehold.co/300x180?text=MySQL',
    'Understand relational databases, SQL queries, joins, and database normalization.'
),

(
    7,
    'React',
    'Frontend',
    'Advanced',
    '10 Weeks',
    25000,
    'https://placehold.co/300x180?text=React',
    'Develop modern single-page applications using React components and hooks.'
),

(
    8,
    'Git & GitHub',
    'DevOps',
    'Beginner',
    '4 Weeks',
    5000,
    'https://placehold.co/300x180?text=Git+%26+GitHub',
    'Master version control, branches, pull requests, and collaborative workflows.'
),

(
    9,
    'Python Programming',
    'Programming',
    'Beginner',
    '2 Months',
    50000,
    'https://placehold.co/300x180?text=Python',
    'Learn Python programming from scratch including data structures, OOP, and automation.'
),

(
    10,
    'Full Stack Web Development',
    'Cloud',
    'Advanced',
    '20 Weeks',
    100000,
    'https://placehold.co/300x180?text=Full+Stack',
    'Combine frontend, backend, databases, authentication, and deployment into one complete project.'
);


-- Seed Enrollments
INSERT INTO enrollments
(student_id, course_id)
VALUES

-- Kamal (Student 2)
(2, 1),   -- Kamal -> HTML & CSS
(2, 2),   -- Kamal -> JavaScript
(2, 6),   -- Kamal -> MySQL
(2, 8),   -- Kamal -> Git & GitHub

-- Nimal (Student 3)
(3, 3),   -- Nimal -> Node.js
(3, 4),   -- Nimal -> Express.js
(3, 5),   -- Nimal -> MongoDB
(3, 9),   -- Nimal -> Python Programming

-- Saman (Student 4)
(4, 2),   -- Saman -> JavaScript
(4, 7),   -- Saman -> React
(4, 10);  -- Saman -> Full Stack Web Development
