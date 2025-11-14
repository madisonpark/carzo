/**
 * Format body style with proper capitalization
 * SUV → SUV (all caps)
 * truck → Truck (capitalize first letter)
 * sedan → Sedan (capitalize first letter)
 */
export function formatBodyStyle(bodyStyle: string | null | undefined): string {
  if (!bodyStyle) return '';

  const normalized = bodyStyle.toLowerCase().trim();

  // Special case: SUV should be all caps
  if (normalized === 'suv') {
    return 'SUV';
  }

  // All other body styles: capitalize first letter
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

/**
 * Get plural form of body style with proper capitalization
 * SUV → SUVs
 * Truck → Trucks
 * Sedan → Sedans
 */
export function formatBodyStylePlural(bodyStyle: string | null | undefined): string {
  const formatted = formatBodyStyle(bodyStyle);
  if (!formatted) return '';

  return formatted + 's';
}
