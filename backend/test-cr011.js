const assert = require("assert");
const db = require("./config/db");
const Enrollment = require("./models/enrollmentModel");
const Course = require("./models/courseModel");

async function runCR011Tests() {
  console.log("Running CR-011 Enrollment Approval Workflow Tests...\n");

  try {
    // Setup test environment: create a clean test course
    const [courseResult] = await db.execute(
      `INSERT INTO courses (title, category, level, duration, price, max_students)
       VALUES ('CR011 Test Course', 'Testing', 'Beginner', '4 Weeks', 10000, 1)`
    );
    const testCourseId = courseResult.insertId;
    const testStudent1Id = 2; // Kamal
    const testStudent2Id = 3; // Nimal
    const testAdminId = 1;

    // Clean up any existing enrollments for testCourseId
    await db.execute("DELETE FROM enrollments WHERE course_id = ?", [testCourseId]);

    // Test 1: New enrollment request initially has status 'pending' (FR-1, AC-1)
    {
      const reqRes = await Enrollment.requestEnrollment(testStudent1Id, testCourseId);
      assert.strictEqual(reqRes.success, true);
      assert.strictEqual(reqRes.status, 201);
      const enrollment = await Enrollment.findById(reqRes.enrollmentId);
      assert.strictEqual(enrollment.status, "pending", "Initial status must be pending");
      assert.strictEqual(enrollment.reviewed_by, null);
      assert.strictEqual(enrollment.reviewed_at, null);
      console.log("✓ Test 1 Passed: New enrollment request saved as pending");
    }

    // Test 2: Pending requests do not count towards course capacity (FR-2, FR-17, AC-2)
    {
      const course = await Course.getById(testCourseId);
      assert.strictEqual(course.enrolled_count, 0, "Pending requests must NOT count towards capacity");
      assert.strictEqual(course.seats_remaining, 1, "Seat should remain available");
      assert.strictEqual(course.is_full, false, "Course must not be marked full by pending requests");
      console.log("✓ Test 2 Passed: Pending requests do not consume seats");
    }

    // Test 3: Students cannot create duplicate pending requests (FR-4)
    {
      const dupRes = await Enrollment.requestEnrollment(testStudent1Id, testCourseId);
      assert.strictEqual(dupRes.success, false);
      assert.strictEqual(dupRes.status, 409);
      assert.ok(dupRes.message.includes("pending"), "Should notify duplicate pending request");
      console.log("✓ Test 3 Passed: Duplicate pending request rejected");
    }

    // Test 4: Rejection without a reason is rejected (FR-9, AC-4)
    {
      const [rows] = await db.execute(
        "SELECT id FROM enrollments WHERE course_id = ? AND student_id = ?",
        [testCourseId, testStudent1Id]
      );
      const enrollmentId = rows[0].id;

      const rejectNoReason = await Enrollment.updateStatus(enrollmentId, "rejected", testAdminId, "");
      assert.strictEqual(rejectNoReason.success, false);
      assert.strictEqual(rejectNoReason.status, 400);
      assert.strictEqual(rejectNoReason.message, "Rejection reason is required");
      console.log("✓ Test 4 Passed: Admin rejection requires a reason");
    }

    // Test 5: Admin can reject a request with reason (FR-8, FR-9, FR-13)
    let rejectedEnrollmentId;
    {
      const [rows] = await db.execute(
        "SELECT id FROM enrollments WHERE course_id = ? AND student_id = ?",
        [testCourseId, testStudent1Id]
      );
      rejectedEnrollmentId = rows[0].id;

      const rejectRes = await Enrollment.updateStatus(
        rejectedEnrollmentId,
        "rejected",
        testAdminId,
        "Prerequisites not met"
      );
      assert.strictEqual(rejectRes.success, true);
      const enrollment = await Enrollment.findById(rejectedEnrollmentId);
      assert.strictEqual(enrollment.status, "rejected");
      assert.strictEqual(enrollment.reviewed_by, testAdminId);
      assert.ok(enrollment.reviewed_at !== null);
      assert.strictEqual(enrollment.rejection_reason, "Prerequisites not met");
      console.log("✓ Test 5 Passed: Admin can reject request with reason");
    }

    // Test 6: An already rejected request cannot be processed again (FR-10, FR-11)
    {
      const reprocessRes = await Enrollment.updateStatus(
        rejectedEnrollmentId,
        "approved",
        testAdminId
      );
      assert.strictEqual(reprocessRes.success, false);
      assert.strictEqual(reprocessRes.status, 400);
      assert.ok(reprocessRes.message.includes("Only pending requests"));
      console.log("✓ Test 6 Passed: Already processed request cannot be updated again");
    }

    // Test 7: Define how rejected requests can be submitted again (FR-5)
    {
      const resubmitRes = await Enrollment.requestEnrollment(testStudent1Id, testCourseId);
      assert.strictEqual(resubmitRes.success, true);
      assert.strictEqual(resubmitRes.status, 201);
      const enrollment = await Enrollment.findById(resubmitRes.enrollmentId);
      assert.strictEqual(enrollment.status, "pending", "Status reset to pending upon resubmission");
      assert.strictEqual(enrollment.rejection_reason, null, "Rejection reason cleared");
      assert.strictEqual(enrollment.reviewed_by, null, "Reviewer cleared");
      console.log("✓ Test 7 Passed: Rejected requests can be submitted again");
    }

    // Test 8: Admin can approve a request (FR-7, FR-13, FR-15, FR-16)
    {
      const [rows] = await db.execute(
        "SELECT id FROM enrollments WHERE course_id = ? AND student_id = ?",
        [testCourseId, testStudent1Id]
      );
      const enrollmentId = rows[0].id;

      const approveRes = await Enrollment.updateStatus(enrollmentId, "approved", testAdminId);
      assert.strictEqual(approveRes.success, true);
      const enrollment = await Enrollment.findById(enrollmentId);
      assert.strictEqual(enrollment.status, "approved");
      assert.strictEqual(enrollment.reviewed_by, testAdminId);
      assert.ok(enrollment.reviewed_at !== null);
      console.log("✓ Test 8 Passed: Admin can approve pending request");
    }

    // Test 9: Approved enrollment now counts towards course capacity (FR-17)
    {
      const course = await Course.getById(testCourseId);
      assert.strictEqual(course.enrolled_count, 1, "Approved enrollment counts towards capacity");
      assert.strictEqual(course.seats_remaining, 0);
      assert.strictEqual(course.is_full, true, "Course is full now");
      console.log("✓ Test 9 Passed: Approved enrollment counts towards course capacity");
    }

    // Test 10: Duplicate approved enrollment check (FR-4)
    {
      const dupApproved = await Enrollment.requestEnrollment(testStudent1Id, testCourseId);
      assert.strictEqual(dupApproved.success, false);
      assert.strictEqual(dupApproved.status, 409);
      assert.ok(dupApproved.message.includes("already enrolled"));
      console.log("✓ Test 10 Passed: Duplicate request for approved course rejected");
    }

    // Test 11: Capacity limit enforcement on approval (FR-15, AC-7)
    {
      // Student 2 requests the same course (which only has capacity 1 and is full)
      const s2Req = await Enrollment.requestEnrollment(testStudent2Id, testCourseId);
      assert.strictEqual(s2Req.success, true);
      const s2EnrollmentId = s2Req.enrollmentId;

      // Admin tries to approve Student 2: should fail because course is full!
      const approveFail = await Enrollment.updateStatus(s2EnrollmentId, "approved", testAdminId);
      assert.strictEqual(approveFail.success, false);
      assert.strictEqual(approveFail.status, 409);
      assert.ok(approveFail.message.includes("full"));
      console.log("✓ Test 11 Passed: Concurrent/subsequent approval over capacity rejected");
    }

    // Test 12: Status filtering in getAll and getByCourse
    {
      const pendingEnrollments = await Enrollment.getAll("pending");
      assert.ok(pendingEnrollments.every((e) => e.status === "pending"));

      const approvedEnrollments = await Enrollment.getAll("approved");
      assert.ok(approvedEnrollments.every((e) => e.status === "approved"));

      console.log("✓ Test 12 Passed: Status filtering in getAll works correctly");
    }

    // Test 13: Student cancel enrollment (FR-19)
    {
      const [rows] = await db.execute(
        "SELECT id FROM enrollments WHERE course_id = ? AND student_id = ? AND status = 'pending'",
        [testCourseId, testStudent2Id]
      );
      assert.ok(rows.length > 0);
      const s2Id = rows[0].id;

      const cancelRes = await Enrollment.cancelByStudent(s2Id, testStudent2Id);
      assert.strictEqual(cancelRes.affectedRows, 1);
      console.log("✓ Test 13 Passed: Student can cancel their pending request");
    }

    // Test 14: Admin delete enrollment (FR-18)
    {
      const [rows] = await db.execute(
        "SELECT id FROM enrollments WHERE course_id = ? AND student_id = ?",
        [testCourseId, testStudent1Id]
      );
      const s1Id = rows[0].id;

      const delRes = await Enrollment.delete(s1Id);
      assert.strictEqual(delRes.affectedRows, 1);
      console.log("✓ Test 14 Passed: Admin can delete enrollment");
    }

    // Clean up test course
    await db.execute("DELETE FROM courses WHERE id = ?", [testCourseId]);

    console.log("\n========================================================");
    console.log("ALL 14 CR-011 BACKEND TESTS PASSED WITH 100% SUCCESS! ✨");
    console.log("========================================================");
    process.exit(0);
  } catch (err) {
    console.error("Test failed with error:", err);
    process.exit(1);
  }
}

runCR011Tests();
