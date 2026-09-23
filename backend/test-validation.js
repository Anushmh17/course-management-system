const assert = require("assert");
const Course = require("./models/courseModel");
const validateCourse = require("./helpers/validateCourse");

// In-memory mock for Course.getByTitle
const mockDatabase = [
  { id: 1, title: "Web Development" },
  { id: 2, title: "Data Science" },
];

Course.getByTitle = async (title, excludeId = null) => {
  const found = mockDatabase.find(
    (c) => c.title.toLowerCase() === title.toLowerCase()
  );
  if (!found) return null;
  if (excludeId !== null && excludeId !== undefined && found.id === Number(excludeId)) {
    return null;
  }
  return found;
};

async function runTests() {
  console.log("Running Course Validation Tests...\n");

  // Test 1: Valid course creation data
  {
    const validData = {
      title: "  Mobile App Development  ",
      category: "  Programming  ",
      level: "Beginner",
      duration: "  8 Weeks  ",
      price: "99.99",
      image: "https://example.com/image.png",
      description: "A comprehensive course on mobile apps",
    };

    const result = await validateCourse(validData);
    assert.strictEqual(result.isValid, true, "Valid data should pass");
    assert.strictEqual(result.data.title, "Mobile App Development", "Title should be trimmed");
    assert.strictEqual(result.data.category, "Programming", "Category should be trimmed");
    assert.strictEqual(result.data.duration, "8 Weeks", "Duration should be trimmed and formatted");
    assert.strictEqual(result.data.price, 99.99, "Price should be numeric");
    console.log("✓ Test 1 Passed: Valid data passes with proper trimming and types");
  }

  // Test 2: Blank / required fields (AC-001)
  {
    const emptyData = {
      title: "   ",
      category: " ",
      level: "",
      duration: "",
      price: "",
    };

    const result = await validateCourse(emptyData);
    assert.strictEqual(result.isValid, false);
    assert.strictEqual(result.errors.title, "Title is required");
    assert.strictEqual(result.errors.category, "Category is required");
    assert.strictEqual(result.errors.level, "Level is required");
    assert.strictEqual(result.errors.duration, "Duration is required");
    assert.strictEqual(result.errors.price, "Price is required");
    console.log("✓ Test 2 Passed: Blank required fields are rejected");
  }

  // Test 3: Title length validation (AC-002)
  {
    const shortTitle = await validateCourse({
      title: "AB",
      category: "Frontend",
      level: "Beginner",
      duration: "5 Days",
      price: 100,
    });
    assert.strictEqual(shortTitle.errors.title, "Title must contain at least 3 characters");

    const longTitle = await validateCourse({
      title: "A".repeat(101),
      category: "Frontend",
      level: "Beginner",
      duration: "5 Days",
      price: 100,
    });
    assert.strictEqual(longTitle.errors.title, "Title cannot exceed 100 characters");
    console.log("✓ Test 3 Passed: Title length constraints (3-100) enforced");
  }

  // Test 4: Category length validation (AC-003)
  {
    const shortCat = await validateCourse({
      title: "Cloud Computing",
      category: "A",
      level: "Beginner",
      duration: "5 Days",
      price: 100,
    });
    assert.strictEqual(shortCat.errors.category, "Category must contain at least 2 characters");

    const longCat = await validateCourse({
      title: "Cloud Computing",
      category: "A".repeat(51),
      level: "Beginner",
      duration: "5 Days",
      price: 100,
    });
    assert.strictEqual(longCat.errors.category, "Category cannot exceed 50 characters");
    console.log("✓ Test 4 Passed: Category length constraints (2-50) enforced");
  }

  // Test 5: Level validation (AC-004)
  {
    for (const lvl of ["Beginner", "Intermediate", "Advanced"]) {
      const res = await validateCourse({
        title: "Test Course",
        category: "Test",
        level: lvl,
        duration: "5 Days",
        price: 100,
      });
      assert.strictEqual(res.errors.level, undefined, `${lvl} should be accepted`);
    }

    const invalidLvl = await validateCourse({
      title: "Test Course",
      category: "Test",
      level: "Expert",
      duration: "5 Days",
      price: 100,
    });
    assert.strictEqual(invalidLvl.errors.level, "Level must be Beginner, Intermediate, or Advanced");
    console.log("✓ Test 5 Passed: Level whitelist enforced");
  }

  // Test 6: Duration validation (AC-005)
  {
    const validDurations = ["5 Days", "8 Weeks", "3 Months", "1 Days", "12 Months"];
    for (const dur of validDurations) {
      const res = await validateCourse({
        title: "Test Course",
        category: "Test",
        level: "Beginner",
        duration: dur,
        price: 100,
      });
      assert.strictEqual(res.errors.duration, undefined, `Duration "${dur}" should be valid`);
    }

    const invalidDurations = ["", "abc", "5 Years", "2 Hours", "0 Days", "-1 Weeks", "5Days", "8.5 Weeks"];
    for (const dur of invalidDurations) {
      const res = await validateCourse({
        title: "Test Course",
        category: "Test",
        level: "Beginner",
        duration: dur,
        price: 100,
      });
      assert.ok(res.errors.duration, `Duration "${dur}" should be rejected`);
    }
    console.log("✓ Test 6 Passed: Duration format (<positive integer> <Days|Weeks|Months>) enforced");
  }

  // Test 7: Price validation (AC-006)
  {
    const validPrices = [100, 99.99, "99.99", 0, "0", 0.50, "0.50", 1000000];
    for (const p of validPrices) {
      const res = await validateCourse({
        title: "Test Course",
        category: "Test",
        level: "Beginner",
        duration: "10 Weeks",
        price: p,
      });
      assert.strictEqual(res.errors.price, undefined, `Price "${p}" should be valid`);
    }

    const invalidCases = [
      { price: -10, expected: "Price cannot be negative" },
      { price: "-10", expected: "Price cannot be negative" },
      { price: 1000001, expected: "Price cannot exceed 1,000,000" },
      { price: "99.999", expected: "Price cannot contain more than two decimal places" },
      { price: "abc", expected: "Price must be numeric" },
      { price: true, expected: "Price must be numeric" },
    ];

    for (const testCase of invalidCases) {
      const res = await validateCourse({
        title: "Test Course",
        category: "Test",
        level: "Beginner",
        duration: "10 Weeks",
        price: testCase.price,
      });
      assert.strictEqual(res.errors.price, testCase.expected, `Price "${testCase.price}" should fail with "${testCase.expected}"`);
    }
    console.log("✓ Test 7 Passed: Price constraints (numeric, non-negative, <= 1,000,000, max 2 decimals) enforced");
  }

  // Test 8: Image URL validation (AC-007)
  {
    const validImageRes = await validateCourse({
      title: "Test Course",
      category: "Test",
      level: "Beginner",
      duration: "10 Weeks",
      price: 100,
      image: "https://example.com/course.jpg",
    });
    assert.strictEqual(validImageRes.errors.image, undefined);

    const invalidImageRes = await validateCourse({
      title: "Test Course",
      category: "Test",
      level: "Beginner",
      duration: "10 Weeks",
      price: 100,
      image: "ftp://example.com/image.png",
    });
    assert.strictEqual(invalidImageRes.errors.image, "Image must be a valid HTTP or HTTPS URL");

    const notAUrlRes = await validateCourse({
      title: "Test Course",
      category: "Test",
      level: "Beginner",
      duration: "10 Weeks",
      price: 100,
      image: "invalid-url",
    });
    assert.strictEqual(notAUrlRes.errors.image, "Image must be a valid HTTP or HTTPS URL");
    console.log("✓ Test 8 Passed: Image URL format (HTTP/HTTPS) enforced");
  }

  // Test 9: Description validation (AC-008)
  {
    const longDesc = "A".repeat(1001);
    const descRes = await validateCourse({
      title: "Test Course",
      category: "Test",
      level: "Beginner",
      duration: "10 Weeks",
      price: 100,
      description: longDesc,
    });
    assert.strictEqual(descRes.errors.description, "Description cannot exceed 1,000 characters");
    console.log("✓ Test 9 Passed: Description length <= 1,000 characters enforced");
  }

  // Test 10: Duplicate title detection (FR-009, AC-009)
  {
    // Create new course with existing title "Web Development" -> should fail
    const createDuplicate = await validateCourse({
      title: "Web Development",
      category: "Development",
      level: "Beginner",
      duration: "4 Weeks",
      price: 50,
    });
    assert.strictEqual(createDuplicate.errors.title, "Course title already exists");

    // Update course ID 1 to keep its own title "Web Development" -> should PASS
    const updateSelf = await validateCourse(
      {
        title: "Web Development",
        category: "Development",
        level: "Beginner",
        duration: "4 Weeks",
        price: 50,
      },
      1
    );
    assert.strictEqual(updateSelf.errors.title, undefined, "Updating course keeping its own title should pass");

    // Update course ID 1 to use course ID 2's title "Data Science" -> should FAIL
    const updateDuplicate = await validateCourse(
      {
        title: "Data Science",
        category: "Development",
        level: "Beginner",
        duration: "4 Weeks",
        price: 50,
      },
      1
    );
    assert.strictEqual(updateDuplicate.errors.title, "Course title already exists", "Updating to another course's title must fail");

    console.log("✓ Test 10 Passed: Duplicate title handling for Create and Update (FR-009, AC-009)");
  }

  console.log("\n========================================================");
  console.log("ALL 10 VALIDATION UNIT TESTS PASSED WITH 100% SUCCESS! ✨");
  console.log("========================================================");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
