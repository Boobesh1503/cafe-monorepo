import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hearth & Hill — A little room to slow down',
  description: 'A neighborhood coffee house for thoughtful cups and unhurried mornings.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
