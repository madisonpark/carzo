"use client";

import { Vehicle } from "@/lib/supabase";
import Link from "next/link";
import { Camera, MapPin, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui";
import { useState } from "react";
import {
  getFlowFromUrl,
  preserveFlowParam,
  isDirectFlow,
  UserFlow,
} from "@/lib/flow-detection";
import { getUserId, getSessionId, getUtmParams } from "@/lib/user-tracking";
import { trackPurchase } from "@/lib/facebook-pixel";

interface VehicleCardProps {
  vehicle: Vehicle & { distance_miles?: number };
}

export default function VehicleCard({ vehicle }: VehicleCardProps) {
  // Initialize flow state directly instead of using useEffect to avoid cascading renders
  const [flow] = useState<UserFlow>(() => {
    if (typeof window === "undefined") return "full";
    return getFlowFromUrl();
  });

  const formattedPrice =
    vehicle.price && vehicle.price > 0
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(vehicle.price)
      : "Call for Price";

  const formattedMileage = vehicle.miles
    ? new Intl.NumberFormat("en-US").format(vehicle.miles)
    : null;

  // Determine link destination based on flow
  const isDirect = isDirectFlow(flow) && vehicle.dealer_vdp_url; // Only direct if URL exists
  const linkHref = isDirect
    ? vehicle.dealer_vdp_url // Flow A: Direct to dealer
    : preserveFlowParam(`/vehicles/${vehicle.vin}`); // Flow C: To VDP

  const linkTarget = isDirect ? "_blank" : "_self";
  const linkRel = isDirect ? "noopener noreferrer" : undefined;

  // Track click for Flow A (direct to dealer)
  const handleClick = () => {
    if (isDirect) {
      // Fire Facebook Pixel Purchase event
      trackPurchase();

      // Track click with keepalive for reliable tracking when opening new tab
      fetch("/api/track-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: vehicle.id,
          dealerId: vehicle.dealer_id,
          userId: getUserId(),
          sessionId: getSessionId(),
          ctaClicked: "serp_direct",
          flow: "direct",
          ...getUtmParams(),
        }),
        keepalive: true,
      }).catch((err) => console.error("Failed to track click:", err));
    }
  };

  // Standardize condition text
  const conditionText =
    vehicle.condition?.toLowerCase() === "new" ? "New" : "Used";

  return (
    <Link
      href={linkHref}
      target={linkTarget}
      rel={linkRel}
      onClick={handleClick}
      className="group bg-trust-card border border-trust-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full"
    >
      {/* Image Area */}
      <div className="relative h-48 bg-trust-elevated overflow-hidden shrink-0">
        <img
          src={
            (vehicle.primary_image_url && vehicle.primary_image_url.trim()) ||
            "/placeholder-vehicle.svg"
          }
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.currentTarget.src = "/placeholder-vehicle.svg";
          }}
        />
        
        {/* Overlay with Price */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
        <div className="absolute bottom-3 left-3 text-white font-bold text-lg shadow-black/20 drop-shadow-sm">
          {formattedPrice}
        </div>

        {/* Badge */}
        {vehicle.condition && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-white/90 backdrop-blur text-trust-navy font-bold text-[10px] uppercase tracking-wider px-2 py-1 rounded-sm shadow-sm">
            {conditionText}
          </div>
        )}
        
        {/* Photo Count */}
        {vehicle.total_photos && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur text-white text-xs font-medium rounded-sm">
            <Camera className="w-3 h-3" />
            {vehicle.total_photos}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col grow">
        {/* Title */}
        <div className="mb-2 min-h-12">
          <h3 className="text-base font-bold text-trust-text group-hover:text-trust-link transition-colors line-clamp-1">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h3>
          {vehicle.trim && (
            <p className="text-sm text-trust-muted line-clamp-1">
              {vehicle.trim}
            </p>
          )}
        </div>

        {/* Details */}
        <div className="text-sm text-trust-muted mb-4 space-y-1">
          {formattedMileage && <div>{formattedMileage} miles</div>}
          {vehicle.transmission && <div>{vehicle.transmission}</div>}
        </div>

        {/* Spacer */}
        <div className="grow"></div>

        {/* Location */}
        <div className="flex items-center justify-between text-sm text-trust-muted mb-4">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="line-clamp-1">
              {vehicle.dealer_city}, {vehicle.dealer_state}
            </span>
          </div>
          {vehicle.distance_miles !== undefined &&
            vehicle.distance_miles !== Infinity && (
              <span className="text-trust-link font-semibold ml-2 shrink-0">
                {Math.round(vehicle.distance_miles)} mi
              </span>
            )}
        </div>

        {/* Primary CTA */}
        <button
          className="w-full bg-trust-navy text-trust-on-brand px-4 py-3 rounded-md font-semibold text-sm hover:opacity-90 flex items-center justify-center gap-2 transition-opacity shadow-sm"
        >
          Check Availability
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </Link>
  );
}