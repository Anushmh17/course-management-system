const Enrollment = require("../models/enrollmentModel");
const Course = require("../models/courseModel");

// Enroll in a course (with atomic capacity checking and concurrency protection)
const enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.body;

    // Logged-in student's ID
    const studentId = req.user.id;

    // Check course ID
    if (!courseId) {
      return res.status(400).json({
        message: "Course ID is required",
      });
    }

    // Atomic enrollment with database transaction & capacity check (FR-026 - FR-034)
    const result = await Enrollment.enrollWithCapacityCheck(
      studentId,
      courseId
    );

    if (!result.success) {
      return res.status(result.status).json({
        message: result.message,
      });
    }

    res.status(201).json({
      message: result.message,
      enrollmentId: result.enrollmentId,
    });

  } catch (error) {
    console.error(
      "Error enrolling in course:",
      error.message
    );

    res.status(500).json({
      message: "Internal server error",
    });
  }
};


// Get logged-in student's courses
const getMyEnrollments = async (req, res) => {
  try {
    const studentId = req.user.id;

    const enrollments =
      await Enrollment.getByStudent(studentId);

    res.status(200).json({
      message: "Enrollments retrieved successfully",
      enrollments,
    });

  } catch (error) {
    console.error(
      "Error getting student enrollments:",
      error.message
    );

    res.status(500).json({
      message: "Internal server error",
    });
  }
};


// Get students enrolled in a course
const getCourseEnrollments = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Check whether course exists
    const course = await Course.getById(courseId);

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    const enrollments =
      await Enrollment.getByCourse(courseId);

    res.status(200).json({
      message: "Course enrollments retrieved successfully",
      course,
      enrollments,
    });

  } catch (error) {
    console.error(
      "Error getting course enrollments:",
      error.message
    );

    res.status(500).json({
      message: "Internal server error",
    });
  }
};


// Get all enrollments
const getAllEnrollments = async (req, res) => {
  try {
    const enrollments =
      await Enrollment.getAll();

    res.status(200).json({
      message: "All enrollments retrieved successfully",
      enrollments,
    });

  } catch (error) {
    console.error(
      "Error getting all enrollments:",
      error.message
    );

    res.status(500).json({
      message: "Internal server error",
    });
  }
};


// Delete enrollment
const deleteEnrollment = async (req, res) => {
  try {
    const { id } = req.params;

    const result =
      await Enrollment.delete(id);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Enrollment not found",
      });
    }

    res.status(200).json({
      message: "Enrollment deleted successfully",
    });

  } catch (error) {
    console.error(
      "Error deleting enrollment:",
      error.message
    );

    res.status(500).json({
      message: "Internal server error",
    });
  }
};


// Student self-service enrollment cancellation
const cancelMyEnrollment = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;

    // Validate enrollment ID parameter
    const enrollmentId = parseInt(id, 10);
    if (!enrollmentId || isNaN(enrollmentId) || enrollmentId <= 0 || String(enrollmentId) !== String(id).trim()) {
      return res.status(400).json({
        message: "Invalid enrollment ID",
      });
    }

    // Attempt deletion verifying both enrollment ID and student ownership
    const result = await Enrollment.cancelByStudent(enrollmentId, studentId);

    // If no row affected, the enrollment does not exist or belongs to another student
    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Enrollment not found",
      });
    }

    res.status(200).json({
      message: "Enrollment cancelled successfully",
    });

  } catch (error) {
    console.error(
      "Error cancelling enrollment:",
      error.message
    );

    res.status(500).json({
      message: "Internal server error",
    });
  }
};


module.exports = {
  enrollInCourse,
  getMyEnrollments,
  getCourseEnrollments,
  getAllEnrollments,
  deleteEnrollment,
  cancelMyEnrollment,
};

