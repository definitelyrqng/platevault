import { createUploadthing, type FileRouter } from "uploadthing/next";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";

const f = createUploadthing();

async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("pv_session")?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    select: {
      expiresAt: true,
      user: { select: { id: true, username: true } },
    },
  });

  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

export const ourFileRouter = {
  // Plate spots - JPG/PNG, max 8 MB
  plateImageUploader: f({
    "image/jpeg": { maxFileSize: "8MB", maxFileCount: 1 },
    "image/png":  { maxFileSize: "8MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const user = await getSessionUser();
      if (!user) throw new Error("Unauthorized");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),

  // Profile avatar - JPG/PNG/WebP, max 2 MB
  avatarUploader: f({
    "image/jpeg": { maxFileSize: "2MB", maxFileCount: 1 },
    "image/png":  { maxFileSize: "2MB", maxFileCount: 1 },
    "image/webp": { maxFileSize: "2MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const user = await getSessionUser();
      if (!user) throw new Error("Unauthorized");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
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
    .middleware(async () => {
      const user = await getSessionUser();
      if (!user) throw new Error("Unauthorized");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await prisma.user.update({
        where: { id: metadata.userId },
        data: { bannerUrl: file.ufsUrl },
      });
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
