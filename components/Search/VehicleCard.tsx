'use client';

import { Vehicle } from '@/lib/supabase';
import Link from 'next/link';
import { Camera, MapPin } from 'lucide-react';

interface VehicleCardProps {
  vehicle: Vehicle & { distance_miles?: number };
}

export default function VehicleCard({ vehicle }: VehicleCardProps) {
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(vehicle.price);

  const formattedMileage = vehicle.miles
    ? new Intl.NumberFormat('en-US').format(vehicle.miles)
    : null;

  return (
    <Link
      href={`/vehicles/${vehicle.vin}`}
      className="group bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-200 flex flex-col h-full"
    >
      {/* Image - Fixed height */}
      <div className="relative h-48 bg-slate-200 overflow-hidden flex-shrink-0">
        <img
          src={(vehicle.primary_image_url && vehicle.primary_image_url.trim()) || '/placeholder-vehicle.svg'}
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.currentTarget.src = '/placeholder-vehicle.svg';
          }}
        />
        {vehicle.condition && (
          <span className="absolute top-2 left-2 px-2.5 py-0.5 bg-blue-600 text-white text-xs font-semibold rounded">
            {vehicle.condition}
          </span>
        )}
        {vehicle.total_photos && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 bg-black/75 text-white text-xs font-medium rounded">
            <Camera className="w-3 h-3" />
            {vehicle.total_photos}
          </div>
        )}
      </div>

      {/* Content - Flex grow to fill remaining space */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Title - Fixed height with line clamp */}
        <div className="mb-2 min-h-[3rem]">
          <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h3>
          {vehicle.trim && (
            <p className="text-sm text-slate-600 line-clamp-1">{vehicle.trim}</p>
          )}
        </div>

        {/* Price */}
        <p className="text-xl font-bold text-slate-900 mb-3">{formattedPrice}</p>

        {/* Details - Single line */}
        <div className="text-sm text-slate-600 mb-3 space-y-1">
          {formattedMileage && <div>{formattedMileage} miles</div>}
          {vehicle.transmission && <div>{vehicle.transmission}</div>}
        </div>

        {/* Spacer to push location and button to bottom */}
        <div className="flex-grow"></div>

        {/* Location */}
        <div className="flex items-center justify-between text-sm text-slate-600 mb-3">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="line-clamp-1">
              {vehicle.dealer_city}, {vehicle.dealer_state}
            </span>
          </div>
          {vehicle.distance_miles !== undefined && vehicle.distance_miles !== Infinity && (
            <span className="text-blue-600 font-semibold ml-2 flex-shrink-0">
              {Math.round(vehicle.distance_miles)} mi
            </span>
          )}
        </div>

        {/* CTA */}
        <button className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2">
          <Camera className="w-4 h-4" />
          See Full Photo Gallery
          <span className="text-lg">›</span>
        </button>
      </div>
    </Link>
  );
}
