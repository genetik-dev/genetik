import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class names with Tailwind-aware deduplication. Used by shadcn-style components.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
