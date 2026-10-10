import { cn } from '@/lib/cn';

/** Error message with a retry button, used wherever data fails to load. */
export function ErrorState({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry: () => void;
  className?: string;
}) {
  return (
    <div role="alert" className={cn('flex flex-col items-center gap-3 text-center', className)}>
      <p className="text-sm leading-6 text-text-secondary">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="min-h-9 rounded-full border border-accent-red px-5 text-sm text-accent-red hover:bg-accent-red/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-red"
      >
        ลองใหม่
      </button>
    </div>
  );
}
