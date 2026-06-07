import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "@/app/lib/uploadthing";

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
