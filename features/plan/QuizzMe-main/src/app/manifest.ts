import { MetadataRoute } from "next";

export const dynamic = 'force-static'
export const revalidate = false

const manifest = (): MetadataRoute.Manifest => ({
  name: "QuizzMe",
  short_name: "QuizzMe",
  description: "Astro intelligence and quiz companion",
  start_url: "/",
  display: "standalone",
  background_color: "#0F3045",
  theme_color: "#D2A95A",
  icons: [
    {
      src: "/assets/icons/star.svg",
      sizes: "192x192",
      type: "image/svg+xml",
    },
    {
      src: "/assets/icons/moon.svg",
      sizes: "512x512",
      type: "image/svg+xml",
    }
  ],
});

export default manifest;
