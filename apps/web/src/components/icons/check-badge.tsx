import { cn } from '@/lib/cn';

/** Round check marker on the progress bar: green once claimed, grey when claimable. */
export function CheckBadge({
  tone,
  className,
}: {
  tone: 'claimed' | 'claimable';
  className?: string;
}) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      className={cn(
        tone === 'claimed' ? 'text-checkpoint-claimed' : 'text-checkpoint-claimable',
        className,
      )}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="10" cy="10" r="10" fill="currentColor" />
      <circle cx="10" cy="10" r="9" fill="none" stroke="white" strokeOpacity="0.6" />
      <path
        d="M5.5 10.2 L8.6 13.2 L14.5 7.2"
        fill="none"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
