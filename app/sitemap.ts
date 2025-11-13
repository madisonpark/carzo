import { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://carzo.net'

  // Don't generate sitemap for staging environment (blocked by robots.txt anyway)
  const isStaging = baseUrl.includes('stage.')
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

  // Fetch active vehicles with pagination
  // Supabase has a max of 1000 rows per request, Google recommends max 50,000 URLs per sitemap
  // Fetch up to 49,998 vehicles (+ 2 static pages = 50,000 total, at Google's limit)
  const SITEMAP_LIMIT = 49998
  const PAGE_SIZE = 1000
  const totalPages = Math.ceil(SITEMAP_LIMIT / PAGE_SIZE)

  let allVehicles: Array<{ vin: string; last_sync: string | null }> = []

  // Fetch vehicles in batches
  for (let page = 0; page < totalPages; page++) {
    const { data, error } = await supabase
      .from('vehicles')
      .select('vin, last_sync')
      .eq('is_active', true)
      .order('last_sync', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (error) {
      console.error(`Error fetching vehicles page ${page}:`, error)
      break // Stop on error, use what we have
    }

    if (data && data.length > 0) {
      allVehicles = [...allVehicles, ...data]
    }

    // Stop if we got fewer results than requested (last page)
    if (!data || data.length < PAGE_SIZE) {
      break
    }
  }

  console.log(`Sitemap: Including ${allVehicles.length} active vehicles`)

  // Generate vehicle detail pages
  const vehiclePages: MetadataRoute.Sitemap = allVehicles.map((vehicle) => ({
    url: `${baseUrl}/vehicles/${vehicle.vin}`,
    lastModified: vehicle.last_sync ? new Date(vehicle.last_sync) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [...staticPages, ...vehiclePages]
}
