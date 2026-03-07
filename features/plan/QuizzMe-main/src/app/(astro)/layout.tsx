import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter, IBM_Plex_Mono } from "next/font/google";
import "./astro-sheet.css";
import { getDictionary } from "@/i18n/dictionaries";
import { TranslationProvider } from "@/components/i18n/TranslationProvider";
import { defaultLocale } from "@/i18n/config";
import Providers from "../providers";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// Font configurations
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-astro-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-astro-sans",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-astro-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: 'Astro Character Dashboard',
  description: 'Your cosmic identity revealed.',
};

export default async function AstroLayout({
  children,
}: {
  children: React.ReactNode;
 }) {
   const supabase = await createClient();
   const { data: { session } } = await supabase.auth.getSession();

   if (!session) {
     redirect('/login');
   }

   const { strings, locale } = await getDictionary(defaultLocale);

   return (
    <div
      className={`astro-scope ${cormorant.variable} ${inter.variable} ${ibmPlexMono.variable}`}
    >
      {/* Background pattern is handled by .astro-scope .bg-pattern in css */}
      <div className="bg-pattern" />

      <TranslationProvider locale={locale} strings={strings}>
        <Providers>
          {children}
        </Providers>
      </TranslationProvider>
    </div>
  );
}
