import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Telescope, BookOpen } from 'lucide-react';
import { ARTICLES } from '../data/articles';
import { ArticleCard } from '../components/ArticleCard';

const CATEGORIES = Array.from(new Set(ARTICLES.map((a) => a.category)));

export default function WissenPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#00050A] text-white">
      {/* Background radial gradients */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_25%,rgba(212,175,55,0.06),transparent_45%),radial-gradient(circle_at_85%_10%,rgba(70,130,220,0.08),transparent_40%),radial-gradient(circle_at_50%_80%,rgba(212,175,55,0.04),transparent_55%)]" />

      {/* Grain overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.025] grain-overlay" />

      <section className="relative mx-auto flex w-full max-w-[1100px] flex-col gap-12 px-4 pb-24 pt-10 md:px-10 md:pt-16">

        {/* Header */}
        <header className="flex items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/40 px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-white/60 transition-all duration-300 hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Link>

          <div className="rounded-full border border-white/8 bg-black/40 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-white/50">
            Kosmisches Wissen
          </div>
        </header>

        {/* Hero section */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl"
        >
          <div className="mb-4 inline-flex items-center gap-2.5 text-[#D4AF37]/60">
            <Telescope className="h-4 w-4" />
            <span className="font-sans text-[10px] uppercase tracking-[0.35em]">Wissenschaft & Kosmos</span>
          </div>

          <h1 className="mb-4 font-serif text-3xl leading-tight text-white/90 md:text-5xl">
            Das Universum wartet darauf,<br />
            <span className="text-[#D4AF37]/80">verstanden zu werden.</span>
          </h1>

          <p className="max-w-2xl font-sans text-sm leading-relaxed text-white/50 md:text-base">
            Wissenschaftlich fundierte Artikel über Weltraumphysik, Quantenmechanik und die großen ungeklärten
            Fragen des Kosmos — für Menschen, die über die Oberfläche hinausblicken wollen.
          </p>
        </motion.div>

        {/* Featured article (first one) */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link
            to={`/wissen/${ARTICLES[0].slug}`}
            className="group relative block overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-br from-white/[0.04] to-transparent transition-all duration-700 hover:border-[#D4AF37]/25"
          >
            <div className="relative h-[320px] overflow-hidden md:h-[420px]">
              <img
                src={ARTICLES[0].image}
                alt={ARTICLES[0].imageAlt}
                loading="eager"
                className="h-full w-full object-cover opacity-50 transition-all duration-700 group-hover:scale-[1.03] group-hover:opacity-65"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#00050A] via-[#00050A]/60 to-[#00050A]/10" />

              {/* Credit */}
              <div className="absolute bottom-4 right-4 rounded border border-white/10 bg-black/50 px-2 py-1 backdrop-blur-sm">
                <span className="font-sans text-[8px] text-white/30">{ARTICLES[0].imageCredit}</span>
              </div>
            </div>

            <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10">
              <div className="mb-3 flex items-center gap-3">
                <span className="rounded-full border border-[#D4AF37]/25 bg-black/60 px-3 py-1 font-sans text-[9px] uppercase tracking-[0.25em] text-[#D4AF37]/80 backdrop-blur-md">
                  {ARTICLES[0].category}
                </span>
                <span className="font-sans text-[9px] uppercase tracking-[0.2em] text-white/30">
                  {ARTICLES[0].readingTime} Min. Lektüre
                </span>
              </div>

              <h2 className="mb-3 font-serif text-2xl leading-tight text-white/90 transition-colors duration-400 group-hover:text-[#D4AF37]/90 md:text-4xl">
                {ARTICLES[0].title}
              </h2>

              <p className="mb-5 max-w-2xl font-sans text-sm leading-relaxed text-white/50 line-clamp-2 md:line-clamp-3">
                {ARTICLES[0].excerpt}
              </p>

              <div className="inline-flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.3em] text-[#D4AF37]/60 transition-all duration-300 group-hover:text-[#D4AF37]">
                <BookOpen className="h-3.5 w-3.5" />
                <span>Artikel lesen</span>
              </div>
            </div>

            {/* Top accent */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/35 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          </Link>
        </motion.div>

        {/* Category filters (visual only, all shown) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-wrap gap-2"
        >
          <div className="rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/8 px-3 py-1.5">
            <span className="font-sans text-[9px] uppercase tracking-[0.25em] text-[#D4AF37]/80">Alle Themen</span>
          </div>
          {CATEGORIES.map((cat) => (
            <div
              key={cat}
              className="rounded-full border border-white/8 bg-white/[0.02] px-3 py-1.5"
            >
              <span className="font-sans text-[9px] uppercase tracking-[0.2em] text-white/40">{cat}</span>
            </div>
          ))}
        </motion.div>

        {/* Article grid */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {ARTICLES.slice(1).map((article, i) => (
            <motion.div
              key={article.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45 + i * 0.08 }}
            >
              <ArticleCard article={article} />
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="rounded-3xl border border-[#D4AF37]/12 bg-gradient-to-r from-[#D4AF37]/[0.05] to-transparent p-8 md:p-12"
        >
          <div className="max-w-2xl">
            <p className="mb-2 font-sans text-[10px] uppercase tracking-[0.35em] text-[#D4AF37]/50">
              Bazodiac — Kosmisches Profil
            </p>
            <h3 className="mb-4 font-serif text-2xl leading-tight text-white/85 md:text-3xl">
              Das Universum zum Zeitpunkt deiner Geburt
            </h3>
            <p className="mb-6 font-sans text-sm leading-relaxed text-white/45">
              Alles, was du in diesen Artikeln gelesen hast — Weltraumwetter, kosmische Frequenzen, Planetenpositionen —
              war bei deiner Geburt in einer einzigartigen Konstellation. Bazodiac berechnet diese astronomischen
              Muster und synthetisiert sie zu einem persönlichen Resonanzprofil.
            </p>
            <Link
              to="/fu-ring"
              className="inline-flex items-center gap-3 rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/8 px-6 py-3 font-sans text-[10px] uppercase tracking-[0.3em] text-[#D4AF37]/80 transition-all duration-500 hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/15 hover:text-[#D4AF37]"
            >
              <span>Mein Profil berechnen</span>
              <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
            </Link>
          </div>
        </motion.div>

      </section>
    </div>
  );
}
