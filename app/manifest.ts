import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KasiStock AI",
    short_name: "KasiStock",
    description: "Explainable restocking intelligence for small retailers.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f1e8",
    theme_color: "#f5f1e8",
    lang: "en-ZA",
  };
}
