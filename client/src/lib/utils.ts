import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function formatTime(time: string): string {
  return time;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export const genreColorMap: Record<string, { bg: string, text: string }> = {
  Rock: { bg: 'bg-secondary/10', text: 'text-secondary' },
  Pop: { bg: 'bg-accent/10', text: 'text-accent' },
  Indie: { bg: 'bg-primary/10', text: 'text-primary' },
  Jazz: { bg: 'bg-dark/10', text: 'text-dark' },
  Electronic: { bg: 'bg-success/10', text: 'text-success' },
  Classical: { bg: 'bg-[#9b59b6]/10', text: 'text-[#9b59b6]' },
  Country: { bg: 'bg-[#e67e22]/10', text: 'text-[#e67e22]' },
  "R&B": { bg: 'bg-[#3498db]/10', text: 'text-[#3498db]' },
  default: { bg: 'bg-dark/10', text: 'text-dark' }
};
