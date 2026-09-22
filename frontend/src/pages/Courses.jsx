import { useEffect, useState } from "react";

import api from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CourseCard from "../components/CourseCard";

function Courses() {

  const [courses, setCourses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");


  // ---------- Load courses from the backend ----------
  useEffect(() => {

    const getCourses = async () => {

      try {

        const response = await api.get("/courses");

        // The backend always puts the array inside "courses".
        setCourses(response.data.courses);

      } catch (error) {

        setError(
          error.response?.data?.message ||
          "Failed to load courses"
        );

      } finally {

        setLoading(false);

      }
    };

    getCourses();

  }, []);


  // ---------- Build the category list from the loaded courses ----------
  const categories = [
    "All",
    ...new Set(courses.map((course) => course.category)),
  ];


  // ---------- Apply the search text and category filter ----------
  const filteredCourses = courses.filter((course) => {

    const matchesSearch =
      course.title.toLowerCase().includes(searchText.toLowerCase()) ||
      course.category.toLowerCase().includes(searchText.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" ||
      course.category === selectedCategory;

    // Keep the course only if BOTH filters match
    return matchesSearch && matchesCategory;
  });


  return (

    <>
      <Navbar />

      <div className="container">

        <div className="page-header">

          <div>
            <h1>Our Courses</h1>
            <p className="page-subtitle">
              Browse the full catalogue and view the details of any course.
            </p>
          </div>

        </div>


        {/* ---------- Filters ---------- */}

        {!loading && !error && courses.length > 0 && (

          <div className="filter-bar">

            <input
              type="text"
              className="input"
              placeholder="Search by course name or category..."
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />

            <select
              className="input"
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

          </div>

        )}


        {/* ---------- Loading state ---------- */}

        {loading && (
          <p className="loading">Loading courses...</p>
        )}


        {/* ---------- Error state ---------- */}

        {error && !loading && (
          <p className="error">{error}</p>
        )}


        {/* ---------- Empty state ---------- */}

        {!loading && !error && courses.length === 0 && (
          <p className="empty">
            There are no courses available at the moment.
          </p>
        )}


        {!loading && !error && courses.length > 0 && filteredCourses.length === 0 && (
          <p className="empty">
            No courses match your search. Try a different keyword.
          </p>
        )}


        {/* ---------- Course list ---------- */}

        {!loading && !error && filteredCourses.length > 0 && (

          <>
            <p className="result-count">
              Showing {filteredCourses.length} of {courses.length} courses
            </p>

            <div className="course-grid">
              {filteredCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </>

        )}

      </div>

      <Footer />

    </>
  );
}

export default Courses;
