import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaBook,
  FaChartBar,
  FaClock,
  FaSearch,
  FaUsers,
} from "react-icons/fa";

import api from "../services/api";
import { getUser } from "../services/auth";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function AdminDashboard() {
  const [stats, setStats] = useState({
    courseCount: 0,
    studentCount: 0,
  });

  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = getUser();

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [statsResponse, enrollmentsResponse] = await Promise.all([
          api.get("/courses/stats"),
          api.get("/enrollments"),
        ]);

        setStats({
          courseCount: statsResponse.data.courseCount,
          studentCount: statsResponse.data.studentCount,
        });

        setEnrollments(enrollmentsResponse.data.enrollments);
      } catch (err) {
        setError(
          err.response?.data?.message ||
          "Failed to load the dashboard data"
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  // ---------- Derived values (CR-011: Distinguish pending and approved) ----------
  const confirmedEnrollments = enrollments.filter(
    (enrollment) => enrollment.status === "approved"
  );
  const pendingRequests = enrollments.filter(
    (enrollment) => enrollment.status === "pending"
  );

  // How many DIFFERENT students have at least one CONFIRMED enrollment
  const uniqueStudents = new Set(
    confirmedEnrollments.map((enrollment) => enrollment.student_id)
  ).size;

  // The 6 most recent enrollments
  const recentEnrollments = enrollments.slice(0, 6);

  const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString();
  };

  return (
    <>
      <Navbar />

      <div className="container">
        {/* ---------- Welcome ---------- */}
        <div className="page-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p className="page-subtitle">
              Welcome back, {user?.full_name || user?.username}. Here is an
              overview of the system.
            </p>
          </div>

          <Link to="/admin/courses" className="btn btn-primary">
            <FaChartBar />
            Manage Courses
          </Link>
        </div>

        {error && <p className="error">{error}</p>}

        {/* ---------- Stat cards (CR-011: Updated dashboard counters) ---------- */}
        <div
          className="dashboard-grid"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          }}
        >
          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {loading ? "..." : stats.courseCount}
            </span>
            <span className="dashboard-card-label">Total Courses</span>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {loading ? "..." : stats.studentCount}
            </span>
            <span className="dashboard-card-label">Total Students</span>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {loading ? "..." : confirmedEnrollments.length}
            </span>
            <span className="dashboard-card-label">Confirmed Enrollments</span>
          </div>

          <div
            className="dashboard-card"
            style={
              pendingRequests.length > 0
                ? { borderColor: "#fde68a", backgroundColor: "#fffbeb" }
                : {}
            }
          >
            <span
              className="dashboard-card-value"
              style={pendingRequests.length > 0 ? { color: "#b45309" } : {}}
            >
              {loading ? "..." : pendingRequests.length}
            </span>
            <span className="dashboard-card-label">Pending Requests</span>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {loading ? "..." : uniqueStudents}
            </span>
            <span className="dashboard-card-label">Students with Enrollments</span>
          </div>
        </div>

        {/* ---------- Pending Requests Notification Banner ---------- */}
        {!loading && pendingRequests.length > 0 && (
          <div
            className="status-banner status-banner-pending"
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "16px",
            }}
          >
            <div>
              <strong>Action Needed:</strong> You have {pendingRequests.length}{" "}
              pending student enrollment request{pendingRequests.length > 1 ? "s" : ""}{" "}
              awaiting review.
            </div>
            <Link
              to="/admin/enrollments?status=pending"
              className="btn btn-small btn-primary"
            >
              <FaClock /> Review Pending
            </Link>
          </div>
        )}

        {/* ---------- Recent enrollments ---------- */}
        <section className="section-card">
          <div className="section-card-header">
            <h2>Recent Enrollments & Requests</h2>
            <Link to="/admin/enrollments" className="link-inline">
              Manage enrollments
            </Link>
          </div>

          {loading && <p className="loading">Loading...</p>}

          {!loading && recentEnrollments.length === 0 && (
            <p className="empty">No enrollments or requests have been made yet.</p>
          )}

          {!loading && recentEnrollments.length > 0 && (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Username</th>
                    <th>Course</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>
                  {recentEnrollments.map((enrollment) => (
                    <tr key={enrollment.id}>
                      <td>{enrollment.full_name}</td>
                      <td>{enrollment.username}</td>
                      <td>{enrollment.title}</td>
                      <td>{enrollment.category}</td>
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

        {/* ---------- Admin shortcuts ---------- */}
        <section className="section-card">
          <div className="section-card-header">
            <h2>Administration</h2>
          </div>

          <div className="quick-actions">
            <Link to="/admin/courses" className="quick-action">
              <span className="quick-action-icon">
                <FaBook />
              </span>
              <span>Add, edit and delete courses</span>
            </Link>

            <Link to="/admin/enrollments" className="quick-action">
              <span className="quick-action-icon">
                <FaUsers />
              </span>
              <span>View, approve, and remove enrollments</span>
            </Link>

            <Link to="/courses" className="quick-action">
              <span className="quick-action-icon">
                <FaSearch />
              </span>
              <span>See the public course list</span>
            </Link>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}

export default AdminDashboard;
