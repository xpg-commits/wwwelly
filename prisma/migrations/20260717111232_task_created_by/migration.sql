-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "createdByMemberId" TEXT;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdByMemberId_fkey" FOREIGN KEY ("createdByMemberId") REFERENCES "householdMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
