'use client';

import dynamic from 'next/dynamic';

const FusionRingCanvas = dynamic(() => import('./fusion-ring-canvas'), {
  ssr: false,
  loading: () => (
    <div className="w-screen h-screen bg-black flex items-center justify-center">
      <div className="relative">
        <div className="w-32 h-32 rounded-full border border-cyan-900/30 animate-pulse" />
        <div className="absolute inset-0 w-32 h-32 rounded-full border border-cyan-800/20 animate-spin" style={{ animationDuration: '3s' }} />
      </div>
    </div>
  ),
});

export default function FusionRingScene() {
  return <FusionRingCanvas />;
}
