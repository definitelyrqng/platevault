CREATE TABLE "TransportCompany" (
    "id" TEXT NOT NULL,
    "numericId" SERIAL NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "country" VARCHAR(60),
    "city" VARCHAR(80),
    "description" VARCHAR(500),
    "website" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "TransportCompany_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TransportCompany_numericId_key" ON "TransportCompany"("numericId");
CREATE INDEX "TransportCompany_name_idx" ON "TransportCompany"("name");
CREATE INDEX "TransportCompany_country_idx" ON "TransportCompany"("country");

ALTER TABLE "TransportCompany" ADD CONSTRAINT "TransportCompany_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Upload" ADD COLUMN "companyId" TEXT;

ALTER TABLE "Upload" ADD CONSTRAINT "Upload_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "TransportCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Upload_companyId_idx" ON "Upload"("companyId");
