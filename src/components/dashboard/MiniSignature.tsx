import { lazy, Suspense } from 'react';

const FusionRingCanvasV2 = lazy(() => import('../fusion-ring-website/FusionRingCanvasV2'));

interface MiniSignatureProps {
  natalWeights?: Record<string, number>;
  quizWeights?: Record<string, number>;
  onExpand?: () => void;
}

export default function MiniSignature({ natalWeights, quizWeights, onExpand }: MiniSignatureProps) {
  return (
    <div
      onClick={onExpand}
      className="group bg-zinc-900/40 border border-zinc-800 p-6 md:p-8 rounded-[2rem] aspect-square flex flex-col justify-between cursor-pointer active:scale-95 transition-all duration-300 hover:border-white/20"
    >
      <div className="relative w-full aspect-square rounded-full overflow-hidden bg-black/20">
        <div className="absolute inset-0 scale-125 group-hover:scale-150 transition-transform duration-1000">
          <Suspense fallback={<div className="w-full h-full bg-zinc-900/20 rounded-full animate-pulse" />}>
            <FusionRingCanvasV2
              natalWeights={natalWeights}
              quizWeights={quizWeights}
              isMini={true}
              showUI={false}
            />
          </Suspense>
        </div>

        {/* Decorative Inner Ring Overlay */}
        <div className="absolute inset-2 border border-white/5 rounded-full pointer-events-none" />

        {/* Subtle radial shadow to frame the ring */}
        <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] pointer-events-none" />
      </div>

      <div className="mt-4 flex justify-between items-center relative z-10">
        <span className="text-[10px] font-bold text-white/60 uppercase tracking-[0.15em]">Deine Form</span>
        <div className="w-5 h-5 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white/30 transition-colors">
          <span className="text-[8px] text-white/30">⤢</span>
        </div>
      </div>
    </div>
  );
}
