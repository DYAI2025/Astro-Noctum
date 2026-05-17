import { useEffect } from "react";
import { Link } from "react-router-dom";
import { LEGAL_DOCS, type LegalPageKind } from "../../legal/legalContent";
import { useLanguage } from "../../contexts/LanguageContext";

// ── Props ─────────────────────────────────────────────────────────────────

interface LegalPageProps {
  kind: LegalPageKind;
}

// ── Markdown renderer ────────────────────────────────────────────────────

function renderMarkdownLite(body: string): string {
  const lines = body.split("\n");
  const html: string[] = [];
  let pendingParagraphLines: string[] = [];

  const flushParagraph = () => {
    if (pendingParagraphLines.length > 0) {
      const text = pendingParagraphLines.join("<br />");
      html.push(`<p class="mb-3 leading-relaxed text-gray-300">${text}</p>`);
      pendingParagraphLines = [];
    }
  };

  for (const raw of lines) {
    const line = raw;

    if (/^### /.test(line)) {
      flushParagraph();
      const content = line.slice(4);
      html.push(
        `<h3 class="text-base font-semibold text-[#D4AF37] mt-5 mb-2">${content}</h3>`,
      );
    } else if (/^## /.test(line)) {
      flushParagraph();
      const content = line.slice(3);
      html.push(
        `<h2 class="text-lg font-semibold text-[#D4AF37] mt-6 mb-3">${content}</h2>`,
      );
    } else if (/^# /.test(line)) {
      flushParagraph();
      const content = line.slice(2);
      html.push(
        `<h1 class="text-2xl font-bold text-[#D4AF37] mt-4 mb-4">${content}</h1>`,
      );
    } else if (line.trim() === "") {
      flushParagraph();
    } else {
      pendingParagraphLines.push(
        line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"),
      );
    }
  }

  flushParagraph();
  return html.join("\n");
}

// ── Component ─────────────────────────────────────────────────────────────

export default function LegalPage({ kind }: LegalPageProps) {
  const { lang, setLang } = useLanguage();
  const doc = LEGAL_DOCS[kind][lang];

  useEffect(() => {
    document.title = `${doc.title} – Bazodiac`;
  }, [doc.title]);

  const renderedBody = renderMarkdownLite(doc.body);

  return (
    <div
      className="min-h-screen bg-[#00050A] text-gray-200"
    >
      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Back link */}
        <div className="mb-6">
          <Link
            to="/"
            className="text-sm text-gray-400 hover:text-[#D4AF37] transition-colors"
          >
            {lang === "de" ? "← Zurück" : "← Back"}
          </Link>
        </div>

        {/* Language toggle */}
        <div className="flex gap-2 mb-8">
          <button
            type="button"
            onClick={() => setLang("de")}
            aria-label="DE"
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              lang === "de"
                ? "text-[#D4AF37] border border-[#D4AF37]"
                : "text-gray-400 border border-gray-600 hover:text-gray-200"
            }`}
          >
            DE
          </button>
          <button
            type="button"
            onClick={() => setLang("en")}
            aria-label="EN"
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              lang === "en"
                ? "text-[#D4AF37] border border-[#D4AF37]"
                : "text-gray-400 border border-gray-600 hover:text-gray-200"
            }`}
          >
            EN
          </button>
        </div>

        {/* Legal content */}
        <article
          // body text is internal static content, not user input
          dangerouslySetInnerHTML={{ __html: renderedBody }}
        />

        {/* Footer spacing */}
        <div className="mt-12 pt-6 border-t border-gray-800 text-xs text-gray-500">
          Bazodiac &mdash; {doc.title}
        </div>
      </div>
    </div>
  );
}
