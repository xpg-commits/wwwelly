-- CreateEnum
CREATE TYPE "HabitType" AS ENUM ('CHECKIN', 'REMINDER');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "dueTime" TEXT;

-- AlterTable
ALTER TABLE "householdMember" ADD COLUMN     "gettingStartedDismissed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hiddenModules" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "Habit" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "HabitType" NOT NULL,
    "goalNote" TEXT,
    "intervalMinutes" INTEGER,
    "activeFrom" TEXT,
    "activeTo" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Habit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HabitLog" (
    "id" TEXT NOT NULL,
    "habitId" TEXT NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HabitLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Habit_householdId_memberId_idx" ON "Habit"("householdId", "memberId");

-- CreateIndex
CREATE INDEX "HabitLog_habitId_loggedAt_idx" ON "HabitLog"("habitId", "loggedAt");

-- AddForeignKey
ALTER TABLE "Habit" ADD CONSTRAINT "Habit_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Habit" ADD CONSTRAINT "Habit_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "householdMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HabitLog" ADD CONSTRAINT "HabitLog_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
