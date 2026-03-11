import { useState, useEffect } from 'react';
import OptimizedFuRing from '../components/OptimizedFuRing';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Zap, Activity, Waves, Wind } from 'lucide-react';

type RingMode = 'normal' | 'divergence' | 'equilibrium' | 'transit';

export default function FuRingPrototypePage() {
  const [signals, setSignals] = useState([0.8, 0.2, 0.5, 0.1, 0.9, 0.3, 0.4, 0.7, 0.6, 0.2, 0.1, 0.5]);
  const [mode, setMode] = useState<RingMode>('normal');
  const [fps, setFps] = useState(0);

  // FPS Counter
  useEffect(() => {
    let lastTime = performance.now();
    let frames = 0;
    let raf: number;
    const loop = () => {
      frames++;
      const now = performance.now();
      if (now >= lastTime + 1000) {
        setFps(Math.round((frames * 1000) / (now - lastTime)));
        frames = 0;
        lastTime = now;
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, []);

  const randomize = () => {
    setSignals(Array.from({ length: 12 }, () => Math.random()));
  };

  return (
    <div className="min-h-screen bg-[#020509] text-white font-sans p-8 selection:bg-[#D4AF37]/30">
      <header className="max-w-6xl mx-auto flex items-center justify-between mb-12">
        <Link to="/fu-ring" className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Fu-Ring
        </Link>
        <div className="text-right">
          <h1 className="text-xl font-serif text-[#D4AF37]">Advanced Fu-Ring Anatomie</h1>
          <p className="text-[10px] uppercase tracking-widest text-white/30">Three.js Multi-Layer Shader Engine</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left: Visualization */}
        <div className="lg:col-span-7 flex flex-col items-center gap-8">
          <div className="relative group">
            {/* Glow Aura */}
            <div className={`absolute -inset-24 rounded-full blur-[100px] transition-all duration-1000 opacity-20 ${
              mode === 'divergence' ? 'bg-red-500' : 
              mode === 'equilibrium' ? 'bg-blue-400' : 
              mode === 'transit' ? 'bg-emerald-400' : 'bg-[#D4AF37]'
            }`} />
            
            <div className="relative z-10 bg-black/40 rounded-full p-4 backdrop-blur-xl border border-white/5 shadow-2xl">
              <OptimizedFuRing signals={signals} size={500} mode={mode} />
            </div>

            {/* Floating Stats */}
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-[10px] font-mono text-green-400 z-20">
              {fps} FPS
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest text-[#D4AF37] z-20">
              Current Mode: {mode}
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <button onClick={randomize} className="flex items-center gap-2 px-6 py-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all text-[10px] uppercase tracking-widest">
              <RefreshCw className="w-3 h-3" /> Randomize Data
            </button>
          </div>
        </div>

        {/* Right: Controls & Info */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-md space-y-8">
            <div>
              <h2 className="text-xs uppercase tracking-[0.25em] text-white/40 mb-6 font-bold">Trigger Anatomical States</h2>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setMode('normal')}
                  className={`flex items-center gap-3 px-4 py-4 rounded-2xl border transition-all text-left ${mode === 'normal' ? 'bg-[#D4AF37]/20 border-[#D4AF37]/50 text-[#D4AF37]' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                >
                  <Activity className="w-5 h-5" />
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider">Soulprint</div>
                    <div className="text-[9px] opacity-50">Standard State</div>
                  </div>
                </button>

                <button 
                  onClick={() => setMode('divergence')}
                  className={`flex items-center gap-3 px-4 py-4 rounded-2xl border transition-all text-left ${mode === 'divergence' ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                >
                  <Zap className="w-5 h-5" />
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider">Divergence</div>
                    <div className="text-[9px] opacity-50">Crystalline Spikes</div>
                  </div>
                </button>

                <button 
                  onClick={() => setMode('equilibrium')}
                  className={`flex items-center gap-3 px-4 py-4 rounded-2xl border transition-all text-left ${mode === 'equilibrium' ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                >
                  <Waves className="w-5 h-5" />
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider">Equilibrium</div>
                    <div className="text-[9px] opacity-50">30d Mean Line</div>
                  </div>
                </button>

                <button 
                  onClick={() => setMode('transit')}
                  className={`flex items-center gap-3 px-4 py-4 rounded-2xl border transition-all text-left ${mode === 'transit' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                >
                  <Wind className="w-5 h-5" />
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider">Transit Flow</div>
                    <div className="text-[9px] opacity-50">Noise & Color</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10 space-y-4">
              <h2 className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold">Anatomical Components</h2>
              <ul className="space-y-3 text-[10px] leading-relaxed text-white/40">
                <li className="flex gap-3"><span className="text-[#D4AF37]">01</span> <span><strong>Eroded Base:</strong> Dynamic noise-distorted edge (Layer 1).</span></li>
                <li className="flex gap-3"><span className="text-[#D4AF37]">02</span> <span><strong>Korona:</strong> Pulsing particle strands at signal peaks (Layer 3).</span></li>
                <li className="flex gap-3"><span className="text-[#D4AF37]">03</span> <span><strong>Spike Mechanics:</strong> High-frequency eruptions triggered by transits (Layer 4).</span></li>
                <li className="flex gap-3"><span className="text-[#D4AF37]">04</span> <span><strong>Equilibrium:</strong> The dashed reference line for energy variance (Layer 5).</span></li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
