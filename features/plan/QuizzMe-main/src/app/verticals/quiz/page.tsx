"use client";

import Link from "next/link";
import { QuizSymbol, QuizSymbolVariant } from "@/components/ui/QuizSymbol";
import { useEffect, useState } from "react";
import { useClusterProgress } from "@/lib/stores/useClusterProgress";
import { NATURKIND_CLUSTER, MENTALIST_CLUSTER } from "@/lib/clusters/registry";
import { aggregateCluster } from "@/lib/clusters/aggregator";
import { ClusterResultCard } from "@/components/clusters/ClusterResultCard";
import { MentalistClusterCard } from "@/components/clusters/MentalistClusterCard";

// Mapping from quiz ID to variant and href
const QUIZ_MAPPING: Record<string, { variant: QuizSymbolVariant; href: string }> = {
  // Naturkind Cluster
  "quiz.aura_colors.v1": { variant: "aura", href: "/verticals/quiz/aura-colors" },
  "quiz.krafttier.v1": { variant: "rpg", href: "/verticals/quiz/rpg-identity" },
  "quiz.blumenwesen.v1": { variant: "personality", href: "/verticals/quiz/blumenwesen" },
  "quiz.energiestein.v1": { variant: "destiny", href: "/verticals/quiz/energiestein" },
  // Mentalist Cluster
  "quiz.lovelang.v1": { variant: "love", href: "/verticals/quiz/love-languages" },
  "quiz.charme.v1": { variant: "celebrity", href: "/verticals/quiz/charme" },
  "quiz.eq.v1": { variant: "social-role", href: "/verticals/quiz/eq" }
};

interface QuizType {
  href: string;
  title: string;
  description: string;
  variant: QuizSymbolVariant;
  isCompleted?: boolean;
}

const otherQuizzes: QuizType[] = [
  {
    href: "/verticals/quiz/social-role",
    title: "Soziale Rolle",
    description: "Der Fels, die Flamme, der Spiegel? Wer bist du für andere?",
    variant: "social-role",
  },
  {
    href: "/verticals/quiz/spotlight",
    title: "Spotlight",
    description: "Bist du bereit für die Bühne des Lebens?",
    variant: "celebrity",
  },
  {
    href: "/verticals/quiz/party",
    title: "Party Bedürfnis",
    description: "Wie viel Feier steckt wirklich in dir?",
    variant: "personality",
  },
  {
    href: "/verticals/quiz/love-languages",
    title: "Die 5 Sprachen der Liebe",
    description: "Wie liebst du? Entdecke deine primäre Sprache der Liebe.",
    variant: "love",
  },
];

interface Particle {
  width: number;
  height: number;
  left: number;
  top: number;
  duration: number;
  delay: number;
}

export default function QuizLandingPage() {
  const [particles] = useState<Particle[]>(() =>
    Array.from({ length: 12 }).map(() => ({
      width: Math.random() * 3 + 1,
      height: Math.random() * 3 + 1,
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: Math.random() * 15 + 20,
      delay: Math.random() * 8,
    }))
  );
  const { initCluster, getClusterProgress, isLoaded } = useClusterProgress();

  useEffect(() => {
    initCluster(NATURKIND_CLUSTER.id);
    initCluster(MENTALIST_CLUSTER.id);
  }, [initCluster]);

  const naturkindProgress = isLoaded ? getClusterProgress(NATURKIND_CLUSTER.id) : null;
  const isClusterComplete = naturkindProgress?.isComplete;
  const clusterPayload = isClusterComplete && naturkindProgress
    ? aggregateCluster(NATURKIND_CLUSTER, naturkindProgress)
    : null;

  // Mentalist Cluster
  const mentalistProgress = isLoaded ? getClusterProgress(MENTALIST_CLUSTER.id) : null;
  const isMentalistComplete = mentalistProgress?.isComplete;
  const mentalistPayload = isMentalistComplete && mentalistProgress
    ? aggregateCluster(MENTALIST_CLUSTER, mentalistProgress)
    : null;

  return (
    <div
      className="min-h-screen relative"
      style={{
        background: "linear-gradient(135deg, #F7F0E6 0%, #F2E3CF 50%, #FEFBF5 100%)",
      }}
    >
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-5 pointer-events-none overflow-hidden">
        <svg viewBox="0 0 1200 900" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <pattern id="constellation-pattern" x="0" y="0" width="300" height="300" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="1.5" fill="#D2A95A" opacity="0.5" />
              <circle cx="90" cy="60" r="1" fill="#D2A95A" opacity="0.3" />
              <circle cx="150" cy="120" r="1.5" fill="#D2A95A" opacity="0.4" />
              <circle cx="60" cy="150" r="1" fill="#6CA192" opacity="0.2" />
              <circle cx="200" cy="80" r="1.2" fill="#6CA192" opacity="0.25" />
              <circle cx="240" cy="200" r="1" fill="#D2A95A" opacity="0.35" />
            </pattern>
          </defs>
          <rect width="1200" height="900" fill="url(#constellation-pattern)" />
        </svg>
      </div>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${p.width}px`,
              height: `${p.height}px`,
              background: i % 3 === 0 ? '#D2A95A' : i % 3 === 1 ? '#6CA192' : '#A77D38',
              opacity: 0.12,
              left: `${p.left}%`,
              top: `${p.top}%`,
              animation: `float-quiz ${p.duration}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(to right, transparent, #D2A95A, transparent)" }}
      />

      <div className="relative z-10 min-h-screen p-6 md:p-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <header className="text-center mb-16 pt-8 md:pt-12">
            <div className="flex items-center justify-center mb-8">
              <div className="w-12 h-px" style={{ background: "#D2A95A" }}></div>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#D2A95A" strokeWidth="1" className="mx-4">
                <circle cx="16" cy="16" r="14" />
                <circle cx="16" cy="16" r="10" />
                <circle cx="16" cy="16" r="6" />
                <circle cx="16" cy="16" r="2" fill="#D2A95A" />
              </svg>
              <div className="w-12 h-px" style={{ background: "#D2A95A" }}></div>
            </div>

            <h1
              className="text-5xl md:text-7xl font-serif font-light mb-6 tracking-wide"
              style={{ color: "#053B3F", letterSpacing: "0.02em" }}
            >
              Entdecke Dich Selbst
            </h1>

            <p
              className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-8"
              style={{ color: "#6CA192", fontWeight: 400 }}
            >
              Mysterium und Klarheit vereint. Finde deine wahre Natur durch reflektierte Quizze und persönliche Erkenntnisse.
            </p>

            <div className="flex items-center justify-center gap-3">
              <div className="w-8 h-px" style={{ background: "#D2A95A" }}></div>
              <span style={{ color: "#D2A95A" }}>◆</span>
              <div className="w-8 h-px" style={{ background: "#D2A95A" }}></div>
            </div>
          </header>

          {/* CLUSTER SECTION: NATURKIND */}
          <section className="mb-24 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-12 text-[#D2A95A]/20 text-9xl font-serif pointer-events-none select-none">
              NATUR
            </div>

            <div className="text-center mb-12 relative z-10">
              <span className="text-xs font-bold tracking-[0.2em] text-[#A77D38] uppercase mb-2 block">Cluster</span>
              <h2 className="text-4xl md:text-5xl font-serif mb-4" style={{ color: "#2D5A4C" }}>Naturkind</h2>
              <p className="max-w-xl mx-auto text-[#6CA192] italic">
                {NATURKIND_CLUSTER.description}
              </p>

              {/* Progress Bar */}
              <div className="max-w-xs mx-auto mt-6">
                <div className="flex justify-between text-xs font-medium text-[#2D5A4C] mb-2 uppercase tracking-wide">
                  <span>Fortschritt</span>
                  <span>{Math.round(naturkindProgress?.percentComplete || 0)}%</span>
                </div>
                <div className="h-1.5 bg-[#D2A95A]/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#2D5A4C] transition-all duration-1000 ease-out"
                    style={{ width: `${naturkindProgress?.percentComplete || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {isClusterComplete && clusterPayload ? (
              <div className="mb-12 animate-in fade-in zoom-in duration-700">
                <ClusterResultCard payload={clusterPayload} />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {NATURKIND_CLUSTER.quizzes.map((quiz) => {
                  const mapping = QUIZ_MAPPING[quiz.id];
                  const isCompleted = naturkindProgress?.completedQuizzes.some(q => q.quizId === quiz.id);

                  return (
                    <QuizCard
                      key={quiz.id}
                      href={mapping?.href || '#'}
                      title={quiz.displayName}
                      description={quiz.teaserText || ''}
                      variant={mapping?.variant || 'aura'}
                      isCompleted={isCompleted}
                    />
                  );
                })}
              </div>
            )}
          </section>

          {/* CLUSTER SECTION: MENTALIST */}
          <section className="mb-24 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-12 text-[#4A0E4E]/10 text-9xl font-serif pointer-events-none select-none">
              SEELE
            </div>

            <div className="text-center mb-12 relative z-10">
              <span className="text-xs font-bold tracking-[0.2em] text-[#4A0E4E] uppercase mb-2 block">Cluster</span>
              <h2 className="text-4xl md:text-5xl font-serif mb-4" style={{ color: "#4A0E4E" }}>Mentalist</h2>
              <p className="max-w-xl mx-auto text-[#8B5A8B] italic">
                {MENTALIST_CLUSTER.description}
              </p>

              {/* Progress Bar */}
              <div className="max-w-xs mx-auto mt-6">
                <div className="flex justify-between text-xs font-medium text-[#4A0E4E] mb-2 uppercase tracking-wide">
                  <span>Fortschritt</span>
                  <span>{Math.round(mentalistProgress?.percentComplete || 0)}%</span>
                </div>
                <div className="h-1.5 bg-[#4A0E4E]/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#4A0E4E] transition-all duration-1000 ease-out"
                    style={{ width: `${mentalistProgress?.percentComplete || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {isMentalistComplete && mentalistPayload ? (
              <div className="mb-12 animate-in fade-in zoom-in duration-700">
                <MentalistClusterCard payload={mentalistPayload} />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {MENTALIST_CLUSTER.quizzes.map((quiz) => {
                  const mapping = QUIZ_MAPPING[quiz.id];
                  const isCompleted = mentalistProgress?.completedQuizzes.some(q => q.quizId === quiz.id);

                  return (
                    <QuizCard
                      key={quiz.id}
                      href={mapping?.href || '#'}
                      title={quiz.displayName}
                      description={quiz.teaserText || ''}
                      variant={mapping?.variant || 'love'}
                      isCompleted={isCompleted}
                    />
                  );
                })}
              </div>
            )}
          </section>

          {/* OTHER QUIZZES */}
          <section className="mb-20">
            <h3 className="text-2xl font-serif text-[#053B3F] mb-8 text-center">Weitere Entdeckungen</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherQuizzes.map((quiz) => (
                <QuizCard key={quiz.title} {...quiz} />
              ))}
            </div>
          </section>

          {/* Trust Section */}
          <section className="mb-20">
            <div className="grid md:grid-cols-3 gap-6">
              <TrustCard
                icon="◆"
                title="Reflektierte Auswertung"
                description="Basierend auf bewährten psychologischen Modellen und therapeutischen Ansätzen."
              />
              <TrustCard
                icon="✦"
                title="Persönliche Tiefe"
                description="Deine Ergebnisse werden speziell für deine Persönlichkeit generiert."
              />
              <TrustCard
                icon="✧"
                title="Nachhaltige Einsicht"
                description="Echte Erkenntnisse für dein Wachstum und deine Selbsterkenntnis."
              />
            </div>
          </section>

          {/* Featured Destiny */}
          <section className="mb-20">
            <Link
              href="/verticals/horoscope"
              className="group block rounded-lg overflow-hidden transition-all duration-500 hover:shadow-lg"
              style={{
                background: "#F7F0E6",
                border: "1px solid #D2A95A",
              }}
            >
              <div className="p-10 md:p-16 flex flex-col md:flex-row items-center gap-12">
                <div className="flex-shrink-0 w-40 h-40 flex items-center justify-center">
                  <QuizSymbol variant="destiny" size="large" state="default" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-3xl md:text-4xl font-serif font-light mb-4" style={{ color: "#053B3F" }}>
                    Dein Schicksal im Kosmos
                  </h3>
                  <p className="text-base md:text-lg leading-relaxed mb-6" style={{ color: "#6CA192" }}>
                    Tritt in unsere Astrologie-Sphäre ein und entdecke die kosmischen Muster.
                  </p>
                  <div className="inline-flex items-center font-medium group-hover:translate-x-1 transition-transform" style={{ color: "#A77D38" }}>
                    Zu den Sternen <span className="ml-2">→</span>
                  </div>
                </div>
              </div>
            </Link>
          </section>

          {/* Footer */}
          <footer className="text-center py-12 border-t border-opacity-20" style={{ borderColor: "#D2A95A", color: "#6CA192" }}>
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-8 h-px" style={{ background: "#D2A95A" }}></div>
              <span style={{ color: "#D2A95A", fontSize: "12px" }}>◇</span>
              <div className="w-8 h-px" style={{ background: "#D2A95A" }}></div>
            </div>
            <p className="text-sm">© 2025 QuizzMe. Mystik trifft Substanz.</p>
          </footer>
        </div>
      </div>
    </div>
  );
}

type QuizCardProps = QuizType;

function QuizCard({ href, title, description, variant, isCompleted }: QuizCardProps) {
  return (
    <Link
      href={href}
      className={`group block h-full rounded-lg transition-all duration-500 hover:shadow-lg relative overflow-hidden ${isCompleted ? 'ring-2 ring-[#2D5A4C] ring-offset-2 ring-offset-[#F7F0E6]' : ''}`}
      style={{
        background: isCompleted ? "rgba(45, 90, 76, 0.05)" : "#F7F0E6",
        border: "1px solid #D2A95A",
      }}
    >
      {isCompleted && (
        <div className="absolute top-3 right-3 bg-[#2D5A4C] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider z-10 flex items-center gap-1">
          <span>✓</span> Erledigt
        </div>
      )}

      <div className="p-8 flex flex-col h-full">
        {/* Symbol with updated state logic could be passed here if QuizSymbol supports 'completed' state */}
        <div className="mb-6 flex justify-center h-28 group-hover:scale-105 transition-transform duration-500">
          <QuizSymbol
            variant={variant}
            size="medium"
            state="default"
          />
        </div>

        <div className="flex-1 flex flex-col">
          <h3
            className="text-lg md:text-xl font-serif font-light mb-3 text-center leading-tight"
            style={{ color: "#053B3F" }}
          >
            {title}
          </h3>

          <p
            className="text-sm leading-relaxed flex-1 text-center"
            style={{ color: "#6CA192", lineHeight: 1.6 }}
          >
            {description}
          </p>
        </div>

        <div
          className="mt-6 pt-6 text-center text-sm font-medium group-hover:translate-y-(-1) transition-all duration-300"
          style={{ color: "#A77D38", borderTop: "1px solid #D2A95A" }}
        >
          {isCompleted ? "Ergebnis ansehen" : "Quiz starten"}
        </div>
      </div>
    </Link>
  );
}

interface TrustCardProps {
  icon: string;
  title: string;
  description: string;
}

function TrustCard({ icon, title, description }: TrustCardProps) {
  return (
    <div
      className="p-8 rounded-lg text-center group hover:shadow-md transition-all duration-300"
      style={{
        background: "#F7F0E6",
        border: "1px solid #D2A95A",
      }}
    >
      <div className="text-4xl mb-4 group-hover:scale-110 transition-transform" style={{ color: "#D2A95A" }}>
        {icon}
      </div>
      <h4 className="text-lg font-serif font-light mb-2" style={{ color: "#053B3F" }}>
        {title}
      </h4>
      <p className="text-sm leading-relaxed" style={{ color: "#6CA192" }}>
        {description}
      </p>
    </div>
  );
}