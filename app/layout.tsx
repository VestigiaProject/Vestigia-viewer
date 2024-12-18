import './globals.css';
import type { Metadata } from 'next';
import { Inter as FontSans } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { Navbar } from '@/components/layout/Navbar';
import { LanguageProvider } from '@/lib/hooks/useLanguage';
import { TranslationProvider } from '@/lib/hooks/useTranslation';
import { useAuth } from '@/lib/hooks/useAuth';
import { cn } from '@/lib/utils';

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

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
    <html lang="en" className={cn('antialiased', fontSans.variable)}>
      <body className={cn('min-h-screen bg-background font-sans antialiased')}>
        <LanguageProvider>
          <TranslationProvider>
            <Toaster />
            {children}
          </TranslationProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}