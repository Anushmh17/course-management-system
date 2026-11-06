import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaBook, FaEye, FaGraduationCap, FaSearch } from "react-icons/fa";

import api from "../services/api";
import { getUser } from "../services/auth";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function StudentDashboard() {
  const [enrollments, setEnrollments] = useState([]);
  const [stats, setStats] = useState({
    courseCount: 0,
    studentCount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = getUser();

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [enrollmentsResponse, statsResponse] = await Promise.all([
          api.get("/enrollments/my"),
          api.get("/courses/stats"),
        ]);

        setEnrollments(enrollmentsResponse.data.enrollments);

        setStats({
          courseCount: statsResponse.data.courseCount,
          studentCount: statsResponse.data.studentCount,
        });
      } catch (err) {
        setError(
          err.response?.data?.message ||
          "Failed to load your dashboard"
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  // CR-011: Ensure pending enrollments are not counted as confirmed enrollments
  const approvedEnrollments = enrollments.filter((e) => e.status === "approved");
  const pendingEnrollments = enrollments.filter((e) => e.status === "pending");

  // Only show the 5 most recent enrollments on the dashboard
  const recentEnrollments = enrollments.slice(0, 5);

  const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString();
  };

  // Only sum value of confirmed / approved courses
  const totalValue = approvedEnrollments.reduce((acc, enrollment) => {
    const price = Number(enrollment.price);
    return acc + (isNaN(price) ? 0 : price);
  }, 0);

  return (
    <>
      <Navbar />

      <div className="container">
        {/* ---------- Welcome ---------- */}
        <div className="page-header">
          <div>
            <h1>Student Dashboard</h1>
            <p className="page-subtitle">
              Welcome back, {user?.full_name || user?.username}!
            </p>
          </div>

          <Link to="/courses" className="btn btn-primary">
            <FaSearch />
            Browse Courses
          </Link>
        </div>

        {/* ---------- Error ---------- */}
        {error && <p className="error">{error}</p>}

        {/* ---------- Stat cards (CR-011 updated counters) ---------- */}
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {loading ? "..." : approvedEnrollments.length}
            </span>
            <span className="dashboard-card-label">
              Enrolled Courses (Confirmed)
            </span>
          </div>

          <div
            className="dashboard-card"
            style={
              pendingEnrollments.length > 0
                ? { borderColor: "#fde68a", backgroundColor: "#fffbeb" }
                : {}
            }
          >
            <span
              className="dashboard-card-value"
              style={pendingEnrollments.length > 0 ? { color: "#b45309" } : {}}
            >
              {loading ? "..." : pendingEnrollments.length}
            </span>
            <span className="dashboard-card-label">
              Pending Approval
            </span>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {loading ? "..." : stats.courseCount}
            </span>
            <span className="dashboard-card-label">
              Courses Available
            </span>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {loading ? "..." : `Rs. ${totalValue}`}
            </span>
            <span className="dashboard-card-label">
              Total Enrolled Value
            </span>
          </div>
        </div>

        {/* ---------- Recent enrollments ---------- */}
        <section className="section-card">
          <div className="section-card-header">
            <h2>My Recent Enrollments & Requests</h2>

            <Link to="/my-enrollments" className="link-inline">
              <FaEye /> View all
            </Link>
          </div>

          {loading && <p className="loading">Loading...</p>}

          {!loading && recentEnrollments.length === 0 && (
            <p className="empty">
              You have not enrolled in or requested any courses yet. Head over
              to the courses page to find a course!
            </p>
          )}

          {!loading && recentEnrollments.length > 0 && (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Category</th>
                    <th>Level</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>
                  {recentEnrollments.map((enrollment) => (
                    <tr key={enrollment.id}>
                      <td>
                        <Link to={`/courses/${enrollment.course_id}`}>
                          {enrollment.title}
                        </Link>
                      </td>
                      <td>{enrollment.category}</td>
                      <td>{enrollment.level}</td>
                      <td>
                        {enrollment.status === "approved" && (
                          <span className="tag tag-approved">Approved</span>
                        )}
                        {enrollment.status === "pending" && (
                          <span className="tag tag-pending">Pending</span>
                        )}
                        {enrollment.status === "rejected" && (
                          <span className="tag tag-rejected">Rejected</span>
                        )}
                      </td>
                      <td>{formatDate(enrollment.enrolled_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ---------- Quick actions ---------- */}
        <section className="section-card">
          <div className="section-card-header">
            <h2>Quick Actions</h2>
          </div>

          <div className="quick-actions">
            <Link to="/courses" className="quick-action">
              <span className="quick-action-icon">
                <FaBook />
              </span>
              <span>Browse all courses</span>
            </Link>

            <Link to="/my-enrollments" className="quick-action">
              <span className="quick-action-icon">
                <FaGraduationCap />
              </span>
              <span>View my enrollments & requests</span>
            </Link>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}

export default StudentDashboard;
