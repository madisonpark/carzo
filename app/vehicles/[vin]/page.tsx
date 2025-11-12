import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Vehicle } from '@/lib/supabase';
import VehicleBridgePage from '@/components/VDP/VehicleBridgePage';

interface PageProps {
  params: Promise<{ vin: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { vin } = await params;

  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('*')
    .eq('vin', vin)
    .eq('is_active', true)
    .single();

  if (!vehicle) {
    return {
      title: 'Vehicle Not Found',
    };
  }

  const title = `${vehicle.condition || 'Used'} ${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim || ''} for Sale in ${vehicle.dealer_city}, ${vehicle.dealer_state}`.trim();
  const description = vehicle.description
    ? vehicle.description.substring(0, 160) + '...'
    : `View this ${vehicle.year} ${vehicle.make} ${vehicle.model} for $${vehicle.price.toLocaleString()}. ${vehicle.miles ? `${vehicle.miles.toLocaleString()} miles.` : ''} See full photo gallery and vehicle details.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: vehicle.primary_image_url ? [vehicle.primary_image_url] : [],
    },
  };
}

// Fetch vehicle data
async function getVehicle(vin: string): Promise<Vehicle | null> {
  const { data: vehicle, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('vin', vin)
    .eq('is_active', true)
    .single();

  if (error || !vehicle) {
    return null;
  }

  return vehicle as Vehicle;
}

// Main page component
export default async function VehicleDetailPage({ params, searchParams }: PageProps) {
  const { vin } = await params;
  const sp = await searchParams;
  const flow = (sp?.flow as string) || 'full';

  const vehicle = await getVehicle(vin);

  if (!vehicle) {
    notFound();
  }

  // Generate Schema.org/Vehicle structured data for Rich Snippets
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Car',
    name: `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim || ''}`.trim(),
    description: vehicle.description || `${vehicle.condition || 'Used'} ${vehicle.year} ${vehicle.make} ${vehicle.model} for sale`,
    brand: {
      '@type': 'Brand',
      name: vehicle.make,
    },
    model: vehicle.model,
    vehicleIdentificationNumber: vehicle.vin,
    vehicleModelDate: vehicle.year?.toString(),
    vehicleConfiguration: vehicle.trim || undefined,
    bodyType: vehicle.body_style || undefined,
    vehicleTransmission: vehicle.transmission || undefined,
    driveWheelConfiguration: vehicle.drive_type || undefined,
    fuelType: vehicle.fuel_type || undefined,
    color: vehicle.exterior_color || undefined,
    mileageFromOdometer: vehicle.miles
      ? {
          '@type': 'QuantitativeValue',
          value: vehicle.miles,
          unitCode: 'SMI', // Statute mile
        }
      : undefined,
    itemCondition: vehicle.condition === 'New'
      ? 'https://schema.org/NewCondition'
      : 'https://schema.org/UsedCondition',
    offers: {
      '@type': 'Offer',
      price: vehicle.price,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://carzo.net'}/vehicles/${vehicle.vin}`,
      seller: {
        '@type': 'AutoDealer',
        name: vehicle.dealer_name,
        address: {
          '@type': 'PostalAddress',
          addressLocality: vehicle.dealer_city,
          addressRegion: vehicle.dealer_state,
          postalCode: vehicle.dealer_zip || undefined,
        },
      },
    },
    image: vehicle.primary_image_url || undefined,
  };

  return (
    <>
      {/* Schema.org structured data for Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <VehicleBridgePage vehicle={vehicle} flow={flow} />
    </>
  );
}

// Enable ISR: Generate on-demand, revalidate every 6 hours
export const revalidate = 21600; // 6 hours in seconds
