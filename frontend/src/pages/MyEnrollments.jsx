import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaSearch, FaRedo } from "react-icons/fa";

import api from "../services/api";
import { getUser } from "../services/auth";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function MyEnrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [sortBy, setSortBy] = useState("newest");
  const [statusFilter, setStatusFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  const user = getUser();

  // ---------- Load the logged-in student's enrollments ----------
  useEffect(() => {
    const getEnrollments = async () => {
      try {
        const response = await api.get("/enrollments/my");
        setEnrollments(response.data.enrollments);
      } catch (err) {
        setError(
          err.response?.data?.message ||
          "Failed to load your enrollments"
        );
      } finally {
        setLoading(false);
      }
    };

    getEnrollments();
  }, []);

  // Handle self-service enrollment / request cancellation (CR-011 FR-19)
  const handleCancelEnrollment = async (enrollment) => {
    const actionLabel =
      enrollment.status === "pending"
        ? "cancel this pending request"
        : enrollment.status === "rejected"
        ? "dismiss this rejected record"
        : "cancel this confirmed enrollment";

    const isConfirmed = window.confirm(
      `Are you sure you want to ${actionLabel} for "${enrollment.title}"?`
    );

    if (!isConfirmed) return;

    setError("");
    setSuccessMessage("");
    setCancellingId(enrollment.id);

    try {
      const response = await api.delete(`/enrollments/my/${enrollment.id}`);
      setSuccessMessage(
        response.data?.message || "Enrollment cancelled successfully."
      );

      // Refresh list without full page reload
      setEnrollments((prev) => prev.filter((e) => e.id !== enrollment.id));
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to cancel enrollment. Please try again."
      );
    } finally {
      setCancellingId(null);
    }
  };

  // Format date helper
  const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString();
  };

  // Derived metrics (CR-011: pending enrollments are not counted as confirmed enrollments)
  const approvedEnrollments = enrollments.filter((e) => e.status === "approved");
  const pendingEnrollments = enrollments.filter((e) => e.status === "pending");
  const rejectedEnrollments = enrollments.filter((e) => e.status === "rejected");

  const totalConfirmed = approvedEnrollments.length;
  const totalPending = pendingEnrollments.length;
  const totalRejected = rejectedEnrollments.length;

  const totalValue = approvedEnrollments.reduce((acc, enrollment) => {
    const price = Number(enrollment.price);
    return acc + (isNaN(price) ? 0 : price);
  }, 0);

  const averagePrice = totalConfirmed > 0 ? (totalValue / totalConfirmed).toFixed(2) : 0;
  const distinctCategories = new Set(
    approvedEnrollments.map((e) => e.category).filter(Boolean)
  ).size;

  // Filter by status
  const filteredEnrollments = enrollments.filter((enrollment) => {
    if (statusFilter === "all") return true;
    return enrollment.status === statusFilter;
  });

  // Sorting
  const getSortedEnrollments = () => {
    const sorted = [...filteredEnrollments];
    sorted.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.enrolled_at) - new Date(a.enrolled_at);
        case "oldest":
          return new Date(a.enrolled_at) - new Date(b.enrolled_at);
        case "price-high-low": {
          const pA = isNaN(Number(a.price)) ? 0 : Number(a.price);
          const pB = isNaN(Number(b.price)) ? 0 : Number(b.price);
          return pB - pA;
        }
        case "price-low-high": {
          const pA = isNaN(Number(a.price)) ? 0 : Number(a.price);
          const pB = isNaN(Number(b.price)) ? 0 : Number(b.price);
          return pA - pB;
        }
        case "title-a-z":
          return (a.title || "").localeCompare(b.title || "");
        default:
          return 0;
      }
    });
    return sorted;
  };

  const sortedEnrollments = getSortedEnrollments();

  return (
    <>
      <Navbar />

      <div className="container">
        <div className="page-header">
          <div>
            <h1>My Enrollments</h1>
            <p className="page-subtitle">
              {user?.full_name
                ? `${user.full_name}, view your enrolled courses and pending requests.`
                : "View your enrolled courses and pending requests."}
            </p>
          </div>

          <Link to="/courses" className="btn btn-primary">
            <FaSearch />
            Browse More Courses
          </Link>
        </div>

        {/* ---------- Loading ---------- */}
        {loading && <p className="loading">Loading your enrollments...</p>}

        {/* ---------- Success message ---------- */}
        {successMessage && (
          <div
            className="alert alert-success"
            role="alert"
            style={{
              padding: "12px 16px",
              marginBottom: "20px",
              backgroundColor: "var(--color-success-bg, #dcfce7)",
              color: "var(--color-success-text, #166534)",
              border: "1px solid #bbf7d0",
              borderRadius: "8px",
              fontWeight: "500",
            }}
          >
            {successMessage}
          </div>
        )}

        {/* ---------- Error ---------- */}
        {error && !loading && <p className="error">{error}</p>}

        {/* ---------- Empty state ---------- */}
        {!loading && !error && enrollments.length === 0 && (
          <div className="empty-box">
            <p className="empty">
              You have not requested or enrolled in any courses yet.
            </p>
            <Link to="/courses" className="btn btn-primary">
              <FaSearch />
              Find a Course
            </Link>
          </div>
        )}

        {/* ---------- Summary & Filter Controls ---------- */}
        {!loading && !error && enrollments.length > 0 && (
          <div
            className="enrollments-summary-sorting"
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "24px",
              flexWrap: "wrap",
              gap: "16px",
              background: "#ffffff",
              padding: "18px 20px",
              borderRadius: "var(--radius)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div className="summary-stats">
              <p>
                <strong>Confirmed Enrolled Courses:</strong> {totalConfirmed}
              </p>
              <p>
                <strong>Pending Requests:</strong> {totalPending}
              </p>
              {totalRejected > 0 && (
                <p>
                  <strong>Rejected Requests:</strong> {totalRejected}
                </p>
              )}
              <p>
                <strong>Total Value (Confirmed):</strong> Rs. {totalValue}
              </p>
              <p>
                <strong>Average Price:</strong> Rs. {averagePrice}
              </p>
              <p>
                <strong>Distinct Categories:</strong> {distinctCategories}
              </p>
            </div>

            <div
              className="sort-controls"
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              <div>
                <label htmlFor="status-filter" style={{ marginRight: "10px", fontWeight: "600" }}>
                  Status:
                </label>
                <select
                  id="status-filter"
                  className="input"
                  style={{ width: "auto", display: "inline-block" }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All ({enrollments.length})</option>
                  <option value="approved">Approved ({totalConfirmed})</option>
                  <option value="pending">Pending ({totalPending})</option>
                  <option value="rejected">Rejected ({totalRejected})</option>
                </select>
              </div>

              <div>
                <label htmlFor="sort-by" style={{ marginRight: "10px", fontWeight: "600" }}>
                  Sort By:
                </label>
                <select
                  id="sort-by"
                  className="input"
                  style={{ width: "auto", display: "inline-block" }}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="price-high-low">Price: High to Low</option>
                  <option value="price-low-high">Price: Low to High</option>
                  <option value="title-a-z">Course Title: A to Z</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ---------- Enrollment cards ---------- */}
        {!loading && !error && filteredEnrollments.length === 0 && enrollments.length > 0 && (
          <p className="empty">No courses found matching the selected status filter.</p>
        )}

        {!loading && !error && sortedEnrollments.length > 0 && (
          <div className="course-grid">
            {sortedEnrollments.map((enrollment) => (
              <article className="course-card" key={enrollment.id}>
                <img
                  src={enrollment.image}
                  alt={enrollment.title}
                  className="course-card-image"
                  loading="lazy"
                />

                <div className="course-card-body">
                  <div className="course-card-tags">
                    <span className="tag tag-category">{enrollment.category}</span>
                    <span className="tag tag-level">{enrollment.level}</span>

                    {/* CR-011: Status Labels (Approved, Pending Approval, Rejected) */}
                    {enrollment.status === "approved" && (
                      <span className="tag tag-approved">Approved</span>
                    )}
                    {enrollment.status === "pending" && (
                      <span className="tag tag-pending">Pending Approval</span>
                    )}
                    {enrollment.status === "rejected" && (
                      <span className="tag tag-rejected">Rejected</span>
                    )}
                  </div>

                  <h3 className="course-card-title">{enrollment.title}</h3>

                  <p className="course-card-summary">
                    {enrollment.description?.slice(0, 100)}
                    {enrollment.description?.length > 100 ? "..." : ""}
                  </p>

                  {/* Status specific notices */}
                  {enrollment.status === "pending" && (
                    <div
                      style={{
                        padding: "8px 12px",
                        backgroundColor: "#fefce8",
                        border: "1px solid #fef08a",
                        borderRadius: "6px",
                        color: "#854d0e",
                        fontSize: "0.85rem",
                        marginBottom: "10px",
                        fontWeight: "500",
                      }}
                    >
                      ⏳ Request Pending Approval
                    </div>
                  )}

                  {enrollment.status === "rejected" && (
                    <div
                      style={{
                        padding: "8px 12px",
                        backgroundColor: "#fef2f2",
                        border: "1px solid #fecaca",
                        borderRadius: "6px",
                        color: "#991b1b",
                        fontSize: "0.85rem",
                        marginBottom: "10px",
                      }}
                    >
                      <div>
                        <strong>Reason:</strong>{" "}
                        {enrollment.rejection_reason || "No reason specified"}
                      </div>
                      {enrollment.reviewed_at && (
                        <div style={{ fontSize: "0.75rem", marginTop: "4px", color: "#b91c1c" }}>
                          Reviewed on: {formatDate(enrollment.reviewed_at)}
                        </div>
                      )}
                    </div>
                  )}

                  <ul className="course-card-meta">
                    <li>
                      <strong>Duration:</strong> {enrollment.duration}
                    </li>
                    <li>
                      <strong>Price:</strong> Rs. {enrollment.price}
                    </li>
                    <li>
                      <strong>
                        {enrollment.status === "approved"
                          ? "Enrolled on:"
                          : "Requested on:"}
                      </strong>{" "}
                      {formatDate(enrollment.enrolled_at)}
                    </li>
                  </ul>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      marginTop: "14px",
                    }}
                  >
                    <Link
                      to={`/courses/${enrollment.course_id}`}
                      className="btn btn-outline btn-block"
                    >
                      View Course
                    </Link>

                    {enrollment.status === "pending" && (
                      <button
                        type="button"
                        className="btn btn-danger btn-block"
                        onClick={() => handleCancelEnrollment(enrollment)}
                        disabled={cancellingId === enrollment.id}
                        aria-label={`Cancel request for ${enrollment.title}`}
                      >
                        {cancellingId === enrollment.id ? "Cancelling..." : "Cancel Request"}
                      </button>
                    )}

                    {enrollment.status === "approved" && (
                      <button
                        type="button"
                        className="btn btn-danger btn-block"
                        onClick={() => handleCancelEnrollment(enrollment)}
                        disabled={cancellingId === enrollment.id}
                        aria-label={`Cancel enrollment for ${enrollment.title}`}
                      >
                        {cancellingId === enrollment.id ? "Cancelling..." : "Cancel Enrollment"}
                      </button>
                    )}

                    {enrollment.status === "rejected" && (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <Link
                          to={`/courses/${enrollment.course_id}`}
                          className="btn btn-primary"
                          style={{ flex: 1 }}
                        >
                          <FaRedo /> Re-apply
                        </Link>
                        <button
                          type="button"
                          className="btn btn-danger"
                          style={{ flex: 1 }}
                          onClick={() => handleCancelEnrollment(enrollment)}
                          disabled={cancellingId === enrollment.id}
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}

export default MyEnrollments;
