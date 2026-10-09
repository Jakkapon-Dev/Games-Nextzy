import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nextzy Points Game',
  description: 'Collect points and claim rewards',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="th" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
