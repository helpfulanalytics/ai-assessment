import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private per-client surfaces: sessions and reports live at unguessable URLs.
        disallow: ["/discovery", "/assessment", "/success"],
      },
    ],
    sitemap: "https://erasefriction.com/sitemap.xml",
  };
}
