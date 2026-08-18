-- Remove unused job-description matching fields and add resume insight metadata.
ALTER TABLE "InterviewSession"
  DROP COLUMN IF EXISTS "jobDescription",
  DROP COLUMN IF EXISTS "matchPercentage",
  ADD COLUMN "education" TEXT,
  ADD COLUMN "certifications" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "Question"
  ADD COLUMN "sourceType" TEXT;
