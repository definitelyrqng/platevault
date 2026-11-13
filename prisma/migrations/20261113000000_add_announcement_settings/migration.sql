-- "What's new" banner settings (edited by the super admin)
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "announcementEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "announcementLabel" VARCHAR(20) NOT NULL DEFAULT 'New';
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "announcementText" VARCHAR(300) NOT NULL DEFAULT 'Weekly challenges, direct messages, road trips, collection export & Germany plates are live.';
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "announcementLink" VARCHAR(200) NOT NULL DEFAULT '/challenges';
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "announcementLinkText" VARCHAR(40) NOT NULL DEFAULT 'Try now →';
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "announcementDays" INTEGER NOT NULL DEFAULT 14;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "announcementVersion" INTEGER NOT NULL DEFAULT 1;
