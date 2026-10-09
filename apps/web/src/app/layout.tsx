import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Nextzy Points Game',
  description: 'Collect points and claim rewards',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="th" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
