import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Mobile-first page frame: content is at most 500px wide and centred on larger screens,
 * with an optional footer that stays at the bottom of the viewport.
 */
export function PageShell({
  children,
  footer,
  className,
}: {
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div className="flex min-h-dvh justify-center">
      <div className={cn('flex w-full max-w-[500px] flex-col bg-white', className)}>
        <main className="flex flex-1 flex-col">{children}</main>
        {footer && (
          <footer className="sticky bottom-0 rounded-t-card bg-white px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-footer">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
