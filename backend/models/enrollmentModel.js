const db = require("../config/db");

const Enrollment = {

  // Create enrollment
  async create(studentId, courseId) {
    const [result] = await db.execute(
      `INSERT INTO enrollments
       (student_id, course_id)
       VALUES (?, ?)`,
      [studentId, courseId]
    );

    return result.insertId;
  },


  // Check if student is already enrolled
  async findByStudentAndCourse(studentId, courseId) {
    const [rows] = await db.execute(
      `SELECT *
       FROM enrollments
       WHERE student_id = ?
       AND course_id = ?`,
      [studentId, courseId]
    );

    return rows[0];
  },


  // Get count of enrollments for a course
  async countByCourse(courseId, connection = db) {
    const [rows] = await connection.execute(
      "SELECT COUNT(*) AS count FROM enrollments WHERE course_id = ?",
      [courseId]
    );
    return Number(rows[0]?.count || 0);
  },


  // Atomic enrollment with capacity check and concurrency lock (FR-026 - FR-034, SEC-003, SEC-004)
  async enrollWithCapacityCheck(studentId, courseId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Lock the course row using SELECT ... FOR UPDATE to serialize concurrent attempts
      const [courses] = await connection.execute(
        "SELECT * FROM courses WHERE id = ? FOR UPDATE",
        [courseId]
      );

      if (courses.length === 0) {
        await connection.rollback();
        return { success: false, status: 404, message: "Course not found" };
      }

      const course = courses[0];

      // 2. Check if student is already enrolled
      const [existing] = await connection.execute(
        "SELECT id FROM enrollments WHERE student_id = ? AND course_id = ? FOR UPDATE",
        [studentId, courseId]
      );

      if (existing.length > 0) {
        await connection.rollback();
        return {
          success: false,
          status: 409,
          message: "You are already enrolled in this course",
        };
      }

      // 3. Check capacity if max_students is configured
      if (course.max_students !== null && course.max_students !== undefined) {
        const [countRows] = await connection.execute(
          "SELECT COUNT(*) AS count FROM enrollments WHERE course_id = ?",
          [courseId]
        );
        const enrolledCount = Number(countRows[0]?.count || 0);

        if (enrolledCount >= Number(course.max_students)) {
          await connection.rollback();
          return {
            success: false,
            status: 409,
            message: "Course is full. No seats available.",
          };
        }
      }

      // 4. Insert enrollment
      const [result] = await connection.execute(
        "INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)",
        [studentId, courseId]
      );

      await connection.commit();

      return {
        success: true,
        enrollmentId: result.insertId,
        message: "Course enrollment successful",
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },


  // Get all courses enrolled by a student
  async getByStudent(studentId) {
    const [rows] = await db.execute(
      `SELECT
          e.id,
          e.enrolled_at,
          c.id AS course_id,
          c.title,
          c.category,
          c.level,
          c.duration,
          c.price,
          c.image,
          c.description
       FROM enrollments e
       JOIN courses c
         ON e.course_id = c.id
       WHERE e.student_id = ?
       ORDER BY e.enrolled_at DESC`,
      [studentId]
    );

    return rows;
  },


  // Get all students enrolled in a course
  async getByCourse(courseId) {
    const [rows] = await db.execute(
      `SELECT
          e.id,
          e.enrolled_at,
          u.id AS student_id,
          u.username,
          u.full_name
       FROM enrollments e
       JOIN users u
         ON e.student_id = u.id
       WHERE e.course_id = ?
       ORDER BY e.enrolled_at DESC`,
      [courseId]
    );

    return rows;
  },


  // Get all enrollments
  async getAll() {
    const [rows] = await db.execute(
      `SELECT
          e.id,
          e.enrolled_at,

          u.id AS student_id,
          u.username,
          u.full_name,

          c.id AS course_id,
          c.title,
          c.category,
          c.level

       FROM enrollments e

       JOIN users u
         ON e.student_id = u.id

       JOIN courses c
         ON e.course_id = c.id

       ORDER BY e.enrolled_at DESC`
    );

    return rows;
  },


  // Delete enrollment
  async delete(id) {
    const [result] = await db.execute(
      `DELETE FROM enrollments
       WHERE id = ?`,
      [id]
    );

    return result;
  },

  // Student cancel enrollment (verifies both enrollment ID and student ID)
  async cancelByStudent(enrollmentId, studentId) {
    const [result] = await db.execute(
      `DELETE FROM enrollments
       WHERE id = ? AND student_id = ?`,
      [enrollmentId, studentId]
    );

    return result;
  },

};

module.exports = Enrollment;
