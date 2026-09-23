const Course = require("../models/courseModel");

/**
 * Reusable course validation helper for course creation and updates.
 *
 * @param {Object} courseData - Raw course payload from request body.
 * @param {number|string|null} courseId - ID of course being updated, or null for creation.
 * @returns {Promise<{ isValid: boolean, errors: Object, data: Object }>}
 */
async function validateCourse(courseData = {}, courseId = null) {
  const errors = {};

  // 1. Trim string values (FR-001, AC-019)
  const title = typeof courseData.title === "string" ? courseData.title.trim() : "";
  const category = typeof courseData.category === "string" ? courseData.category.trim() : "";
  const level = typeof courseData.level === "string" ? courseData.level.trim() : "";
  const duration = typeof courseData.duration === "string" ? courseData.duration.trim() : "";
  const image = typeof courseData.image === "string" ? courseData.image.trim() : "";
  const description = typeof courseData.description === "string" ? courseData.description.trim() : "";
  const rawPrice = courseData.price;

  // 2. Validate Course Title (FR-002, AC-001, AC-002, FR-009, AC-009)
  if (!title) {
    errors.title = "Title is required";
  } else if (title.length < 3) {
    errors.title = "Title must contain at least 3 characters";
  } else if (title.length > 100) {
    errors.title = "Title cannot exceed 100 characters";
  } else {
    // Check for duplicate course title in database (FR-009, AC-009)
    const existingCourse = await Course.getByTitle(title, courseId);
    if (existingCourse) {
      errors.title = "Course title already exists";
    }
  }

  // 3. Validate Category (FR-003, AC-001, AC-003)
  if (!category) {
    errors.category = "Category is required";
  } else if (category.length < 2) {
    errors.category = "Category must contain at least 2 characters";
  } else if (category.length > 50) {
    errors.category = "Category cannot exceed 50 characters";
  }

  // 4. Validate Level (FR-004, AC-004)
  const allowedLevels = ["Beginner", "Intermediate", "Advanced"];
  if (!level) {
    errors.level = "Level is required";
  } else if (!allowedLevels.includes(level)) {
    errors.level = "Level must be Beginner, Intermediate, or Advanced";
  }

  // 5. Validate Duration (FR-005, AC-001, AC-005)
  // Format: <positive integer> <Days|Weeks|Months>
  const durationRegex = /^[1-9]\d*\s+(Days|Weeks|Months)$/;
  if (!duration) {
    errors.duration = "Duration is required";
  } else if (!durationRegex.test(duration)) {
    errors.duration = "Duration must follow the format: <positive integer> <Days|Weeks|Months> (e.g. 8 Weeks)";
  }

  // 6. Validate Price (FR-006, AC-001, AC-006)
  if (
    rawPrice === undefined ||
    rawPrice === null ||
    rawPrice === "" ||
    (typeof rawPrice === "string" && rawPrice.trim() === "")
  ) {
    errors.price = "Price is required";
  } else {
    const priceStr = String(rawPrice).trim();
    const priceNum = Number(priceStr);

    if (isNaN(priceNum) || typeof rawPrice === "boolean") {
      errors.price = "Price must be numeric";
    } else if (priceNum < 0) {
      errors.price = "Price cannot be negative";
    } else if (priceNum > 1000000) {
      errors.price = "Price cannot exceed 1,000,000";
    } else {
      const decimalParts = priceStr.split(".");
      if (decimalParts.length === 2 && decimalParts[1].length > 2) {
        errors.price = "Price cannot contain more than two decimal places";
      }
    }
  }

  // 7. Validate Image (Optional) (FR-007, AC-007)
  if (image) {
    if (image.length > 500) {
      errors.image = "Image URL cannot exceed 500 characters";
    } else {
      try {
        const parsedUrl = new URL(image);
        if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
          errors.image = "Image must be a valid HTTP or HTTPS URL";
        }
      } catch {
        errors.image = "Image must be a valid HTTP or HTTPS URL";
      }
    }
  }

  // 8. Validate Description (Optional) (FR-008, AC-008)
  if (description && description.length > 1000) {
    errors.description = "Description cannot exceed 1,000 characters";
  }

  // Sanitized trimmed data for saving
  const normalizedDuration = duration ? duration.replace(/\s+/, " ") : "";
  const sanitizedData = {
    title,
    category,
    level,
    duration: normalizedDuration,
    price: Number(rawPrice),
    image: image || null,
    description: description || null,
  };

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    data: sanitizedData,
  };
}

module.exports = validateCourse;
