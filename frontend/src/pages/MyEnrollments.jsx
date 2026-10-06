import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaSearch } from "react-icons/fa";

import api from "../services/api";
import { getUser } from "../services/auth";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";


function MyEnrollments() {

  const [enrollments, setEnrollments] = useState([]);
  const [sortBy, setSortBy] = useState("newest");

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

  const totalCourses = enrollments.length;
  const totalValue = enrollments.reduce((acc, enrollment) => {
    const price = Number(enrollment.price);
    return acc + (isNaN(price) ? 0 : price);
  }, 0);
  const averagePrice = totalCourses > 0 ? (totalValue / totalCourses).toFixed(2) : 0;
  const distinctCategories = new Set(enrollments.map((e) => e.category).filter(Boolean)).size;

  const getSortedEnrollments = () => {
    const sorted = [...enrollments];
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


        {/* ---------- Summary & Sorting ---------- */}

        {!loading && !error && (
          <div className="enrollments-summary-sorting" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div className="summary-stats">
              <p>Total Enrolled Courses: {totalCourses}</p>
              <p>Total Value: Rs. {totalValue}</p>
              <p>Average Price: Rs. {averagePrice}</p>
              <p>Distinct Categories: {distinctCategories}</p>
            </div>
            
            <div className="sort-controls">
              <label htmlFor="sort-by" style={{ marginRight: '10px' }}>Sort By:</label>
              <select 
                id="sort-by" 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest Enrolled</option>
                <option value="oldest">Oldest Enrolled</option>
                <option value="price-high-low">Price: High to Low</option>
                <option value="price-low-high">Price: Low to High</option>
                <option value="title-a-z">Course Title: A to Z</option>
              </select>
            </div>
          </div>
        )}

        {/* ---------- Enrollment cards ---------- */}

        {!loading && !error && enrollments.length > 0 && (

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
