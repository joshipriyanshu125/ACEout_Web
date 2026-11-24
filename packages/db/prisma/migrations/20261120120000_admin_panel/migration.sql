-- CreateEnum
CREATE TYPE "QuizMode" AS ENUM ('LIVE', 'AFTER_LAB');

-- CreateEnum
CREATE TYPE "QuizStatus" AS ENUM ('DRAFT', 'READY', 'DONE');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MCQ', 'TRUE_FALSE', 'NUMERIC');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('LOBBY', 'QUESTION', 'REVEAL', 'DONE');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'PRINCIPAL';

-- DropForeignKey
ALTER TABLE "Class" DROP CONSTRAINT "Class_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "LabUnlock" DROP CONSTRAINT "LabUnlock_classId_fkey";

-- DropForeignKey
ALTER TABLE "LabUnlock" DROP CONSTRAINT "LabUnlock_labId_fkey";

-- DropForeignKey
ALTER TABLE "LabUnlock" DROP CONSTRAINT "LabUnlock_unlockedById_fkey";

-- DropForeignKey
ALTER TABLE "QuizQuestion" DROP CONSTRAINT "QuizQuestion_labId_fkey";

-- DropForeignKey
ALTER TABLE "QuizResponse" DROP CONSTRAINT "QuizResponse_attemptId_fkey";

-- DropForeignKey
ALTER TABLE "QuizResponse" DROP CONSTRAINT "QuizResponse_questionId_fkey";

-- DropIndex
DROP INDEX "QuizQuestion_labId_number_key";

-- AlterTable
ALTER TABLE "Class" DROP COLUMN "name",
DROP COLUMN "subject",
ADD COLUMN     "section" TEXT NOT NULL,
DROP COLUMN "grade",
ADD COLUMN     "grade" INTEGER NOT NULL,
ALTER COLUMN "teacherId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Lab" DROP COLUMN "benchType",
DROP COLUMN "isReady",
DROP COLUMN "tags",
ADD COLUMN     "abbr" TEXT NOT NULL,
ADD COLUMN     "chapterNo" TEXT NOT NULL,
ADD COLUMN     "skills" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "steps" INTEGER NOT NULL,
ADD COLUMN     "unit" TEXT NOT NULL,
DROP COLUMN "grade",
ADD COLUMN     "grade" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "LabAttempt" ADD COLUMN     "faultSteps" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "faults" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "precision" DOUBLE PRECISION,
ADD COLUMN     "xpEarned" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "QuizQuestion" DROP COLUMN "displayValue",
DROP COLUMN "hintDescription",
DROP COLUMN "hintTitle",
DROP COLUMN "instrumentType",
DROP COLUMN "labId",
DROP COLUMN "leastCount",
DROP COLUMN "subtitle",
DROP COLUMN "title",
ADD COLUMN     "points" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "quizId" TEXT NOT NULL,
ADD COLUMN     "seconds" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN     "text" TEXT NOT NULL,
ADD COLUMN     "type" "QuestionType" NOT NULL DEFAULT 'MCQ',
DROP COLUMN "options",
ADD COLUMN     "options" JSONB NOT NULL DEFAULT '[]',
ALTER COLUMN "correctIndex" SET DEFAULT 0,
ALTER COLUMN "explanation" SET DEFAULT '';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "bestStreak",
DROP COLUMN "board",
DROP COLUMN "grade",
DROP COLUMN "sessionsThisWeek",
ADD COLUMN     "lastActiveAt" TIMESTAMP(3),
ADD COLUMN     "rollNo" INTEGER;

-- DropTable
DROP TABLE "LabUnlock";

-- DropTable
DROP TABLE "QuizResponse";

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "labId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "hintLevel" TEXT NOT NULL DEFAULT 'STANDARD',
    "attachQuiz" BOOLEAN NOT NULL DEFAULT true,
    "allowOffline" BOOLEAN NOT NULL DEFAULT true,
    "assignedById" TEXT,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quiz" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "mode" "QuizMode" NOT NULL,
    "status" "QuizStatus" NOT NULL DEFAULT 'READY',
    "labId" TEXT,
    "shuffle" BOOLEAN NOT NULL DEFAULT true,
    "showLeaderboard" BOOLEAN NOT NULL DEFAULT true,
    "reportsSentAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizAudience" (
    "quizId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,

    CONSTRAINT "QuizAudience_pkey" PRIMARY KEY ("quizId","classId")
);

-- CreateTable
CREATE TABLE "QuizSession" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'LOBBY',
    "currentIndex" INTEGER NOT NULL DEFAULT 0,
    "questionStartedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "hostId" TEXT,

    CONSTRAINT "QuizSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizParticipant" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizAnswer" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sessionId" TEXT,
    "attemptId" TEXT,
    "selectedIndex" INTEGER,
    "value" TEXT,
    "isCorrect" BOOLEAN NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "msTaken" INTEGER,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Assignment_classId_idx" ON "Assignment"("classId");

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_classId_labId_key" ON "Assignment"("classId", "labId");

-- CreateIndex
CREATE INDEX "Quiz_labId_idx" ON "Quiz"("labId");

-- CreateIndex
CREATE UNIQUE INDEX "QuizSession_code_key" ON "QuizSession"("code");

-- CreateIndex
CREATE INDEX "QuizSession_quizId_idx" ON "QuizSession"("quizId");

-- CreateIndex
CREATE UNIQUE INDEX "QuizParticipant_sessionId_studentId_key" ON "QuizParticipant"("sessionId", "studentId");

-- CreateIndex
CREATE INDEX "QuizAnswer_quizId_idx" ON "QuizAnswer"("quizId");

-- CreateIndex
CREATE INDEX "QuizAnswer_studentId_idx" ON "QuizAnswer"("studentId");

-- CreateIndex
CREATE INDEX "QuizAnswer_sessionId_idx" ON "QuizAnswer"("sessionId");

-- CreateIndex
CREATE INDEX "QuizAnswer_attemptId_idx" ON "QuizAnswer"("attemptId");

-- CreateIndex
CREATE UNIQUE INDEX "Class_grade_section_key" ON "Class"("grade", "section");

-- CreateIndex
CREATE UNIQUE INDEX "QuizQuestion_quizId_number_key" ON "QuizQuestion"("quizId", "number");

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAudience" ADD CONSTRAINT "QuizAudience_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAudience" ADD CONSTRAINT "QuizAudience_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizSession" ADD CONSTRAINT "QuizSession_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizSession" ADD CONSTRAINT "QuizSession_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizParticipant" ADD CONSTRAINT "QuizParticipant_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "QuizSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizParticipant" ADD CONSTRAINT "QuizParticipant_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAnswer" ADD CONSTRAINT "QuizAnswer_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAnswer" ADD CONSTRAINT "QuizAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuizQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAnswer" ADD CONSTRAINT "QuizAnswer_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAnswer" ADD CONSTRAINT "QuizAnswer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "QuizSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAnswer" ADD CONSTRAINT "QuizAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "LabAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

