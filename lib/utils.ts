import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function for conditionally joining Tailwind CSS classes
 *
 * Combines clsx for conditional classes with tailwind-merge for proper
 * Tailwind class merging (handles conflicts like "p-4 p-6" → "p-6")
 *
 * @example
 * cn('px-4 py-2', isActive && 'bg-primary', className)
 * // Output: 'px-4 py-2 bg-primary custom-class'
 *
 * @example
 * cn('p-4 text-red-500', 'p-6 text-blue-600')
 * // Output: 'p-6 text-blue-600' (later classes override)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Helper to anonymize IP (zero out last octet for IPv4, last 80 bits for IPv6)
 * @param ip - The IP address string
 * @returns Anonymized IP address string
 */
export function anonymizeIp(ip: string | null | undefined): string | null | undefined {
  if (!ip) {
    return ip;
  }
  if (ip.includes(':')) {
    // IPv6
    const parts = ip.split(':');
    // Anonymize last 5 parts (80 bits)
    return [...parts.slice(0, 3), '0:0:0:0:0'].join(':');
  }
  // IPv4
  const parts = ip.split('.');
  if (parts.length === 4) {
    return parts.slice(0, 3).join('.') + '.0';
  }
  return ip; // Return as is if not a standard IPv4/IPv6
}
