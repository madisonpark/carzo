"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

interface UserLocation {
  city: string;
  state: string;
  latitude: number;
  longitude: number;
}

export function LocationSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [zipCode, setZipCode] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-detect or load from cache/URL on mount
  // Fix: Memoize to prevent dependency loop, but dependencies are tricky.
  // Better to keep it outside or use a ref if we want to avoid re-creating it.
  // Or simplify: we only need this on mount or when we *decide* to re-detect.
  const detectLocation = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/detect-location");
      if (!response.ok) throw new Error("Failed to detect location");

      const data = await response.json();
      if (data.success && data.location) {
        const loc = data.location;
        // We need to call the update logic here, but we can't easily call updateLocationState 
        // if it's defined below. Let's duplicate the logic or move it up.
        // Moving logic inside or creating a separate helper.
        setLocation(loc);
        sessionStorage.setItem("userLocation", JSON.stringify(loc));
        
        // Update URL
        // Note: We need to get current params, which we have from useSearchParams (but it's read-onlyish)
        // We construct new URLSearchParams from window or the hook result.
        // Using window.location.search is sometimes safer for "current" state in callbacks
        // but useSearchParams is the Next.js way.
        const params = new URLSearchParams(window.location.search);
        params.set("lat", loc.latitude.toString());
        params.set("lon", loc.longitude.toString());
        router.replace(`/search?${params.toString()}`, { scroll: false });
      }
    } catch (error) {
      // Safe error logging
      if (process.env.NODE_ENV !== "production") {
        console.error("Error detecting location:", error);
      }
    } finally {
      setLoading(false);
    }
  }, [router]); // Removed searchParams from deps to avoid loop, added router

  const updateLocationState = (loc: UserLocation) => {
    setLocation(loc);
    sessionStorage.setItem("userLocation", JSON.stringify(loc));
    
    const params = new URLSearchParams(window.location.search);
    params.set("lat", loc.latitude.toString());
    params.set("lon", loc.longitude.toString());
    router.replace(`/search?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    // Priority: URL -> Cache -> Auto-detect
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");
    const cachedLocation = sessionStorage.getItem("userLocation");

    if (lat && lon) {
      if (cachedLocation) {
        const loc = JSON.parse(cachedLocation);
        // Simple check if cache matches URL roughly
        if (Math.abs(loc.latitude - parseFloat(lat)) < 0.01) {
           setLocation(loc);
           return;
        }
      }
      // If URL has coords but no matching cache, we re-detect to get city/state
      detectLocation(); 
    } else if (cachedLocation) {
      updateLocationState(JSON.parse(cachedLocation));
    } else {
      detectLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount (and when deps change, but we want to avoid loop)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!zipCode || zipCode.length !== 5) {
      setError("Enter 5-digit ZIP");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/zipcode-lookup?zip=${zipCode}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Zip not found");
        return;
      }

      const { city, state, latitude, longitude } = data.location;
      updateLocationState({ city, state, latitude, longitude });
      setIsEditing(false);
      setZipCode("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Lookup failed";
      if (process.env.NODE_ENV !== "production") {
        console.error("ZIP lookup error:", err);
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (isEditing) {
    return (
      <form onSubmit={handleManualSubmit} className="flex items-center gap-2 animate-fade-in">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={zipCode}
            onChange={(e) => {
              setZipCode(e.target.value.replace(/\D/g, "").slice(0, 5));
              setError("");
            }}
            placeholder="Zip Code"
            aria-label="Enter 5-digit Zip Code"
            className={cn(
              "w-32 pl-3 pr-3 py-1.5 text-sm bg-white border rounded-md outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all",
              error ? "border-red-500 focus-visible:ring-red-500" : "border-gray-300"
            )}
            disabled={loading}
          />
          {error && (
            <span className="absolute -bottom-5 left-0 text-[10px] text-red-500 whitespace-nowrap">
              {error}
            </span>
          )}
        </div>
        <Button
          type="submit"
          size="sm"
          disabled={loading || zipCode.length !== 5}
          className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white"
          aria-label="Update location"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Update"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setIsEditing(false);
            setError("");
          }}
          className="h-8 w-8 p-0 hover:bg-gray-100"
          aria-label="Cancel location update"
        >
          <X className="w-4 h-4 text-gray-500" />
        </Button>
      </form>
    );
  }

  return (
    <div className="flex items-center">
      <button
        onClick={() => setIsEditing(true)}
        className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
        title="Change location"
        aria-label={location ? `Change location, currently near ${location.city}, ${location.state}` : "Set location"}
      >
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
          <MapPin className="w-3.5 h-3.5" />
        </div>
        <div className="flex flex-col items-start">
          <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 leading-none">
            Location
          </span>
          <span className="text-sm font-semibold text-gray-900 leading-none mt-0.5">
            {loading ? (
              <span className="animate-pulse">Locating...</span>
            ) : location ? (
              `Near ${location.city}, ${location.state}`
            ) : (
              "Set Location"
            )}
          </span>
        </div>
      </button>
    </div>
  );
}