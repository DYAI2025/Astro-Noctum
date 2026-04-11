/**
 * SynastryPage — Partnership astrology analysis.
 *
 * DEC-synastry-architecture: separate system, premium-only, manual birth data entry.
 * DEC-conversion-tiers: free users see a teaser card (PremiumGate), no FOMO copy.
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Plus, Sparkles, ChevronDown, ChevronUp, Trash2, User } from 'lucide-react';
import { PremiumGate } from '@/src/components/PremiumGate';
import { searchNominatim } from '@/src/services/nominatim';
import { fetchTimezone } from '@/src/services/timezone';
import {
  getPartners,
  addPartner,
  deletePartner,
  computeSynastry,
  type PartnerProfile,
  type SynastryResult,
  type NewPartner,
} from '@/src/services/synastry';

// ── Constants ─────────────────────────────────────────────────────────────────

const ASPECT_COLORS: Record<string, string> = {
  conjunction: '#D4AF37',  // gold
  trine:       '#7EC8A4',  // soft green
  sextile:     '#7AAFCA',  // soft teal
  opposition:  '#C47A7A',  // muted red
  square:      '#C49A7A',  // muted amber
};

const ASPECT_DE: Record<string, string> = {
  conjunction: 'Konjunktion',
  opposition:  'Opposition',
  trine:       'Trigon',
  square:      'Quadrat',
  sextile:     'Sextil',
};

const PLANET_DE: Record<string, string> = {
  Sun: 'Sonne', Moon: 'Mond', Mercury: 'Merkur',
  Venus: 'Venus', Mars: 'Mars', Jupiter: 'Jupiter', Saturn: 'Saturn',
};

// ── Sub-components ────────────────────────────────────────────────────────────

function AspectPill({ type, exact }: { type: string; exact: boolean }) {
  const color = ASPECT_COLORS[type] ?? '#888';
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide"
      style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
    >
      {exact && <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: color }} />}
      {ASPECT_DE[type] ?? type}
    </span>
  );
}

function AspectCard({
  aspect,
  expanded,
  onToggle,
}: {
  aspect: SynastryResult['aspects'][number];
  expanded: boolean;
  onToggle: () => void;
}) {
  const stableKey = `${aspect.planet1}-${aspect.type}-${aspect.planet2}`;
  return (
    <motion.div
      layout
      layoutId={stableKey}
      className="glass-card p-4 cursor-pointer hover:border-gold/20 transition-colors"
      onClick={onToggle}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="font-serif text-sm text-ink">
            {PLANET_DE[aspect.planet1] ?? aspect.planet1}
          </span>
          <AspectPill type={aspect.type} exact={aspect.exact} />
          <span className="font-serif text-sm text-ink">
            {PLANET_DE[aspect.planet2] ?? aspect.planet2}
          </span>
          <span className="text-dawn/40 text-xs ml-1">Orb {aspect.orb}°</span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-dawn/40 shrink-0 mt-0.5" />
        ) : (
          <ChevronDown className="w-4 h-4 text-dawn/40 shrink-0 mt-0.5" />
        )}
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.p
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-3 text-sm text-dawn/70 leading-relaxed overflow-hidden"
          >
            {aspect.narrative}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function PartnerCard({
  partner,
  onSelect,
  onDelete,
  selected,
}: {
  partner: PartnerProfile;
  onSelect: () => void;
  onDelete: () => void;
  selected: boolean;
}) {
  return (
    <div
      className={`glass-card p-4 cursor-pointer transition-colors ${
        selected ? 'border-gold/40 bg-gold/5' : 'hover:border-gold/20'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-gold/70" />
          </div>
          <div>
            <p className="text-sm font-medium text-ink">{partner.display_name}</p>
            <p className="text-xs text-dawn/50 mt-0.5">
              {new Date(partner.birth_date).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
              {partner.birth_place && ` · ${partner.birth_place}`}
            </p>
          </div>
        </div>
        <button
          className="p-1.5 rounded-lg text-dawn/30 hover:text-red-400 hover:bg-red-400/10 transition-colors"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          title="Partner entfernen"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Add Partner Form ──────────────────────────────────────────────────────────

interface AddPartnerFormProps {
  onSave: (partner: PartnerProfile) => void;
  onCancel: () => void;
}

function AddPartnerForm({ onSave, onCancel }: AddPartnerFormProps) {
  const [name, setName]           = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [placeQuery, setPlaceQuery] = useState('');
  const [placeResults, setPlaceResults] = useState<{ display_name: string; lat: string; lon: string }[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<{ label: string; lat: number; lon: number } | null>(null);
  const [detectedTz, setDetectedTz]   = useState<string | null>(null);
  const [tzLoading, setTzLoading]     = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePlaceSearch = useCallback(async (q: string) => {
    setPlaceQuery(q);
    if (q.length < 3) { setPlaceResults([]); return; }
    const results = await searchNominatim(q);
    setPlaceResults(results);
  }, []);

  const handlePlaceSelect = (r: { display_name: string; lat: string; lon: string }) => {
    const lat = parseFloat(r.lat);
    const lon = parseFloat(r.lon);
    const label = r.display_name.split(',').slice(0, 2).join(',').trim();
    setSelectedPlace({ label, lat, lon });
    setPlaceQuery(label);
    setPlaceResults([]);
    setDetectedTz(null);
    setTzLoading(true);
    fetchTimezone(lat, lon)
      .then(tz => setDetectedTz(tz))
      .catch(() => setDetectedTz(null))
      .finally(() => setTzLoading(false));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !birthDate) { setError('Name und Geburtsdatum sind Pflichtfelder.'); return; }
    if (!selectedPlace) { setError('Bitte wähle einen Geburtsort aus den Vorschlägen.'); return; }

    setSaving(true);
    setError(null);

    const tz = detectedTz ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
    const payload: NewPartner = {
      display_name:   name.trim(),
      birth_date:     birthDate,
      birth_time:     birthTime || null,
      iana_time_zone: birthTime ? tz : null,
      birth_place:    selectedPlace.label,
      birth_lat:      selectedPlace.lat,
      birth_lon:      selectedPlace.lon,
    };

    try {
      const saved = await addPartner(payload);
      onSave(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern.');
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card p-5 space-y-4">
      <h3 className="font-serif text-lg text-gold">Partner hinzufügen</h3>

      {/* Name */}
      <div>
        <label className="block text-xs text-dawn/50 mb-1.5 uppercase tracking-widest">Name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Name des Partners"
          maxLength={100}
          className="w-full bg-obsidian border border-white/10 rounded-xl px-4 py-3 text-sm text-ink placeholder:text-dawn/30 focus:outline-none focus:border-gold/40 transition-colors"
        />
      </div>

      {/* Birth date + time */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-dawn/50 mb-1.5 uppercase tracking-widest">Geburtsdatum</label>
          <input
            type="date"
            value={birthDate}
            onChange={e => setBirthDate(e.target.value)}
            className="w-full bg-obsidian border border-white/10 rounded-xl px-4 py-3 text-sm text-ink focus:outline-none focus:border-gold/40 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs text-dawn/50 mb-1.5 uppercase tracking-widest">Geburtszeit <span className="normal-case opacity-50">(optional)</span></label>
          <input
            type="time"
            value={birthTime}
            onChange={e => setBirthTime(e.target.value)}
            className="w-full bg-obsidian border border-white/10 rounded-xl px-4 py-3 text-sm text-ink focus:outline-none focus:border-gold/40 transition-colors"
          />
        </div>
      </div>

      {/* Birth place */}
      <div className="relative">
        <label className="block text-xs text-dawn/50 mb-1.5 uppercase tracking-widest">Geburtsort</label>
        <input
          type="text"
          value={placeQuery}
          onChange={e => handlePlaceSearch(e.target.value)}
          placeholder="Stadt oder Ort eingeben…"
          className="w-full bg-obsidian border border-white/10 rounded-xl px-4 py-3 text-sm text-ink placeholder:text-dawn/30 focus:outline-none focus:border-gold/40 transition-colors"
        />
        {placeResults.length > 0 && (
          <ul className="absolute top-full left-0 right-0 z-20 mt-1 bg-[#0A0D10] border border-white/10 rounded-xl shadow-xl overflow-hidden">
            {placeResults.map((r, i) => (
              <li key={i}>
                <button
                  type="button"
                  className="w-full text-left px-4 py-3 text-sm text-dawn/80 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                  onClick={() => handlePlaceSelect(r)}
                >
                  {r.display_name}
                </button>
              </li>
            ))}
          </ul>
        )}
        {selectedPlace && (
          <div className="mt-1 flex items-center gap-2">
            <p className="text-xs text-gold/60">
              {selectedPlace.lat.toFixed(4)}, {selectedPlace.lon.toFixed(4)}
            </p>
            {tzLoading && (
              <span className="text-xs text-dawn/30">Zeitzone wird ermittelt…</span>
            )}
            {!tzLoading && detectedTz && (
              <span className="text-xs text-dawn/40">Zeitzone: {detectedTz}</span>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={saving || tzLoading}
          className="flex-1 bg-gold text-obsidian font-semibold py-3 rounded-xl hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-wait text-sm"
        >
          {saving ? 'Wird gespeichert…' : tzLoading ? 'Zeitzone wird ermittelt…' : 'Speichern'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 rounded-xl border border-white/10 text-dawn/60 hover:text-ink hover:border-white/20 transition-colors text-sm"
        >
          Abbrechen
        </button>
      </div>
    </form>
  );
}

// ── Synastry Results ──────────────────────────────────────────────────────────

function SynastryResults({ result }: { result: SynastryResult }) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);

  const sortedAspects = [...result.aspects].sort((a, b) => {
    if (a.exact !== b.exact) return a.exact ? -1 : 1;
    return a.orb - b.orb;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Summary */}
      <div className="glass-card p-5">
        <div className="flex items-start gap-3 mb-3">
          <Sparkles className="w-4 h-4 text-gold/70 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-serif text-base text-gold mb-0.5">Synastrie-Analyse</h3>
            {result.narrative_source === 'gemini' && (
              <span className="text-[10px] text-gold/40 uppercase tracking-widest">KI-generiert</span>
            )}
          </div>
        </div>
        <p className="text-sm text-dawn/80 leading-relaxed">{result.synastry_summary}</p>
      </div>

      {/* Aspect grid */}
      {sortedAspects.length > 0 ? (
        <div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-dawn/35 mb-3">
            Aspekte — {sortedAspects.length} gefunden
          </p>
          <div className="space-y-2">
            {sortedAspects.map((aspect, i) => (
              <AspectCard
                key={`${aspect.planet1}-${aspect.type}-${aspect.planet2}`}
                aspect={aspect}
                expanded={expandedIdx === i}
                onToggle={() => setExpandedIdx(expandedIdx === i ? null : i)}
              />
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-dawn/40 text-center py-6">
          Keine signifikanten Hauptaspekte gefunden.
        </p>
      )}
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SynastryPage() {
  const [partners, setPartners]           = useState<PartnerProfile[]>([]);
  const [showAddForm, setShowAddForm]     = useState(false);
  const [selectedId, setSelectedId]       = useState<string | null>(null);
  const [result, setResult]               = useState<SynastryResult | null>(null);
  const [loading, setLoading]             = useState(false);
  const [loadingPartners, setLoadingPartners] = useState(true);
  const [error, setError]                 = useState<string | null>(null);

  // Load partners on mount
  useEffect(() => {
    getPartners()
      .then(setPartners)
      .catch(err => console.error('[synastry] load partners failed:', err))
      .finally(() => setLoadingPartners(false));
  }, []);

  const handleSelectPartner = useCallback(async (partnerId: string) => {
    if (selectedId === partnerId && result) return; // already loaded
    setSelectedId(partnerId);
    setResult(null);
    setError(null);
    setLoading(true);
    try {
      const data = await computeSynastry(partnerId);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler bei der Berechnung.');
    } finally {
      setLoading(false);
    }
  }, [selectedId, result]);

  const handlePartnerAdded = useCallback((partner: PartnerProfile) => {
    setPartners(prev => [partner, ...prev]);
    setShowAddForm(false);
    handleSelectPartner(partner.id);
  }, [handleSelectPartner]);

  const handleDeletePartner = useCallback(async (id: string) => {
    try {
      await deletePartner(id);
      setPartners(prev => prev.filter(p => p.id !== id));
      if (selectedId === id) { setSelectedId(null); setResult(null); }
    } catch (err) {
      console.error('[synastry] delete failed:', err);
    }
  }, [selectedId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full max-w-2xl mx-auto px-4 md:px-6 pb-16"
    >
      {/* Back link */}
      <div className="mb-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-dawn/40 hover:text-dawn/80 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <p className="text-gold-deep/55 text-[9px] uppercase tracking-[0.5em] mb-2">
          Partnerschaft
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl text-ink">
          Synastrie
        </h1>
        <p className="mt-3 text-sm text-dawn/55 leading-relaxed max-w-md">
          Astrologische Resonanz zwischen zwei Geburtshoroskopen — Aspekte, die verbinden, spiegeln und herausfordern.
        </p>
      </div>

      {/* Premium gate — free users see blurred teaser */}
      <PremiumGate teaser="Synastrie ist Teil des Premium-Bereichs. Entdecke die astrologische Verbindung zwischen dir und einem Menschen, der in deinem Leben Bedeutung trägt.">
        <div className="space-y-6">
          {/* Partner list */}
          {!showAddForm && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] uppercase tracking-[0.4em] text-dawn/35">
                  Deine Partner
                </p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-gold/70 hover:text-gold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Hinzufügen
                </button>
              </div>

              {loadingPartners ? (
                <div className="space-y-2">
                  {[1,2].map(i => (
                    <div key={i} className="glass-card p-4 animate-pulse">
                      <div className="h-4 bg-white/5 rounded w-1/3" />
                    </div>
                  ))}
                </div>
              ) : partners.length === 0 ? (
                <div className="glass-card p-6 text-center">
                  <p className="text-sm text-dawn/40 mb-3">Noch keine Partner gespeichert.</p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="inline-flex items-center gap-2 text-sm text-gold/70 hover:text-gold transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Ersten Partner hinzufügen
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {partners.map(p => (
                    <PartnerCard
                      key={p.id}
                      partner={p}
                      selected={selectedId === p.id}
                      onSelect={() => handleSelectPartner(p.id)}
                      onDelete={() => handleDeletePartner(p.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Add partner form */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <AddPartnerForm
                  onSave={handlePartnerAdded}
                  onCancel={() => setShowAddForm(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading indicator */}
          {loading && (
            <div className="flex items-center justify-center gap-3 py-8 text-dawn/40 text-sm">
              <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
              Berechne Synastrie…
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="glass-card p-4 border-red-500/20">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Synastry results */}
          {result && !loading && <SynastryResults result={result} />}
        </div>
      </PremiumGate>
    </motion.div>
  );
}
