/**
 * Flow Detection Utilities for A/B Testing
 *
 * Detects and manages user flow variants for A/B testing:
 * - Flow A (direct): SERP → Dealer (skip VDP)
 * - Flow B (vdp-only): Ad → VDP → Dealer (skip SERP)
 * - Flow C (full): SERP → VDP → Dealer (default)
 */

export type UserFlow = 'direct' | 'vdp-only' | 'full';

/**
 * Get the current flow variant from URL parameters
 * @returns UserFlow - The detected flow or 'full' as default
 */
export function getFlowFromUrl(): UserFlow {
  // Server-side: Return default
  if (typeof window === 'undefined') {
    return 'full';
  }

  const params = new URLSearchParams(window.location.search);
  const flow = params.get('flow');

  // Validate flow parameter
  if (flow === 'direct' || flow === 'vdp-only') {
    return flow;
  }

  // Default to full funnel
  return 'full';
}

/**
 * Preserve flow parameter when navigating to a new path
 * @param targetPath - The path to navigate to
 * @returns string - The path with flow parameter preserved
 *
 * @example
 * // Current URL: /search?make=toyota&flow=direct
 * preserveFlowParam('/vehicles/ABC123')
 * // Returns: '/vehicles/ABC123?flow=direct'
 */
export function preserveFlowParam(targetPath: string): string {
  // Server-side: Return path as-is
  if (typeof window === 'undefined') {
    return targetPath;
  }

  const currentParams = new URLSearchParams(window.location.search);
  const flow = currentParams.get('flow');

  // No flow parameter to preserve
  if (!flow || flow === 'full') {
    return targetPath;
  }

  // Parse target path (may already have query params)
  const url = new URL(targetPath, window.location.origin);
  url.searchParams.set('flow', flow);

  return url.pathname + url.search;
}

/**
 * Add flow parameter to a URL
 * @param url - The URL to add flow parameter to
 * @param flow - The flow variant to add
 * @returns string - The URL with flow parameter added
 *
 * @example
 * addFlowParam('/search?make=toyota', 'direct')
 * // Returns: '/search?make=toyota&flow=direct'
 */
export function addFlowParam(url: string, flow: UserFlow): string {
  // Don't add 'full' parameter (it's the default)
  if (flow === 'full') {
    return url;
  }

  const urlObj = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
  urlObj.searchParams.set('flow', flow);

  return urlObj.pathname + urlObj.search;
}

/**
 * Get flow label for display purposes
 * @param flow - The flow variant
 * @returns string - Human-readable flow label
 */
export function getFlowLabel(flow: UserFlow): string {
  const labels: Record<UserFlow, string> = {
    direct: 'Flow A: Direct to Dealer',
    'vdp-only': 'Flow B: VDP Only',
    full: 'Flow C: Full Funnel (Default)',
  };

  return labels[flow];
}

/**
 * Get flow description for analytics/documentation
 * @param flow - The flow variant
 * @returns string - Detailed flow description
 */
export function getFlowDescription(flow: UserFlow): string {
  const descriptions: Record<UserFlow, string> = {
    direct: 'SERP → Dealer (skip VDP) - Minimal friction, direct links from search results',
    'vdp-only': 'Ad → VDP → Dealer (skip SERP) - Vehicle-specific landing pages for targeted ads',
    full: 'SERP → VDP → Dealer - Full funnel with photo gallery tease and trust-building',
  };

  return descriptions[flow];
}

/**
 * Check if a flow requires direct dealer links (Flow A)
 * @param flow - The flow variant
 * @returns boolean - True if vehicle cards should link directly to dealer
 */
export function isDirectFlow(flow: UserFlow): boolean {
  return flow === 'direct';
}

/**
 * Check if a flow is VDP-only (Flow B)
 * @param flow - The flow variant
 * @returns boolean - True if VDP should auto-redirect to dealer
 */
export function isVDPOnlyFlow(flow: UserFlow): boolean {
  return flow === 'vdp-only';
}

/**
 * Check if a flow is full funnel (Flow C)
 * @param flow - The flow variant
 * @returns boolean - True if using full SERP → VDP → Dealer funnel
 */
export function isFullFlow(flow: UserFlow): boolean {
  return flow === 'full';
}

/**
 * Get CTA text based on flow variant
 * @param flow - The flow variant
 * @returns string - Appropriate CTA text for the flow
 */
export function getFlowCTA(flow: UserFlow): string {
  const ctas: Record<UserFlow, string> = {
    direct: 'View at Dealer',
    'vdp-only': 'See This Vehicle',
    full: 'Check Availability',
  };

  return ctas[flow];
}
