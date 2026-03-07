import type { NextConfig } from "next";
import path from "path";

/**
 * Next.js Configuration
 *
 * Deployment modes:
 * - Development: API routes enabled (npm run dev)
 * - Static export: Set NEXT_OUTPUT=export for GitHub Pages (no API routes)
 * - Vercel/Node: Full features including API routes
 */
const nextConfig: NextConfig = {
  // Only enable static export when explicitly requested
  // API routes require server-side rendering
  ...(process.env.NEXT_OUTPUT === "export" && {
    output: "export",
  }),
  images: {
    unoptimized: true,
  },
  // Fix workspace root inference for deterministic builds across environments
  // turbopack: {
  //   root: path.resolve(__dirname),
  // },
  // GitHub Pages subpath config (uncomment if needed):
  // basePath: '/QuizzMe',
};

export default nextConfig;
