import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "wwwelly — La memoria de tu hogar",
    short_name: "wwwelly",
    description:
      "La app que recuerda por ti todo lo que normalmente llevas en la cabeza.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#FBF7F3",
    theme_color: "#FBF7F3",
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
