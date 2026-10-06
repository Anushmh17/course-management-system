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
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentId, setEnrollmentId] = useState(null);

  // Read the login state from localStorage.
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


  // ---------- Check whether logged-in student is already enrolled ----------
  useEffect(() => {
    if (studentLoggedIn) {
      api
        .get("/enrollments/my")
        .then((res) => {
          const match = res.data.enrollments?.find(
            (e) => String(e.course_id) === String(id)
          );
          if (match) {
            setIsEnrolled(true);
            setEnrollmentId(match.id);
          } else {
            setIsEnrolled(false);
            setEnrollmentId(null);
          }
        })
        .catch(() => {});
    }
  }, [id, studentLoggedIn]);


  // ---------- Enroll ----------
  const handleEnroll = async () => {

    setError("");
    setSuccess("");
    setEnrolling(true);

    try {

      const response = await api.post("/enrollments", {
        // The backend reads courseId from the request body
        courseId: id,
      });

      setSuccess(response.data.message || "Enrolled successfully!");
      setIsEnrolled(true);
      setEnrollmentId(response.data.enrollmentId);

      // Refresh course state to reflect recalculated availability (FR-036)
      const courseRes = await api.get(`/courses/${id}`);
      setCourse(courseRes.data.course);

    } catch (err) {

      if (err.response?.status === 409) {
        const msg = err.response?.data?.message || "";
        if (msg.toLowerCase().includes("full")) {
          // Course is full (FR-029, FR-030)
          setError(msg);
          // Refresh course state
          api.get(`/courses/${id}`).then((res) => setCourse(res.data.course)).catch(() => {});
        } else {
          setError(
            "You are already enrolled in this course. You can see it in My Enrollments."
          );
          setIsEnrolled(true);
        }
      } else {

        setError(
          err.response?.data?.message ||
          "Enrollment failed. Please try again."
        );

      }

    } finally {

      setEnrolling(false);

    }
  };


  // ---------- Cancel Enrollment ----------
  const handleCancelEnrollment = async () => {
    if (!enrollmentId) return;

    const isConfirmed = window.confirm(
      "Are you sure you want to cancel your enrollment in this course?"
    );
    if (!isConfirmed) return;

    setError("");
    setSuccess("");
    setCancelling(true);

    try {
      const res = await api.delete(`/enrollments/my/${enrollmentId}`);
      setSuccess(res.data?.message || "Enrollment cancelled successfully.");
      setIsEnrolled(false);
      setEnrollmentId(null);

      // Refresh course state after cancellation (seat released) (FR-035, FR-036)
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

              {/* Not logged in: invite the visitor to login */}
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
                        Please login as a student to enroll in this course.
                      </p>

                      <Link
                        to="/login"
                        state={{ from: location.pathname }}
                        className="btn btn-primary"
                      >
                        <FaSignInAlt />
                        Login to Enroll
                      </Link>
                    </>
                  )}
                </div>
              )}


              {/* Logged in as a student: show enrolled or enroll button or full state */}
              {studentLoggedIn && (
                <>
                  {isEnrolled ? (
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
                        ✓ Enrolled in this course
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
                  ) : course.is_full ? (
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
                      <button
                        type="button"
                        className="btn btn-primary btn-lg"
                        onClick={handleEnroll}
                        disabled={enrolling}
                      >
                        <FaShoppingCart />
                        {enrolling ? "Enrolling..." : "Enroll Now"}
                      </button>

                      <Link to="/my-enrollments" className="btn btn-outline">
                        <FaGraduationCap />
                        My Enrollments
                      </Link>
                    </>
                  )}
                </>
              )}


              {/* Logged in as an admin: explain why there is no Enroll button */}
              {adminLoggedIn && (
                <div className="notice">
                  <p>
                    You are logged in as an administrator. Only students
                    can enroll in courses.
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

