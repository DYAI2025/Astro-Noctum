import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Compass, Cpu, ShieldCheck, ChevronRight } from 'lucide-react';

// ── Content data (EN/DE) ────────────────────────────────────────────
const CONTENT = {
  EN: {
    nav_how_it_works: 'How it works',
    nav_agents: 'Agents',
    nav_start: 'Start',
    hero_title: 'Bazodiac',
    hero_subtitle: 'Fusioned Firmament \u2014 Horoscope AI Consulting',
    hero_value_prop:
      'We compute real celestial positions at your exact birth time for a synthesis of Western and BaZi astrology.',
    cta_primary: 'Get your reading',
    cta_secondary: 'How it works',
    proof_1_title: 'Astronomical Precision',
    proof_1_desc: 'Real sky positions at your exact birth moment.',
    proof_2_title: 'Neural Synthesis',
    proof_2_desc: 'Western Astrology + BaZi synthesis through advanced LLMs.',
    proof_3_title: 'Serious Guidance',
    proof_3_desc: 'AI agents trained for serious, analytical consulting.',
    levi_role: 'The Architect',
    levi_name: 'Levi',
    levi_desc:
      'Analytical, structured, and system-driven. Levi decodes the logic of your stars with mathematical precision.',
    talk_levi: 'Talk to Levi',
    victoria_role: 'The Oracle',
    victoria_name: 'Victoria',
    victoria_desc:
      'Intuitive, empathetic, and visionary. Victoria translates cosmic energy into profound personal guidance.',
    talk_victoria: 'Talk to Victoria',
    how_it_works_title: 'The Process',
    sim_step_1: 'Translating birth coordinates...',
    sim_step_2: 'Computing BaZi pillars...',
    sim_step_3: 'Generating synthesis...',
    step_1_title: 'Input Data',
    step_1_desc: 'Enter birth date, time, and location with high precision.',
    step_2_title: 'Computation',
    step_2_desc: 'We compute real celestial positions + BaZi pillars integration.',
    step_3_title: 'Synthesis',
    step_3_desc: 'Levi & Victoria deliver your integrated, multi-system reading.',
    footer_disclaimer:
      'For self-reflection and personal growth. Not intended as medical or financial advice. We treat your birth data with extreme sensitivity and privacy.',
  },
  DE: {
    nav_how_it_works: 'Ablauf',
    nav_agents: 'Berater',
    nav_start: 'Starten',
    hero_title: 'Bazodiac',
    hero_subtitle: 'Fusioniertes Firmament \u2014 Horoskop AI Consulting',
    hero_value_prop:
      'Wir berechnen reale Planetenkonstellationen zum Zeitpunkt Ihrer Geburt f\u00fcr eine Synthese aus westlicher und BaZi-Astrologie.',
    cta_primary: 'Deutung beginnen',
    cta_secondary: 'Ablauf',
    proof_1_title: 'Astronomische Pr\u00e4zision',
    proof_1_desc: 'Reale Himmelspositionen zum exakten Geburtszeitpunkt.',
    proof_2_title: 'Neuronale Synthese',
    proof_2_desc: 'Synthese aus westlicher Astrologie + BaZi durch fortschrittliche KI.',
    proof_3_title: 'Fundierte Beratung',
    proof_3_desc: 'KI-Agenten, spezialisiert auf ernsthafte, analytische Beratung.',
    levi_role: 'Der Architekt',
    levi_name: 'Levi',
    levi_desc:
      'Analytisch, strukturiert und systemorientiert. Levi dekodiert die Logik Ihrer Sterne mit mathematischer Pr\u00e4zision.',
    talk_levi: 'Mit Levi sprechen',
    victoria_role: 'Das Orakel',
    victoria_name: 'Victoria',
    victoria_desc:
      'Intuitiv, empathisch und vision\u00e4r. Victoria \u00fcbersetzt kosmische Energie in tiefe pers\u00f6nliche F\u00fchrung.',
    talk_victoria: 'Mit Victoria sprechen',
    how_it_works_title: 'Der Prozess',
    sim_step_1: '\u00dcbersetze Geburtskoordinaten...',
    sim_step_2: 'Berechne BaZi-S\u00e4ulen...',
    sim_step_3: 'Generiere Synthese...',
    step_1_title: 'Dateneingabe',
    step_1_desc: 'Geben Sie Geburtsdatum, Uhrzeit und Ort mit hoher Pr\u00e4zision ein.',
    step_2_title: 'Berechnung',
    step_2_desc: 'Wir berechnen reale Positionen + Integration der BaZi-S\u00e4ulen.',
    step_3_title: 'Synthese',
    step_3_desc: 'Levi & Victoria liefern Ihre integrierte, system\u00fcbergreifende Deutung.',
    footer_disclaimer:
      'Zur Selbstreflexion und pers\u00f6nlichen Weiterentwicklung. Keine medizinische oder finanzielle Beratung. Wir behandeln Ihre Daten mit h\u00f6chster Vertraulichkeit.',
  },
} as const;

type Lang = keyof typeof CONTENT;

// ── Agent images ────────────────────────────────────────────────────
const LEVI_IMG =
  'https://r2-bucket.flowith.net/f/2ddb3efc1855cc5b/cosmic_structure_logic_visual_index_1%402048x2048.jpeg';
const VICTORIA_IMG =
  'https://r2-bucket.flowith.net/f/db67c119da6f754e/cosmic_intuition_guidance_visual_index_2%402048x2048.jpeg';
const SYNTHESIS_IMG =
  'https://images.unsplash.com/photo-1614732414444-af963171f61d?auto=format&fit=crop&w=2048&q=80';

// ── Props ───────────────────────────────────────────────────────────
interface LandingHeroProps {
  onContinue: () => void;
}

// ── Component ───────────────────────────────────────────────────────
export function LandingHero({ onContinue }: LandingHeroProps) {
  const [lang, setLang] = useState<Lang>('EN');
  const t = CONTENT[lang];

  const starfieldRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const lerpMouseRef = useRef({ x: 0, y: 0 });
  const [cursorActive, setCursorActive] = useState(false);
  const [stepsVisible, setStepsVisible] = useState(false);
  const stepsRef = useRef<HTMLDivElement>(null);

  // ── Starfield ───────────────────────────────────────────────────
  useEffect(() => {
    const container = starfieldRef.current;
    if (!container) return;

    const stars: HTMLDivElement[] = [];
    const count = 120;

    for (let i = 0; i < count; i++) {
      const star = document.createElement('div');
      const size = Math.random() * 2 + 0.5;
      Object.assign(star.style, {
        position: 'absolute',
        width: `${size}px`,
        height: `${size}px`,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        borderRadius: '50%',
        backgroundColor: '#d4af37',
        opacity: '0',
        boxShadow: `0 0 ${size * 2}px rgba(212, 175, 55, 0.4)`,
        willChange: 'opacity',
      });
      container.appendChild(star);
      stars.push(star);

      // Animate with CSS
      const delay = Math.random() * 5;
      const duration = Math.random() * 2 + 1;
      const maxOpacity = Math.random() * 0.5 + 0.2;
      star.animate(
        [
          { opacity: 0 },
          { opacity: maxOpacity },
          { opacity: 0 },
        ],
        {
          duration: duration * 2000,
          delay: delay * 1000,
          iterations: Infinity,
          easing: 'ease-in-out',
        },
      );
    }

    return () => {
      stars.forEach((s) => s.remove());
    };
  }, []);

  // ── Synthesis Engine Canvas ─────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let animId = 0;

    interface Node {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      pulse: number;
    }

    let nodes: Node[] = [];

    const resize = () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
      nodes = [];
      for (let i = 0; i < 100; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          radius: Math.random() * 1.5 + 0.5,
          pulse: Math.random() * Math.PI,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      lerpMouseRef.current.x += (mouseRef.current.x - lerpMouseRef.current.x) * 0.08;
      lerpMouseRef.current.y += (mouseRef.current.y - lerpMouseRef.current.y) * 0.08;

      for (const node of nodes) {
        const dxm = lerpMouseRef.current.x - node.x;
        const dym = lerpMouseRef.current.y - node.y;
        const distM = Math.sqrt(dxm * dxm + dym * dym);

        if (distM < 400) {
          const force = 1 - distM / 400;
          node.vx += (dxm / distM) * force * 0.4;
          node.vy += (dym / distM) * force * 0.4;
          node.vx += (-dym / distM) * force * 0.8;
          node.vy += (dxm / distM) * force * 0.8;
        }

        node.vx *= 0.95;
        node.vy *= 0.95;
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0) node.x = width;
        if (node.x > width) node.x = 0;
        if (node.y < 0) node.y = height;
        if (node.y > height) node.y = 0;

        const alpha = 0.3 + Math.sin((node.pulse += 0.02)) * 0.2;
        ctx.fillStyle = `rgba(212, 175, 55, ${alpha})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // ── Custom Cursor ───────────────────────────────────────────────
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${e.clientX - 20}px, ${e.clientY - 20}px)`;
      }
    };

    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  // ── IntersectionObserver for steps ──────────────────────────────
  useEffect(() => {
    const el = stepsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStepsVisible(true);
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // ── Hover handlers for cursor ───────────────────────────────────
  const onInteractEnter = useCallback(() => setCursorActive(true), []);
  const onInteractLeave = useCallback(() => setCursorActive(false), []);

  // ── Smooth scroll ───────────────────────────────────────────────
  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div className="landing-hero-root">
      {/* Noise overlay */}
      <div className="landing-noise" />

      {/* Starfield */}
      <div ref={starfieldRef} className="fixed inset-0 z-0 pointer-events-none" />

      {/* Custom cursor (desktop only) */}
      <div
        ref={cursorRef}
        className={`landing-cursor ${cursorActive ? 'active' : ''}`}
      >
        <div className="landing-cursor-dot" />
        <div className="landing-cursor-ring" />
      </div>

      {/* ── Navigation ─────────────────────────────────────────── */}
      <header className="fixed top-0 w-full z-50 px-6 md:px-8 py-5 flex justify-between items-center bg-transparent backdrop-blur-sm border-b border-white/5">
        <div
          className="flex items-center gap-2"
          onMouseEnter={onInteractEnter}
          onMouseLeave={onInteractLeave}
        >
          <div className="w-7 h-7 rounded-full border border-[#b0b3b8] flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-[#b0b3b8] rounded-full animate-pulse" />
          </div>
          <span className="font-bold tracking-widest uppercase text-lg font-landing-display">
            Bazodiac
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-10 text-[10px] uppercase tracking-widest font-semibold">
          <button
            onClick={() => scrollTo('landing-how')}
            className="landing-nav-link"
            onMouseEnter={onInteractEnter}
            onMouseLeave={onInteractLeave}
          >
            {t.nav_how_it_works}
          </button>
          <button
            onClick={() => scrollTo('landing-agents')}
            className="landing-nav-link"
            onMouseEnter={onInteractEnter}
            onMouseLeave={onInteractLeave}
          >
            {t.nav_agents}
          </button>
          <button
            onClick={onContinue}
            className="px-5 py-2 border border-[#b0b3b8]/30 hover:border-[#b0b3b8] transition-all text-[10px] uppercase tracking-widest"
            onMouseEnter={onInteractEnter}
            onMouseLeave={onInteractLeave}
          >
            {t.nav_start}
          </button>

          {/* Language toggle */}
          <div
            className="landing-lang-switch"
            onClick={() => setLang((l) => (l === 'EN' ? 'DE' : 'EN'))}
            onMouseEnter={onInteractEnter}
            onMouseLeave={onInteractLeave}
          >
            <div
              className="landing-lang-slider"
              style={{ transform: `translateX(${lang === 'EN' ? 0 : 36}px)` }}
            />
            <span className={`landing-lang-option ${lang === 'EN' ? 'active' : ''}`}>EN</span>
            <span className={`landing-lang-option ${lang === 'DE' ? 'active' : ''}`}>DE</span>
          </div>
        </nav>
      </header>

      {/* ── Hero Section ────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        {/* Synthesis core bg image */}
        <div className="absolute inset-0 z-0 flex items-center justify-center">
          <div className="landing-core-wrap">
            <img
              src={SYNTHESIS_IMG}
              alt=""
              className="landing-core opacity-20 w-[400px] h-[400px] md:w-[600px] md:h-[600px] object-cover rounded-full mix-blend-screen brightness-150 blur-md"
            />
          </div>
        </div>

        {/* Particle canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 z-10 pointer-events-none opacity-50 w-full h-full"
        />

        {/* Hero content */}
        <div className="relative z-20">
          <motion.h1
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 1.8, ease: 'easeOut' }}
            className="text-6xl md:text-[120px] font-bold font-landing-display tracking-tighter leading-none mb-4"
          >
            {t.hero_title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 1.5, ease: 'easeOut' }}
            className="text-base md:text-xl font-extralight tracking-[0.2em] md:tracking-[0.3em] text-[#b0b3b8]/80 uppercase mb-6 md:mb-8"
          >
            {t.hero_subtitle}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 1.5, ease: 'easeOut' }}
            className="max-w-xl mx-auto text-[#b0b3b8]/60 mb-10 md:mb-12 font-light leading-relaxed text-sm md:text-base px-4"
          >
            {t.hero_value_prop}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.6, duration: 1, ease: 'easeOut' }}
            className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6"
          >
            <button
              onClick={onContinue}
              className="landing-btn-primary px-8 md:px-10 py-4 bg-[#f8f9fa] text-[#020617] font-semibold uppercase tracking-widest text-xs md:text-sm cursor-pointer"
              onMouseEnter={onInteractEnter}
              onMouseLeave={onInteractLeave}
            >
              {t.cta_primary}
            </button>
            <button
              onClick={() => scrollTo('landing-how')}
              className="px-8 md:px-10 py-4 border border-[#b0b3b8]/30 hover:bg-white/5 transition-all uppercase tracking-widest text-xs md:text-sm cursor-pointer"
              onMouseEnter={onInteractEnter}
              onMouseLeave={onInteractLeave}
            >
              {t.cta_secondary}
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── Proof Section ───────────────────────────────────────── */}
      <section className="py-24 md:py-32 px-6 md:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16 text-center">
          {[
            { Icon: Compass, title: t.proof_1_title, desc: t.proof_1_desc, delay: 0 },
            { Icon: Cpu, title: t.proof_2_title, desc: t.proof_2_desc, delay: 0.15 },
            { Icon: ShieldCheck, title: t.proof_3_title, desc: t.proof_3_desc, delay: 0.3 },
          ].map(({ Icon, title, desc, delay }) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.8, delay }}
            >
              <Icon className="w-7 h-7 md:w-8 md:h-8 mx-auto mb-5 md:mb-6 text-[#6366f1]" />
              <h3 className="text-[10px] md:text-xs uppercase tracking-widest mb-3 md:mb-4 font-bold">
                {title}
              </h3>
              <p className="text-[#b0b3b8]/50 font-light text-sm">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Agents Section ──────────────────────────────────────── */}
      <section id="landing-agents" className="py-24 md:py-32 px-6 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
          {/* Levi */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 1 }}
            className="landing-agent-card group cursor-pointer"
            onMouseEnter={onInteractEnter}
            onMouseLeave={onInteractLeave}
          >
            <div className="absolute inset-0 overflow-hidden rounded">
              <img
                src={LEVI_IMG}
                alt="Levi"
                className="w-full h-full object-cover opacity-40 grayscale-[0.5] contrast-125 transition-all duration-700 group-hover:opacity-60 group-hover:scale-105"
                style={{ maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)' }}
              />
            </div>
            <div className="relative z-10 h-full p-8 md:p-12 flex flex-col justify-end min-h-[450px] md:min-h-[600px]">
              <span className="text-[10px] uppercase tracking-[0.4em] text-[#6366f1] font-bold mb-2 block">
                {t.levi_role}
              </span>
              <h2 className="text-4xl md:text-5xl font-landing-display font-bold mb-4">
                {t.levi_name}
              </h2>
              <p className="text-[#b0b3b8]/70 font-light mb-6 md:mb-8 max-w-sm leading-relaxed text-sm">
                {t.levi_desc}
              </p>
              <button className="text-xs uppercase tracking-widest font-bold flex items-center gap-2 border border-white/10 px-5 md:px-6 py-3 rounded-full hover:bg-white/5 transition-all w-fit">
                <span>{t.talk_levi}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>

          {/* Victoria */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 1 }}
            className="landing-agent-card group cursor-pointer"
            onMouseEnter={onInteractEnter}
            onMouseLeave={onInteractLeave}
          >
            <div className="absolute inset-0 overflow-hidden rounded">
              <img
                src={VICTORIA_IMG}
                alt="Victoria"
                className="w-full h-full object-cover opacity-40 grayscale-[0.5] contrast-125 transition-all duration-700 group-hover:opacity-60 group-hover:scale-105"
                style={{ maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)' }}
              />
            </div>
            <div className="relative z-10 h-full p-8 md:p-12 flex flex-col justify-end min-h-[450px] md:min-h-[600px]">
              <span className="text-[10px] uppercase tracking-[0.4em] text-[#6366f1] font-bold mb-2 block">
                {t.victoria_role}
              </span>
              <h2 className="text-4xl md:text-5xl font-landing-display font-bold mb-4">
                {t.victoria_name}
              </h2>
              <p className="text-[#b0b3b8]/70 font-light mb-6 md:mb-8 max-w-sm leading-relaxed text-sm">
                {t.victoria_desc}
              </p>
              <button className="text-xs uppercase tracking-widest font-bold flex items-center gap-2 border border-white/10 px-5 md:px-6 py-3 rounded-full hover:bg-white/5 transition-all w-fit">
                <span>{t.talk_victoria}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────── */}
      <section id="landing-how" className="py-24 md:py-32 px-6 md:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center text-2xl md:text-3xl font-landing-display font-semibold mb-16 md:mb-20 uppercase tracking-[0.3em] md:tracking-[0.4em]">
            {t.how_it_works_title}
          </h2>

          <div
            ref={stepsRef}
            className="landing-sim-container p-8 md:p-16 relative overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16 relative z-10">
              {[
                { sim: t.sim_step_1, title: t.step_1_title, desc: t.step_1_desc, idx: 0 },
                { sim: t.sim_step_2, title: t.step_2_title, desc: t.step_2_desc, idx: 1 },
                { sim: t.sim_step_3, title: t.step_3_title, desc: t.step_3_desc, idx: 2 },
              ].map(({ sim, title, desc, idx }) => (
                <div key={idx}>
                  <div className="text-[10px] font-mono text-[#6366f1] mb-4 opacity-50 uppercase">
                    {sim}
                  </div>
                  <div className="h-px bg-white/10 w-full mb-6 md:mb-8 relative overflow-hidden">
                    <div
                      className="h-full bg-[#6366f1] absolute left-0 top-0 transition-all duration-[2000ms] ease-in-out"
                      style={{
                        width: stepsVisible ? '100%' : '0%',
                        transitionDelay: `${idx * 400}ms`,
                        boxShadow: '0 0 10px rgba(99,102,241,0.5)',
                      }}
                    />
                  </div>
                  <h4 className="text-base md:text-lg font-bold mb-3">{title}</h4>
                  <p className="text-[#b0b3b8]/50 text-sm font-light leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
            {/* Grid dot pattern */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.02]"
              style={{
                backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
                backgroundSize: '60px 60px',
              }}
            />
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="py-16 md:py-24 px-6 md:px-8 border-t border-white/5 relative">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8 md:gap-12">
          <div className="max-w-sm">
            <span className="font-bold tracking-widest uppercase text-lg md:text-xl font-landing-display block mb-4 md:mb-6">
              Bazodiac
            </span>
            <p className="text-[10px] md:text-xs text-[#b0b3b8]/40 leading-relaxed font-light">
              {t.footer_disclaimer}
            </p>
          </div>
          <div className="flex gap-12 md:gap-20 text-[10px] uppercase tracking-[0.2em] font-bold">
            <div className="flex flex-col gap-4 md:gap-5">
              <span className="landing-nav-link cursor-pointer">Privacy Policy</span>
              <span className="landing-nav-link cursor-pointer">Terms of Service</span>
            </div>
            <div className="flex flex-col gap-4 md:gap-5">
              <span className="landing-nav-link cursor-pointer">Legal Notice</span>
              <span className="landing-nav-link cursor-pointer">Contact Us</span>
            </div>
          </div>
        </div>
        <div className="mt-16 md:mt-20 text-center text-[9px] text-[#b0b3b8]/20 tracking-[0.2em] md:tracking-[0.3em] uppercase">
          &copy; 2026 Bazodiac Systemic Consulting &mdash; Harmonizing the heavens.
        </div>
      </footer>
    </div>
  );
}
