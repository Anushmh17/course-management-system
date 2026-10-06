import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";

// ---------- Public pages ----------
import Home from "./pages/Home";
import Login from "./pages/Login";
import Courses from "./pages/Courses";
import CourseDetails from "./pages/CourseDetails";

// ---------- Student pages ----------
import StudentDashboard from "./pages/StudentDashboard";
import MyEnrollments from "./pages/MyEnrollments";

// ---------- Admin pages ----------
import AdminDashboard from "./pages/AdminDashboard";
import ManageCourses from "./pages/ManageCourses";
import ManageEnrollments from "./pages/ManageEnrollments";

// ---------- Other ----------
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

import "./App.css";

function SessionExpiredListener() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleExpired = (event) => {
      const from = event.detail?.from;
      navigate("/login", {
        state: { from, sessionExpired: true },
        replace: true,
      });
    };

    window.addEventListener("cms:session_expired", handleExpired);
    return () => {
      window.removeEventListener("cms:session_expired", handleExpired);
    };
  }, [navigate]);

  return null;
}

function App() {

  return (

    <BrowserRouter>
      <SessionExpiredListener />

      <Routes>


        {/* PUBLIC ROUTES - no login needed */}

        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/courses" element={<Courses />} />

        <Route path="/courses/:id" element={<CourseDetails />} />


        {/* STUDENT ROUTES - login required, role = student */}

        <Route
          path="/student"
          element={
            <ProtectedRoute role="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-enrollments"
          element={
            <ProtectedRoute role="student">
              <MyEnrollments />
            </ProtectedRoute>
          }
        />


       {/* ADMIN ROUTES - login required, role = admin */}

        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/courses"
          element={
            <ProtectedRoute role="admin">
              <ManageCourses />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/enrollments"
          element={
            <ProtectedRoute role="admin">
              <ManageEnrollments />
            </ProtectedRoute>
          }
        />


        {/* CATCH-ALL - anything else is a 404 */}

        <Route path="*" element={<NotFound />} />

      </Routes>

    </BrowserRouter>
  );
}

export default App;
