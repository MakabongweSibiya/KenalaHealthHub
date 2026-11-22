import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Totus Massage & Aesthetics",
    short_name: "Totus Massages",
    description:
      "Bespoke therapeutic massage, deep tissue, aromatherapy, luxury facials, body contouring, and skin aesthetics in South Africa.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF9F6",
    theme_color: "#135061",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
