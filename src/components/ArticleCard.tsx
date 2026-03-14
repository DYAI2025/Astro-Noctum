import { Link } from 'react-router-dom';
import { Clock, ArrowRight } from 'lucide-react';
import type { Article } from '../data/articles';

interface ArticleCardProps {
  article: Article;
  variant?: 'default' | 'featured' | 'compact';
}

export function ArticleCard({ article, variant = 'default' }: ArticleCardProps) {
  if (variant === 'featured') {
    return (
      <Link
        to={`/wissen/${article.slug}`}
        className="group relative block overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-b from-white/[0.03] to-transparent backdrop-blur-sm transition-all duration-700 hover:border-[#D4AF37]/25 hover:from-white/[0.06]"
        aria-label={article.title}
      >
        {/* Image */}
        <div className="relative h-52 overflow-hidden">
          <img
            src={article.image}
            alt={article.imageAlt}
            loading="lazy"
            className="h-full w-full object-cover opacity-60 transition-all duration-700 group-hover:scale-105 group-hover:opacity-75"
            onError={(e) => {
              // Fallback: gradient placeholder on missing image
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#00050A] via-[#00050A]/40 to-transparent" />

          {/* Category badge */}
          <div className="absolute left-4 top-4 rounded-full border border-[#D4AF37]/20 bg-black/50 px-3 py-1 backdrop-blur-md">
            <span className="font-sans text-[9px] uppercase tracking-[0.25em] text-[#D4AF37]/80">
              {article.category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="mb-3 flex items-center gap-2 text-white/30">
            <Clock className="h-3 w-3" />
            <span className="font-sans text-[10px] tracking-widest">{article.readingTime} Min. Lektüre</span>
          </div>

          <h3 className="mb-2 font-serif text-lg leading-snug text-white/90 transition-colors duration-300 group-hover:text-[#D4AF37]/90">
            {article.title}
          </h3>

          <p className="mb-4 font-sans text-xs leading-relaxed text-white/45 line-clamp-3">
            {article.excerpt}
          </p>

          <div className="flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.25em] text-[#D4AF37]/60 transition-colors duration-300 group-hover:text-[#D4AF37]/90">
            <span>Weiterlesen</span>
            <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </div>

        {/* Gold top accent line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <Link
        to={`/wissen/${article.slug}`}
        className="group flex items-start gap-4 rounded-xl border border-white/6 bg-white/[0.02] p-4 transition-all duration-500 hover:border-[#D4AF37]/20 hover:bg-white/[0.04]"
      >
        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg">
          <img
            src={article.image}
            alt=""
            aria-hidden
            loading="lazy"
            className="h-full w-full object-cover opacity-70 transition-opacity duration-300 group-hover:opacity-90"
          />
          <div className="absolute inset-0 bg-[#00050A]/30" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="mb-1 font-sans text-[9px] uppercase tracking-[0.2em] text-[#D4AF37]/50">
            {article.category}
          </p>
          <h4 className="font-serif text-sm leading-snug text-white/80 transition-colors duration-300 group-hover:text-[#D4AF37]/80 line-clamp-2">
            {article.title}
          </h4>
          <div className="mt-1 flex items-center gap-1.5 text-white/25">
            <Clock className="h-2.5 w-2.5" />
            <span className="font-sans text-[9px]">{article.readingTime} Min.</span>
          </div>
        </div>
      </Link>
    );
  }

  // default
  return (
    <Link
      to={`/wissen/${article.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02] backdrop-blur-sm transition-all duration-700 hover:border-[#D4AF37]/25 hover:bg-white/[0.04]"
    >
      <div className="relative h-44 overflow-hidden">
        <img
          src={article.image}
          alt={article.imageAlt}
          loading="lazy"
          className="h-full w-full object-cover opacity-55 transition-all duration-700 group-hover:scale-105 group-hover:opacity-70"
          onError={(e) => {
            (e.target as HTMLImageElement).parentElement!.style.background =
              'linear-gradient(135deg, #0a0f1a, #1a1c1e)';
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#00050A]/90 via-[#00050A]/20 to-transparent" />
        <div className="absolute left-3 top-3">
          <span className="rounded-full border border-[#D4AF37]/15 bg-black/60 px-2.5 py-1 font-sans text-[8px] uppercase tracking-[0.25em] text-[#D4AF37]/70 backdrop-blur-sm">
            {article.category}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center gap-1.5 text-white/25">
          <Clock className="h-2.5 w-2.5" />
          <span className="font-sans text-[9px] tracking-widest">{article.readingTime} Min.</span>
        </div>

        <h3 className="mb-2 font-serif text-base leading-snug text-white/85 transition-colors duration-300 group-hover:text-[#D4AF37]/85">
          {article.title}
        </h3>

        <p className="flex-1 font-sans text-xs leading-relaxed text-white/40 line-clamp-2">
          {article.excerpt}
        </p>

        <div className="mt-3 flex items-center gap-2 text-[#D4AF37]/50 transition-all duration-300 group-hover:text-[#D4AF37]/80">
          <span className="font-sans text-[9px] uppercase tracking-[0.25em]">Lesen</span>
          <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
