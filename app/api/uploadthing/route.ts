import { type NextRequest } from "next/server";
import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "@/app/lib/uploadthing";

const handler = createRouteHandler({
  router: ourFileRouter,
  config: {
    token: process.env.UPLOADTHING_TOKEN,
    logLevel: "Debug",
  },
});

export const GET = handler.GET;

export async function POST(req: NextRequest) {
  console.log("[UT route] TOKEN present:", !!process.env.UPLOADTHING_TOKEN, "len:", process.env.UPLOADTHING_TOKEN?.length ?? 0);
  const res = await handler.POST(req);
  if (!res.ok) {
    const body = await res.clone().text();
    console.error("[UT route] POST error", res.status, body.slice(0, 500));
  }
  return res;
}
