interface LeviOrbProps {
  onActivate?: () => void;
  isListening?: boolean;
}

export default function LeviOrb({ onActivate, isListening = false }: LeviOrbProps) {
  return (
    <div
      onClick={onActivate}
      className="group relative cursor-pointer active:scale-95 transition-transform duration-300"
    >
      <div className="bg-zinc-900/40 border border-zinc-800 p-6 md:p-8 rounded-[2rem] aspect-square flex flex-col justify-between overflow-hidden">
        <div className="relative w-full aspect-square">
          {/* Main Glow */}
          <div className={`absolute inset-0 bg-blue-500/20 rounded-full blur-[40px] transition-opacity duration-1000 ${isListening ? 'opacity-100 animate-pulse' : 'opacity-40 group-hover:opacity-60'}`} />

          {/* Core Orb */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-2/3 h-2/3">
              {/* Outer Ring */}
              <div className="absolute inset-0 rounded-full border border-blue-400/20 group-hover:border-blue-400/40 transition-colors" />

              {/* Inner Pulsing Orb */}
              <div className={`absolute inset-4 rounded-full bg-gradient-to-tr from-blue-600 via-cyan-400 to-white shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all duration-700 ${isListening ? 'scale-110 blur-[2px]' : 'scale-100'}`} />

              {/* Spinning Light Streak */}
              <div className="absolute inset-0 animate-spin" style={{ animationDuration: '4s' }}>
                <div className="absolute top-0 left-1/2 -ml-1 w-2 h-2 rounded-full bg-white opacity-40 blur-[1px]" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center relative z-10">
          <span className="text-[10px] font-bold text-blue-400/80 uppercase tracking-[0.15em]">Levi Fragen</span>
          <div className="flex gap-1">
            <div className={`w-1 h-3 rounded-full bg-blue-500/50 ${isListening ? 'animate-bounce' : ''}`} style={{ animationDelay: '0s' }} />
            <div className={`w-1 h-3 rounded-full bg-blue-500/50 ${isListening ? 'animate-bounce' : ''}`} style={{ animationDelay: '0.1s' }} />
            <div className={`w-1 h-3 rounded-full bg-blue-500/50 ${isListening ? 'animate-bounce' : ''}`} style={{ animationDelay: '0.2s' }} />
          </div>
        </div>
      </div>

      {/* Background Reflection */}
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-2 bg-blue-500/20 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
