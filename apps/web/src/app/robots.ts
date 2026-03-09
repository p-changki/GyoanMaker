import type { MetadataRoute } from "next";

const SITE_URL = "https://gyoan-maker.store";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pricing", "/privacy", "/terms"],
        disallow: [
          "/api/",
          "/generate",
          "/results",
          "/compile",
          "/dashboard",
          "/account",
          "/admin",
          "/pending",
          "/login",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
