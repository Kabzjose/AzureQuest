import { Wifi } from 'lucide-react';

/**
 * Displayed when the first API request takes longer than ~3 seconds.
 * Neon's free tier may suspend compute; the banner reassures users while it wakes up.
 */
export function WakingUpBanner() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-50 bg-accent-600 text-white text-sm py-2 px-4 flex items-center justify-center gap-2 animate-pulse-slow"
    >
      <Wifi className="h-4 w-4 animate-pulse" />
      <span>Waking up the server… this may take a few seconds ☕</span>
    </div>
  );
}
