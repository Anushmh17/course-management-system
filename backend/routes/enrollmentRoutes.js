const express = require("express");

const router = express.Router();

const {
  enrollInCourse,
  updateEnrollmentStatus,
  getMyEnrollments,
  getCourseEnrollments,
  getAllEnrollments,
  deleteEnrollment,
  cancelMyEnrollment,
} = require("../controllers/enrollmentController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");


// Student (JWT + student role required)
// Enroll in a course
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["student"]),
  enrollInCourse
);


// Student (JWT + student role required)
// View my enrolled courses
router.get(
  "/my",
  authMiddleware,
  roleMiddleware(["student"]),
  getMyEnrollments
);


// Student (JWT + student role required)
// Cancel my own enrollment
router.delete(
  "/my/:id",
  authMiddleware,
  roleMiddleware(["student"]),
  cancelMyEnrollment
);


// Admin (JWT + admin role required)
// View all enrollments
router.get(
  "/",
  authMiddleware,
  roleMiddleware(["admin"]),
  getAllEnrollments
);


// Admin (JWT + admin role required)
// View students enrolled in a course
router.get(
  "/course/:courseId",
  authMiddleware,
  roleMiddleware(["admin"]),
  getCourseEnrollments
);


// Admin (JWT + admin role required)
// Approve or reject an enrollment request (CR-011 API Requirements)
router.patch(
  "/:id/status",
  authMiddleware,
  roleMiddleware(["admin"]),
  updateEnrollmentStatus
);


// Support PUT as well for API convenience
router.put(
  "/:id/status",
  authMiddleware,
  roleMiddleware(["admin"]),
  updateEnrollmentStatus
);


// Admin (JWT + admin role required)
// Delete an enrollment
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  deleteEnrollment
);


module.exports = router;