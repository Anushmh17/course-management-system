import { Navigate, useLocation } from "react-router-dom";

import { getUser, getToken } from "../services/auth";


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

    // A student who opens /admin is sent to the student area and the
    // other way around.
    const fallback =
      user.role === "admin" ? "/admin" : "/student";

    return <Navigate to={fallback} replace />;
  }


  // ---------- 3. Allowed ----------
  return children;
}

export default ProtectedRoute;

