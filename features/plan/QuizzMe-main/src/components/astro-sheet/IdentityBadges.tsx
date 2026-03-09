
import React, { useState, useEffect } from 'react';
import { MasterIdentity } from './types';
import { 
  Sparkles, Zap, Star, CircleDot, Cpu, Layers, Hexagon, Database, 
  Info, ChevronRight, ShieldCheck, Trees, Flame, 
  Mountain, Waves, Shield, TrendingUp, Anchor, Compass,
  Orbit, Sun, Moon, ArrowUpRight, Activity, Wand2, Loader2,
  Binary, LucideIcon
} from 'lucide-react';
import SigilPortrait from './SigilPortrait';
import { ZODIAC_DATA } from './constants';
import { generateAstroInsight } from '@/app/actions/generateInsight';

interface IdentityBadgesProps {
  data: MasterIdentity;
}

const ELEMENT_ICONS: Record<string, LucideIcon> = {
  holz: Trees,
  wood: Trees,
  feuer: Flame,
  fire: Flame,
  erde: Mountain,
  earth: Mountain,
  metall: Shield,
  metal: Shield,
  wasser: Waves,
  water: Waves,
};

const getElementIcon = (elementName: string): LucideIcon | null => {
  const normalized = elementName.toLowerCase();
  for (const [key, icon] of Object.entries(ELEMENT_ICONS)) {
    if (normalized.includes(key)) return icon;
  }
  return null;
};

const ElementBadge: React.FC<{ name: string }> = ({ name }) => {
  const icon = getElementIcon(name);
  return (
    <span className="inline-flex items-center gap-2">
      {icon ? React.createElement(icon, { size: 12, className: "text-[#C9A46A]" }) : null}
      <span>{name}</span>
    </span>
  );
};

const signMap: Record<string, string> = {
  'widder': 'aries', 'aries': 'aries',
  'stier': 'taurus', 'taurus': 'taurus',
  'zwilling': 'gemini', 'gemini': 'gemini',
  'krebs': 'cancer', 'cancer': 'cancer',
  'löwe': 'leo', 'leo': 'leo',
  'jungfrau': 'virgo', 'virgo': 'virgo',
  'waage': 'libra', 'libra': 'libra',
  'skorpion': 'scorpio', 'scorpio': 'scorpio',
  'schütze': 'sagittarius', 'sagittarius': 'sagittarius',
  'steinbock': 'capricorn', 'capricorn': 'capricorn',
  'wassermann': 'aquarius', 'aquarius': 'aquarius',
  'fische': 'pisces', 'pisces': 'pisces'
};

const getZodiacSymbol = (sign: string) => {
  const normalized = sign.toLowerCase();
  if (normalized.includes('widder') || normalized.includes('aries')) return '♈';
  if (normalized.includes('stier') || normalized.includes('taurus')) return '♉';
  if (normalized.includes('zwilling') || normalized.includes('gemini')) return '♊';
  if (normalized.includes('krebs') || normalized.includes('cancer')) return '♋';
  if (normalized.includes('löwe') || normalized.includes('leo')) return '♌';
  if (normalized.includes('jungfrau') || normalized.includes('virgo')) return '♍';
  if (normalized.includes('waage') || normalized.includes('libra')) return '♎';
  if (normalized.includes('skorpion') || normalized.includes('scorpio')) return '♏';
  if (normalized.includes('schütze') || normalized.includes('sagittarius')) return '♐';
  if (normalized.includes('steinbock') || normalized.includes('capricorn')) return '♑';
  if (normalized.includes('wassermann') || normalized.includes('aquarius')) return '♒';
  if (normalized.includes('fische') || normalized.includes('pisces')) return '♓';
  return '✧';
};

const ZodiacBadge: React.FC<{ sign: string; prefix?: string }> = ({ sign, prefix }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const normalizedSign = sign.toLowerCase().trim();
  const infoKey = signMap[normalizedSign];
  const info = infoKey ? ZODIAC_DATA[infoKey] : null;

  return (
    <div 
      className="relative inline-flex items-center gap-3 ml-4 first:ml-0 cursor-help group/zodiac"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => setShowTooltip(!showTooltip)}
    >
      <div className="w-9 h-9 rounded-full bg-[#0E1B33] flex items-center justify-center text-[#C9A46A] text-xl shadow-lg border border-[#C9A46A]/30 group-hover/zodiac:scale-110 group-hover/zodiac:border-[#C9A46A] group-hover/zodiac:shadow-[#C9A46A]/20 transition-all duration-300 select-none">
        {getZodiacSymbol(sign)}
      </div>
      <div className="flex flex-col items-start leading-none">
        <span className="opacity-40 font-bold mono text-[8px] uppercase tracking-widest mb-0.5">{prefix}</span>
        <span className="text-[#0E1B33] font-bold text-xs uppercase tracking-tight">{sign}</span>
      </div>
      
      {showTooltip && info && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-56 bg-[#0E1B33] text-white p-5 rounded-[2rem] shadow-2xl z-[100] animate-reveal pointer-events-none border border-white/10">
          <div className="flex items-center gap-3 mb-3 border-b border-white/10 pb-3">
            <span className="text-[#C9A46A] text-2xl">{getZodiacSymbol(sign)}</span>
            <span className="mono text-[11px] font-bold uppercase tracking-[0.2em]">{sign}</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="mono text-[8px] uppercase text-white/40 tracking-wider">Herrscher</span>
              <span className="text-[11px] font-bold text-[#7AA7A1]">{info.ruler}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="mono text-[8px] uppercase text-white/40 tracking-wider">Element</span>
              <span className="text-[11px] font-bold text-[#C9A46A]">{info.element}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="mono text-[8px] uppercase text-white/40 tracking-wider">Modalität</span>
              <span className="text-[11px] font-bold text-[#8F7AD1]">{info.modality}</span>
            </div>
            <div className="pt-2 border-t border-white/5">
               <p className="text-[9px] text-white/60 italic leading-relaxed">{info.keywords}</p>
            </div>
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0E1B33] rotate-45 border-r border-b border-white/10 -mt-1.5" />
        </div>
      )}
    </div>
  );
};

const DataRow: React.FC<{ label: string; value: React.ReactNode; icon: LucideIcon; isBazi?: boolean }> = ({ label, value, icon: Icon, isBazi }) => (
  <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between py-6 border-b border-[#E6E0D8]/60 last:border-0 hover:bg-[#0E1B33]/[0.02] px-2 transition-all duration-300 group relative ${isBazi ? 'pl-8' : ''}`}>
    {isBazi && (
      <div className="absolute left-0 top-3 bottom-3 w-[4px] rounded-full bg-gradient-to-b from-[#8F7AD1] via-[#7AA7A1] to-[#C9A46A] opacity-80 shadow-[0_0_12px_rgba(122,167,161,0.4)] animate-pulse" />
    )}
    <div className="flex items-center gap-4 mb-2 sm:mb-0">
      <div className={`p-2 bg-white rounded-lg border border-[#E6E0D8] group-hover:border-[#C9A46A] transition-colors shadow-sm ${isBazi ? 'bg-gradient-to-br from-white to-[#F6F3EE] border-[#7AA7A1]/40' : ''}`}>
        <Icon size={14} className={`text-[#5A6477] group-hover:text-[#0E1B33] ${isBazi ? 'text-[#7AA7A1]' : ''}`} />
      </div>
      <div className="flex flex-col">
        <span className="mono text-[10px] text-[#5A6477] font-bold uppercase tracking-[0.4em]">{label}</span>
        {isBazi && (
          <span className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1 h-1 rounded-full bg-[#7AA7A1] animate-ping" />
            <span className="mono text-[7px] text-[#7AA7A1] uppercase tracking-[0.2em] font-extrabold">BAZI_QUANTUM_FEED</span>
          </span>
        )}
      </div>
    </div>
    <div className={`text-sm text-[#0E1B33] font-bold tracking-tight text-right sm:max-w-[70%] transition-all relative overflow-hidden ${isBazi ? 'bg-[#F6F3EE] px-7 py-3 rounded-full border border-transparent shadow-[0_4px_15px_rgba(122,167,161,0.08)] group-hover:shadow-[0_4px_25px_rgba(122,167,161,0.2)] group-hover:border-[#7AA7A1]/30 flex items-center gap-3' : ''}`}>
      {isBazi && (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-[#8F7AD1]/10 via-transparent to-[#C9A46A]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#7AA7A1]/40 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#C9A46A]/40 to-transparent" />
          {/* Holo Edge Shimmer */}
          <div className="absolute top-0 left-[-100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg] animate-[scan-shine_3s_infinite]" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#7AA7A1] shadow-[0_0_8px_#7AA7A1] animate-pulse" />
        </>
      )}
      <span className="relative z-10">{value}</span>
    </div>
  </div>
);

const PlanetaryVisualization: React.FC<{ konstellation: { sun: string; moon: string; rising: string } }> = ({ konstellation }) => {
  return (
    <div className="relative w-full aspect-video bg-[#0E1B33] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl mt-12 group/align cursor-crosshair">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <svg width="100%" height="100%" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="metatron" width="200" height="200" patternUnits="userSpaceOnUse">
              <circle cx="100" cy="100" r="80" fill="none" stroke="white" strokeWidth="1" />
              <path d="M100 20 L169.28 60 L169.28 140 L100 180 L30.72 140 L30.72 60 Z" fill="none" stroke="white" strokeWidth="0.5" />
              <path d="M100 20 L30.72 140 M169.28 60 L30.72 60 M169.28 140 L100 20 M100 180 L169.28 60 M30.72 140 L169.28 140 M30.72 60 L100 180" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#metatron)" />
        </svg>
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <svg viewBox="0 0 400 200" className="w-full h-full p-10 overflow-visible">
          <circle cx="200" cy="100" r="85" fill="none" stroke="white" strokeWidth="0.1" strokeDasharray="1 5" className="animate-spin-slow" />
          <circle cx="200" cy="100" r="65" fill="none" stroke="white" strokeWidth="0.2" strokeDasharray="10 20" className="opacity-20 animate-[spin_120s_linear_infinite_reverse]" />
          <circle cx="200" cy="100" r="2" fill="#7AA7A1" className="animate-pulse" />
          <circle cx="200" cy="100" r="4" fill="none" stroke="#7AA7A1" strokeWidth="0.5" className="animate-ping opacity-30" />
          
          <g className="opacity-40">
            <path d="M 100 40 Q 200 20 280 60" fill="none" stroke="#C9A46A" strokeWidth="0.3" strokeDasharray="2 2" className="animate-pulse" />
            <path d="M 280 60 Q 300 100 160 150" fill="none" stroke="#8F7AD1" strokeWidth="0.3" strokeDasharray="2 2" />
            <path d="M 100 40 Q 120 100 160 150" fill="none" stroke="#7AA7A1" strokeWidth="0.3" strokeDasharray="2 2" />
          </g>

          <g className="animate-reveal group/sun [animation-delay:0.2s]">
             <line x1="200" y1="100" x2="100" y2="40" stroke="#C9A46A" strokeWidth="0.5" strokeDasharray="1 3" />
             <circle cx="100" cy="40" r="7" fill="#0E1B33" stroke="#C9A46A" strokeWidth="1" className="group-hover/sun:scale-125 transition-transform" />
             <text x="100" y="42" textAnchor="middle" className="text-[6px] fill-[#C9A46A] select-none font-bold">☉</text>
             <text x="85" y="30" className="mono text-[4px] fill-[#C9A46A] uppercase font-bold tracking-widest opacity-0 group-hover/sun:opacity-100 transition-opacity">SUN_{konstellation.sun.toUpperCase()}</text>
          </g>

          <g className="animate-reveal group/moon [animation-delay:0.4s]">
             <line x1="200" y1="100" x2="280" y2="60" stroke="#8F7AD1" strokeWidth="0.5" strokeDasharray="1 3" />
             <circle cx="280" cy="60" r="7" fill="#0E1B33" stroke="#8F7AD1" strokeWidth="1" className="group-hover/moon:scale-125 transition-transform" />
             <text x="280" y="62" textAnchor="middle" className="text-[6px] fill-[#8F7AD1] select-none font-bold">☽</text>
             <text x="285" y="52" className="mono text-[4px] fill-[#8F7AD1] uppercase font-bold tracking-widest opacity-0 group-hover/moon:opacity-100 transition-opacity">MOON_{konstellation.moon.toUpperCase()}</text>
          </g>

          <g className="animate-reveal group/asc [animation-delay:0.6s]">
             <line x1="200" y1="100" x2="160" y2="150" stroke="#7AA7A1" strokeWidth="0.5" strokeDasharray="1 3" />
             <circle cx="160" cy="150" r="7" fill="#0E1B33" stroke="#7AA7A1" strokeWidth="1" className="group-hover/asc:scale-125 transition-transform" />
             <text x="160" y="152" textAnchor="middle" className="text-[5px] fill-[#7AA7A1] select-none font-bold uppercase">AC</text>
             <text x="145" y="165" className="mono text-[4px] fill-[#7AA7A1] uppercase font-bold tracking-widest opacity-0 group-hover/asc:opacity-100 transition-opacity">ASC_{konstellation.rising.toUpperCase()}</text>
          </g>

          <path d="M 100 40 L 280 60 L 160 150 Z" fill="rgba(201, 164, 106, 0.05)" stroke="white" strokeWidth="0.1" className="animate-pulse" />
        </svg>
      </div>

      <div className="absolute top-8 left-10 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Orbit size={14} className="text-[#C9A46A]" />
          <span className="mono text-[9px] font-extrabold text-white/50 uppercase tracking-[0.4em]">Celestial_Resonance_Map</span>
        </div>
        <div className="text-[10px] text-white serif italic opacity-80">Geometrische Resonanz der Geburtsmatrix</div>
      </div>

      <div className="absolute bottom-8 right-10 flex flex-col items-end gap-3">
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <Sun size={10} className="text-[#C9A46A]" />
            <span className="mono text-[8px] text-white/30 uppercase tracking-widest font-bold">Essenz</span>
          </div>
          <div className="flex items-center gap-2">
            <Moon size={10} className="text-[#8F7AD1]" />
            <span className="mono text-[8px] text-white/30 uppercase tracking-widest font-bold">Reflexion</span>
          </div>
          <div className="flex items-center gap-2">
            <ArrowUpRight size={10} className="text-[#7AA7A1]" />
            <span className="mono text-[8px] text-white/30 uppercase tracking-widest font-bold">Projektion</span>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
           <Activity size={10} className="text-[#7AA7A1] animate-pulse" />
           <span className="mono text-[7px] text-white/60 uppercase tracking-[0.2em] font-bold">Sync: 104.2ms</span>
        </div>
      </div>
    </div>
  );
};

const IdentityBadges: React.FC<IdentityBadgesProps> = ({ data }) => {
  const [activePillar, setActivePillar] = useState<number | null>(0);
  const [hoveredPillar, setHoveredPillar] = useState<number | null>(null);
  const [shineKey, setShineKey] = useState(0);
  const [aiInsight, setAiInsight] = useState(data.bedeutung);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setShineKey(prev => prev + 1);
  }, [activePillar]);

  const generateDeepInsight = async () => {
    setIsGenerating(true);
    try {
      const insight = await generateAstroInsight({
        sunSign: data.konstellation.sun,
        moonSign: data.konstellation.moon,
        ascSign: data.konstellation.rising,
        tierkreis: data.tierkreis,
        monatstier: data.monatstier,
        element: data.element,
      });
      setAiInsight(insight);
    } catch (error) {
      console.error("AI Insight Generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const tierkreisClean = data.tierkreis.replace(/\s/g, '');
  const combinedHeader = `${tierkreisClean} Sonne: ${data.konstellation.sun} AC ${data.konstellation.rising}`;

  // Transform real BaZi data into pillar display format
  const PILLAR_META = {
    year: { label: 'JAHR', title: 'Ahnenerbe', aspect: 'Äußeres Image', meaningBase: 'Dein soziales Erbe und der erste Eindruck, den du in der Welt hinterlässt.' },
    month: { label: 'MONAT', title: 'Eltern/Karriere', aspect: 'Berufung', meaningBase: 'Der Ursprung deines Ehrgeizes und das Fundament deiner beruflichen Identität.' },
    day: { label: 'TAG', title: 'Selbstkern', aspect: 'Inneres Wesen', meaningBase: 'Dein wahres Ich und dein engstes Umfeld. Eine tiefe Quelle der Intuition.' },
    hour: { label: 'STUNDE', title: 'Zukunft/Ideale', aspect: 'Bestimmung', meaningBase: 'Deine Wünsche, Träume und das Vermächtnis, das du hinterlassen willst.' },
  };

  const ELEMENT_DE: Record<string, string> = {
    Wood: 'Holz', Fire: 'Feuer', Earth: 'Erde', Metal: 'Metall', Water: 'Wasser',
  };

  const pillars = data.bazi ? (['year', 'month', 'day', 'hour'] as const).map((key) => {
    const pillar = data.bazi![key];
    const meta = PILLAR_META[key];
    return {
      label: meta.label,
      title: meta.title,
      stem: `${ELEMENT_DE[pillar.element] || pillar.element} (${pillar.stem})`,
      branch: `${pillar.animalDE || pillar.animal} (${pillar.branch})`,
      element: `${pillar.polarity} ${ELEMENT_DE[pillar.element] || pillar.element}`,
      aspect: meta.aspect,
      hiddenStems: [] as string[], // Hidden stems need additional computation
      strength: 70, // Placeholder - could be derived from element balance
      meaning: meta.meaningBase,
    };
  }) : [
    // Fallback mock data when bazi is not available
    { label: 'JAHR', title: 'Ahnenerbe', stem: 'Metall (Geng)', branch: 'Pferd (Wu)', element: 'Yang Metall', aspect: 'Äußeres Image', hiddenStems: ['Feuer (Ding)', 'Erde (Ji)'], strength: 78, meaning: 'Dein soziales Erbe und der erste Eindruck, den du in der Welt hinterlässt.' },
    { label: 'MONAT', title: 'Eltern/Karriere', stem: 'Erde (Ji)', branch: 'Ziege (Wei)', element: 'Yin Erde', aspect: 'Berufung', hiddenStems: ['Erde (Ji)', 'Feuer (Ding)', 'Holz (Yi)'], strength: 64, meaning: 'Der Ursprung deines Ehrgeizes und das Fundament deiner beruflichen Identität.' },
    { label: 'TAG', title: 'Selbstkern', stem: 'Wasser (Gui)', branch: 'Hahn (You)', element: 'Yin Wasser', aspect: 'Inneres Wesen', hiddenStems: ['Metall (Xin)'], strength: 92, meaning: 'Dein wahres Ich und dein engstes Umfeld. Eine tiefe Quelle der Intuition.' },
    { label: 'STUNDE', title: 'Zukunft/Ideale', stem: 'Metall (Xin)', branch: 'Schwein (Hai)', element: 'Yin Metall', aspect: 'Bestimmung', hiddenStems: ['Wasser (Ren)', 'Holz (Jia)'], strength: 55, meaning: 'Deine Wünsche, Träume und das Vermächtnis, das du hinterlassen willst.' },
  ];

  return (
    <div className="relative animate-reveal">
      <div className="absolute -top-16 left-0 w-full flex justify-center pointer-events-none">
        <div className="cluster-title serif uppercase tracking-[1.2em]">MANIFESTO</div>
      </div>

      <div className="max-w-5xl mx-auto premium-card">
        <div key={shineKey} className="scan-shine-effect" />

        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
          <div className="lg:col-span-5 p-12 lg:border-r border-[#E6E0D8] flex flex-col items-center justify-center relative bg-[#F6F3EE]/40">
            <div className="absolute top-10 left-10 flex items-center gap-3">
              <Hexagon size={16} className="text-[#C9A46A]" />
              <span className="mono text-[9px] text-[#5A6477] font-bold tracking-[0.4em] uppercase">Core_Matrix</span>
            </div>
            
            <div className="relative mb-12">
              <SigilPortrait 
                svg={data.symbol?.svg}
                description={data.symbol?.description}
              />
            </div>

            <div className="text-center">
              <div className="mono text-[10px] text-[#C9A46A] font-extrabold uppercase tracking-[0.6em] mb-4">Master Identity</div>
              <h2 className="serif text-4xl text-[#0E1B33] font-light tracking-tighter uppercase leading-tight mb-2">
                {combinedHeader}
              </h2>
              <div className="mt-6 flex items-center justify-center gap-4">
                <div className="w-8 h-[1px] bg-[#E6E0D8]" />
                <span className="text-[#5A6477] mono text-[9px] font-bold tracking-[0.3em] uppercase opacity-60">Status: Verifiziert</span>
                <div className="w-8 h-[1px] bg-[#E6E0D8]" />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 p-14 flex flex-col justify-center">
            <div className="flex justify-between items-center mb-10 border-b border-[#E6E0D8] pb-6">
              <div className="flex items-center gap-5">
                <div className="p-3 bg-[#0E1B33] rounded-2xl">
                  <Database size={20} className="text-[#7AA7A1]" />
                </div>
                <div>
                  <h3 className="serif text-2xl text-[#0E1B33] font-medium tracking-tight">Charakter-Synthese</h3>
                  <div className="mono text-[9px] text-[#5A6477] uppercase tracking-widest mt-1">Multi-Domain Astrology Feed</div>
                </div>
              </div>
            </div>

            <div className="space-y-1 mb-10">
              <DataRow label="Monatstier" value={data.monatstier} icon={CircleDot} isBazi />
              <DataRow label="Tagestier" value={data.tagestier} icon={Zap} isBazi />
              <DataRow label="Stunden Meister" value={data.stundenMeister} icon={Cpu} isBazi />
              <DataRow label="Element" value={<ElementBadge name={data.element} />} icon={Layers} />
              <DataRow 
                label="Konstellation" 
                value={
                  <div className="flex flex-wrap justify-end gap-x-8 gap-y-4">
                    <ZodiacBadge prefix="Sonne" sign={data.konstellation.sun} />
                    <ZodiacBadge prefix="Mond" sign={data.konstellation.moon} />
                    <ZodiacBadge prefix="Rising" sign={data.konstellation.rising} />
                  </div>
                } 
                icon={Star} 
              />
            </div>

            <div className="mb-10 mt-6">
              <div className="flex items-center gap-4 mb-4">
                <span className="mono text-[10px] text-[#5A6477] font-bold uppercase tracking-[0.4em]">BaZi Four Pillars Matrix</span>
                <div className="h-[1px] flex-grow bg-[#E6E0D8]" />
                <div className="flex items-center gap-2">
                  <ShieldCheck size={12} className="text-[#C9A46A]" />
                  <span className="mono text-[8px] uppercase tracking-widest font-bold text-[#A1A1AA]">Core Calibration</span>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-3 mb-6 relative">
                {pillars.map((p, idx) => (
                  <div key={idx} className="relative group/tab">
                    <button
                      onMouseEnter={() => setHoveredPillar(idx)}
                      onMouseLeave={() => setHoveredPillar(null)}
                      onClick={() => setActivePillar(idx)}
                      className={`w-full relative flex flex-col items-center py-4 rounded-xl border transition-all duration-300 overflow-hidden ${
                        activePillar === idx 
                          ? 'bg-[#0E1B33] border-[#0E1B33] text-white shadow-xl translate-y-[-2px]' 
                          : 'bg-white border-[#E6E0D8] text-[#5A6477] hover:border-[#C9A46A] hover:bg-[#F6F3EE] hover:scale-[1.02]'
                      }`}
                    >
                      <div className={`absolute top-0 left-0 right-0 h-[3px] transition-all duration-500 bg-gradient-to-r from-[#8F7AD1] via-[#7AA7A1] to-[#C9A46A] ${
                        activePillar === idx ? 'opacity-100 scale-x-100' : 'opacity-40 scale-x-75 group-hover/tab:opacity-100 group-hover/tab:scale-x-100'
                      }`} />
                      
                      <span className="mono text-[9px] font-bold tracking-widest mb-1">{p.label}</span>
                      <span className="text-[10px] opacity-60 uppercase font-medium">{p.title}</span>
                      <div className={`w-1 h-1 rounded-full mt-2 transition-all ${activePillar === idx ? 'bg-[#7AA7A1] scale-150 shadow-[0_0_8px_#7AA7A1]' : 'bg-[#E6E0D8]'}`} />
                    </button>

                    {hoveredPillar === idx && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-60 bg-[#0E1B33] text-white p-5 rounded-[2rem] shadow-2xl z-[100] animate-reveal pointer-events-none border border-white/10">
                        <div className="mono text-[8px] text-[#C9A46A] font-extrabold uppercase tracking-[0.4em] mb-3 border-b border-white/10 pb-2 flex items-center gap-2">
                          <Activity size={10} className="animate-pulse" /> Pillar_Data_Link
                        </div>
                        <div className="space-y-4">
                          <div>
                            <span className="mono text-[7px] uppercase text-white/40 tracking-wider block mb-1">Domäne / Aspect</span>
                            <div className="text-[12px] font-bold text-[#7AA7A1] leading-tight">{p.aspect}</div>
                          </div>
                          <div>
                            <span className="mono text-[7px] uppercase text-white/40 tracking-wider block mb-2">Verborgene Stämme</span>
                            <div className="flex flex-wrap gap-1.5">
                              {p.hiddenStems.map((s, i) => (
                                <span key={i} className="text-[9px] bg-white/5 px-2 py-1 rounded-lg border border-white/10 text-white/90 font-bold">{s}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0E1B33] rotate-45 border-r border-b border-white/10 -mt-1.5" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className={`bg-[#F6F3EE] rounded-3xl p-8 border border-[#E6E0D8] transition-all duration-500 relative overflow-hidden shadow-inner ${activePillar !== null ? 'min-h-[220px]' : 'min-h-0'}`}>
                <div className={`absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-[#7AA7A1] to-[#C9A46A] transition-all duration-700 ${activePillar !== null ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0'}`} />
                <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none"><Hexagon size={160} /></div>
                
                {activePillar !== null ? (
                  <div className="animate-reveal relative z-10 w-full" key={`pillar-detail-${activePillar}`}>
                    <div className="flex justify-between items-start mb-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="mono text-[10px] font-bold text-[#C9A46A] uppercase tracking-widest"><ElementBadge name={pillars[activePillar].element} /></span>
                          <span className="w-1 h-1 rounded-full bg-[#E6E0D8]" />
                          <span className="mono text-[9px] text-[#A1A1AA] uppercase tracking-widest font-bold">Pillar_Expanded_Details</span>
                        </div>
                        <h5 className="serif text-3xl text-[#0E1B33] leading-none">{pillars[activePillar].aspect}</h5>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-[#E6E0D8] shadow-sm">
                          <TrendingUp size={12} className="text-[#7AA7A1]" /><span className="mono text-[9px] font-bold text-[#0E1B33]">{pillars[activePillar].strength}% Kraft</span>
                        </div>
                        <span className="mono text-[7px] text-[#A1A1AA] uppercase tracking-widest">Resonanz_Level</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2"><Anchor size={12} className="text-[#0E1B33] opacity-40" /><span className="mono text-[8px] uppercase text-[#5A6477] font-bold tracking-wider">Himmelsstamm</span></div>
                        <div className="text-sm font-bold text-[#0E1B33] bg-white px-3 py-2 rounded-xl border border-[#E6E0D8]/60 inline-block shadow-sm">{pillars[activePillar].stem}</div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2"><Compass size={12} className="text-[#0E1B33] opacity-40" /><span className="mono text-[8px] uppercase text-[#5A6477] font-bold tracking-wider">Erdzweig</span></div>
                        <div className="text-sm font-bold text-[#0E1B33] bg-white px-3 py-2 rounded-xl border border-[#E6E0D8]/60 inline-block shadow-sm">{pillars[activePillar].branch}</div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2"><Layers size={12} className="text-[#C9A46A]" /><span className="mono text-[8px] uppercase text-[#C9A46A] font-bold tracking-wider">Verborgene Stämme</span></div>
                        <div className="flex flex-wrap gap-2">
                          {pillars[activePillar].hiddenStems.map((s, i) => (<span key={i} className="text-[11px] font-bold text-[#5A6477] bg-[#E6E0D8]/30 px-2 py-1 rounded-md border border-[#E6E0D8]/60">{s}</span>))}
                        </div>
                      </div>
                    </div>
                    <div className="mt-8 pt-6 border-t border-[#E6E0D8]/60">
                      <p className="text-[#5A6477] text-xs leading-relaxed italic font-medium"><Info size={12} className="inline mr-2 text-[#C9A46A]" />{pillars[activePillar].meaning}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center flex-grow py-12 text-[#A1A1AA] gap-4">
                    <ChevronRight size={24} className="animate-pulse opacity-40" />
                    <span className="mono text-[10px] uppercase tracking-[0.4em] font-bold">Wähle eine Säule zur Detail-Analyse</span>
                  </div>
                )}
              </div>
            </div>

            <PlanetaryVisualization konstellation={data.konstellation} />

            <div className="relative mt-24 group/ai">
              <div className="absolute -top-6 left-10 px-5 py-2 bg-[#0E1B33] text-white mono text-[11px] font-bold uppercase tracking-[0.4em] rounded-full shadow-2xl z-20 border border-white/20 flex items-center gap-3">
                <Sparkles size={14} className="text-[#C9A46A] animate-pulse" />
                Quantum_Synergy_Module
              </div>

              <div className="bg-white rounded-[3rem] p-16 border border-[#C9A46A]/30 relative overflow-hidden shadow-[0_15px_50px_-10px_rgba(201,164,106,0.15)] transition-all hover:shadow-[0_20px_60px_-10px_rgba(201,164,106,0.25)] group">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none overflow-hidden mono text-[7px] text-[#0E1B33] p-8 leading-tight">
                   {Array.from({ length: 20 }).map((_, i) => (
                     <div key={i}>PROC_THREAD_{i}: CROSS_SYSTEM_COMPATIBILITY_{Math.random().toString(36).substring(7)}</div>
                   ))}
                </div>

                <div className="relative z-10 flex flex-col md:flex-row gap-16 items-start">
                  <div className="flex-grow">
                    <div className="flex items-center gap-4 mb-3">
                       <Binary size={16} className="text-[#7AA7A1] opacity-60" />
                       <h4 className="mono text-[12px] font-extrabold text-[#C9A46A] uppercase tracking-[0.6em] opacity-80">Synergy Analysis</h4>
                    </div>
                    <h3 className="serif text-4xl lg:text-5xl font-light text-[#0E1B33] tracking-tighter mb-8 border-b border-[#E6E0D8]/50 pb-6 uppercase">Cross-System Compatibility</h3>
                    
                    <div className="relative min-h-[120px]">
                      {isGenerating ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-5 animate-pulse bg-[#F6F3EE]/40 rounded-3xl border border-dashed border-[#E6E0D8]">
                          <Loader2 size={36} className="text-[#C9A46A] animate-spin" />
                          <span className="mono text-[11px] text-[#5A6477] uppercase tracking-[0.3em] font-bold">Resonanz-Matrix wird kalibriert...</span>
                        </div>
                      ) : (
                        <div className="p-2">
                           <p className="text-[#0E1B33] italic font-light leading-relaxed serif text-3xl animate-reveal">
                            &ldquo;{aiInsight}&rdquo;
                          </p>
                          <div className="mt-8 flex gap-3">
                             <div className="px-3 py-1 bg-[#F6F3EE] rounded-md border border-[#E6E0D8] mono text-[8px] text-[#5A6477] font-bold uppercase tracking-widest">Source: BaZi</div>
                             <div className="px-3 py-1 bg-[#F6F3EE] rounded-md border border-[#E6E0D8] mono text-[8px] text-[#5A6477] font-bold uppercase tracking-widest">Source: Western</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-5 shrink-0 pt-10 md:pt-4">
                    <button 
                      onClick={generateDeepInsight}
                      disabled={isGenerating}
                      className="group/btn relative px-10 py-5 bg-[#0E1B33] rounded-2xl overflow-hidden transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-2xl shadow-[#0E1B33]/20"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-[#8F7AD1] via-[#7AA7A1] to-[#C9A46A] opacity-0 group-hover/btn:opacity-30 transition-opacity" />
                      <div className="relative z-10 flex items-center gap-3 text-white">
                        <Wand2 size={18} className="text-[#C9A46A] group-hover/btn:rotate-[30deg] transition-transform" />
                        <span className="mono text-[11px] font-extrabold uppercase tracking-[0.4em]">Deep_Calibration</span>
                      </div>
                    </button>
                    
                    <div className="flex items-center gap-3 px-5 py-3 bg-[#F6F3EE] rounded-xl border border-[#E6E0D8] shadow-sm">
                      <Activity size={12} className="text-[#7AA7A1]" />
                      <span className="mono text-[9px] text-[#5A6477] font-bold uppercase tracking-widest">System: Gemini_3_Flash</span>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-0 right-0 p-8 opacity-[0.07] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                  <Sparkles size={100} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdentityBadges;
