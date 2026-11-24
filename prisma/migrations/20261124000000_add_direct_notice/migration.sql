-- Notice shown to people who open the site directly (no referrer); edited by the super admin
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "directNoticeEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "directNoticeTitle" VARCHAR(60) NOT NULL DEFAULT 'Heads up';
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "directNoticeText" VARCHAR(400) NOT NULL DEFAULT 'PlateVault is still being built — things may change or break while we work on it.';
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "directNoticeLink" VARCHAR(200) NOT NULL DEFAULT '';
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "directNoticeLinkText" VARCHAR(40) NOT NULL DEFAULT '';
