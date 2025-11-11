import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Vehicle } from '@/lib/supabase';
import VehicleBridgePage from '@/components/VDP/VehicleBridgePage';

interface PageProps {
  params: Promise<{ vin: string }>;
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
export default async function VehicleDetailPage({ params }: PageProps) {
  const { vin } = await params;
  const vehicle = await getVehicle(vin);

  if (!vehicle) {
    notFound();
  }

  return <VehicleBridgePage vehicle={vehicle} />;
}

// Enable ISR: Generate on-demand, revalidate every 6 hours
export const revalidate = 21600; // 6 hours in seconds
