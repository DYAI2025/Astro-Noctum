import { Link } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";

interface LegalLink {
  to: string;
  label: string;
}

const LINKS_DE: LegalLink[] = [
  { to: "/datenschutz", label: "Datenschutz" },
  { to: "/impressum", label: "Impressum" },
  { to: "/agb", label: "AGB" },
];

const LINKS_EN: LegalLink[] = [
  { to: "/privacy", label: "Privacy" },
  { to: "/legal-notice", label: "Legal Notice" },
  { to: "/terms", label: "Terms" },
];

export function StaticLegalLinks() {
  const { lang } = useLanguage();
  const links = lang === "de" ? LINKS_DE : LINKS_EN;

  return (
    <nav aria-label="Legal links" className="flex items-center justify-center gap-0 py-4">
      {links.map((link, index) => (
        <span key={link.to} className="flex items-center">
          {index > 0 && (
            <span className="mx-2 text-xs text-white/20 select-none" aria-hidden="true">·</span>
          )}
          <Link
            to={link.to}
            className="text-xs text-white/30 hover:text-[#D4AF37] transition-colors duration-150"
          >
            {link.label}
          </Link>
        </span>
      ))}
    </nav>
  );
}
