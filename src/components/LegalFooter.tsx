import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

type LegalSection = "impressum" | "privacy" | "terms" | null;

const LEGAL_CONTENT = {
  impressum: {
    en: {
      title: "Legal Notice (Impressum)",
      body: `Bazodiac
Operated by: Benjamin Poersch
Email: contact@bazodiac.com

Responsible for content according to § 18 Abs. 2 MStV:
Benjamin Poersch

Dispute resolution:
The European Commission provides a platform for online dispute resolution (OS):
https://ec.europa.eu/consumers/odr
We are not willing or obliged to participate in dispute resolution proceedings before a consumer arbitration board.`,
    },
    de: {
      title: "Impressum",
      body: `Bazodiac
Betrieben von: Benjamin Poersch
E-Mail: contact@bazodiac.com

Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV:
Benjamin Poersch

Streitschlichtung:
Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
https://ec.europa.eu/consumers/odr
Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.`,
    },
  },
  privacy: {
    en: {
      title: "Privacy Policy",
      body: `1. Data Controller
Benjamin Poersch, contact@bazodiac.com

2. Data Collected
- Account data: email address, hashed password (via Supabase Auth)
- Birth data: date, time, and coordinates of birth (voluntarily provided for chart calculation)
- Usage data: anonymised analytics events (no IP storage)

3. Purpose of Processing
- Account management and authentication (Art. 6(1)(b) GDPR)
- Astrological chart calculation and personalised interpretation (Art. 6(1)(b) GDPR)
- Service improvement via anonymised analytics (Art. 6(1)(f) GDPR)

4. Third-Party Services
- Supabase (EU region): authentication, database hosting
- Google Gemini API: AI-generated interpretations (birth data sent pseudonymised)
- Stripe: payment processing (we do not store payment card data)
- ElevenLabs: voice agent (audio processed in real-time, not stored)

5. Data Retention
Your data is stored as long as your account exists. Upon account deletion, all personal data is removed within 30 days.

6. Your Rights (Art. 15-21 GDPR)
You have the right to access, rectification, erasure, restriction, data portability, and objection. Contact: contact@bazodiac.com

7. Cookies
Bazodiac uses only technically necessary cookies (session authentication). No tracking cookies or third-party advertising cookies are used.

8. Changes
We may update this policy. The current version is always available on this page.`,
    },
    de: {
      title: "Datenschutzerklärung",
      body: `1. Verantwortlicher
Benjamin Poersch, contact@bazodiac.com

2. Erhobene Daten
- Kontodaten: E-Mail-Adresse, gehashtes Passwort (über Supabase Auth)
- Geburtsdaten: Datum, Uhrzeit und Koordinaten der Geburt (freiwillig angegeben zur Chart-Berechnung)
- Nutzungsdaten: anonymisierte Analyse-Events (keine IP-Speicherung)

3. Zweck der Verarbeitung
- Kontoverwaltung und Authentifizierung (Art. 6 Abs. 1 lit. b DSGVO)
- Astrologische Chart-Berechnung und personalisierte Interpretation (Art. 6 Abs. 1 lit. b DSGVO)
- Serviceverbesserung durch anonymisierte Analysen (Art. 6 Abs. 1 lit. f DSGVO)

4. Drittanbieter
- Supabase (EU-Region): Authentifizierung, Datenbank-Hosting
- Google Gemini API: KI-generierte Interpretationen (Geburtsdaten pseudonymisiert übermittelt)
- Stripe: Zahlungsabwicklung (wir speichern keine Zahlungskartendaten)
- ElevenLabs: Sprach-Agent (Audio wird in Echtzeit verarbeitet, nicht gespeichert)

5. Speicherdauer
Ihre Daten werden gespeichert, solange Ihr Konto besteht. Bei Kontolöschung werden alle personenbezogenen Daten innerhalb von 30 Tagen entfernt.

6. Ihre Rechte (Art. 15-21 DSGVO)
Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch. Kontakt: contact@bazodiac.com

7. Cookies
Bazodiac verwendet ausschließlich technisch notwendige Cookies (Session-Authentifizierung). Es werden keine Tracking-Cookies oder Werbe-Cookies von Drittanbietern eingesetzt.

8. Änderungen
Wir können diese Richtlinie aktualisieren. Die aktuelle Version ist stets auf dieser Seite verfügbar.`,
    },
  },
  terms: {
    en: {
      title: "Terms & Conditions",
      body: `1. Scope
These terms govern the use of Bazodiac, a web application for astrological chart calculation and personality exploration.

2. Service Description
Bazodiac provides astrological calculations combining Western astrology, Chinese BaZi, and WuXing analysis. AI-generated interpretations are for entertainment and self-reflection purposes only and do not constitute professional advice.

3. Account
Users must register with a valid email address. You are responsible for maintaining the confidentiality of your account credentials.

4. Premium Features
Premium features are available via one-time payment. Payments are processed securely through Stripe. Refunds are available within 14 days if premium features have not been substantially used, in accordance with EU consumer protection law.

5. Intellectual Property
All content, design, and code of Bazodiac are the property of the operator. Your personal chart data belongs to you.

6. Limitation of Liability
Astrological readings are provided for entertainment and personal reflection. They are not a substitute for professional psychological, medical, or financial advice. The operator is not liable for decisions made based on readings.

7. Termination
You may delete your account at any time. The operator reserves the right to suspend accounts that violate these terms.

8. Governing Law
These terms are governed by the laws of the Federal Republic of Germany. The European Online Dispute Resolution platform is available at https://ec.europa.eu/consumers/odr.

9. Changes
We reserve the right to modify these terms. Continued use after changes constitutes acceptance.`,
    },
    de: {
      title: "Allgemeine Geschäftsbedingungen",
      body: `1. Geltungsbereich
Diese AGB regeln die Nutzung von Bazodiac, einer Webanwendung zur astrologischen Chart-Berechnung und Persönlichkeitserkundung.

2. Leistungsbeschreibung
Bazodiac bietet astrologische Berechnungen, die westliche Astrologie, chinesisches BaZi und WuXing-Analyse kombinieren. KI-generierte Interpretationen dienen ausschließlich der Unterhaltung und Selbstreflexion und stellen keine professionelle Beratung dar.

3. Benutzerkonto
Nutzer müssen sich mit einer gültigen E-Mail-Adresse registrieren. Sie sind für die Geheimhaltung Ihrer Zugangsdaten verantwortlich.

4. Premium-Funktionen
Premium-Funktionen sind per Einmalzahlung verfügbar. Zahlungen werden sicher über Stripe abgewickelt. Eine Rückerstattung ist innerhalb von 14 Tagen möglich, sofern die Premium-Funktionen nicht wesentlich genutzt wurden, gemäß EU-Verbraucherschutzrecht.

5. Geistiges Eigentum
Alle Inhalte, das Design und der Code von Bazodiac sind Eigentum des Betreibers. Ihre persönlichen Chart-Daten gehören Ihnen.

6. Haftungsbeschränkung
Astrologische Deutungen dienen der Unterhaltung und persönlichen Reflexion. Sie ersetzen keine professionelle psychologische, medizinische oder finanzielle Beratung. Der Betreiber haftet nicht für Entscheidungen, die auf Grundlage der Deutungen getroffen werden.

7. Kündigung
Sie können Ihr Konto jederzeit löschen. Der Betreiber behält sich das Recht vor, Konten bei Verstoß gegen diese AGB zu sperren.

8. Anwendbares Recht
Es gilt das Recht der Bundesrepublik Deutschland. Die Europäische Plattform zur Online-Streitbeilegung ist unter https://ec.europa.eu/consumers/odr erreichbar.

9. Änderungen
Wir behalten uns das Recht vor, diese AGB zu ändern. Die fortgesetzte Nutzung nach Änderungen gilt als Zustimmung.`,
    },
  },
};

export function LegalFooter({ lang }: { lang: "en" | "de" }) {
  const [open, setOpen] = useState<LegalSection>(null);

  const toggle = (section: LegalSection) => {
    setOpen((prev) => (prev === section ? null : section));
  };

  return (
    <footer className="mt-8 mb-4 border-t border-[#8B6914]/8 pt-6">
      {/* Links row */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[9px] text-[#1E2A3A]/30 tracking-[0.15em] uppercase">
        <span className="text-[#1E2A3A]/20 normal-case tracking-normal text-[8px]">
          &copy; {new Date().getFullYear()} Bazodiac
        </span>
        <span className="text-[#1E2A3A]/10">|</span>
        <button
          type="button"
          onClick={() => toggle("impressum")}
          className="hover:text-[#8B6914]/60 transition-colors cursor-pointer"
        >
          {lang === "de" ? "Impressum" : "Legal Notice"}
        </button>
        <span className="text-[#1E2A3A]/10">|</span>
        <button
          type="button"
          onClick={() => toggle("privacy")}
          className="hover:text-[#8B6914]/60 transition-colors cursor-pointer"
        >
          {lang === "de" ? "Datenschutz" : "Privacy"}
        </button>
        <span className="text-[#1E2A3A]/10">|</span>
        <button
          type="button"
          onClick={() => toggle("terms")}
          className="hover:text-[#8B6914]/60 transition-colors cursor-pointer"
        >
          {lang === "de" ? "AGB" : "Terms"}
        </button>
      </div>

      {/* Expandable legal text */}
      <AnimatePresence>
        {open && (
          <motion.div
            key={open}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-4 mx-auto max-w-2xl rounded-lg border border-[#8B6914]/8 bg-white/40 backdrop-blur-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[10px] uppercase tracking-[0.3em] text-[#8B6914]/50 font-semibold">
                  {LEGAL_CONTENT[open][lang].title}
                </h4>
                <button
                  type="button"
                  onClick={() => setOpen(null)}
                  className="text-[#1E2A3A]/25 hover:text-[#1E2A3A]/50 text-xs transition-colors"
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>
              <div className="text-[10px] text-[#1E2A3A]/40 leading-relaxed whitespace-pre-line">
                {LEGAL_CONTENT[open][lang].body}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </footer>
  );
}
