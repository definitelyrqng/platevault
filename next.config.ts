import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The plate image route reads these from disk at runtime — make sure they ship with it.
  outputFileTracingIncludes: {
    "/api/plate": ["./assets/fonts/**", "./public/plates/**"],
  },
};

export default nextConfig;
