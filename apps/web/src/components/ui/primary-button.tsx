import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

const base =
  'inline-flex items-center justify-center rounded-full bg-brand-yellow font-bold text-white ' +
  'transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 ' +
  'focus-visible:outline-brand-yellow disabled:cursor-not-allowed disabled:opacity-50';

const sizes = {
  large: 'min-h-12 w-full px-6 text-xl',
  medium: 'min-h-9 min-w-44 px-6 text-base',
};

type Size = keyof typeof sizes;

/** Yellow pill button from the design ("Primary button" component). */
export function PrimaryButton({
  size = 'large',
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { size?: Size }) {
  return <button type={type} className={cn(base, sizes[size], className)} {...props} />;
}

/** Same appearance as `PrimaryButton`, for navigation. */
export function PrimaryLink({
  href,
  size = 'large',
  className,
  children,
}: {
  href: string;
  size?: Size;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={cn(base, sizes[size], className)}>
      {children}
    </Link>
  );
}
