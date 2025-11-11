'use client';

import { Vehicle } from '@/lib/supabase';
import Link from 'next/link';
import { Camera, MapPin } from 'lucide-react';

interface VehicleCardProps {
  vehicle: Vehicle & { distance?: number };
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
      className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300"
    >
      {/* Image */}
      <div className="relative aspect-video bg-slate-200 overflow-hidden">
        <img
          src={vehicle.primary_image_url}
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {vehicle.condition && (
          <span className="absolute top-3 left-3 px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
            {vehicle.condition}
          </span>
        )}
        {vehicle.total_photos && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 bg-black/70 text-white text-xs rounded">
            <Camera className="w-3 h-3" />
            {vehicle.total_photos}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </h3>
        {vehicle.trim && <p className="text-sm text-slate-600 mb-3">{vehicle.trim}</p>}

        {/* Price */}
        <p className="text-2xl font-bold text-blue-600 mb-3">{formattedPrice}</p>

        {/* Details */}
        <div className="flex items-center justify-between text-sm text-slate-600 mb-3">
          {formattedMileage && (
            <span className="flex items-center gap-1">
              {formattedMileage} miles
            </span>
          )}
          {vehicle.transmission && (
            <span>{vehicle.transmission}</span>
          )}
        </div>

        {/* Location */}
        <div className="flex items-center justify-between text-sm text-slate-500 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>
              {vehicle.dealer_city}, {vehicle.dealer_state}
            </span>
          </div>
          {vehicle.distance !== undefined && vehicle.distance !== Infinity && (
            <span className="text-blue-600 font-medium">
              {vehicle.distance} mi
            </span>
          )}
        </div>

        {/* CTA */}
        <button className="w-full mt-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">
          See Photos
        </button>
      </div>
    </Link>
  );
}
