-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "rotationMemberIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
