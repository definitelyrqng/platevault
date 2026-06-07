/*
  Warnings:

  - You are about to alter the column `token` on the `Session` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(128)`.
  - You are about to alter the column `avatarUrl` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - Changed the type of `type` on the `Notification` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('LIKE', 'UPLOAD_DELETED', 'UPLOAD_FLAGGED', 'SYSTEM');

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "type",
ADD COLUMN     "type" "NotificationType" NOT NULL;

-- AlterTable
ALTER TABLE "Session" ALTER COLUMN "token" SET DATA TYPE VARCHAR(128);

-- AlterTable
ALTER TABLE "Upload" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "avatarUrl" SET DATA TYPE VARCHAR(500);

-- CreateIndex
CREATE INDEX "Like_uploadId_idx" ON "Like"("uploadId");

-- CreateIndex
CREATE INDEX "Like_userId_idx" ON "Like"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "Upload_userId_createdAt_idx" ON "Upload"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Upload_country_createdAt_idx" ON "Upload"("country", "createdAt");

-- CreateIndex
CREATE INDEX "Upload_plateText_idx" ON "Upload"("plateText");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");
