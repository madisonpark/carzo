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
