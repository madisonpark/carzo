'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';

interface ZipCodeInputProps {
  placeholder?: string;
  className?: string;
  onLocationChange?: (location: { city: string; state: string; lat: number; lon: number }) => void;
}

/**
 * Zip code input component that converts zip to coordinates and updates location
 */
export default function ZipCodeInput({ placeholder = '98112', className = '', onLocationChange }: ZipCodeInputProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [zipCode, setZipCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!zipCode || zipCode.length !== 5) {
      setError('Please enter a valid 5-digit zip code');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/zipcode-lookup?zip=${zipCode}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || 'Zip code not found');
        setLoading(false);
        return;
      }

      const { city, state, latitude, longitude } = data.location;

      // Store in sessionStorage
      sessionStorage.setItem('userLocation', JSON.stringify({
        city,
        state,
        latitude,
        longitude,
      }));

      // Call callback if provided
      if (onLocationChange) {
        onLocationChange({ city, state, lat: latitude, lon: longitude });
      }

      // Update URL with new location
      const params = new URLSearchParams(searchParams.toString());
      params.set('lat', latitude.toString());
      params.set('lon', longitude.toString());

      // If we're on homepage, navigate to search
      if (window.location.pathname === '/') {
        router.push(`/search?${params.toString()}`);
      } else {
        // If on search page, just update params
        router.replace(`/search?${params.toString()}`);
      }

      setZipCode('');
    } catch (err) {
      console.error('Error looking up zip code:', err);
      setError('Failed to lookup zip code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={zipCode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 5);
                setZipCode(val);
                setError('');
              }}
              placeholder={placeholder}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border text-foreground rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:border-transparent"
              disabled={loading}
              maxLength={5}
            />
          </div>
          <Button
            type="submit"
            disabled={loading || zipCode.length !== 5}
            variant="brand"
            size="sm"
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4" />
                Update
              </>
            )}
          </Button>
        </div>
        {error && (
          <p className="text-sm text-error mt-1">{error}</p>
        )}
      </form>
    </div>
  );
}
