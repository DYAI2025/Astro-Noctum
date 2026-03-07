import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "../globals.css";
import "../styles/modern-alchemy-tokens.css";
import { getDictionary } from "@/i18n/dictionaries";
import { TranslationProvider } from "@/components/i18n/TranslationProvider";
import { normalizeLocale } from "@/i18n/config";
import Providers from "../providers";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "QuizzMe - Entdecke deine wahre Natur",
  description: "Persönlichkeitsquizze für Selbstentdeckung und persönliches Wachstum. Entdecke die Alchemie deiner Persönlichkeit.",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const { strings, locale } = await getDictionary(localeParam);
  const normalized = normalizeLocale(locale);

  return (
    <html lang={normalized} suppressHydrationWarning>
      <body
        className={`${playfair.variable} ${inter.variable} antialiased`}
        style={{ background: "var(--alchemy-bg-midnight)" }}
        suppressHydrationWarning
      >
        <TranslationProvider locale={normalized} strings={strings}>
          <Providers>
            {children}
          </Providers>
        </TranslationProvider>
      </body>
    </html>
  );
}
