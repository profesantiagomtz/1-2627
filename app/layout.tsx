import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'EDOA · Grupo 311',
  description: 'Plataforma de aprendizaje y acompañamiento para el grupo 311 en Elaboración de documentos digitales avanzados.',
  metadataBase: new URL('https://profesantiagomtz.github.io/1-2627/'),
  openGraph: {
    title: 'EDOA · Grupo 311',
    description: 'Aprende, entrega y avanza en Elaboración de documentos digitales avanzados.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'EDOA · Grupo 311' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EDOA · Grupo 311',
    description: 'Aprende, entrega y avanza en Elaboración de documentos digitales avanzados.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
