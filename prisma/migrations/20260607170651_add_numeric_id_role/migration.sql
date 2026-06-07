/*
  Warnings:

  - A unique constraint covering the columns `[numericId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPERADMIN', 'ADMIN', 'MOD', 'USER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "numericId" SERIAL NOT NULL,
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';

-- CreateIndex
CREATE UNIQUE INDEX "User_numericId_key" ON "User"("numericId");
