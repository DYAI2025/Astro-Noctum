
import React from 'react';

interface SigilPortraitProps {
  svg?: string;
  description?: string;
}

const SigilPortrait: React.FC<SigilPortraitProps> = ({ svg, description }) => {
  if (svg) {
    return (
      <div className="relative w-64 h-64 flex flex-col items-center justify-center animate-reveal">
         <div className="absolute inset-0 bg-gradient-to-tr from-[#22D3EE]/5 to-[#C5A059]/5 blur-3xl rounded-full" />
         <div className="w-full h-full relative z-10" dangerouslySetInnerHTML={{ __html: svg }} />
         {description && (
           <div className="absolute top-full mt-4 text-[10px] mono text-[#5A6477] text-center max-w-[200px] opacity-70">
              {description}
           </div>
         )}
      </div>
    );
  }
  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-tr from-[#22D3EE]/5 to-[#C5A059]/5 blur-3xl rounded-full" />
      
      {/* Rotating Background Ring */}
      <div className="absolute w-full h-full animate-spin-slow opacity-20">
        <svg viewBox="0 0 200 200" className="w-full h-full">
           <circle cx="100" cy="100" r="95" fill="none" stroke="#C5A059" strokeWidth="0.5" strokeDasharray="2 6" />
           <circle cx="100" cy="100" r="85" fill="none" stroke="#22D3EE" strokeWidth="0.2" />
        </svg>
      </div>

      <svg viewBox="0 0 200 200" className="w-full h-full relative z-10">
        <defs>
          <radialGradient id="centralGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#C5A059" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#C5A059" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Intricate Geometric Lattice */}
        <g opacity="0.4">
          <circle cx="100" cy="100" r="60" fill="none" stroke="#E4E4E7" strokeWidth="0.5" />
          <path d="M100,20 L180,100 L100,180 L20,100 Z" fill="none" stroke="#C5A059" strokeWidth="0.5" />
          <path d="M43,43 L157,43 L157,157 L43,157 Z" fill="none" stroke="#22D3EE" strokeWidth="0.5" transform="rotate(45 100 100)" />
          
          {/* DNA Spikes / Rays */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
            <line 
              key={deg} 
              x1="100" y1="40" x2="100" y2="10" 
              stroke="#A1A1AA" 
              strokeWidth="0.3" 
              transform={`rotate(${deg} 100 100)`} 
            />
          ))}
        </g>
        
        {/* Core Glow */}
        <circle cx="100" cy="100" r="10" fill="url(#centralGlow)" className="animate-pulse" />
        <circle cx="100" cy="100" r="6" fill="#FFFFFF" className="glow-gold" />
        
        {/* Connection Nodes */}
        <g fill="#22D3EE">
          <circle cx="100" cy="20" r="1.5" />
          <circle cx="180" cy="100" r="1.5" />
          <circle cx="100" cy="180" r="1.5" />
          <circle cx="20" cy="100" r="1.5" />
        </g>

        {/* Outer Rune Ring Elements */}
        <g fill="none" stroke="#C5A059" strokeWidth="1" opacity="0.6">
           <path d="M100,5 A95,95 0 0,1 195,100" />
           <path d="M100,195 A95,95 0 0,1 5,100" />
        </g>
      </svg>
    </div>
  );
};

export default SigilPortrait;
