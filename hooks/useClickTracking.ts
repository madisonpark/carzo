'use client';

import { useEffect, useState } from 'react';
import { getUserId, getSessionId } from '@/lib/user-tracking';
import { trackPurchase } from '@/lib/facebook-pixel';

interface TrackClickOptions {
  vehicleId: string;
  dealerId: string;
  ctaClicked?: 'primary' | 'history' | 'payment' | 'photos';
}

interface TrackClickResponse {
  success: boolean;
  billable: boolean;
  message: string;
}

export function useClickTracking() {
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Initialize user and session IDs on mount
  useEffect(() => {
    setUserId(getUserId());
    setSessionId(getSessionId());
  }, []);

  /**
   * Track a click to dealer site
   * Returns whether the click was billable
   */
  const trackClick = async ({
    vehicleId,
    dealerId,
    ctaClicked = 'primary',
  }: TrackClickOptions): Promise<TrackClickResponse> => {
    // Fire Facebook Pixel Purchase event immediately (client-side)
    trackPurchase();

    if (!userId || !sessionId) {
      console.warn('User ID or session ID not initialized');
      return {
        success: false,
        billable: false,
        message: 'User ID not initialized',
      };
    }

    try {
      const response = await fetch('/api/track-click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicleId,
          dealerId,
          userId,
          sessionId,
          ctaClicked,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to track click');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error tracking click:', error);
      return {
        success: false,
        billable: false,
        message: 'Failed to track click',
      };
    }
  };

  /**
   * Create a click handler that tracks before navigating
   * Note: For new tab links, we track immediately without waiting
   */
  const createClickHandler = (options: TrackClickOptions) => {
    return () => {
      // Don't prevent default - let the link open in new tab
      // Track asynchronously (fire and forget)
      trackClick(options).catch(console.error);
    };
  };

  return {
    userId,
    sessionId,
    trackClick,
    createClickHandler,
  };
}
