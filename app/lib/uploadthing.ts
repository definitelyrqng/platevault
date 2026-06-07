import { createUploadthing, type FileRouter } from "uploadthing/next";
import { prisma } from "@/app/lib/prisma";

const f = createUploadthing();

// Read the pv_session cookie directly from the request header.
// We cannot use cookies() from next/headers here because uploadthing runs
// the middleware inside an Effect fiber, which does not inherit Next.js's
// AsyncLocalStorage request context.
function getTokenFromReq(req: Request): string | null {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("pv_session="));
  return match ? match.split("=").slice(1).join("=") : null;
}

async function getSessionUser(req: Request) {
  const token = getTokenFromReq(req);
  console.log("[UT] getSessionUser - token found:", !!token);
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    select: {
      expiresAt: true,
      user: { select: { id: true, username: true } },
    },
  });

  if (!session || session.expiresAt < new Date()) return null;
  console.log("[UT] session valid, user:", session.user.username);
  return session.user;
}

export const ourFileRouter = {
  // Plate spots - JPG/PNG, max 8 MB
  plateImageUploader: f({
    "image/jpeg": { maxFileSize: "8MB", maxFileCount: 1 },
    "image/png":  { maxFileSize: "8MB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      const user = await getSessionUser(req);
      if (!user) throw new Error("Unauthorized");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("[UT] plateImageUploader complete, userId:", metadata.userId);
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),

  // Profile avatar - JPG/PNG/WebP, max 2 MB
  avatarUploader: f({
    "image/jpeg": { maxFileSize: "2MB", maxFileCount: 1 },
    "image/png":  { maxFileSize: "2MB", maxFileCount: 1 },
    "image/webp": { maxFileSize: "2MB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      const user = await getSessionUser(req);
      if (!user) throw new Error("Unauthorized");
      console.log("[UT] avatarUploader middleware ok, userId:", user.id);
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("[UT] avatarUploader complete, url:", file.ufsUrl);
      await prisma.user.update({
        where: { id: metadata.userId },
        data: { avatarUrl: file.ufsUrl },
      });
      return { url: file.ufsUrl };
    }),

  // Profile banner - JPG/PNG/WebP, max 4 MB
  bannerUploader: f({
    "image/jpeg": { maxFileSize: "4MB", maxFileCount: 1 },
    "image/png":  { maxFileSize: "4MB", maxFileCount: 1 },
    "image/webp": { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      const user = await getSessionUser(req);
      if (!user) throw new Error("Unauthorized");
      console.log("[UT] bannerUploader middleware ok, userId:", user.id);
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("[UT] bannerUploader complete, url:", file.ufsUrl);
      await prisma.$executeRaw`UPDATE "User" SET "bannerUrl" = ${file.ufsUrl} WHERE id = ${metadata.userId}`;
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
