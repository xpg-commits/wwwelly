import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Narela — La memoria de tu hogar",
    short_name: "Narela",
    description:
      "La app que recuerda por ti todo lo que normalmente llevas en la cabeza.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#FFF7EE",
    theme_color: "#C2703D",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  }
}
