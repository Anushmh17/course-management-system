import { Navigate, useLocation, Link } from "react-router-dom";
import { FaShieldAlt } from "react-icons/fa";

import { getUser, getToken } from "../services/auth";
import Navbar from "./Navbar";

function ProtectedRoute({ children, role }) {
  const location = useLocation();

  const token = getToken();
  const user = getUser();

  // ---------- 1. Not logged in ----------
  if (!token || !user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  // ---------- 2. Logged in but wrong role ----------
  if (role && user.role !== role) {
    // User remains logged in but receives an access-denied message
    const fallbackPath = user.role === "admin" ? "/admin" : "/student";
    const fallbackLabel =
      user.role === "admin" ? "Admin Dashboard" : "Student Area";

    return (
      <>
        <Navbar />
        <div
          className="container"
          style={{
            maxWidth: "600px",
            margin: "60px auto",
            padding: "30px",
            textAlign: "center",
            background: "#ffffff",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            border: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              fontSize: "48px",
              color: "#e53e3e",
              marginBottom: "16px",
            }}
          >
            <FaShieldAlt />
          </div>
          <h2 style={{ fontSize: "22px", marginBottom: "12px", color: "#2d3748" }}>
            Access Denied
          </h2>
          <p
            className="access-denied-message"
            style={{
              fontSize: "16px",
              color: "#4a5568",
              marginBottom: "24px",
              lineHeight: "1.5",
            }}
          >
            Access denied. You do not have permission to access this page.
          </p>
          <Link
            to={fallbackPath}
            className="btn btn-primary"
            style={{ textDecoration: "none" }}
          >
            Return to {fallbackLabel}
          </Link>
        </div>
      </>
    );
  }

  // ---------- 3. Allowed ----------
  return children;
}

export default ProtectedRoute;


