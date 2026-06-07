/*
  Warnings:

  - A unique constraint covering the columns `[numericId]` on the table `Upload` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Upload" ADD COLUMN     "numericId" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Upload_numericId_key" ON "Upload"("numericId");
