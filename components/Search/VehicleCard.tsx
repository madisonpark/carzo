"use client";

import { Vehicle } from "@/lib/supabase";
import Link from "next/link";
import { Camera, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui";
import { useSearchParams } from "next/navigation";
import {
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
  const searchParams = useSearchParams();
  const flow = (searchParams.get("flow") as UserFlow) || "full";

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

  const isDirect = isDirectFlow(flow) && Boolean(vehicle.dealer_vdp_url);
  const linkHref = isDirect
    ? vehicle.dealer_vdp_url
    : preserveFlowParam(`/vehicles/${vehicle.vin}`);

  const linkTarget = isDirect ? "_blank" : "_self";
  const linkRel = isDirect ? "noopener noreferrer" : undefined;

  const handleClick = () => {
    if (isDirect) {
      trackPurchase();
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
      }).catch((err) => {
        if (process.env.NODE_ENV !== "production") {
          console.error("Failed to track click:", err);
        }
      });
    }
  };

  return (
    <Link
      href={linkHref}
      target={linkTarget}
      rel={linkRel}
      onClick={handleClick}
      aria-label={`Check availability for ${vehicle.year} ${vehicle.make} ${vehicle.model}`}
      className="group bg-trust-card border border-border hover:border-foreground/30 transition-colors rounded-lg overflow-hidden flex flex-col h-full outline-none focus-visible:ring-2 focus-visible:ring-trust-blue"
    >
      {/* Image Section */}
      <div className="relative h-48 bg-gray-100 overflow-hidden shrink-0">
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
        
        {vehicle.total_photos && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 bg-black/50 text-white text-xs font-medium rounded-sm backdrop-blur-sm">
            <Camera className="w-3 h-3" />
            {vehicle.total_photos}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-5 flex flex-col grow">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-base font-semibold text-gray-900 line-clamp-1">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {vehicle.trim}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-2xl font-extrabold tracking-tight text-trust-text">
            {formattedPrice}
          </p>
          <div className="text-xs font-medium text-muted-foreground mt-1">
            {formattedMileage && <span>{formattedMileage} mi</span>}
            {vehicle.transmission && <span> • {vehicle.transmission}</span>}
          </div>
        </div>

        <div className="grow"></div>

        <div
          className="w-full inline-flex items-center justify-center rounded-md font-semibold shadow-sm transition-all duration-300 outline-none bg-trust-blue text-white px-6 py-3 text-base pointer-events-none"
        >
          Check Availability
          <ChevronRight className="ml-1 w-5 h-5" />
        </div>
      </div>
    </Link>
  );
}
