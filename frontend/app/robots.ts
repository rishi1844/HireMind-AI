import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vita.genixpay.com";

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/resume/builder", "/interview", "/resume/upload", "/cover-letter", "/pricing", "/privacy", "/terms"],
      disallow: [
        "/api/",
        "/dashboard/",
        "/admin/",
        "/profile/",
        "/history/",
        "/resume/print/",
        "/auth/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
