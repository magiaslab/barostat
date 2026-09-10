import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BaroStat 24",
    short_name: "BaroStat",
    description:
      "Registra dal vivo in quale fascia dei 24 secondi cade ogni canestro.",
    start_url: "/",
    display: "standalone",
    background_color: "#0C0F14",
    theme_color: "#0C0F14",
    lang: "it",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
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
