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
  // Only JPG and PNG, max 8 MB
  plateImageUploader: f({
    "image/jpeg": { maxFileSize: "8MB", maxFileCount: 1 },
    "image/png": { maxFileSize: "8MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const user = await getSessionUser();
      if (!user) throw new Error("Unauthorized");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
