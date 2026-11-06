-- CR-011: Enrollment Approval Workflow Migration
-- Adds status, reviewed_by, reviewed_at, rejection_reason, decision_note to enrollments table

USE course_management;

-- 1. Add approval workflow fields to enrollments table
ALTER TABLE enrollments
ADD COLUMN status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
ADD COLUMN reviewed_by INT NULL DEFAULT NULL,
ADD COLUMN reviewed_at TIMESTAMP NULL DEFAULT NULL,
ADD COLUMN rejection_reason TEXT NULL DEFAULT NULL,
ADD COLUMN decision_note TEXT NULL DEFAULT NULL;

-- 2. Add foreign key constraint for reviewed_by referencing users(id)
ALTER TABLE enrollments
ADD CONSTRAINT fk_enrollments_reviewed_by
FOREIGN KEY (reviewed_by)
    REFERENCES users(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- 3. Migrate existing enrollments to approved
UPDATE enrollments
SET status = 'approved'
WHERE status IS NULL OR status = 'pending';
