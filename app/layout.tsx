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
      <body className={cn('min-h-screen font-sans antialiased relative')}>
        {/* Background image with overlay */}
        <div 
          className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10"
          style={{
            backgroundImage: 'url("https://ocubfcrajgjmdzymcwbu.supabase.co/storage/v1/object/public/landingpage/landing4.png")',
          }}
        >
          <div className="absolute inset-0 bg-black/40" />
        </div>
        <div className="relative min-h-screen bg-white/60 backdrop-blur-sm">
          <LanguageProvider>
            <TranslationProvider>
              <Toaster />
              <Navbar />
              {children}
            </TranslationProvider>
          </LanguageProvider>
        </div>
      </body>
    </html>
  );
}