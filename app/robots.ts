import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://carzo.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/search$',  // Allow search page itself
          '/vehicles/',
        ],
        disallow: [
          '/admin/',
          '/api/',
          '/search?*',  // Block search with query params (prevent crawl bloat)
          '/*?flow=*',  // Block A/B test flow parameters (prevent duplicate content)
          '/*.json$',   // Block JSON files
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/search$',
          '/vehicles/',
        ],
        disallow: [
          '/admin/',
          '/api/',
          '/search?*',
          '/*?flow=*',
        ],
        crawlDelay: 0,  // No delay for Google
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
