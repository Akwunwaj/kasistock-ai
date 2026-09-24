import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.APP_BASE_URL?.trim() || "http://localhost:3000";
  return ["", "/guide", "/judge", "/evidence", "/decision", "/architecture"].map((path, index) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date("2026-07-18T00:00:00+02:00"),
    changeFrequency: index === 0 ? "daily" : "weekly",
    priority: index === 0 ? 1 : 0.8,
  }));
}
