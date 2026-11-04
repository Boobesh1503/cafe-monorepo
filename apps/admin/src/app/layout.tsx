import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hearth & Hill | Cafe Admin',
  description: 'Operations dashboard foundation for Hearth & Hill Cafe.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
