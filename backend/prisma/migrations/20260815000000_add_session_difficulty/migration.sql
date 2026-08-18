-- Add the user-selected interview difficulty to each saved session.
ALTER TABLE "InterviewSession"
ADD COLUMN "difficulty" TEXT NOT NULL DEFAULT 'medium';
