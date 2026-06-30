import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "IAC Camp",
    short_name: "IAC Camp",
    description: "منصة إشعارات ومسابقات معسكر IAC",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#063F36",
    theme_color: "#063F36",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}