import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Foodie Café — Good Food. Great Mood.',
  description: 'Your cravings deserve something special. Discover freshly prepared meals, delicious bites and refreshing drinks at Foodie Café.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.jpg" />
      </head>
      <body>{children}</body>
    </html>
  );
}
