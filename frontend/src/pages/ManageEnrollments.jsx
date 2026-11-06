import { useEffect, useState } from "react";
import { FaCheck, FaTimes, FaTrash } from "react-icons/fa";

import api from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function ManageEnrollments() {
  // Course list - used to fill the "filter by course" dropdown
  const [courses, setCourses] = useState([]);

  // "" means "show every enrollment"
  const [selectedCourseId, setSelectedCourseId] = useState("");

  // Status filter: "all", "pending", "approved", "rejected" (CR-011 API Requirements)
  const [selectedStatus, setSelectedStatus] = useState("all");

  // The enrollments currently shown in the table
  const [enrollments, setEnrollments] = useState([]);

  // When one course is selected the backend also returns the course
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Rejection modal state (CR-011 Frontend Req 5, 6)
  const [rejectingEnrollment, setRejectingEnrollment] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionError, setRejectionError] = useState("");

  // Reload trigger
  const [reloadKey, setReloadKey] = useState(0);

  // ---------- Load course dropdown options (once) ----------
  useEffect(() => {
    const loadCourseOptions = async () => {
      try {
        const response = await api.get("/courses");
        setCourses(response.data.courses);
      } catch (err) {
        console.error("Could not load course options:", err.message);
      }
    };

    loadCourseOptions();
  }, []);

  // ---------- Load enrollments table (with ?status= filtering) ----------
  useEffect(() => {
    const loadEnrollments = async () => {
      setLoading(true);
      setError("");

      try {
        const queryParams = [];
        if (selectedStatus && selectedStatus !== "all") {
          queryParams.push(`status=${selectedStatus}`);
        }
        const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";

        if (selectedCourseId === "") {
          // All courses
          const response = await api.get(`/enrollments${queryString}`);
          setEnrollments(response.data.enrollments);
          setSelectedCourse(null);
        } else {
          // Specific course
          const response = await api.get(
            `/enrollments/course/${selectedCourseId}${queryString}`
          );
          setEnrollments(response.data.enrollments);
          setSelectedCourse(response.data.course);
        }
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load enrollments"
        );
        setEnrollments([]);
      } finally {
        setLoading(false);
      }
    };

    loadEnrollments();
  }, [selectedCourseId, selectedStatus, reloadKey]);

  // ---------- Approve an enrollment request (CR-011 FR-7) ----------
  const handleApprove = async (enrollment) => {
    const confirmed = window.confirm(
      `Approve enrollment request for ${enrollment.full_name || enrollment.username}${
        enrollment.title ? ` in "${enrollment.title}"` : ""
      }?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setProcessingId(enrollment.id);

    try {
      const response = await api.patch(`/enrollments/${enrollment.id}/status`, {
        status: "approved",
      });

      setSuccess(response.data.message || "Enrollment request approved successfully.");
      setReloadKey((prev) => prev + 1);
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not approve the enrollment request."
      );
    } finally {
      setProcessingId(null);
    }
  };

  // ---------- Open Rejection Modal (CR-011 FR-8, FR-9) ----------
  const openRejectModal = (enrollment) => {
    setRejectingEnrollment(enrollment);
    setRejectionReason("");
    setRejectionError("");
  };

  const closeRejectModal = () => {
    setRejectingEnrollment(null);
    setRejectionReason("");
    setRejectionError("");
  };

  // ---------- Submit Rejection with Reason (CR-011 FR-8, FR-9) ----------
  const handleConfirmReject = async (e) => {
    e.preventDefault();

    if (!rejectionReason.trim()) {
      setRejectionError("A rejection reason is required.");
      return;
    }

    setError("");
    setSuccess("");
    setProcessingId(rejectingEnrollment.id);

    try {
      const response = await api.patch(
        `/enrollments/${rejectingEnrollment.id}/status`,
        {
          status: "rejected",
          reason: rejectionReason.trim(),
        }
      );

      setSuccess(
        response.data.message || "Enrollment request rejected successfully."
      );
      closeRejectModal();
      setReloadKey((prev) => prev + 1);
    } catch (err) {
      setRejectionError(
        err.response?.data?.message || "Could not reject the enrollment request."
      );
    } finally {
      setProcessingId(null);
    }
  };

  // ---------- Delete an enrollment (Admin action - FR-18) ----------
  const handleDelete = async (enrollment) => {
    const confirmed = window.confirm(
      `Permanently remove ${enrollment.full_name || enrollment.username}${
        enrollment.title ? ` from "${enrollment.title}"` : ""
      }?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      const response = await api.delete(`/enrollments/${enrollment.id}`);
      setSuccess(response.data.message || "Enrollment deleted successfully.");
      setReloadKey((prev) => prev + 1);
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not delete the enrollment."
      );
    }
  };

  // Format date helper
  const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString();
  };

  return (
    <>
      <Navbar />

      <div className="container">
        <div className="page-header">
          <div>
            <h1>Manage Enrollments</h1>
            <p className="page-subtitle">
              Review and approve pending student enrollment requests, view approved
              students, and manage enrollments.
            </p>
          </div>
        </div>

        {/* ---------- Filters: Course & Status ---------- */}
        <div
          className="filter-bar filter-bar-admin"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div className="form-group">
            <label htmlFor="courseFilter">Filter by Course</label>
            <select
              id="courseFilter"
              className="input"
              value={selectedCourseId}
              onChange={(e) => {
                setSuccess("");
                setSelectedCourseId(e.target.value);
              }}
            >
              <option value="">All courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="statusFilter">Filter by Status</label>
            <select
              id="statusFilter"
              className="input"
              value={selectedStatus}
              onChange={(e) => {
                setSuccess("");
                setSelectedStatus(e.target.value);
              }}
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* ---------- Messages ---------- */}
        {success && <p className="success">{success}</p>}
        {error && <p className="error">{error}</p>}

        {/* ---------- Table ---------- */}
        <section className="section-card">
          <div className="section-card-header">
            <h2>
              {selectedCourse
                ? `Enrollments for "${selectedCourse.title}"`
                : "Enrollment Requests & Records"}
              {!loading && ` (${enrollments.length})`}
            </h2>
          </div>

          {loading && <p className="loading">Loading enrollments...</p>}

          {!loading && enrollments.length === 0 && (
            <p className="empty">
              {selectedStatus !== "all"
                ? `No ${selectedStatus} enrollments found.`
                : selectedCourseId === ""
                ? "No enrollments or requests have been made yet."
                : "No students match the criteria for this course."}
            </p>
          )}

          {!loading && enrollments.length > 0 && (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Username</th>
                    {selectedCourseId === "" && <th>Course</th>}
                    {selectedCourseId === "" && <th>Category</th>}
                    <th>Status</th>
                    <th>Date</th>
                    <th>Review / Reason</th>
                    <th className="table-actions-column">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {enrollments.map((enrollment) => (
                    <tr key={enrollment.id}>
                      <td>{enrollment.full_name}</td>
                      <td>{enrollment.username}</td>

                      {selectedCourseId === "" && <td>{enrollment.title}</td>}
                      {selectedCourseId === "" && (
                        <td>
                          <span className="tag tag-category">{enrollment.category}</span>
                        </td>
                      )}

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

                      <td>
                        <div style={{ fontSize: "0.85rem" }}>
                          {formatDate(enrollment.enrolled_at)}
                        </div>
                      </td>

                      <td>
                        {enrollment.status === "rejected" && (
                          <div style={{ fontSize: "0.85rem", color: "#991b1b" }}>
                            <strong>Reason:</strong>{" "}
                            {enrollment.rejection_reason || "None specified"}
                          </div>
                        )}
                        {enrollment.reviewed_by && (
                          <div className="review-info-text">
                            Reviewed by {enrollment.reviewer_name || "Admin"} on{" "}
                            {formatDate(enrollment.reviewed_at)}
                          </div>
                        )}
                        {enrollment.status === "pending" && (
                          <span style={{ fontSize: "0.85rem", color: "#854d0e" }}>
                            Awaiting Review
                          </span>
                        )}
                      </td>

                      <td>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          {/* CR-011: Pending requests can be Approved or Rejected */}
                          {enrollment.status === "pending" && (
                            <>
                              <button
                                type="button"
                                className="btn btn-small btn-success"
                                onClick={() => handleApprove(enrollment)}
                                disabled={processingId === enrollment.id}
                                title="Approve Request"
                              >
                                <FaCheck /> Approve
                              </button>

                              <button
                                type="button"
                                className="btn btn-small btn-warning"
                                onClick={() => openRejectModal(enrollment)}
                                disabled={processingId === enrollment.id}
                                title="Reject Request"
                              >
                                <FaTimes /> Reject
                              </button>
                            </>
                          )}

                          {/* Deletion remains available to administrators (FR-18) */}
                          <button
                            type="button"
                            className="btn btn-small btn-danger"
                            onClick={() => handleDelete(enrollment)}
                            disabled={processingId === enrollment.id}
                            title="Delete Record"
                          >
                            <FaTrash /> Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ---------- Rejection Modal (CR-011 Frontend Req 5, 6) ---------- */}
        {rejectingEnrollment && (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-card">
              <div className="modal-header">
                <h3>Reject Enrollment Request</h3>
                <button
                  type="button"
                  className="btn btn-small btn-outline"
                  onClick={closeRejectModal}
                  style={{ border: "none", fontSize: "1.2rem", padding: "4px 8px" }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleConfirmReject}>
                <div className="modal-body">
                  <p style={{ marginTop: 0, marginBottom: "14px" }}>
                    Reject enrollment request for{" "}
                    <strong>
                      {rejectingEnrollment.full_name || rejectingEnrollment.username}
                    </strong>{" "}
                    in{" "}
                    <strong>
                      {rejectingEnrollment.title || "this course"}
                    </strong>
                    .
                  </p>

                  <div className="form-group">
                    <label
                      htmlFor="rejectionReasonInput"
                      style={{ fontWeight: "600", marginBottom: "6px", display: "block" }}
                    >
                      Rejection Reason <span style={{ color: "red" }}>*</span>
                    </label>
                    <textarea
                      id="rejectionReasonInput"
                      className="modal-textarea"
                      placeholder="e.g., Required prerequisite is missing, Course eligibility criteria not satisfied..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>

                  {rejectionError && (
                    <p className="error" style={{ marginTop: "10px", marginBottom: 0 }}>
                      {rejectionError}
                    </p>
                  )}
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={closeRejectModal}
                    disabled={processingId === rejectingEnrollment.id}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-danger"
                    disabled={
                      processingId === rejectingEnrollment.id ||
                      !rejectionReason.trim()
                    }
                  >
                    {processingId === rejectingEnrollment.id
                      ? "Rejecting..."
                      : "Confirm Rejection"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}

export default ManageEnrollments;
