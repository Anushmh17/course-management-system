const Enrollment = require("../models/enrollmentModel");
const Course = require("../models/courseModel");

// Enroll in a course / Submit enrollment request (CR-011: initial status is pending)
const enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const studentId = req.user.id;

    if (!courseId) {
      return res.status(400).json({
        message: "Course ID is required",
      });
    }

    const result = await Enrollment.requestEnrollment(studentId, courseId);

    if (!result.success) {
      return res.status(result.status).json({
        message: result.message,
      });
    }

    res.status(201).json({
      message: result.message,
      enrollmentId: result.enrollmentId,
      status: "pending",
    });
  } catch (error) {
    console.error("Error submitting enrollment request:", error.message);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Approve or reject an enrollment request (CR-011: Admin only)
const updateEnrollmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const reviewerId = req.user.id; // FR-13: Reviewer ID from authenticated administrator

    const enrollmentId = parseInt(id, 10);
    if (!enrollmentId || isNaN(enrollmentId) || enrollmentId <= 0) {
      return res.status(400).json({
        message: "Invalid enrollment ID",
      });
    }

    if (!status) {
      return res.status(400).json({
        message: "Status is required ('approved' or 'rejected')",
      });
    }

    const result = await Enrollment.updateStatus(
      enrollmentId,
      status,
      reviewerId,
      reason
    );

    if (!result.success) {
      return res.status(result.status).json({
        message: result.message,
      });
    }

    res.status(200).json({
      message: result.message,
      enrollment: result.enrollment,
    });
  } catch (error) {
    console.error("Error updating enrollment status:", error.message);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Get logged-in student's courses (includes pending, approved, and rejected statuses)
const getMyEnrollments = async (req, res) => {
  try {
    const studentId = req.user.id;
    const enrollments = await Enrollment.getByStudent(studentId);

    res.status(200).json({
      message: "Enrollments retrieved successfully",
      enrollments,
    });
  } catch (error) {
    console.error("Error getting student enrollments:", error.message);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Get students enrolled in a course (with optional status filter)
const getCourseEnrollments = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { status } = req.query;

    const course = await Course.getById(courseId);
    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    const enrollments = await Enrollment.getByCourse(courseId, status);

    res.status(200).json({
      message: "Course enrollments retrieved successfully",
      course,
      enrollments,
    });
  } catch (error) {
    console.error("Error getting course enrollments:", error.message);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Get all enrollments with optional ?status= filtering (CR-011 API Requirement)
const getAllEnrollments = async (req, res) => {
  try {
    const { status } = req.query;
    const enrollments = await Enrollment.getAll(status);

    res.status(200).json({
      message: "All enrollments retrieved successfully",
      enrollments,
    });
  } catch (error) {
    console.error("Error getting all enrollments:", error.message);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Delete enrollment (Admin action - FR-18)
const deleteEnrollment = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await Enrollment.delete(id);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Enrollment not found",
      });
    }

    res.status(200).json({
      message: "Enrollment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting enrollment:", error.message);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Student self-service enrollment cancellation (FR-19)
const cancelMyEnrollment = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;

    const enrollmentId = parseInt(id, 10);
    if (
      !enrollmentId ||
      isNaN(enrollmentId) ||
      enrollmentId <= 0 ||
      String(enrollmentId) !== String(id).trim()
    ) {
      return res.status(400).json({
        message: "Invalid enrollment ID",
      });
    }

    const result = await Enrollment.cancelByStudent(enrollmentId, studentId);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Enrollment not found",
      });
    }

    res.status(200).json({
      message: "Enrollment cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling enrollment:", error.message);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = {
  enrollInCourse,
  updateEnrollmentStatus,
  getMyEnrollments,
  getCourseEnrollments,
  getAllEnrollments,
  deleteEnrollment,
  cancelMyEnrollment,
};
