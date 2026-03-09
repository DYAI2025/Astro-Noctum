import React, { useState, useEffect, useRef, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// RITUAL SPACE - INTERACTIVE SPHERE WITH LIVE AGENT INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════
// "Ein Dialog mit deinem Muster."
// Through the lens of mythic-philosophical Claude Opus 4.5
// ═══════════════════════════════════════════════════════════════════════════

const ZODIAC_SIGNS = [
  { symbol: '♈', name: 'Aries', element: 'fire' },
  { symbol: '♉', name: 'Taurus', element: 'earth' },
  { symbol: '♊', name: 'Gemini', element: 'air' },
  { symbol: '♋', name: 'Cancer', element: 'water' },
  { symbol: '♌', name: 'Leo', element: 'fire' },
  { symbol: '♍', name: 'Virgo', element: 'earth' },
  { symbol: '♎', name: 'Libra', element: 'air' },
  { symbol: '♏', name: 'Scorpio', element: 'water' },
  { symbol: '♐', name: 'Sagittarius', element: 'fire' },
  { symbol: '♑', name: 'Capricorn', element: 'earth' },
  { symbol: '♒', name: 'Aquarius', element: 'air' },
  { symbol: '♓', name: 'Pisces', element: 'water' }
];

const PLANETS = [
  { symbol: '☉', name: 'Sun', position: 127 },
  { symbol: '☽', name: 'Moon', position: 234 },
  { symbol: '☿', name: 'Mercury', position: 145 },
  { symbol: '♀', name: 'Venus', position: 98 },
  { symbol: '♂', name: 'Mars', position: 312 },
  { symbol: '♃', name: 'Jupiter', position: 45 },
  { symbol: '♄', name: 'Saturn', position: 267 },
  { symbol: '⛢', name: 'Uranus', position: 189 },
  { symbol: '♆', name: 'Neptune', position: 356 },
  { symbol: '♇', name: 'Pluto', position: 298 }
];

const AGENT_MESSAGES = [
  { type: 'system', text: 'Ritual initialisiert. Die Sphäre erwacht...' },
  { type: 'agent', text: 'Lass uns deinen Himmel öffnen.' },
  { type: 'agent', text: 'Ich sehe deine Koordinaten im kosmischen Gewebe. Deine Sonne steht im Zeichen des Löwen – das Feuer der Selbsterkenntnis brennt in dir.' },
  { type: 'agent', text: 'Dein Mond in den Fischen spricht von einer Seele, die in Träumen wandelt. Die emotionale Tiefe ist dein Geschenk und deine Prüfung.' },
  { type: 'agent', text: 'Der Aszendent im Steinbock formt deine Maske zur Welt – Struktur, Ambition, der lange Atem.' },
  { type: 'insight', text: 'Kontrast erkannt: Westliche Deutung sieht Führung. BaZi sieht den Metall-Affen – Schärfe des Geistes, rastlose Innovation.' },
  { type: 'agent', text: 'Die Integration beginnt: Du bist nicht entweder-oder. Du bist das UND dazwischen.' }
];

export default function RitualSphere() {
  const [phase, setPhase] = useState('awakening'); // awakening, calibrating, revealed, dialogue
  const [calmMode, setCalmMode] = useState(false);
  const [selectedPlanet, setSelectedPlanet] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageIndex, setMessageIndex] = useState(0);
  const [inputText, setInputText] = useState('');
  const [insightVisible, setInsightVisible] = useState(false);
  const [currentInsight, setCurrentInsight] = useState(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const messagesEndRef = useRef(null);

  // ═══════════════════════════════════════════════════════════════════════
  // COSMIC BACKGROUND RENDERER
  // ═══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Star field
    const stars = Array.from({ length: 400 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5,
      brightness: Math.random(),
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      twinkleOffset: Math.random() * Math.PI * 2
    }));

    // Nebula particles
    const nebulae = Array.from({ length: 8 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 200 + 100,
      color: ['#1a0a2e', '#0a1628', '#0d1f2d', '#1a0f1a'][Math.floor(Math.random() * 4)],
      opacity: Math.random() * 0.3 + 0.1,
      drift: Math.random() * 0.2 - 0.1
    }));

    let time = 0;
    const animate = () => {
      if (calmMode) {
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Minimal static stars in calm mode
        stars.forEach(star => {
          ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness * 0.3})`;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 0.5, 0, Math.PI * 2);
          ctx.fill();
        });
      } else {
        // Deep space gradient
        const gradient = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, 0,
          canvas.width / 2, canvas.height / 2, canvas.width * 0.8
        );
        gradient.addColorStop(0, '#0d1117');
        gradient.addColorStop(0.5, '#090c10');
        gradient.addColorStop(1, '#040608');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Nebulae
        nebulae.forEach(nebula => {
          nebula.x += nebula.drift;
          if (nebula.x > canvas.width + nebula.radius) nebula.x = -nebula.radius;
          if (nebula.x < -nebula.radius) nebula.x = canvas.width + nebula.radius;

          const nebulaGradient = ctx.createRadialGradient(
            nebula.x, nebula.y, 0,
            nebula.x, nebula.y, nebula.radius
          );
          nebulaGradient.addColorStop(0, nebula.color + Math.floor(nebula.opacity * 255).toString(16).padStart(2, '0'));
          nebulaGradient.addColorStop(1, 'transparent');
          ctx.fillStyle = nebulaGradient;
          ctx.fillRect(nebula.x - nebula.radius, nebula.y - nebula.radius, nebula.radius * 2, nebula.radius * 2);
        });

        // Animated stars
        stars.forEach(star => {
          const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.5 + 0.5;
          const alpha = star.brightness * twinkle;
          
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fill();

          // Glow for brighter stars
          if (star.brightness > 0.7) {
            ctx.fillStyle = `rgba(180, 200, 255, ${alpha * 0.3})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      time++;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [calmMode]);

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE PROGRESSION
  // ═══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const phases = [
      { name: 'awakening', duration: 2000 },
      { name: 'calibrating', duration: 3000 },
      { name: 'revealed', duration: 2000 },
      { name: 'dialogue', duration: null }
    ];

    let timeout;
    const currentIndex = phases.findIndex(p => p.name === phase);
    const current = phases[currentIndex];
    
    if (current && current.duration) {
      timeout = setTimeout(() => {
        const next = phases[currentIndex + 1];
        if (next) setPhase(next.name);
      }, current.duration);
    }

    return () => clearTimeout(timeout);
  }, [phase]);

  // ═══════════════════════════════════════════════════════════════════════
  // AGENT MESSAGE STREAMING
  // ═══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (phase !== 'dialogue') return;

    const interval = setInterval(() => {
      if (messageIndex < AGENT_MESSAGES.length) {
        const msg = AGENT_MESSAGES[messageIndex];
        setMessages(prev => [...prev, { ...msg, id: Date.now() }]);
        setMessageIndex(prev => prev + 1);

        // Show insight card for insight messages
        if (msg.type === 'insight') {
          setCurrentInsight(msg.text);
          setInsightVisible(true);
          setTimeout(() => setInsightVisible(false), 6000);
        }
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [phase, messageIndex]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    setMessages(prev => [...prev, { type: 'user', text: inputText, id: Date.now() }]);
    setInputText('');
    
    // Simulate agent response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        type: 'agent', 
        text: 'Ich höre deine Frage und betrachte die Konstellationen...', 
        id: Date.now() 
      }]);
    }, 1500);
  };

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <div className="ritual-container">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=JetBrains+Mono:wght@300;400&display=swap');

        :root {
          --color-void: #040608;
          --color-deep: #0a0d12;
          --color-surface: #12161d;
          --color-elevated: #1a1f28;
          --color-border: #2a3140;
          --color-text-primary: #e8eaed;
          --color-text-secondary: #8b919c;
          --color-text-muted: #5a6270;
          --color-accent-gold: #c9a962;
          --color-accent-gold-dim: #8b7642;
          --color-accent-blue: #4a90a4;
          --color-accent-violet: #7c5295;
          --color-fire: #c45c3e;
          --color-earth: #6b8e5a;
          --color-air: #a4a4c4;
          --color-water: #4a7a9c;
          --font-display: 'Cormorant Garamond', serif;
          --font-mono: 'JetBrains Mono', monospace;
          --transition-slow: 1.2s cubic-bezier(0.16, 1, 0.3, 1);
          --transition-medium: 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          --transition-fast: 0.3s ease;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .ritual-container {
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: var(--color-void);
          font-family: var(--font-display);
          color: var(--color-text-primary);
          position: relative;
        }

        .cosmic-canvas {
          position: absolute;
          inset: 0;
          z-index: 0;
        }

        /* ═══════════════════════════════════════════════════════════════ */
        /* TOP NAVIGATION BAR */
        /* ═══════════════════════════════════════════════════════════════ */
        .nav-bar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          z-index: 100;
          background: linear-gradient(to bottom, rgba(4, 6, 8, 0.9), transparent);
        }

        .nav-logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .nav-logo-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--color-accent-gold-dim), var(--color-accent-violet));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }

        .nav-logo-text {
          font-size: 18px;
          font-weight: 300;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--color-text-secondary);
        }

        .nav-controls {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .calm-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border: 1px solid var(--color-border);
          border-radius: 20px;
          background: rgba(26, 31, 40, 0.6);
          cursor: pointer;
          transition: var(--transition-fast);
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .calm-toggle:hover {
          border-color: var(--color-accent-gold-dim);
          background: rgba(26, 31, 40, 0.8);
        }

        .calm-toggle.active {
          border-color: var(--color-accent-gold);
          color: var(--color-accent-gold);
        }

        .calm-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--color-text-muted);
          transition: var(--transition-fast);
        }

        .calm-toggle.active .calm-indicator {
          background: var(--color-accent-gold);
          box-shadow: 0 0 8px var(--color-accent-gold);
        }

        /* ═══════════════════════════════════════════════════════════════ */
        /* MAIN LAYOUT */
        /* ═══════════════════════════════════════════════════════════════ */
        .main-content {
          position: relative;
          z-index: 10;
          display: flex;
          height: 100vh;
          padding-top: 56px;
        }

        .stage-area {
          flex: 7;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .agent-panel {
          flex: 3;
          min-width: 340px;
          max-width: 420px;
          background: linear-gradient(to bottom, rgba(10, 13, 18, 0.95), rgba(18, 22, 29, 0.95));
          border-left: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          backdrop-filter: blur(20px);
        }

        /* ═══════════════════════════════════════════════════════════════ */
        /* ORBITAL RING */
        /* ═══════════════════════════════════════════════════════════════ */
        .orbital-container {
          position: relative;
          width: min(70vw, 600px);
          height: min(70vw, 600px);
          opacity: ${phase === 'awakening' ? 0 : 1};
          transform: scale(${phase === 'awakening' ? 0.8 : 1});
          transition: opacity var(--transition-slow), transform var(--transition-slow);
        }

        .orbital-ring {
          position: absolute;
          inset: 0;
          border: 1px solid var(--color-border);
          border-radius: 50%;
          opacity: ${calmMode ? 0.3 : 0.6};
          transition: var(--transition-medium);
        }

        .orbital-ring.inner {
          inset: 15%;
          border-color: rgba(201, 169, 98, 0.2);
        }

        .orbital-ring.middle {
          inset: 30%;
          border-color: rgba(201, 169, 98, 0.15);
        }

        .orbital-ring.outer {
          inset: -5%;
          border-style: dashed;
          border-color: rgba(201, 169, 98, 0.1);
        }

        .house-markers {
          position: absolute;
          inset: 0;
        }

        .house-marker {
          position: absolute;
          width: 2px;
          height: 100%;
          left: calc(50% - 1px);
          top: 0;
          transform-origin: center;
          background: linear-gradient(to bottom, transparent, var(--color-border), transparent);
          opacity: ${calmMode ? 0.2 : 0.4};
        }

        .zodiac-ring {
          position: absolute;
          inset: -40px;
        }

        .zodiac-sign {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 40px;
          height: 40px;
          margin: -20px 0 0 -20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition-fast);
          opacity: ${calmMode ? 0.5 : 0.8};
        }

        .zodiac-sign:hover {
          opacity: 1;
          transform: scale(1.1);
        }

        .zodiac-symbol {
          font-size: 22px;
          line-height: 1;
        }

        .zodiac-sign[data-element="fire"] .zodiac-symbol { color: var(--color-fire); }
        .zodiac-sign[data-element="earth"] .zodiac-symbol { color: var(--color-earth); }
        .zodiac-sign[data-element="air"] .zodiac-symbol { color: var(--color-air); }
        .zodiac-sign[data-element="water"] .zodiac-symbol { color: var(--color-water); }

        .zodiac-name {
          font-family: var(--font-mono);
          font-size: 8px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--color-text-muted);
          margin-top: 2px;
          opacity: 0;
          transition: var(--transition-fast);
        }

        .zodiac-sign:hover .zodiac-name {
          opacity: 1;
        }

        /* ═══════════════════════════════════════════════════════════════ */
        /* PLANETARY POSITIONS */
        /* ═══════════════════════════════════════════════════════════════ */
        .planets-layer {
          position: absolute;
          inset: 15%;
        }

        .planet-marker {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 36px;
          height: 36px;
          margin: -18px 0 0 -18px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition-fast);
          z-index: 5;
        }

        .planet-marker:hover {
          z-index: 10;
        }

        .planet-glyph {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: var(--color-surface);
          border: 1px solid var(--color-accent-gold-dim);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          color: var(--color-accent-gold);
          transition: var(--transition-fast);
          box-shadow: ${calmMode ? 'none' : '0 0 15px rgba(201, 169, 98, 0.2)'};
        }

        .planet-marker:hover .planet-glyph {
          transform: scale(1.2);
          border-color: var(--color-accent-gold);
          box-shadow: 0 0 25px rgba(201, 169, 98, 0.4);
        }

        .planet-marker.selected .planet-glyph {
          background: var(--color-accent-gold);
          color: var(--color-void);
          transform: scale(1.3);
        }

        .planet-tooltip {
          position: absolute;
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          padding: 6px 12px;
          background: var(--color-elevated);
          border: 1px solid var(--color-border);
          border-radius: 4px;
          font-family: var(--font-mono);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: var(--transition-fast);
        }

        .planet-marker:hover .planet-tooltip {
          opacity: 1;
        }

        /* ═══════════════════════════════════════════════════════════════ */
        /* CENTER CORE */
        /* ═══════════════════════════════════════════════════════════════ */
        .center-core {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 120px;
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 20;
        }

        .core-ring {
          position: absolute;
          border-radius: 50%;
          border: 1px solid var(--color-accent-gold-dim);
          animation: ${calmMode ? 'none' : 'pulse 4s ease-in-out infinite'};
        }

        .core-ring:nth-child(1) {
          inset: 0;
          animation-delay: 0s;
        }

        .core-ring:nth-child(2) {
          inset: -15px;
          opacity: 0.6;
          animation-delay: 0.5s;
        }

        .core-ring:nth-child(3) {
          inset: -30px;
          opacity: 0.3;
          animation-delay: 1s;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.05); opacity: 1; }
        }

        .core-glyph {
          font-size: 32px;
          color: var(--color-accent-gold);
          z-index: 1;
          text-shadow: ${calmMode ? 'none' : '0 0 30px rgba(201, 169, 98, 0.5)'};
        }

        /* ═══════════════════════════════════════════════════════════════ */
        /* AGENT PANEL */
        /* ═══════════════════════════════════════════════════════════════ */
        .agent-header {
          padding: 20px 24px;
          border-bottom: 1px solid var(--color-border);
        }

        .agent-title {
          font-size: 14px;
          font-weight: 300;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--color-text-secondary);
        }

        .agent-subtitle {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--color-text-muted);
          margin-top: 4px;
          letter-spacing: 0.1em;
        }

        .agent-status {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 12px;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--color-accent-gold);
          animation: ${phase === 'dialogue' ? 'statusPulse 2s ease-in-out infinite' : 'none'};
        }

        @keyframes statusPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; box-shadow: 0 0 8px var(--color-accent-gold); }
        }

        .status-text {
          font-family: var(--font-mono);
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--color-text-muted);
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .messages-container::-webkit-scrollbar {
          width: 4px;
        }

        .messages-container::-webkit-scrollbar-track {
          background: transparent;
        }

        .messages-container::-webkit-scrollbar-thumb {
          background: var(--color-border);
          border-radius: 2px;
        }

        .message {
          opacity: 0;
          animation: messageIn 0.6s ease forwards;
        }

        @keyframes messageIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .message-system {
          text-align: center;
          font-family: var(--font-mono);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--color-text-muted);
          padding: 8px 0;
        }

        .message-agent {
          padding: 16px;
          background: rgba(26, 31, 40, 0.5);
          border-left: 2px solid var(--color-accent-gold-dim);
          border-radius: 0 8px 8px 0;
        }

        .message-agent-label {
          font-family: var(--font-mono);
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--color-accent-gold-dim);
          margin-bottom: 8px;
        }

        .message-agent-text {
          font-size: 15px;
          line-height: 1.7;
          font-weight: 300;
          color: var(--color-text-primary);
        }

        .message-user {
          padding: 16px;
          background: rgba(74, 144, 164, 0.15);
          border-left: 2px solid var(--color-accent-blue);
          border-radius: 0 8px 8px 0;
          align-self: flex-end;
          max-width: 85%;
        }

        .message-user-text {
          font-size: 14px;
          line-height: 1.6;
          color: var(--color-text-primary);
        }

        .message-insight {
          padding: 16px;
          background: linear-gradient(135deg, rgba(124, 82, 149, 0.2), rgba(74, 144, 164, 0.2));
          border: 1px solid rgba(124, 82, 149, 0.3);
          border-radius: 8px;
        }

        .message-insight-label {
          font-family: var(--font-mono);
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--color-accent-violet);
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .message-insight-icon {
          font-size: 12px;
        }

        .message-insight-text {
          font-size: 14px;
          line-height: 1.6;
          font-style: italic;
          color: var(--color-text-primary);
        }

        .input-area {
          padding: 20px 24px;
          border-top: 1px solid var(--color-border);
        }

        .input-wrapper {
          display: flex;
          gap: 12px;
        }

        .input-field {
          flex: 1;
          padding: 12px 16px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 8px;
          font-family: var(--font-display);
          font-size: 14px;
          color: var(--color-text-primary);
          outline: none;
          transition: var(--transition-fast);
        }

        .input-field::placeholder {
          color: var(--color-text-muted);
        }

        .input-field:focus {
          border-color: var(--color-accent-gold-dim);
        }

        .send-button {
          padding: 12px 20px;
          background: var(--color-accent-gold-dim);
          border: none;
          border-radius: 8px;
          font-family: var(--font-mono);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--color-void);
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .send-button:hover {
          background: var(--color-accent-gold);
        }

        /* ═══════════════════════════════════════════════════════════════ */
        /* INSIGHT CARD OVERLAY */
        /* ═══════════════════════════════════════════════════════════════ */
        .insight-card-overlay {
          position: fixed;
          top: 50%;
          left: 35%;
          transform: translate(-50%, -50%);
          z-index: 200;
          pointer-events: none;
          opacity: ${insightVisible ? 1 : 0};
          transition: opacity 0.8s ease;
        }

        .insight-card {
          padding: 32px 40px;
          background: linear-gradient(135deg, rgba(18, 22, 29, 0.98), rgba(26, 31, 40, 0.98));
          border: 1px solid rgba(124, 82, 149, 0.4);
          border-radius: 16px;
          max-width: 400px;
          backdrop-filter: blur(20px);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(124, 82, 149, 0.2);
          animation: ${insightVisible ? 'insightFloat 6s ease-in-out' : 'none'};
        }

        @keyframes insightFloat {
          0% { transform: translateY(20px); opacity: 0; }
          10% { transform: translateY(0); opacity: 1; }
          85% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-20px); opacity: 0; }
        }

        .insight-card-header {
          font-family: var(--font-mono);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: var(--color-accent-violet);
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .insight-card-text {
          font-size: 18px;
          line-height: 1.7;
          font-weight: 300;
          color: var(--color-text-primary);
        }

        /* ═══════════════════════════════════════════════════════════════ */
        /* PHASE OVERLAYS */
        /* ═══════════════════════════════════════════════════════════════ */
        .phase-overlay {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 300;
          background: var(--color-void);
          opacity: ${phase === 'awakening' ? 1 : 0};
          pointer-events: ${phase === 'awakening' ? 'auto' : 'none'};
          transition: opacity 1.5s ease;
        }

        .phase-text {
          font-size: 24px;
          font-weight: 300;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: var(--color-text-secondary);
          animation: phaseTextPulse 2s ease-in-out infinite;
        }

        @keyframes phaseTextPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }

        .calibration-indicator {
          position: fixed;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 100;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          opacity: ${phase === 'calibrating' ? 1 : 0};
          transition: opacity 0.8s ease;
        }

        .calibration-bar {
          width: 200px;
          height: 2px;
          background: var(--color-border);
          border-radius: 1px;
          overflow: hidden;
        }

        .calibration-progress {
          width: 0%;
          height: 100%;
          background: var(--color-accent-gold);
          animation: calibrate 3s ease-in-out forwards;
        }

        @keyframes calibrate {
          0% { width: 0%; }
          100% { width: 100%; }
        }

        .calibration-text {
          font-family: var(--font-mono);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: var(--color-text-muted);
        }

        /* ═══════════════════════════════════════════════════════════════ */
        /* RESPONSIVE */
        /* ═══════════════════════════════════════════════════════════════ */
        @media (max-width: 900px) {
          .main-content {
            flex-direction: column;
          }

          .stage-area {
            flex: none;
            height: 60vh;
          }

          .agent-panel {
            flex: 1;
            max-width: none;
            min-width: auto;
            border-left: none;
            border-top: 1px solid var(--color-border);
          }

          .orbital-container {
            width: min(85vw, 400px);
            height: min(85vw, 400px);
          }
        }
      `}</style>

      {/* COSMIC CANVAS BACKGROUND */}
      <canvas ref={canvasRef} className="cosmic-canvas" />

      {/* PHASE OVERLAY - AWAKENING */}
      <div className="phase-overlay">
        <div className="phase-text">Die Sphäre erwacht</div>
      </div>

      {/* CALIBRATION INDICATOR */}
      <div className="calibration-indicator">
        <div className="calibration-bar">
          <div className="calibration-progress" />
        </div>
        <div className="calibration-text">Koordinaten kalibrieren</div>
      </div>

      {/* NAVIGATION BAR */}
      <nav className="nav-bar">
        <div className="nav-logo">
          <div className="nav-logo-icon">✧</div>
          <div className="nav-logo-text">Ritual Space</div>
        </div>
        <div className="nav-controls">
          <button 
            className={`calm-toggle ${calmMode ? 'active' : ''}`}
            onClick={() => setCalmMode(!calmMode)}
          >
            <span className="calm-indicator" />
            Calm Mode
          </button>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="main-content">
        {/* STAGE AREA */}
        <div className="stage-area">
          <div className="orbital-container">
            {/* ORBITAL RINGS */}
            <div className="orbital-ring outer" />
            <div className="orbital-ring" />
            <div className="orbital-ring inner" />
            <div className="orbital-ring middle" />

            {/* HOUSE MARKERS */}
            <div className="house-markers">
              {Array.from({ length: 12 }).map((_, i) => (
                <div 
                  key={i} 
                  className="house-marker" 
                  style={{ transform: `rotate(${i * 30}deg)` }} 
                />
              ))}
            </div>

            {/* ZODIAC SIGNS */}
            <div className="zodiac-ring">
              {ZODIAC_SIGNS.map((sign, i) => {
                const angle = (i * 30 - 90) * (Math.PI / 180);
                const radius = 280;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                return (
                  <div
                    key={sign.name}
                    className="zodiac-sign"
                    data-element={sign.element}
                    style={{ transform: `translate(${x}px, ${y}px)` }}
                  >
                    <span className="zodiac-symbol">{sign.symbol}</span>
                    <span className="zodiac-name">{sign.name}</span>
                  </div>
                );
              })}
            </div>

            {/* PLANETS */}
            <div className="planets-layer">
              {PLANETS.map((planet) => {
                const angle = (planet.position - 90) * (Math.PI / 180);
                const radius = 120;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                return (
                  <div
                    key={planet.name}
                    className={`planet-marker ${selectedPlanet === planet.name ? 'selected' : ''}`}
                    style={{ transform: `translate(${x}px, ${y}px)` }}
                    onClick={() => setSelectedPlanet(selectedPlanet === planet.name ? null : planet.name)}
                  >
                    <div className="planet-glyph">{planet.symbol}</div>
                    <div className="planet-tooltip">{planet.name} · {planet.position}°</div>
                  </div>
                );
              })}
            </div>

            {/* CENTER CORE */}
            <div className="center-core">
              <div className="core-ring" />
              <div className="core-ring" />
              <div className="core-ring" />
              <span className="core-glyph">⊕</span>
            </div>
          </div>
        </div>

        {/* AGENT PANEL */}
        <aside className="agent-panel">
          <header className="agent-header">
            <h2 className="agent-title">Celestial Guide</h2>
            <div className="agent-subtitle">Live Agent · Audio Ready</div>
            <div className="agent-status">
              <span className="status-dot" />
              <span className="status-text">
                {phase === 'dialogue' ? 'Im Dialog' : 'Initialisiert'}
              </span>
            </div>
          </header>

          <div className="messages-container">
            {messages.map((msg) => (
              <div key={msg.id} className={`message message-${msg.type}`}>
                {msg.type === 'system' && (
                  <div className="message-system">{msg.text}</div>
                )}
                {msg.type === 'agent' && (
                  <>
                    <div className="message-agent-label">Guide</div>
                    <div className="message-agent-text">{msg.text}</div>
                  </>
                )}
                {msg.type === 'user' && (
                  <div className="message-user-text">{msg.text}</div>
                )}
                {msg.type === 'insight' && (
                  <>
                    <div className="message-insight-label">
                      <span className="message-insight-icon">◆</span>
                      Insight
                    </div>
                    <div className="message-insight-text">{msg.text}</div>
                  </>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-area">
            <div className="input-wrapper">
              <input
                type="text"
                className="input-field"
                placeholder="Stelle deine Frage an das Muster..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button className="send-button" onClick={handleSendMessage}>
                Senden
              </button>
            </div>
          </div>
        </aside>
      </main>

      {/* INSIGHT CARD OVERLAY */}
      <div className="insight-card-overlay">
        <div className="insight-card">
          <div className="insight-card-header">
            <span>◆</span> Kontrast erkannt
          </div>
          <div className="insight-card-text">{currentInsight}</div>
        </div>
      </div>
    </div>
  );
}
