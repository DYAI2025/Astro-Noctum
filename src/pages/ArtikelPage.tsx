import { useParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Clock, ExternalLink, ChevronRight } from 'lucide-react';
import { getArticleBySlug, ARTICLES } from '../data/articles';
import type { ArticleSection } from '../data/articles';
import { ArticleCard } from '../components/ArticleCard';

function renderSection(section: ArticleSection, index: number) {
  switch (section.type) {
    case 'h2':
      return (
        <h2
          key={index}
          className="mt-10 mb-4 font-serif text-2xl leading-snug text-white/90 md:text-3xl"
        >
          {section.content}
        </h2>
      );

    case 'h3':
      return (
        <h3
          key={index}
          className="mt-7 mb-3 font-serif text-lg leading-snug text-white/80"
        >
          {section.content}
        </h3>
      );

    case 'p':
      return (
        <p
          key={index}
          className="mb-5 font-sans text-sm leading-[1.85] text-white/60 md:text-base"
        >
          {section.content}
        </p>
      );

    case 'quote':
      return (
        <blockquote
          key={index}
          className="my-8 border-l-2 border-[#D4AF37]/40 pl-6"
        >
          <p className="font-serif text-base italic leading-relaxed text-white/70 md:text-lg">
            {section.content}
          </p>
        </blockquote>
      );

    case 'list':
      return (
        <div key={index} className="my-6">
          {section.content && (
            <p className="mb-3 font-sans text-sm text-white/55">{section.content}</p>
          )}
          <ul className="space-y-3">
            {section.items?.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-[#D4AF37]/60" />
                <span className="font-sans text-sm leading-relaxed text-white/60">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      );

    case 'highlight':
      return (
        <div
          key={index}
          className="my-8 rounded-2xl border border-[#D4AF37]/15 bg-gradient-to-r from-[#D4AF37]/[0.06] to-transparent p-6"
        >
          <p className="font-sans text-sm leading-relaxed text-white/70 md:text-base">
            {section.content}
          </p>
        </div>
      );

    default:
      return null;
  }
}

export default function ArtikelPage() {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? getArticleBySlug(slug) : undefined;

  if (!article) {
    return <Navigate to="/wissen" replace />;
  }

  const related = ARTICLES.filter((a) => a.slug !== article.slug).slice(0, 2);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#00050A] text-white">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(212,175,55,0.06),transparent_50%),radial-gradient(circle_at_80%_50%,rgba(70,130,220,0.05),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.025] grain-overlay" />

      {/* Hero image */}
      <div className="relative h-[40vh] max-h-[500px] w-full overflow-hidden md:h-[52vh]">
        <img
          src={article.image}
          alt={article.imageAlt}
          loading="eager"
          className="h-full w-full object-cover opacity-40"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#00050A]/30 via-[#00050A]/50 to-[#00050A]" />

        {/* Nav */}
        <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-4 py-5 md:px-10">
          <Link
            to="/wissen"
            className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/50 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-white/60 backdrop-blur-md transition-all duration-300 hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
          >
            <ArrowLeft className="h-3 w-3" />
            Wissen
          </Link>

          <Link
            to="/"
            className="font-sans text-[9px] uppercase tracking-[0.35em] text-white/30 hover:text-white/60 transition-colors duration-300"
          >
            Bazodiac
          </Link>
        </div>

        {/* Image credit */}
        <div className="absolute bottom-4 right-4">
          <a
            href={article.imageCreditUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded border border-white/8 bg-black/50 px-2 py-1 font-sans text-[8px] text-white/25 backdrop-blur-sm transition-colors hover:text-white/50"
          >
            {article.imageCredit}
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </div>
      </div>

      {/* Article content */}
      <article className="relative mx-auto max-w-[720px] px-4 pb-24 pt-10 md:px-6">

        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 font-sans text-[9px] uppercase tracking-[0.2em] text-white/25">
          <Link to="/" className="hover:text-white/50 transition-colors">Bazodiac</Link>
          <ChevronRight className="h-2.5 w-2.5" />
          <Link to="/wissen" className="hover:text-white/50 transition-colors">Wissen</Link>
          <ChevronRight className="h-2.5 w-2.5" />
          <span className="text-[#D4AF37]/50">{article.category}</span>
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Category + reading time */}
          <div className="mb-4 flex items-center gap-4">
            <span className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/8 px-3 py-1 font-sans text-[9px] uppercase tracking-[0.25em] text-[#D4AF37]/70">
              {article.category}
            </span>
            <div className="flex items-center gap-1.5 text-white/25">
              <Clock className="h-3 w-3" />
              <span className="font-sans text-[10px]">{article.readingTime} Minuten Lektüre</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="mb-4 font-serif text-3xl leading-tight text-white/93 md:text-4xl lg:text-5xl">
            {article.title}
          </h1>

          {/* Subtitle */}
          <p className="mb-8 font-serif text-base leading-relaxed text-[#D4AF37]/60 md:text-lg">
            {article.subtitle}
          </p>

          {/* Excerpt / lead */}
          <p className="mb-10 border-l-2 border-white/10 pl-5 font-sans text-sm leading-[1.9] text-white/55 md:text-base">
            {article.excerpt}
          </p>

          {/* Divider */}
          <div className="mb-10 h-px bg-gradient-to-r from-[#D4AF37]/20 via-white/5 to-transparent" />

          {/* Body */}
          <div>
            {article.sections.map((section, i) => renderSection(section, i))}
          </div>

          {/* Divider */}
          <div className="my-12 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent" />

          {/* CTA */}
          <div className="rounded-3xl border border-[#D4AF37]/15 bg-gradient-to-br from-[#D4AF37]/[0.07] to-transparent p-8">
            <p className="mb-2 font-sans text-[9px] uppercase tracking-[0.35em] text-[#D4AF37]/50">
              Bazodiac
            </p>
            <h3 className="mb-3 font-serif text-xl leading-snug text-white/85">
              {article.ctaText}
            </h3>
            <p className="mb-6 font-sans text-xs leading-relaxed text-white/40">
              Astronomische Präzision trifft antike Weisheit. Erhalte dein persönliches Resonanzprofil aus
              westlicher Astrologie, BaZi und Wu-Xing — berechnet aus deinen exakten Geburtsdaten.
            </p>
            <Link
              to={article.ctaHref}
              className="inline-flex items-center gap-3 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-6 py-3 font-sans text-[10px] uppercase tracking-[0.3em] text-[#D4AF37]/80 transition-all duration-500 hover:border-[#D4AF37]/55 hover:bg-[#D4AF37]/18 hover:text-[#D4AF37]"
            >
              <span>Jetzt starten</span>
              <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
            </Link>
          </div>

        </motion.div>
      </article>

      {/* Related articles */}
      {related.length > 0 && (
        <section className="mx-auto max-w-[1100px] px-4 pb-20 md:px-10">
          <div className="mb-8 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
          <h2 className="mb-6 font-sans text-[10px] uppercase tracking-[0.35em] text-white/30">
            Weitere Artikel
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {related.map((rel) => (
              <ArticleCard key={rel.slug} article={rel} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
