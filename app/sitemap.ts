import { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'

// Revalidate sitemap every hour to avoid hitting database on every request
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://carzo.net'

  // Don't generate sitemap for staging environment (blocked by robots.txt anyway)
  const isStaging = baseUrl.includes('stage.carzo.net')
  if (isStaging) {
    return []
  }

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ]

  // Fetch active vehicles with pagination in parallel
  // Supabase has a max of 1000 rows per request, Google recommends max 50,000 URLs per sitemap
  // Fetch up to 49,998 vehicles (+ 2 static pages = 50,000 total, at Google's limit)
  const SITEMAP_LIMIT = 49998
  const PAGE_SIZE = 1000
  const totalPages = Math.ceil(SITEMAP_LIMIT / PAGE_SIZE)

  // Create array of page numbers for parallel fetching
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i)

  // Fetch all pages in parallel using Promise.all
  const promises = pageNumbers.map(page =>
    supabase
      .from('vehicles')
      .select('vin, last_sync')
      .eq('is_active', true)
      .order('last_sync', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
  )

  const results = await Promise.all(promises)

  // Process results and collect vehicles
  let allVehicles: Array<{ vin: string; last_sync: string | null }> = []

  for (const { data, error } of results) {
    if (error) {
      console.error('Error fetching vehicle page:', error)
      continue // Continue processing other successful results
    }

    if (data && data.length > 0) {
      allVehicles.push(...data)
    }
  }

  // Limit to exactly 49,998 vehicles to stay within Google's 50,000 URL limit (including 2 static pages)
  const limitedVehicles = allVehicles.slice(0, SITEMAP_LIMIT)

  console.log(`Sitemap: Including ${limitedVehicles.length} active vehicles`)

  // Generate vehicle detail pages
  const vehiclePages: MetadataRoute.Sitemap = limitedVehicles.map((vehicle) => ({
    url: `${baseUrl}/vehicles/${vehicle.vin}`,
    lastModified: vehicle.last_sync ? new Date(vehicle.last_sync) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [...staticPages, ...vehiclePages]
}
