-- Spot reports (shown in the admin panel and sent to Discord)
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "category" VARCHAR(20) NOT NULL,
    "details" VARCHAR(500) NOT NULL DEFAULT '',
    "status" VARCHAR(10) NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Report_status_createdAt_idx" ON "Report"("status", "createdAt");
CREATE INDEX "Report_uploadId_idx" ON "Report"("uploadId");

ALTER TABLE "Report" ADD CONSTRAINT "Report_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "Upload"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
