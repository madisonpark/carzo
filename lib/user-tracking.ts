/**
 * User Tracking System for Carzo
 * Uses simple cookie-based approach for anonymous user identification
 * Purpose: Track which dealers each user has clicked (30-day deduplication)
 */

const USER_ID_COOKIE = 'carzo_user_id';
const SESSION_ID_KEY = 'carzo_session_id';
const CLICKED_DEALERS_KEY = 'carzo_clicked_dealers';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds

/**
 * Get or create persistent user ID (stored in cookie)
 * Returns consistent ID across sessions for 1 year
 */
export function getUserId(): string {
  if (typeof window === 'undefined') return '';

  // Try to get existing cookie
  const cookies = document.cookie.split('; ');
  for (const cookie of cookies) {
    const [name, value] = cookie.split('=');
    if (name === USER_ID_COOKIE) {
      return value;
    }
  }

  // Create new user ID using browser's crypto API
  const userId = crypto.randomUUID();

  // Set cookie with 1 year expiration
  document.cookie = `${USER_ID_COOKIE}=${userId}; max-age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax`;

  return userId;
}

/**
 * Get or create session ID (stored in sessionStorage)
 * Resets when browser tab is closed
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') return '';

  let sessionId = sessionStorage.getItem(SESSION_ID_KEY);

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  }

  return sessionId;
}

/**
 * Check if user has clicked this dealer in current session
 * Used for UI feedback (not for billing - server handles that)
 */
export function hasClickedDealer(dealerId: string): boolean {
  if (typeof window === 'undefined') return false;

  const clickedDealers = getClickedDealers();
  return clickedDealers.has(dealerId);
}

/**
 * Mark dealer as clicked in current session
 */
export function markDealerClicked(dealerId: string): void {
  if (typeof window === 'undefined') return;

  const clickedDealers = getClickedDealers();
  clickedDealers.add(dealerId);

  sessionStorage.setItem(
    CLICKED_DEALERS_KEY,
    JSON.stringify(Array.from(clickedDealers))
  );
}

/**
 * Get set of clicked dealers in current session
 * Returns empty set if data is corrupted or invalid
 */
function getClickedDealers(): Set<string> {
  const stored = sessionStorage.getItem(CLICKED_DEALERS_KEY);
  if (stored) {
    try {
      return new Set(JSON.parse(stored));
    } catch (error) {
      // Corrupted data - clear it and return empty set
      sessionStorage.removeItem(CLICKED_DEALERS_KEY);
      return new Set();
    }
  }
  return new Set();
}

/**
 * Get UTM parameters from URL
 */
export function getUtmParams(): {
  source?: string;
  medium?: string;
  campaign?: string;
} {
  if (typeof window === 'undefined') return {};

  const params = new URLSearchParams(window.location.search);

  return {
    source: params.get('utm_source') || undefined,
    medium: params.get('utm_medium') || undefined,
    campaign: params.get('utm_campaign') || undefined,
  };
}

/**
 * Clear all tracking data (for testing/debugging)
 */
export function clearTrackingData(): void {
  if (typeof window === 'undefined') return;

  // Clear cookie
  document.cookie = `${USER_ID_COOKIE}=; max-age=0; path=/`;

  // Clear session storage
  sessionStorage.removeItem(SESSION_ID_KEY);
  sessionStorage.removeItem(CLICKED_DEALERS_KEY);
}
