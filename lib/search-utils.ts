
/**
 * Determines if dealer diversification should be applied based on the sort order.
 * 
 * Business Rule:
 * - Diversification ON: Relevance, Distance, Year (user exploring)
 * - Diversification OFF: Price, Mileage (user intent is specific/strict)
 * 
 * @param sortBy - The current sort parameter
 * @returns boolean - True if diversification should be applied
 */
export function shouldApplyDiversification(sortBy?: string): boolean {
  if (!sortBy) return true; // Default sort (Relevance)

  // Whitelist approach: Only diversity on fuzzy sorts
  const diversifiedSorts = [
    'relevance',
    'distance',
    'year_desc',
    'year_asc'
  ];

  return diversifiedSorts.includes(sortBy);
}

