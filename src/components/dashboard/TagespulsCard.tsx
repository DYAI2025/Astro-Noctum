/**
 * TagespulsCard — Phase E
 *
 * Two-phase Tagespuls UI:
 *
 *   Phase 1 (default):
 *     - Mode chip (PULS / SPUR / SPANNUNG)
 *     - Aphorism (slot_1) + author (+ work, suppressed when null)
 *     - "Brücke ins Heute" (slot_2) — RENDERED ONLY WHEN NON-NULL
 *     - "Handlungsimpuls" (slot_3) — RENDERED ONLY WHEN NON-NULL
 *     - Council (6 figure buttons) — title + buttons rendered always
 *
 *   Phase 2 (after `selectedFigure`):
 *     - Selected figure header + sign/element
 *     - Personalized interpretation text
 *     - NO back button — Phase 2 is irreversible (spec C-2: one decision per day)
 *
 * NO PLACEHOLDER FALLBACK RENDERING. When slot_2 / slot_3 are null the
 * corresponding section is omitted entirely — never replaced with generic
 * deterministic copy. Skeletons during `loading` are acknowledged as
 * "loading" signal, not fake content.
 */

import { useLanguage } from '@/src/contexts/LanguageContext';
import { useDailyPulse } from '@/src/hooks/useDailyPulse';

export interface TagespulsCardProps {
  /**
   * Optional callback invoked when the user clicks the
   * profile-completion CTA after a 422 PROFILE_REQUIRED. Typically
   * routes to /onboarding or opens the BirthForm.
   */
  onCompleteProfile?: () => void;
}

const COUNCIL_KEY_TO_I18N: Record<string, string> = {
  sonne: 'tagespuls.council.sonne',
  mond: 'tagespuls.council.mond',
  aszendent: 'tagespuls.council.aszendent',
  day_master: 'tagespuls.council.day_master',
  jahrestier: 'tagespuls.council.jahrestier',
  wuxing_dom: 'tagespuls.council.wuxing_dom',
};

const MODE_TO_I18N: Record<string, string> = {
  pulse: 'tagespuls.modes.pulse',
  trace: 'tagespuls.modes.trace',
  spannung: 'tagespuls.modes.spannung',
};

// ── Skeleton ──────────────────────────────────────────────────────────────

function TagespulsCardSkeleton() {
  return (
    <div
      className="cosmic-tile p-6 sm:p-8 rounded-[2rem] space-y-5 animate-pulse"
      data-testid="tagespuls-card-skeleton"
    >
      <div className="h-3 w-16 rounded bg-white/10" />
      <div className="space-y-2">
        <div className="h-5 w-full rounded bg-white/10" />
        <div className="h-5 w-3/4 rounded bg-white/10" />
      </div>
      <div className="h-3 w-32 rounded bg-white/5" />
      <div className="h-3 w-2/3 rounded bg-white/5" />
    </div>
  );
}

// ── Error states ──────────────────────────────────────────────────────────

function ProfileRequiredState({
  t,
  onCompleteProfile,
}: {
  t: (k: string) => string;
  onCompleteProfile?: () => void;
}) {
  return (
    <div
      className="cosmic-tile p-6 sm:p-8 rounded-[2rem] space-y-4"
      data-testid="tagespuls-profile-required"
    >
      <p className="text-base text-ink/80">{t('tagespuls.errors.profileRequired')}</p>
      {onCompleteProfile && (
        <button
          type="button"
          onClick={onCompleteProfile}
          className="rounded-lg bg-gold/90 px-4 py-2 text-sm font-medium text-obsidian hover:bg-gold focus:outline-none focus:ring-2 focus:ring-gold/60"
        >
          {t('tagespuls.errors.profileCta')}
        </button>
      )}
    </div>
  );
}

function RetryState({
  t,
  onRetry,
  message,
  testId,
}: {
  t: (k: string) => string;
  onRetry: () => void;
  message: string;
  testId: string;
}) {
  return (
    <div
      className="cosmic-tile p-6 sm:p-8 rounded-[2rem] space-y-4"
      data-testid={testId}
    >
      <p className="text-base text-ink/80">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-lg border border-white/20 px-4 py-2 text-sm text-ink hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/30"
      >
        {t('tagespuls.errors.retry')}
      </button>
    </div>
  );
}

// ── Council button ────────────────────────────────────────────────────────

function CouncilButton({
  figureKey,
  signOrElement,
  label,
  onClick,
  disabled = false,
}: {
  figureKey: string;
  signOrElement: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-figure-key={figureKey}
      className={
        disabled
          ? 'flex flex-col items-start gap-1 rounded-xl border border-white/5 bg-white/5 p-3 text-left text-sm text-ink/40 cursor-not-allowed'
          : 'flex flex-col items-start gap-1 rounded-xl border border-white/10 bg-white/5 p-3 text-left text-sm text-ink/90 hover:bg-white/10 hover:border-white/25 focus:outline-none focus:ring-2 focus:ring-white/30'
      }
    >
      <span className="text-xs uppercase tracking-[0.18em] text-ink/60">{label}</span>
      <span className="text-base font-medium text-ink">{signOrElement}</span>
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────

export function TagespulsCard({ onCompleteProfile }: TagespulsCardProps) {
  const { lang, t } = useLanguage();
  const {
    pulse,
    loading,
    error,
    refresh,
    selectedFigure,
    interpretation,
    loadingInterpretation,
    interpretationError,
    selectCouncilFigure,
  } = useDailyPulse(lang === 'en' ? 'en' : 'de');

  // ── Loading ─────────────────────────────────────────────────────────────
  if (loading && !pulse) {
    return <TagespulsCardSkeleton />;
  }

  // ── Error: profile_required ────────────────────────────────────────────
  if (error?.code === 'profile_required') {
    return <ProfileRequiredState t={t} onCompleteProfile={onCompleteProfile} />;
  }

  // ── Error: network / unknown / ai_unavailable (Phase 1) ────────────────
  if (error) {
    const message =
      error.code === 'network'
        ? t('tagespuls.errors.network')
        : error.code === 'ai_unavailable'
          ? t('tagespuls.errors.aiUnavailable')
          : t('tagespuls.errors.unknown');
    return (
      <RetryState
        t={t}
        onRetry={refresh}
        message={message}
        testId="tagespuls-error-retry"
      />
    );
  }

  // ── Defensive: no error, no pulse, not loading → reload prompt ──────────
  // This is unreachable in practice (loading flips before pulse=null
  // resolves), but we surface a retry rather than rendering nothing so
  // the card is never invisible.
  if (!pulse) {
    return (
      <RetryState
        t={t}
        onRetry={refresh}
        message={t('tagespuls.errors.unknown')}
        testId="tagespuls-empty-retry"
      />
    );
  }

  const modeLabel = t(MODE_TO_I18N[pulse.mode] ?? 'tagespuls.modes.pulse');
  const aph = pulse.aphorism;

  // ── Phase 2: figure selected ───────────────────────────────────────────
  if (selectedFigure) {
    const figure = pulse.council.find((c) => c.key === selectedFigure);
    const figureLabel = figure
      ? t(COUNCIL_KEY_TO_I18N[figure.key] ?? 'tagespuls.council.sonne')
      : '';

    return (
      <div
        className="cosmic-tile p-6 sm:p-8 rounded-[2rem] space-y-5"
        data-testid="tagespuls-card"
        data-phase="interpretation"
      >
        {/* Aphorism stays visible above the interpretation as the
            curated foundation. After the user picks an archetype the
            decision is irreversible (spec C-2: "Kein 'Zurück' Button"). */}
        <blockquote className="border-l-2 border-gold/40 pl-4 text-base text-ink/85 italic">
          "{aph.slot_1}"
          {aph.author && (
            <footer className="mt-1 text-xs not-italic text-ink/60">— {aph.author}</footer>
          )}
        </blockquote>

        <div className="space-y-2">
          <h3 className="text-lg font-medium text-ink">
            {figureLabel}
            {figure?.signOrElement && (
              <span className="ml-2 text-sm text-ink/60">· {figure.signOrElement}</span>
            )}
          </h3>

          {loadingInterpretation && (
            <div className="space-y-2 animate-pulse" data-testid="tagespuls-interp-skeleton">
              <div className="h-3 w-full rounded bg-white/10" />
              <div className="h-3 w-5/6 rounded bg-white/10" />
              <div className="h-3 w-2/3 rounded bg-white/10" />
            </div>
          )}

          {!loadingInterpretation && interpretationError && (
            <div className="space-y-3" data-testid="tagespuls-interp-error">
              <p className="text-sm text-ink/70">
                {interpretationError.code === 'network'
                  ? t('tagespuls.errors.network')
                  : interpretationError.code === 'ai_unavailable'
                    ? t('tagespuls.errors.aiUnavailable')
                    : t('tagespuls.errors.unknown')}
              </p>
              <button
                type="button"
                onClick={() => selectCouncilFigure(selectedFigure)}
                className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-ink hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                {t('tagespuls.errors.retry')}
              </button>
            </div>
          )}

          {!loadingInterpretation && !interpretationError && interpretation && (
            <p className="text-base text-ink/85 leading-relaxed whitespace-pre-line">
              {interpretation.text}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Phase 1: pulse + council selection ─────────────────────────────────
  return (
    <div
      className="cosmic-tile p-6 sm:p-8 rounded-[2rem] space-y-5"
      data-testid="tagespuls-card"
      data-phase="pulse"
    >
      <div className="flex items-center gap-2">
        <span
          className="text-xs uppercase tracking-[0.25em] text-gold/80"
          data-testid="tagespuls-mode"
        >
          {modeLabel}
        </span>
      </div>

      <blockquote className="border-l-2 border-gold/40 pl-4 text-base text-ink/85 italic">
        "{aph.slot_1}"
        {aph.author && (
          <footer className="mt-1 text-xs not-italic text-ink/60">— {aph.author}</footer>
        )}
      </blockquote>

      {/*
        slot_2 / slot_3 are rendered ONLY when non-null. When the LLM
        router returned null we omit the section entirely — the
        no-placeholders directive forbids substituting generic copy.
      */}
      {aph.slot_2 && (
        <div className="space-y-1" data-testid="tagespuls-bridge">
          <span className="text-xs uppercase tracking-[0.2em] text-ink/55">
            {t('tagespuls.bridge')}
          </span>
          <p className="text-sm text-ink/80 leading-relaxed">{aph.slot_2}</p>
        </div>
      )}

      {aph.slot_3 && (
        <div className="space-y-1" data-testid="tagespuls-impulse">
          <span className="text-xs uppercase tracking-[0.2em] text-ink/55">
            {t('tagespuls.impulse')}
          </span>
          <p className="text-sm text-ink/80 leading-relaxed">{aph.slot_3}</p>
        </div>
      )}

      <div className="pt-2 space-y-3" data-testid="tagespuls-council">
        <h4 className="text-sm font-medium text-ink/85">{t('tagespuls.council.title')}</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {pulse.council.map((c) => (
            <CouncilButton
              key={c.key}
              figureKey={c.key}
              signOrElement={c.signOrElement}
              label={t(COUNCIL_KEY_TO_I18N[c.key] ?? 'tagespuls.council.sonne')}
              onClick={() => selectCouncilFigure(c.key)}
              // After the user picks (selectedFigure becomes non-null) or
              // while a request is in-flight, all 6 buttons lock —
              // spec C-3: "Es geht nur einmal am Tag".
              disabled={selectedFigure !== null || loadingInterpretation}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
