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


-- Seed Courses (Matches Test Evidence B-01 and B-02)
-- B-01 (TC-001/TC-003): Course ID 1 matches "C001" or "1" as single record
-- B-02 (TC-012): Prices 5000, 15000, 25000, 100000 sort in exact ascending numerical order
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
    'Git & GitHub',
    'DevOps',
    'Beginner',
    '4 Weeks',
    5000,
    'https://placehold.co/300x180?text=Git+%26+GitHub',
    'Master version control, branches, pull requests, and collaborative workflows.'
),

(
    3,
    'React',
    'Frontend',
    'Intermediate',
    '10 Weeks',
    25000,
    'https://placehold.co/300x180?text=React',
    'Develop modern single-page applications using React components and hooks.'
),

(
    4,
    'Full Stack Web Development',
    'Full Stack',
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
(2, 1),   -- Kamal -> HTML & CSS
(2, 2),   -- Kamal -> Git & GitHub
(3, 3),   -- Nimal -> React
(4, 4);   -- Saman -> Full Stack Web Development
