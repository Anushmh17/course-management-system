-- CR-007: Course Seat Capacity and Availability Migration
-- Adds max_students INT NULL column to courses table

USE course_management;

ALTER TABLE courses
ADD COLUMN max_students INT NULL DEFAULT NULL;
