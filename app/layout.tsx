import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { Navbar } from '@/components/layout/Navbar';
import { LanguageProvider } from '@/lib/hooks/useLanguage';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Scroll History - Experience The Past in Real Time',
  description: 'Experience history through a social media lens, starting from 1789.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LanguageProvider>
          <Navbar />
          {children}
          <Toaster />
        </LanguageProvider>
      </body>
    </html>
  );
}