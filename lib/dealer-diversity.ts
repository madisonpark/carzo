/**
 * Dealer Diversification Algorithm
 * CRITICAL: Maximizes revenue by rotating dealers in vehicle lists
 * Business Rule: $0.80 per UNIQUE dealer per user per 30 days
 */

/**
 * Diversify vehicles by dealer using round-robin algorithm
 * Ensures maximum variety of dealers to maximize billable clicks
 *
 * Example:
 * Input:  [Toyota-DealerA, Toyota-DealerA, Ford-DealerB, Toyota-DealerC]
 * Output: [Toyota-DealerA, Ford-DealerB, Toyota-DealerC, Toyota-DealerA]
 *
 * @param vehicles - Array of vehicles with dealer_id
 * @param limit - Maximum number of vehicles to return
 * @returns Diversified array with dealers rotated
 */
export function diversifyByDealer<T extends { dealer_id: string }>(
  vehicles: T[],
  limit: number
): T[] {
  if (vehicles.length === 0) return [];

  const result: T[] = [];
  const dealerVehicles = new Map<string, T[]>();

  // Group vehicles by dealer
  for (const vehicle of vehicles) {
    if (!dealerVehicles.has(vehicle.dealer_id)) {
      dealerVehicles.set(vehicle.dealer_id, []);
    }
    dealerVehicles.get(vehicle.dealer_id)!.push(vehicle);
  }

  // Convert to array for round-robin
  const dealerArrays = Array.from(dealerVehicles.values());
  let maxRounds = 100; // Safety limit

  // Round-robin through dealers
  while (result.length < limit && maxRounds > 0) {
    let addedInRound = false;

    for (const dealerVehicles of dealerArrays) {
      if (dealerVehicles.length > 0 && result.length < limit) {
        result.push(dealerVehicles.shift()!);
        addedInRound = true;
      }
    }

    // Break if no vehicles added (all dealers exhausted)
    if (!addedInRound) break;
    maxRounds--;
  }

  return result;
}

/**
 * Calculate dealer diversity score (percentage of unique dealers)
 * Used for analytics to track revenue optimization
 *
 * @param vehicles - Array of vehicles with dealer_id
 * @returns Percentage (0-100) of unique dealers
 */
export function calculateDealerDiversity(
  vehicles: { dealer_id: string }[]
): number {
  if (vehicles.length === 0) return 0;

  const uniqueDealers = new Set(vehicles.map((v) => v.dealer_id));
  return (uniqueDealers.size / vehicles.length) * 100;
}

/**
 * Get dealer distribution stats
 * Useful for admin dashboard
 */
export function getDealerStats(
  vehicles: { dealer_id: string; dealer_name: string }[]
): {
  totalDealers: number;
  vehiclesPerDealer: Record<string, number>;
  topDealers: Array<{ dealerId: string; dealerName: string; count: number }>;
} {
  const vehiclesPerDealer: Record<string, number> = {};
  const dealerNames: Record<string, string> = {};

  for (const vehicle of vehicles) {
    vehiclesPerDealer[vehicle.dealer_id] =
      (vehiclesPerDealer[vehicle.dealer_id] || 0) + 1;
    dealerNames[vehicle.dealer_id] = vehicle.dealer_name;
  }

  const topDealers = Object.entries(vehiclesPerDealer)
    .map(([dealerId, count]) => ({
      dealerId,
      dealerName: dealerNames[dealerId],
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalDealers: Object.keys(vehiclesPerDealer).length,
    vehiclesPerDealer,
    topDealers,
  };
}

/**
 * Filter to prioritize different dealers than the current vehicle
 * Used for "Related Vehicles" section to maximize dealer diversity
 *
 * @param currentVehicle - The vehicle currently being viewed
 * @param relatedVehicles - Array of related vehicles
 * @param limit - Maximum number to return
 * @returns Related vehicles prioritizing different dealers
 */
export function prioritizeDifferentDealers<T extends { dealer_id: string }>(
  currentVehicle: { dealer_id: string },
  relatedVehicles: T[],
  limit: number
): T[] {
  // Split into different dealers and same dealer
  const differentDealers = relatedVehicles.filter(
    (v) => v.dealer_id !== currentVehicle.dealer_id
  );

  const sameDealers = relatedVehicles.filter(
    (v) => v.dealer_id === currentVehicle.dealer_id
  );

  // Prioritize different dealers, then add same dealer if needed
  const prioritized = [...differentDealers, ...sameDealers];

  // Apply diversification to the prioritized list
  return diversifyByDealer(prioritized, limit);
}
