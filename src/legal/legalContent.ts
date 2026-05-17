export type LegalLanguage = "de" | "en";
export type LegalPageKind = "privacy" | "imprint" | "terms";

export const LEGAL_LAST_UPDATED = "2026-05-17";

export const LEGAL_OPERATOR = {
  appName: "Bazodiac",
  operatorName: "Benjamin Poersch",
  email: "ben.poersch@dyai.app",
  address: "MISSING_LEGAL_ADDRESS",
  phone: "MISSING_PHONE_OPTIONAL",
  vatId: "MISSING_VAT_ID_OPTIONAL",
  register: "MISSING_REGISTER_OPTIONAL",
  supervisoryAuthority: "MISSING_SUPERVISORY_AUTHORITY",
};

export const LEGAL_DOCS: Record<
  LegalPageKind,
  Record<LegalLanguage, { title: string; description: string; body: string }>
> = {
  imprint: {
    de: {
      title: "Impressum",
      description: "Anbieterkennzeichnung und rechtliche Kontaktinformationen von Bazodiac.",
      body: `# Impressum

Angaben gemäß den geltenden Informationspflichten für digitale Dienste.

## Anbieter

Bazodiac
Betrieben von: ${LEGAL_OPERATOR.operatorName}
Anschrift: ${LEGAL_OPERATOR.address}
E-Mail: ${LEGAL_OPERATOR.email}
Telefon: ${LEGAL_OPERATOR.phone}

## Vertreten durch

${LEGAL_OPERATOR.operatorName}

## Umsatzsteuer-ID

${LEGAL_OPERATOR.vatId}

## Registerangaben

${LEGAL_OPERATOR.register}

## Verantwortlich für journalistisch-redaktionelle Inhalte

Verantwortlich im Sinne von § 18 Abs. 2 MStV:

${LEGAL_OPERATOR.operatorName}
${LEGAL_OPERATOR.address}
E-Mail: ${LEGAL_OPERATOR.email}

## Verbraucherstreitbeilegung

Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen, sofern keine gesetzliche Pflicht im Einzelfall besteht.

Hinweis: Die frühere EU-Plattform zur Online-Streitbeilegung wurde eingestellt. Deshalb wird hier kein Link zur ehemaligen OS-Plattform bereitgestellt.

## Haftung für Inhalte

Wir erstellen die Inhalte dieser Anwendung mit Sorgfalt. Dennoch übernehmen wir keine Gewähr für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte. Astrologische, BaZi-, Wu-Xing-, KI-generierte und reflexive Inhalte dienen der Unterhaltung, Selbstreflexion und Orientierung. Sie stellen keine medizinische, psychologische, rechtliche, steuerliche, finanzielle oder sonstige professionelle Beratung dar.

## Haftung für externe Links

Diese Anwendung kann Links zu externen Webseiten oder Diensten enthalten. Auf deren Inhalte haben wir keinen Einfluss. Für Inhalte externer Anbieter ist der jeweilige Anbieter verantwortlich.

## Urheberrecht

Die durch den Anbieter erstellten Inhalte, Texte, Designs, Grafiken, Interfaces und Konzepte dieser Anwendung unterliegen dem Urheberrecht. Jede nicht ausdrücklich erlaubte Nutzung bedarf der vorherigen schriftlichen Zustimmung des Rechteinhabers.

Stand: ${LEGAL_LAST_UPDATED}`,
    },
    en: {
      title: "Legal Notice",
      description: "Provider identification and legal contact information for Bazodiac.",
      body: `# Legal Notice

Provider information according to the applicable information duties for digital services.

## Provider

Bazodiac
Operated by: ${LEGAL_OPERATOR.operatorName}
Address: ${LEGAL_OPERATOR.address}
Email: ${LEGAL_OPERATOR.email}
Phone: ${LEGAL_OPERATOR.phone}

## Represented by

${LEGAL_OPERATOR.operatorName}

## VAT ID

${LEGAL_OPERATOR.vatId}

## Register information

${LEGAL_OPERATOR.register}

## Responsible for editorial content

Responsible pursuant to § 18(2) MStV:

${LEGAL_OPERATOR.operatorName}
${LEGAL_OPERATOR.address}
Email: ${LEGAL_OPERATOR.email}

## Consumer dispute resolution

We are neither obliged nor willing to participate in dispute resolution proceedings before a consumer arbitration board, unless a statutory obligation applies in an individual case.

Note: The former EU Online Dispute Resolution platform has been discontinued. Therefore, no link to the former ODR platform is provided here.

## Liability for content

We prepare the content of this application with care. However, we do not guarantee that all content is accurate, complete or up to date. Astrological, BaZi, Wu-Xing, AI-generated and reflective content is provided for entertainment, self-reflection and orientation only. It does not constitute medical, psychological, legal, tax, financial or other professional advice.

## Liability for external links

This application may contain links to external websites or services. We have no control over their content. The respective provider is responsible for external content.

## Copyright

Content, text, design, graphics, interfaces and concepts created by the provider are protected by copyright. Any use not expressly permitted requires prior written consent from the rights holder.

Last updated: ${LEGAL_LAST_UPDATED}`,
    },
  },

  privacy: {
    de: {
      title: "Datenschutzerklärung",
      description: "Informationen zur Verarbeitung personenbezogener Daten bei Bazodiac.",
      body: `# Datenschutzerklärung

Diese Datenschutzerklärung informiert Sie darüber, wie Bazodiac personenbezogene Daten verarbeitet. Sie gilt für die Webanwendung Bazodiac, die zugehörigen Nutzerkonten, astrologischen Berechnungen, KI-generierten Inhalte, Zahlungsfunktionen und Sprachagenten-Funktionen.

## 1. Verantwortlicher

Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:

${LEGAL_OPERATOR.operatorName}
${LEGAL_OPERATOR.address}
E-Mail: ${LEGAL_OPERATOR.email}

## 2. Kategorien personenbezogener Daten

### 2.1 Konto- und Authentifizierungsdaten

Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.

### 2.2 Geburts- und Chartdaten

Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.

### 2.3 KI-generierte Inhalte

Wir verwenden KI-Inhalte nicht, um Entscheidungen mit rechtlicher Wirkung über Sie zu treffen. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.

### 2.4 Zahlungsdaten

Rechtsgrundlage: Art. 6 Abs. 1 lit. b und c DSGVO.

### 2.5 Technische Daten und Logs

Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO.

## 3. Empfänger und Dienstleister

- Supabase: Authentifizierung, Datenbank. Anbieter/Region: MISSING_SUPABASE_ENTITY / MISSING_SUPABASE_REGION_CONFIRMATION.
- Railway oder vergleichbares Hosting: Backend/API. Anbieter/Region: MISSING_RAILWAY_ENTITY_AND_REGION.
- Google Gemini API: KI-Interpretationen. Anbieter/Rolle/Region: MISSING_GEMINI_PROCESSOR_ENTITY.
- ElevenLabs: Sprachagenten. Anbieter/Rolle/Region: MISSING_ELEVENLABS_PROCESSOR_ENTITY.
- Stripe: Zahlungsabwicklung. Anbieter/Rolle/Region: MISSING_STRIPE_ENTITY.

## 4. Ihre Rechte

Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung (Art. 18), Datenübertragbarkeit (Art. 20), Widerspruch (Art. 21), Widerruf (Art. 7 Abs. 3 DSGVO).

Kontakt: ${LEGAL_OPERATOR.email}

## 5. Beschwerderecht

Zuständige Aufsichtsbehörde für den Anbieter: ${LEGAL_OPERATOR.supervisoryAuthority}

## 6. Speicherdauer

Nach Kontolöschung werden personenbezogene Daten gelöscht oder anonymisiert, soweit keine gesetzlichen Aufbewahrungspflichten entgegenstehen.

## 7. Cookies und localStorage

Bazodiac verwendet technisch notwendige Speichertechnologien für Login, Session-Verwaltung und Grundfunktionen. Tracking- oder Werbe-Cookies werden nur mit wirksamer Einwilligung eingesetzt.

Stand: ${LEGAL_LAST_UPDATED}`,
    },
    en: {
      title: "Privacy Policy",
      description: "Information about the processing of personal data by Bazodiac.",
      body: `# Privacy Policy

This Privacy Policy explains how Bazodiac processes personal data. It applies to the Bazodiac web application, user accounts, astrological calculations, AI-generated content, payment features and optional voice-agent features.

## 1. Controller

The controller within the meaning of the General Data Protection Regulation (GDPR) is:

${LEGAL_OPERATOR.operatorName}
${LEGAL_OPERATOR.address}
Email: ${LEGAL_OPERATOR.email}

## 2. Categories of personal data

### 2.1 Account and authentication data

Legal basis: Art. 6(1)(b) GDPR.

### 2.2 Birth and chart data

Legal basis: Art. 6(1)(b) GDPR.

### 2.3 AI-generated content

We do not use AI-generated content to make decisions about you with legal effects. Legal basis: Art. 6(1)(b) GDPR.

### 2.4 Payment data

Legal basis: Art. 6(1)(b) and (c) GDPR.

### 2.5 Technical data and logs

Legal basis: Art. 6(1)(f) GDPR. Legitimate interest: secure operation.

## 3. Recipients and service providers

- Supabase: authentication, database. Provider/region: MISSING_SUPABASE_ENTITY / MISSING_SUPABASE_REGION_CONFIRMATION.
- Railway or comparable hosting: backend/API. Provider/region: MISSING_RAILWAY_ENTITY_AND_REGION.
- Google Gemini API: AI interpretations. Provider/role/region: MISSING_GEMINI_PROCESSOR_ENTITY.
- ElevenLabs: voice-agent features. Provider/role/region: MISSING_ELEVENLABS_PROCESSOR_ENTITY.
- Stripe: payment processing. Provider/role/region: MISSING_STRIPE_ENTITY.

## 4. Your rights

Right of access (Art. 15), rectification (Art. 16), erasure (Art. 17), restriction (Art. 18), data portability (Art. 20), objection (Art. 21), withdrawal of consent (Art. 7(3) GDPR).

Contact: ${LEGAL_OPERATOR.email}

## 5. Right to lodge a complaint

Supervisory authority for the provider: ${LEGAL_OPERATOR.supervisoryAuthority}

## 6. Retention

After account deletion, personal data are deleted or anonymised unless statutory retention obligations apply.

## 7. Cookies and localStorage

Bazodiac uses technically necessary storage technologies for login, session management and basic functionality. Tracking or advertising cookies are used only with valid consent.

Last updated: ${LEGAL_LAST_UPDATED}`,
    },
  },

  terms: {
    de: {
      title: "Allgemeine Geschäftsbedingungen",
      description: "Nutzungsbedingungen für Bazodiac.",
      body: `# Allgemeine Geschäftsbedingungen

## 1. Geltungsbereich

Diese Bedingungen regeln die Nutzung von Bazodiac, einer Webanwendung für astrologische, BaZi-, Wu-Xing-, Signatur-, Reflexions- und KI-gestützte Inhalte.

## 2. Leistungsbeschreibung

Die Inhalte dienen Unterhaltung, Selbstreflexion und Orientierung. Sie stellen keine medizinische, psychologische, rechtliche, steuerliche, finanzielle oder sonstige professionelle Beratung dar.

## 3. Nutzerkonto

Für bestimmte Funktionen ist ein Nutzerkonto erforderlich. Sie sind verpflichtet, Zugangsdaten vertraulich zu behandeln.

## 4. Premium-Funktionen und Zahlung

Preise, Laufzeiten und Leistungsumfang werden vor Abschluss angezeigt. Zahlungen werden über einen externen Zahlungsdienstleister abgewickelt.

## 5. Widerruf und Verbraucherrechte

Falls Sie Verbraucher im Sinne des geltenden Rechts sind, stehen Ihnen gesetzliche Widerrufsrechte zu. Diese Klausel muss vor produktivem Einsatz anwaltlich auf den tatsächlichen Checkout-Flow abgestimmt werden.

## 6. Verbotene Nutzung

Sie dürfen Bazodiac nicht für rechtswidrige Zwecke, zur Umgehung von Sicherheitsmechanismen, zur Störung des Betriebs oder zur Eingabe fremder personenbezogener Daten ohne Rechtsgrundlage nutzen.

## 7. Haftung

Wir haften nach den gesetzlichen Vorschriften für Vorsatz und grobe Fahrlässigkeit. Für einfache Fahrlässigkeit haften wir nur bei Verletzung wesentlicher Vertragspflichten.

## 8. Kündigung und Kontolöschung

Sie können Ihr Konto jederzeit löschen oder Löschung verlangen.

## 9. Schlussbestimmungen

Es gilt deutsches Recht unter Ausschluss kollisionsrechtlicher Vorschriften, soweit zwingende Verbraucherschutzvorschriften Ihres Aufenthaltsstaats nicht entgegenstehen.

Stand: ${LEGAL_LAST_UPDATED}`,
    },
    en: {
      title: "Terms and Conditions",
      description: "Terms of use for Bazodiac.",
      body: `# Terms and Conditions

## 1. Scope

These terms govern the use of Bazodiac, a web application for astrological, BaZi, Wu-Xing, signature, reflection and AI-assisted content.

## 2. Service description

The content is provided for entertainment, self-reflection and orientation only. It is not medical, psychological, legal, tax, financial or other professional advice.

## 3. User account

Certain features require a user account. You must keep your credentials confidential.

## 4. Premium features and payment

Prices, durations and scope of services are shown before purchase. Payments are processed through an external payment service provider.

## 5. Withdrawal rights and consumer rights

If you are a consumer under applicable law, statutory withdrawal rights may apply. This clause must be reviewed by counsel before production use and aligned with the actual checkout flow.

## 6. Prohibited use

You must not misuse Bazodiac for unlawful purposes, to bypass security mechanisms, to disrupt operations, or to enter third-party personal data without legal basis.

## 7. Liability

We are liable according to statutory law for intent and gross negligence. For simple negligence, we are liable only for breach of essential contractual obligations.

## 8. Termination and account deletion

You may delete your account or request deletion at any time.

## 9. Final provisions

German law applies, excluding conflict-of-law rules, unless mandatory consumer protection laws of your country of residence prevail.

Last updated: ${LEGAL_LAST_UPDATED}`,
    },
  },
};
