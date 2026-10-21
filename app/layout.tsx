import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/shared/theme-provider';
import { QueryProvider } from '@/components/shared/query-provider';
import { AuthProvider } from '@/lib/auth/auth-context';
import { SessionExpiredDialog } from '@/components/shared/session-expired-dialog';
import { ServiceWorkerRegistration } from '@/components/shared/service-worker-registration';

export const viewport: Viewport = {
  themeColor: '#4f46e5',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'TalentLens - ATS B2B Éthique & Recrutement Impartial',
  description:
    'ATS B2B multi-organisations dédié aux cabinets de recrutement avec mode aveugle natif, conformité RGPD stricte et matching explicable.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TalentLens',
  },
  openGraph: {
    title: 'TalentLens - ATS B2B Éthique & Recrutement Impartial',
    description:
      'ATS B2B multi-organisations dédié aux cabinets de recrutement avec mode aveugle natif, conformité RGPD stricte et matching explicable.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TalentLens - ATS B2B Éthique & Recrutement Impartial',
    description:
      'ATS B2B multi-organisations dédié aux cabinets de recrutement avec mode aveugle natif, conformité RGPD stricte et matching explicable.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-50">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              {children}
              <SessionExpiredDialog />
              <ServiceWorkerRegistration />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
