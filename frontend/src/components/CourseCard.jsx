import { Link } from "react-router-dom";
import { FaEye } from "react-icons/fa";

function CourseCard({ course }) {
  const isLimited =
    course.max_students !== null && course.max_students !== undefined;
  const isFull = Boolean(course.is_full);

  return (
    <article className={`course-card ${isFull ? "course-card-full" : ""}`}>
      {/* Course image from the database with optional full badge */}
      <div className="course-card-image-wrapper">
        <img
          src={course.image}
          alt={course.title}
          className="course-card-image"
          loading="lazy"
        />
        {isFull && (
          <span className="course-full-badge-overlay">Course Full</span>
        )}
      </div>

      <div className="course-card-body">
        <div className="course-card-tags">
          <span className="tag tag-id">
            {`C${String(course.id).padStart(3, "0")}`}
          </span>

          <span className="tag tag-category">
            {course.category}
          </span>

          <span className="tag tag-level">
            {course.level}
          </span>

          {isFull && (
            <span className="tag tag-full">Course Full</span>
          )}
        </div>

        <h3 className="course-card-title">
          {course.title}
        </h3>

        {/* Short summary - we trim the long description */}
        <p className="course-card-summary">
          {course.description?.slice(0, 110)}
          {course.description?.length > 110 ? "..." : ""}
        </p>

        <ul className="course-card-meta">
          <li>
            <strong>Duration:</strong> {course.duration}
          </li>

          <li>
            <strong>Price:</strong> Rs. {course.price}
          </li>

          <li>
            <strong>Availability:</strong>{" "}
            {isLimited
              ? `${course.enrolled_count} / ${course.max_students} students`
              : "Unlimited"}
            {isFull && (
              <span className="availability-full-label"> (Course Full)</span>
            )}
          </li>
        </ul>

        <Link
          to={`/courses/${course.id}`}
          className="btn btn-primary btn-block"
        >
          <FaEye />
          View Details
        </Link>
      </div>
    </article>
  );
}

export default CourseCard;
