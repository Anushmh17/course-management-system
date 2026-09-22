import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaSearch } from "react-icons/fa";

import api from "../services/api";
import { getUser } from "../services/auth";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";


function MyEnrollments() {

  const [enrollments, setEnrollments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = getUser();


  // ---------- Load the logged-in student's enrollments ----------
  useEffect(() => {

    const getEnrollments = async () => {

      try {

        const response = await api.get("/enrollments/my");

        setEnrollments(response.data.enrollments);

      } catch (error) {

        setError(
          error.response?.data?.message ||
          "Failed to load your enrollments"
        );

      } finally {

        setLoading(false);

      }
    };

    getEnrollments();

  }, []);


  // Format "2026-09-21T10:15:00.000Z" into a readable date
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
            <h1>My Enrollments</h1>

            <p className="page-subtitle">
              {user?.full_name
                ? `${user.full_name}, these are the courses you are enrolled in.`
                : "These are the courses you are enrolled in."}
            </p>
          </div>

          <Link to="/courses" className="btn btn-primary">
            <FaSearch />
            Browse More Courses
          </Link>

        </div>


        {/* ---------- Loading ---------- */}

        {loading && (
          <p className="loading">Loading your enrollments...</p>
        )}


        {/* ---------- Error ---------- */}

        {error && !loading && (
          <p className="error">{error}</p>
        )}


        {/* ---------- Empty state ---------- */}

        {!loading && !error && enrollments.length === 0 && (
          <div className="empty-box">
            <p className="empty">
              You have not enrolled in any courses yet.
            </p>

            <Link to="/courses" className="btn btn-primary">
              <FaSearch />
              Find a Course
            </Link>
          </div>
        )}


        {/* ---------- Enrollment cards ---------- */}

        {!loading && !error && enrollments.length > 0 && (

          <div className="course-grid">

            {enrollments.map((enrollment) => (

              <article className="course-card" key={enrollment.id}>

                <img
                  src={enrollment.image}
                  alt={enrollment.title}
                  className="course-card-image"
                  loading="lazy"
                />

                <div className="course-card-body">

                  <div className="course-card-tags">
                    <span className="tag tag-category">
                      {enrollment.category}
                    </span>

                    <span className="tag tag-level">
                      {enrollment.level}
                    </span>
                  </div>


                  <h3 className="course-card-title">
                    {enrollment.title}
                  </h3>


                  <p className="course-card-summary">
                    {enrollment.description?.slice(0, 100)}
                    {enrollment.description?.length > 100 ? "..." : ""}
                  </p>


                  <ul className="course-card-meta">

                    <li>
                      <strong>Duration:</strong> {enrollment.duration}
                    </li>

                    <li>
                      <strong>Price:</strong> Rs. {enrollment.price}
                    </li>

                    <li>
                      <strong>Enrolled on:</strong>{" "}
                      {formatDate(enrollment.enrolled_at)}
                    </li>

                  </ul>


                  <Link
                    to={`/courses/${enrollment.course_id}`}
                    className="btn btn-outline btn-block"
                  >
                    View Course
                  </Link>

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
