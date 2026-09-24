import { useEffect, useState } from "react";

import api from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CourseCard from "../components/CourseCard";

// Check if course ID matches search term (supports raw ID, numbers, and padded codes like C001, C1)
function matchesCourseId(courseId, term) {
  if (courseId === undefined || courseId === null) return false;
  const rawIdStr = String(courseId).trim().toLowerCase();
  if (rawIdStr === term) return true;

  const numericMatch = rawIdStr.match(/\d+/);
  if (numericMatch) {
    const numVal = parseInt(numericMatch[0], 10);
    const padded3 = `c${String(numVal).padStart(3, "0")}`;
    const padded4 = `c${String(numVal).padStart(4, "0")}`;
    const prefixed = `c${numVal}`;
    const padOnly3 = String(numVal).padStart(3, "0");
    const padOnly4 = String(numVal).padStart(4, "0");

    if (
      padded3 === term ||
      padded4 === term ||
      prefixed === term ||
      padded3.includes(term) ||
      padded4.includes(term) ||
      prefixed.includes(term) ||
      padOnly3 === term ||
      padOnly4 === term
    ) {
      return true;
    }
  }

  const termDigitsMatch = term.match(/^c0*(\d+)$/);
  if (termDigitsMatch) {
    const termNum = termDigitsMatch[1];
    if (rawIdStr === termNum) return true;
  }

  return false;
}

function Courses() {
  const [courses, setCourses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ---------- Filters ----------
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // ---------- Load courses from the backend ----------
  useEffect(() => {
    const getCourses = async () => {
      try {
        const response = await api.get("/courses");

        // Backend returns the course array inside "courses"
        setCourses(response.data.courses || []);
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

  // ---------- Build category list from loaded courses ----------
  const categories = [
    "All",
    ...new Set(
      courses
        .map((course) => course.category)
        .filter(Boolean)
    ),
  ];

  // ---------- Available levels ----------
  const levels = [
    "All",
    "Beginner",
    "Intermediate",
    "Advanced",
  ];

  // ---------- Apply all filters using AND logic ----------
  const filteredCourses = courses.filter((course) => {
    // Safely convert potentially null/undefined values to strings
    const title = String(course.title || "");
    const category = String(course.category || "");
    const level = String(course.level || "");
    const description = String(course.description || "");
    const duration = String(course.duration || "");

    const search = searchText.trim().toLowerCase();

    // Check course ID match (e.g., C001, C1, 1)
    const matchesId = matchesCourseId(course.id, search);

    // Search title, category, level, description, duration, and course ID
    const matchesSearch =
      !search ||
      matchesId ||
      title.toLowerCase().includes(search) ||
      category.toLowerCase().includes(search) ||
      level.toLowerCase().includes(search) ||
      description.toLowerCase().includes(search) ||
      duration.toLowerCase().includes(search);

    // Category filter
    const matchesCategory =
      selectedCategory === "All" ||
      category === selectedCategory;

    // Level filter
    const matchesLevel =
      selectedLevel === "All" ||
      level === selectedLevel;

    // Convert course price to a number safely
    const coursePrice = Number(course.price);

    // Minimum price filter
    const matchesMinPrice =
      minPrice === "" ||
      (!Number.isNaN(coursePrice) &&
        coursePrice >= Number(minPrice));

    // Maximum price filter
    const matchesMaxPrice =
      maxPrice === "" ||
      (!Number.isNaN(coursePrice) &&
        coursePrice <= Number(maxPrice));

    // ALL filters must match
    return (
      matchesSearch &&
      matchesCategory &&
      matchesLevel &&
      matchesMinPrice &&
      matchesMaxPrice
    );
  });

  // ---------- Check whether any filter is active ----------
  const hasActiveFilters =
    searchText.trim() !== "" ||
    selectedCategory !== "All" ||
    selectedLevel !== "All" ||
    minPrice !== "" ||
    maxPrice !== "";

  // ---------- Clear all filters ----------
  const clearAllFilters = () => {
    setSearchText("");
    setSelectedCategory("All");
    setSelectedLevel("All");
    setMinPrice("");
    setMaxPrice("");
  };

  return (
    <>
      <Navbar />

      <div className="container">
        <div className="page-header">
          <div>
            <h1>Our Courses</h1>
            <p className="page-subtitle">
              Browse the full catalogue and find a course
              that suits your needs.
            </p>
          </div>
        </div>

        {/* ---------- Filters ---------- */}

        {!loading && !error && courses.length > 0 && (
          <div className="filter-bar">
            {/* Search */}
            <input
              type="text"
              className="input"
              placeholder="Search by title, category, course ID (e.g. C001), level, description or duration..."
              value={searchText}
              onChange={(event) =>
                setSearchText(event.target.value)
              }
            />

            {/* Category */}
            <select
              className="input"
              value={selectedCategory}
              onChange={(event) =>
                setSelectedCategory(event.target.value)
              }
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            {/* Level */}
            <select
              className="input"
              value={selectedLevel}
              onChange={(event) =>
                setSelectedLevel(event.target.value)
              }
            >
              {levels.map((level) => (
                <option key={level} value={level}>
                  {level === "All" ? "All Levels" : level}
                </option>
              ))}
            </select>

            {/* Minimum price */}
            <input
              type="number"
              className="input"
              placeholder="Minimum price"
              min="0"
              value={minPrice}
              onChange={(event) =>
                setMinPrice(event.target.value)
              }
            />

            {/* Maximum price */}
            <input
              type="number"
              className="input"
              placeholder="Maximum price"
              min="0"
              value={maxPrice}
              onChange={(event) =>
                setMaxPrice(event.target.value)
              }
            />

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                type="button"
                className="clear-filter-btn"
                onClick={clearAllFilters}
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}

        {/* ---------- Active Filter Chips ---------- */}

        {!loading &&
          !error &&
          courses.length > 0 &&
          hasActiveFilters && (
            <div className="active-filters">
              <span className="active-filters-label">
                Active filters:
              </span>

              {searchText.trim() !== "" && (
                <span className="filter-chip">
                  Search: {searchText}
                </span>
              )}

              {selectedCategory !== "All" && (
                <span className="filter-chip">
                  Category: {selectedCategory}
                </span>
              )}

              {selectedLevel !== "All" && (
                <span className="filter-chip">
                  Level: {selectedLevel}
                </span>
              )}

              {minPrice !== "" && (
                <span className="filter-chip">
                  Min price: {minPrice}
                </span>
              )}

              {maxPrice !== "" && (
                <span className="filter-chip">
                  Max price: {maxPrice}
                </span>
              )}
            </div>
          )}

        {/* ---------- Loading state ---------- */}

        {loading && (
          <p className="loading">
            Loading courses...
          </p>
        )}

        {/* ---------- Error state ---------- */}

        {error && !loading && (
          <p className="error">{error}</p>
        )}

        {/* ---------- No courses exist ---------- */}

        {!loading &&
          !error &&
          courses.length === 0 && (
            <p className="empty">
              There are no courses available at the moment.
            </p>
          )}

        {/* ---------- Courses exist but filters match nothing ---------- */}

        {!loading &&
          !error &&
          courses.length > 0 &&
          filteredCourses.length === 0 && (
            <p className="empty">
              No courses match your filters. Try changing or
              clearing your search criteria.
            </p>
          )}

        {/* ---------- Result count and course list ---------- */}

        {!loading &&
          !error &&
          courses.length > 0 &&
          filteredCourses.length > 0 && (
            <>
              <p className="result-count">
                Showing {filteredCourses.length} of{" "}
                {courses.length} courses
              </p>

              <div className="course-grid">
                {filteredCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                  />
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