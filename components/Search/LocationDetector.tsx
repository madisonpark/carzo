'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapPin } from 'lucide-react';

interface UserLocation {
  city: string;
  state: string;
  latitude: number;
  longitude: number;
}

/**
 * Client component that detects user location and adds to search params
 * Only runs once per session
 */
export default function LocationDetector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(false);

  const detectLocation = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/detect-location');
      if (!response.ok) {
        throw new Error('Failed to detect location');
      }

      const data = await response.json();
      if (data.success && data.location) {
        const loc = data.location;
        setLocation(loc);

        // Cache in sessionStorage
        sessionStorage.setItem('userLocation', JSON.stringify(loc));

        // Add to URL
        const params = new URLSearchParams(searchParams.toString());
        params.set('lat', loc.latitude.toString());
        params.set('lon', loc.longitude.toString());
        router.replace(`/search?${params.toString()}`, { scroll: false });
      }
    } catch (error) {
      console.error('Error detecting location:', error);
    } finally {
      setLoading(false);
    }
  }, [router, searchParams]);

  useEffect(() => {
    // Check if location is already in URL or sessionStorage
    const hasLocationInUrl = searchParams.get('lat') && searchParams.get('lon');
    const cachedLocation = sessionStorage.getItem('userLocation');

    if (hasLocationInUrl) {
      // Parse from URL
      const lat = parseFloat(searchParams.get('lat') || '0');
      const lon = parseFloat(searchParams.get('lon') || '0');
      const city = searchParams.get('city') || '';
      const state = searchParams.get('state') || '';

      if (lat && lon) {
        setLocation({ city, state, latitude: lat, longitude: lon });
      }
      return;
    }

    if (cachedLocation) {
      // Use cached location
      try {
        const loc = JSON.parse(cachedLocation);
        setLocation(loc);

        // Add to URL
        const params = new URLSearchParams(searchParams.toString());
        params.set('lat', loc.latitude.toString());
        params.set('lon', loc.longitude.toString());
        router.replace(`/search?${params.toString()}`, { scroll: false });
      } catch (e) {
        console.error('Failed to parse cached location:', e);
      }
      return;
    }

    // Detect location for the first time
    detectLocation();
  }, [detectLocation, router, searchParams]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <MapPin className="w-4 h-4 animate-pulse" />
        <span>Detecting your location...</span>
      </div>
    );
  }

  if (location && location.city) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <MapPin className="w-4 h-4 text-brand" />
          <span>
            <strong>{location.city}, {location.state}</strong>
          </span>
        </div>
      </div>
    );
  }

  return null;
}
