import type { Metadata } from 'next';
import './globals.css';

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const base = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return {
    title: 'Fusion Ring',
    description: 'A living energy visualization - your personal divergence monitor',
    metadataBase: new URL(base),
    icons: {
      icon: '/favicon.svg',
      shortcut: '/favicon.svg',
    },
    openGraph: {
      title: 'Fusion Ring',
      description: 'A living energy visualization - your personal divergence monitor',
      images: ['/og-image.png'],
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <head>
        <script src="https://apps.abacus.ai/chatllm/appllm-lib.js" />
      </head>
      <body className="bg-black overflow-hidden">
        <div suppressHydrationWarning>{children}</div>
      </body>
    </html>
  );
}
