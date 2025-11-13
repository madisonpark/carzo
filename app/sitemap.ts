import { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://carzo.com'

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

  // Fetch all active vehicles
  const { data: vehicles, error } = await supabase
    .from('vehicles')
    .select('vin, last_sync')
    .eq('is_active', true)
    .order('last_sync', { ascending: false })

  if (error) {
    console.error('Error fetching vehicles for sitemap:', error)
    return staticPages // Return at least static pages
  }

  // Generate vehicle detail pages
  const vehiclePages: MetadataRoute.Sitemap = (vehicles || []).map((vehicle) => ({
    url: `${baseUrl}/vehicles/${vehicle.vin}`,
    lastModified: vehicle.last_sync ? new Date(vehicle.last_sync) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [...staticPages, ...vehiclePages]
}
