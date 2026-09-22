import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // The VPS is 6 GB / 4 cores; a standalone bundle keeps the runtime image small
  // and lets `docker compose pull` replace the app without a rebuild on the box.
  // Windows local builds can skip deployment packaging when symlink creation
  // is unavailable. Linux/Docker/CI retain standalone output by default.
  output: process.env.NEXT_STANDALONE === "false" ? undefined : "standalone",
  // The runtime deployment command uses Drizzle's migrator without drizzle-kit.
  outputFileTracingIncludes: {
    "/*": ["./node_modules/drizzle-orm/**/*"],
  },
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    /**
     * Server Actions buffer the whole request body, and Next caps it at 1 MB by
     * default — which silently swallowed every real photo upload, since §13 caps
     * a file at 10 MB. This allows two max-size files in one batch; the
     * per-file limit is still enforced in the pipeline, and the upload form
     * refuses an oversized batch client-side so the failure is never silent.
     */
    serverActions: { bodySizeLimit: "24mb" },
  },
  images: {
    // No hotlinked assets (CLAUDE.md): every image is local or in the media library.
    remotePatterns: [],
    formats: ["image/avif", "image/webp"],
  },
};

export default withNextIntl(nextConfig);
