import { useState, useEffect } from 'react';
import OptimizedFuRing from '../components/OptimizedFuRing';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';

export default function FuRingPrototypePage() {
  const [signals, setSignals] = useState([0.8, 0.2, 0.5, 0.1, 0.9, 0.3, 0.4, 0.7, 0.6, 0.2, 0.1, 0.5]);
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
    <div className="min-h-screen bg-[#020509] text-white font-sans p-8">
      <header className="max-w-4xl mx-auto flex items-center justify-between mb-12">
        <Link to="/fu-ring" className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Fu-Ring
        </Link>
        <div className="text-right">
          <h1 className="text-xl font-serif text-[#D4AF37]">Optimized Fu-Ring Prototype</h1>
          <p className="text-[10px] uppercase tracking-widest text-white/30">Shader-Based WebGL Rendering</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative group">
            <div className="absolute -inset-20 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors" />
            <OptimizedFuRing signals={signals} size={400} />
            <div className="absolute top-0 right-0 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-[10px] font-mono text-green-400">
              {fps} FPS
            </div>
          </div>
          
          <button 
            onClick={randomize}
            className="flex items-center gap-2 px-6 py-2 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-full text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-all text-sm uppercase tracking-widest"
          >
            <RefreshCw className="w-4 h-4" />
            Randomize Data
          </button>
        </div>

        <div className="space-y-8 bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-sm">
          <div>
            <h2 className="text-sm uppercase tracking-[0.2em] text-white/60 mb-4 font-semibold">Technical Advantages</h2>
            <ul className="space-y-4 text-xs leading-relaxed text-white/40">
              <li className="flex gap-3">
                <span className="text-[#D4AF37]">✦</span>
                <span><strong>Hardware Acceleration:</strong> Uses WebGL fragment shaders to calculate every pixel in parallel on the GPU.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#D4AF37]">✦</span>
                <span><strong>No CPU Loops:</strong> Replaces the 720-step Canvas loop with a single draw call.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#D4AF37]">✦</span>
                <span><strong>Mobile-First:</strong> Low memory footprint and efficient battery usage due to optimized shader code.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#D4AF37]">✦</span>
                <span><strong>Real-time Bloom:</strong> High-quality glow effect using UnrealBloomPass, independent of drawing complexity.</span>
              </li>
            </ul>
          </div>

          <div className="pt-6 border-t border-white/10">
            <h2 className="text-sm uppercase tracking-[0.2em] text-white/60 mb-4 font-semibold">Current Signal (12 Sectors)</h2>
            <div className="grid grid-cols-6 gap-2">
              {signals.map((s, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-full h-12 bg-white/5 rounded-lg relative overflow-hidden">
                    <div 
                      className="absolute bottom-0 w-full transition-all duration-500" 
                      style={{ 
                        height: `${s * 100}%`, 
                        backgroundColor: SECTOR_COLORS_HEX[i],
                        opacity: 0.6
                      }} 
                    />
                  </div>
                  <span className="text-[8px] mt-1 font-mono opacity-30">{Math.round(s * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const SECTOR_COLORS_HEX = [
  '#E63946', '#C9A227', '#E9C46A', '#A8DADC', '#F4A261', '#6B9080',
  '#D4A5A5', '#9B2335', '#7B2D8E', '#2B2D42', '#00B4D8', '#48BFE3'
];
