-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "involvedChildIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
