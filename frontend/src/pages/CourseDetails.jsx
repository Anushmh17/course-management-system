import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { FaChartBar, FaGraduationCap, FaShoppingCart, FaSignInAlt } from "react-icons/fa";

import api from "../services/api";
import { isLoggedIn, isStudent, isAdmin } from "../services/auth";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function CourseDetails() {
  const { id } = useParams();
  const location = useLocation();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [enrolling, setEnrolling] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [enrollment, setEnrollment] = useState(null);

  // Read the login state from localStorage
  const loggedIn = isLoggedIn();
  const studentLoggedIn = isStudent();
  const adminLoggedIn = isAdmin();

  // ---------- Load the course ----------
  useEffect(() => {
    const getCourse = async () => {
      try {
        const response = await api.get(`/courses/${id}`);
        setCourse(response.data.course);
      } catch (err) {
        setError(
          err.response?.data?.message ||
          "Failed to load course"
        );
      } finally {
        setLoading(false);
      }
    };

    getCourse();
  }, [id]);

  // ---------- Check whether logged-in student has an enrollment/request for this course ----------
  useEffect(() => {
    if (studentLoggedIn) {
      api
        .get("/enrollments/my")
        .then((res) => {
          const match = res.data.enrollments?.find(
            (e) => String(e.course_id) === String(id)
          );
          if (match) {
            setEnrollment(match);
          } else {
            setEnrollment(null);
          }
        })
        .catch(() => {});
    }
  }, [id, studentLoggedIn]);

  // ---------- Submit Enrollment Request (CR-011 FR-1, Frontend Req 1) ----------
  const handleEnroll = async () => {
    setError("");
    setSuccess("");
    setEnrolling(true);

    try {
      const response = await api.post("/enrollments", {
        courseId: id,
      });

      setSuccess(
        response.data.message ||
        "Enrollment request submitted successfully. Awaiting administrator approval."
      );
      setEnrollment({
        id: response.data.enrollmentId,
        status: "pending",
        course_id: id,
      });

      // Refresh course state
      const courseRes = await api.get(`/courses/${id}`);
      setCourse(courseRes.data.course);
    } catch (err) {
      if (err.response?.status === 409) {
        const msg = err.response?.data?.message || "";
        if (msg.toLowerCase().includes("full")) {
          setError(msg);
          api.get(`/courses/${id}`).then((res) => setCourse(res.data.course)).catch(() => {});
        } else if (msg.toLowerCase().includes("pending")) {
          setError("You already have a pending enrollment request for this course.");
          setEnrollment({ id: enrollment?.id, status: "pending" });
        } else {
          setError("You are already enrolled in this course.");
          setEnrollment({ id: enrollment?.id, status: "approved" });
        }
      } else {
        setError(
          err.response?.data?.message ||
          "Enrollment request failed. Please try again."
        );
      }
    } finally {
      setEnrolling(false);
    }
  };

  // ---------- Cancel Request / Enrollment (CR-011 FR-19) ----------
  const handleCancelEnrollment = async () => {
    if (!enrollment?.id) return;

    const actionText =
      enrollment.status === "pending"
        ? "cancel your pending enrollment request"
        : enrollment.status === "rejected"
        ? "dismiss this rejected request"
        : "cancel your enrollment";

    const isConfirmed = window.confirm(
      `Are you sure you want to ${actionText} in this course?`
    );
    if (!isConfirmed) return;

    setError("");
    setSuccess("");
    setCancelling(true);

    try {
      const res = await api.delete(`/enrollments/my/${enrollment.id}`);
      setSuccess(res.data?.message || "Enrollment request cancelled successfully.");
      setEnrollment(null);

      // Refresh course state after cancellation
      const courseRes = await api.get(`/courses/${id}`);
      setCourse(courseRes.data.course);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to cancel enrollment. Please try again."
      );
    } finally {
      setCancelling(false);
    }
  };

  // Format date helper
  const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString();
  };

  // ---------- Loading ----------
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container">
          <p className="loading">Loading course...</p>
        </div>
      </>
    );
  }

  // ---------- Course not found / server error ----------
  if (error && !course) {
    return (
      <>
        <Navbar />
        <div className="container">
          <p className="error">{error}</p>
          <div className="center-actions">
            <Link to="/courses" className="btn btn-primary">
              Back to Courses
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="container">
        {/* Breadcrumb */}
        <p className="breadcrumb">
          <Link to="/courses">Courses</Link>
          <span> / </span>
          <span>{course.title}</span>
        </p>

        <div className="details-layout">
          {/* ---------- Left: image ---------- */}
          <div className="details-image-wrapper">
            <img
              src={course.image}
              alt={course.title}
              className="details-image"
            />
          </div>

          {/* ---------- Right: information ---------- */}
          <div className="details-info">
            <div className="course-card-tags">
              <span className="tag tag-category">{course.category}</span>
              <span className="tag tag-level">{course.level}</span>
              {course.is_full && (
                <span className="tag tag-full">Course Full</span>
              )}
            </div>

            <h1>{course.title}</h1>

            <p className="details-description">{course.description}</p>

            <dl className="details-list">
              <div>
                <dt>Category</dt>
                <dd>{course.category}</dd>
              </div>

              <div>
                <dt>Level</dt>
                <dd>{course.level}</dd>
              </div>

              <div>
                <dt>Duration</dt>
                <dd>{course.duration}</dd>
              </div>

              <div>
                <dt>Price</dt>
                <dd className="details-price">Rs. {course.price}</dd>
              </div>

              <div>
                <dt>Availability</dt>
                <dd className="details-availability">
                  {course.max_students !== null && course.max_students !== undefined
                    ? `${course.enrolled_count} / ${course.max_students} students`
                    : "Unlimited"}
                  {course.is_full && (
                    <span className="tag tag-full" style={{ marginLeft: "8px" }}>
                      Course Full
                    </span>
                  )}
                </dd>
              </div>
            </dl>

            {/* ---------- Messages ---------- */}
            {success && <p className="success">{success}</p>}
            {error && <p className="error">{error}</p>}

            {/* ---------- Action area (role based) ---------- */}
            <div className="details-actions">
              {/* Not logged in: invite visitor to login */}
              {!loggedIn && (
                <div className="notice">
                  {course.is_full ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div>
                        <span className="tag tag-full tag-full-lg">Course Full</span>
                      </div>
                      <p>
                        This course is currently full ({course.enrolled_count} / {course.max_students} students). No remaining seats are available.
                      </p>
                    </div>
                  ) : (
                    <>
                      <p>
                        Please login as a student to request enrollment in this course.
                      </p>
                      <Link
                        to="/login"
                        state={{ from: location.pathname }}
                        className="btn btn-primary"
                      >
                        <FaSignInAlt />
                        Login to Request Enrollment
                      </Link>
                    </>
                  )}
                </div>
              )}

              {/* Logged in as a student */}
              {studentLoggedIn && (
                <>
                  {/* Status 1: Approved enrollment */}
                  {enrollment?.status === "approved" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div
                        style={{
                          padding: "10px 16px",
                          backgroundColor: "var(--color-success-bg, #dcfce7)",
                          color: "var(--color-success-text, #166534)",
                          border: "1px solid #bbf7d0",
                          borderRadius: "6px",
                          fontWeight: "600",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          width: "fit-content",
                        }}
                      >
                        ✓ Enrolled in this course (Approved)
                      </div>

                      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "4px" }}>
                        <Link to="/my-enrollments" className="btn btn-outline">
                          <FaGraduationCap />
                          My Enrollments
                        </Link>

                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={handleCancelEnrollment}
                          disabled={cancelling}
                        >
                          {cancelling ? "Cancelling..." : "Cancel Enrollment"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Status 2: Pending Approval (CR-011 Frontend Req 2) */}
                  {enrollment?.status === "pending" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div className="status-banner status-banner-pending">
                        <div className="status-banner-header">
                          <span>⏳ Request Pending Approval</span>
                        </div>
                        <p className="status-banner-body">
                          Your enrollment request has been submitted and is currently awaiting administrator review and approval.
                        </p>
                      </div>

                      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        <Link to="/my-enrollments" className="btn btn-outline">
                          <FaGraduationCap />
                          My Enrollments
                        </Link>

                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={handleCancelEnrollment}
                          disabled={cancelling}
                        >
                          {cancelling ? "Cancelling..." : "Cancel Request"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Status 3: Rejected Request (CR-011 Frontend Req 3, 4, Functional Req 5) */}
                  {enrollment?.status === "rejected" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div className="status-banner status-banner-rejected">
                        <div className="status-banner-header">
                          <span>✕ Enrollment Request Rejected</span>
                        </div>
                        <p className="status-banner-body">
                          Your previous enrollment request for this course was rejected.
                        </p>
                        {enrollment.rejection_reason && (
                          <div className="rejection-reason-box">
                            <strong>Rejection Reason:</strong> {enrollment.rejection_reason}
                          </div>
                        )}
                        {enrollment.reviewed_at && (
                          <p className="review-info-text">
                            Reviewed on: {formatDate(enrollment.reviewed_at)}
                          </p>
                        )}
                      </div>

                      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        {!course.is_full && (
                          <button
                            type="button"
                            className="btn btn-primary btn-lg"
                            onClick={handleEnroll}
                            disabled={enrolling}
                          >
                            <FaShoppingCart />
                            {enrolling ? "Submitting Request..." : "Request Enrollment Again"}
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={handleCancelEnrollment}
                          disabled={cancelling}
                        >
                          {cancelling ? "Dismissing..." : "Dismiss"}
                        </button>
                        <Link to="/my-enrollments" className="btn btn-outline">
                          <FaGraduationCap />
                          My Enrollments
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Status 4: Not Enrolled / No active request */}
                  {!enrollment && (
                    <>
                      {course.is_full ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          <div>
                            <span className="tag tag-full tag-full-lg">Course Full</span>
                          </div>
                          <p className="course-full-message">
                            This course is full ({course.enrolled_count} / {course.max_students} students). No seats are remaining.
                          </p>
                          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-lg btn-disabled"
                              disabled
                            >
                              Course Full
                            </button>
                            <Link to="/my-enrollments" className="btn btn-outline">
                              <FaGraduationCap />
                              My Enrollments
                            </Link>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* CR-011 Frontend Req 1: Change Enroll Now to Request Enrollment */}
                          <button
                            type="button"
                            className="btn btn-primary btn-lg"
                            onClick={handleEnroll}
                            disabled={enrolling}
                          >
                            <FaShoppingCart />
                            {enrolling ? "Submitting Request..." : "Request Enrollment"}
                          </button>

                          <Link to="/my-enrollments" className="btn btn-outline">
                            <FaGraduationCap />
                            My Enrollments
                          </Link>
                        </>
                      )}
                    </>
                  )}
                </>
              )}

              {/* Logged in as an admin */}
              {adminLoggedIn && (
                <div className="notice">
                  <p>
                    You are logged in as an administrator. Only students can request enrollment in courses.
                  </p>
                  <Link to="/admin/courses" className="btn btn-primary">
                    <FaChartBar />
                    Manage Courses
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}

export default CourseDetails;
