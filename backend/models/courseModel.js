const db = require("../config/db");

// Helper to calculate course capacity fields
function formatCourseCapacity(course) {
  if (!course) return null;
  const enrolledCount = Number(course.enrolled_count || 0);
  const maxStudents =
    course.max_students !== null && course.max_students !== undefined
      ? Number(course.max_students)
      : null;
  const isFull = maxStudents !== null ? enrolledCount >= maxStudents : false;
  const seatsRemaining =
    maxStudents !== null ? Math.max(0, maxStudents - enrolledCount) : null;

  return {
    ...course,
    max_students: maxStudents,
    enrolled_count: enrolledCount,
    seats_remaining: seatsRemaining,
    is_full: isFull,
  };
}

const Course = {
  // Format helper attached for reuse
  formatCourseCapacity,

  // Get all courses with enrollment count and capacity info
  async getAll() {
    const [rows] = await db.execute(
      `SELECT 
         c.*,
         CAST(COUNT(e.id) AS UNSIGNED) AS enrolled_count
       FROM courses c
       LEFT JOIN enrollments e ON c.id = e.course_id
       GROUP BY c.id
       ORDER BY c.id ASC`
    );

    return rows.map(formatCourseCapacity);
  },

  // Get one course by ID with enrollment count and capacity info
  async getById(id) {
    const [rows] = await db.execute(
      `SELECT 
         c.*,
         CAST(COUNT(e.id) AS UNSIGNED) AS enrolled_count
       FROM courses c
       LEFT JOIN enrollments e ON c.id = e.course_id
       WHERE c.id = ?
       GROUP BY c.id`,
      [id]
    );

    if (!rows[0]) return null;
    return formatCourseCapacity(rows[0]);
  },

  // Find course by title (optionally excluding a course ID for updates)
  async getByTitle(title, excludeId = null) {
    let query = "SELECT * FROM courses WHERE LOWER(title) = LOWER(?)";
    const params = [title];

    if (excludeId !== null && excludeId !== undefined) {
      query += " AND id != ?";
      params.push(excludeId);
    }

    const [rows] = await db.execute(query, params);
    return rows[0] || null;
  },

  // Get current enrollment count for a course
  async getEnrollmentCount(id) {
    const [rows] = await db.execute(
      "SELECT COUNT(*) AS count FROM enrollments WHERE course_id = ?",
      [id]
    );
    return Number(rows[0]?.count || 0);
  },

  // Create course
  async create(course) {
    const {
      title,
      category,
      level,
      duration,
      price,
      image,
      description,
      max_students,
    } = course;

    const [result] = await db.execute(
      `INSERT INTO courses
       (title, category, level, duration, price, image, description, max_students)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        category,
        level,
        duration,
        price,
        image,
        description,
        max_students ?? null,
      ]
    );

    return result.insertId;
  },

  // Update course
  async update(id, course) {
    const {
      title,
      category,
      level,
      duration,
      price,
      image,
      description,
      max_students,
    } = course;

    const [result] = await db.execute(
      `UPDATE courses
       SET title = ?,
           category = ?,
           level = ?,
           duration = ?,
           price = ?,
           image = ?,
           description = ?,
           max_students = ?
       WHERE id = ?`,
      [
        title,
        category,
        level,
        duration,
        price,
        image,
        description,
        max_students ?? null,
        id,
      ]
    );

    return result;
  },

  // Delete course
  async delete(id) {
    const [result] = await db.execute(
      "DELETE FROM courses WHERE id = ?",
      [id]
    );

    return result;
  },
};

module.exports = Course;
