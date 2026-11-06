const db = require("../config/db");

const Enrollment = {
  // Find single enrollment by ID
  async findById(id) {
    const [rows] = await db.execute(
      `SELECT e.*, c.title AS course_title, u.full_name AS student_name, u.username
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       JOIN users u ON e.student_id = u.id
       WHERE e.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  // Check if student has an existing enrollment / request for a course
  async findByStudentAndCourse(studentId, courseId) {
    const [rows] = await db.execute(
      `SELECT *
       FROM enrollments
       WHERE student_id = ?
       AND course_id = ?`,
      [studentId, courseId]
    );

    return rows[0] || null;
  },

  // Get count of approved enrollments for a course (CR-011: pending requests do NOT count towards capacity)
  async countByCourse(courseId, connection = db) {
    const [rows] = await connection.execute(
      "SELECT COUNT(*) AS count FROM enrollments WHERE course_id = ? AND status = 'approved'",
      [courseId]
    );
    return Number(rows[0]?.count || 0);
  },

  // Student requests enrollment: initial status is 'pending' (CR-011 FR-1, FR-4, FR-5)
  async requestEnrollment(studentId, courseId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Check course existence
      const [courses] = await connection.execute(
        "SELECT * FROM courses WHERE id = ?",
        [courseId]
      );
      if (courses.length === 0) {
        await connection.rollback();
        return { success: false, status: 404, message: "Course not found" };
      }

      // 2. Check duplicate pending or approved requests (FR-4)
      const [existingRows] = await connection.execute(
        "SELECT * FROM enrollments WHERE student_id = ? AND course_id = ? FOR UPDATE",
        [studentId, courseId]
      );

      if (existingRows.length > 0) {
        const existing = existingRows[0];

        if (existing.status === "approved") {
          await connection.rollback();
          return {
            success: false,
            status: 409,
            message: "You are already enrolled in this course",
          };
        }

        if (existing.status === "pending") {
          await connection.rollback();
          return {
            success: false,
            status: 409,
            message: "You already have a pending enrollment request for this course",
          };
        }

        // FR-5: Define how rejected requests can be submitted again.
        // If previous request was rejected, re-submit by resetting to pending status
        if (existing.status === "rejected") {
          await connection.execute(
            `UPDATE enrollments
             SET status = 'pending',
                 reviewed_by = NULL,
                 reviewed_at = NULL,
                 rejection_reason = NULL,
                 decision_note = NULL,
                 enrolled_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [existing.id]
          );

          await connection.commit();
          return {
            success: true,
            status: 201,
            enrollmentId: existing.id,
            message: "Enrollment request submitted successfully. Awaiting administrator approval.",
          };
        }
      }

      // 3. Insert new pending request (FR-1)
      const [result] = await connection.execute(
        `INSERT INTO enrollments (student_id, course_id, status)
         VALUES (?, ?, 'pending')`,
        [studentId, courseId]
      );

      await connection.commit();
      return {
        success: true,
        status: 201,
        enrollmentId: result.insertId,
        message: "Enrollment request submitted successfully. Awaiting administrator approval.",
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Legacy compatibility alias
  async enrollWithCapacityCheck(studentId, courseId) {
    return this.requestEnrollment(studentId, courseId);
  },

  // Admin approves or rejects enrollment request with database transaction (CR-011 FR-6 - FR-16)
  async updateStatus(enrollmentId, newStatus, reviewerId, reason = "") {
    // Validate target status
    if (newStatus !== "approved" && newStatus !== "rejected") {
      return {
        success: false,
        status: 400,
        message: "Invalid status. Allowed values are 'approved' or 'rejected'",
      };
    }

    // FR-9: A rejection must include a reason
    if (newStatus === "rejected") {
      if (!reason || typeof reason !== "string" || reason.trim() === "") {
        return {
          success: false,
          status: 400,
          message: "Rejection reason is required",
        };
      }
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Lock the enrollment record using SELECT ... FOR UPDATE
      const [enrollmentRows] = await connection.execute(
        "SELECT * FROM enrollments WHERE id = ? FOR UPDATE",
        [enrollmentId]
      );

      if (enrollmentRows.length === 0) {
        await connection.rollback();
        return {
          success: false,
          status: 404,
          message: "Enrollment request not found",
        };
      }

      const enrollment = enrollmentRows[0];

      // FR-10 & FR-11: Only pending requests may be approved or rejected.
      // An already approved or rejected request cannot be processed again.
      if (enrollment.status !== "pending") {
        await connection.rollback();
        return {
          success: false,
          status: 400,
          message: `Only pending requests can be processed. This request is already ${enrollment.status}`,
        };
      }

      // If approving, re-check: course existence, course capacity, and duplicate enrollment (FR-15, FR-16)
      if (newStatus === "approved") {
        // Check Course existence & lock course row to serialize concurrent approvals
        const [courseRows] = await connection.execute(
          "SELECT * FROM courses WHERE id = ? FOR UPDATE",
          [enrollment.course_id]
        );

        if (courseRows.length === 0) {
          await connection.rollback();
          return {
            success: false,
            status: 404,
            message: "Course not found",
          };
        }

        const course = courseRows[0];

        // Check duplicate enrollment: check if student is already approved for this course
        const [dupRows] = await connection.execute(
          "SELECT id FROM enrollments WHERE student_id = ? AND course_id = ? AND status = 'approved' AND id != ? FOR UPDATE",
          [enrollment.student_id, enrollment.course_id, enrollmentId]
        );

        if (dupRows.length > 0) {
          await connection.rollback();
          return {
            success: false,
            status: 409,
            message: "Student is already enrolled in this course",
          };
        }

        // Check capacity if max_students is set
        if (course.max_students !== null && course.max_students !== undefined) {
          const [countRows] = await connection.execute(
            "SELECT COUNT(*) AS count FROM enrollments WHERE course_id = ? AND status = 'approved' FOR UPDATE",
            [enrollment.course_id]
          );
          const approvedCount = Number(countRows[0]?.count || 0);

          if (approvedCount >= Number(course.max_students)) {
            await connection.rollback();
            return {
              success: false,
              status: 409,
              message: "Course is full. No seats available.",
            };
          }
        }

        // Apply approval update
        await connection.execute(
          `UPDATE enrollments
           SET status = 'approved',
               reviewed_by = ?,
               reviewed_at = CURRENT_TIMESTAMP,
               rejection_reason = NULL,
               decision_note = NULL
           WHERE id = ?`,
          [reviewerId, enrollmentId]
        );
      } else {
        // Rejection update
        const cleanReason = reason.trim();
        await connection.execute(
          `UPDATE enrollments
           SET status = 'rejected',
               reviewed_by = ?,
               reviewed_at = CURRENT_TIMESTAMP,
               rejection_reason = ?,
               decision_note = ?
           WHERE id = ?`,
          [reviewerId, cleanReason, cleanReason, enrollmentId]
        );
      }

      await connection.commit();

      // Fetch the updated enrollment
      const [updatedRows] = await connection.execute(
        `SELECT e.*, c.title, u.username, u.full_name
         FROM enrollments e
         JOIN courses c ON e.course_id = c.id
         JOIN users u ON e.student_id = u.id
         WHERE e.id = ?`,
        [enrollmentId]
      );

      return {
        success: true,
        status: 200,
        message:
          newStatus === "approved"
            ? "Enrollment request approved successfully"
            : "Enrollment request rejected successfully",
        enrollment: updatedRows[0],
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Get all courses enrolled/requested by a student (CR-011 FR-14)
  async getByStudent(studentId) {
    const [rows] = await db.execute(
      `SELECT
          e.id,
          e.status,
          e.enrolled_at,
          e.reviewed_by,
          e.reviewed_at,
          e.rejection_reason,
          e.decision_note,
          c.id AS course_id,
          c.title,
          c.category,
          c.level,
          c.duration,
          c.price,
          c.image,
          c.description,
          c.max_students,
          reviewer.full_name AS reviewer_name
       FROM enrollments e
       JOIN courses c
         ON e.course_id = c.id
       LEFT JOIN users reviewer
         ON e.reviewed_by = reviewer.id
       WHERE e.student_id = ?
       ORDER BY e.enrolled_at DESC`,
      [studentId]
    );

    return rows;
  },

  // Get all students enrolled in a course with optional status filter
  async getByCourse(courseId, status = null) {
    let query = `
      SELECT
          e.id,
          e.status,
          e.enrolled_at,
          e.reviewed_by,
          e.reviewed_at,
          e.rejection_reason,
          e.decision_note,
          u.id AS student_id,
          u.username,
          u.full_name,
          reviewer.full_name AS reviewer_name
       FROM enrollments e
       JOIN users u
         ON e.student_id = u.id
       LEFT JOIN users reviewer
         ON e.reviewed_by = reviewer.id
       WHERE e.course_id = ?
    `;
    const params = [courseId];

    if (status && status !== "all") {
      query += " AND e.status = ?";
      params.push(status);
    }

    query += " ORDER BY e.enrolled_at DESC";

    const [rows] = await db.execute(query, params);
    return rows;
  },

  // Get all enrollments with optional status filter (CR-011 API Requirements)
  async getAll(status = null) {
    let query = `
      SELECT
          e.id,
          e.status,
          e.enrolled_at,
          e.reviewed_by,
          e.reviewed_at,
          e.rejection_reason,
          e.decision_note,

          u.id AS student_id,
          u.username,
          u.full_name,

          c.id AS course_id,
          c.title,
          c.category,
          c.level,

          reviewer.full_name AS reviewer_name,
          reviewer.username AS reviewer_username

       FROM enrollments e

       JOIN users u
         ON e.student_id = u.id

       JOIN courses c
         ON e.course_id = c.id

       LEFT JOIN users reviewer
         ON e.reviewed_by = reviewer.id
    `;
    const params = [];

    if (status && status !== "all") {
      query += " WHERE e.status = ?";
      params.push(status);
    }

    query += " ORDER BY e.enrolled_at DESC";

    const [rows] = await db.execute(query, params);
    return rows;
  },

  // Delete enrollment (Admin action - FR-18)
  async delete(id) {
    const [result] = await db.execute(
      `DELETE FROM enrollments
       WHERE id = ?`,
      [id]
    );

    return result;
  },

  // Student cancel enrollment / request (FR-19: students may cancel pending, approved, or rejected requests)
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
