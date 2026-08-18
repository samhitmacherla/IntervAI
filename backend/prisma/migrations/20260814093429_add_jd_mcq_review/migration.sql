-- AlterTable
ALTER TABLE "InterviewSession" ADD COLUMN     "jobDescription" TEXT,
ADD COLUMN     "matchPercentage" INTEGER;

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "correctOption" TEXT,
ADD COLUMN     "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "suggestedAnswer" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'open';
