import type {
  DebugControlValues,
  DebugDisplayModes,
  FusionDebugEventType,
  FusionVisualState,
} from './testFieldTypes';

type RuntimeReadout = {
  effectiveMagnetFlow: number;
  effectiveSpaceDensity: number;
  pairDistance: number;
  dischargeFrequency: number;
};

type TestControlPanelProps = {
  isCollapsed: boolean;
  visualState: FusionVisualState;
  activeEventType: FusionDebugEventType | null;
  controls: DebugControlValues;
  displayModes: DebugDisplayModes;
  runtime: RuntimeReadout;
  onToggleCollapsed: () => void;
  onTriggerContribution: () => void;
  onTriggerTransit: () => void;
  onTriggerDual: () => void;
  onPulseMagnetism: () => void;
  onResetField: () => void;
  onControlChange: (key: keyof DebugControlValues, value: number) => void;
  onDisplayModeToggle: (key: keyof DebugDisplayModes) => void;
};

const sliderDefs: Array<{ key: keyof DebugControlValues; label: string }> = [
  { key: 'contributionStrength', label: 'Contribution Strength' },
  { key: 'transitStrength', label: 'Transit Strength' },
  { key: 'magnetFlow', label: 'Magnet Flow' },
  { key: 'spaceDensity', label: 'Space Density' },
  { key: 'pairCoherence', label: 'Pair Coherence' },
];

const displayModeDefs: Array<{ key: keyof DebugDisplayModes; label: string }> = [
  { key: 'showTriggerPoints', label: 'Show Trigger Points' },
  { key: 'showFlowLines', label: 'Show Flow Lines' },
  { key: 'showDensityMap', label: 'Show Density Map' },
  { key: 'showPairingZones', label: 'Show Pairing Zones' },
];

const formatPercent = (value: number): string => `${Math.round(value * 100)}%`;

export const TestControlPanel = ({
  isCollapsed,
  visualState,
  activeEventType,
  controls,
  displayModes,
  runtime,
  onToggleCollapsed,
  onTriggerContribution,
  onTriggerTransit,
  onTriggerDual,
  onPulseMagnetism,
  onResetField,
  onControlChange,
  onDisplayModeToggle,
}: TestControlPanelProps) => {
  return (
    <div className="pointer-events-auto absolute bottom-4 right-4 z-20 w-[min(26rem,92vw)] rounded-2xl border border-white/20 bg-black/75 p-3 text-xs text-white/85 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37]">Fusion Test Panel</div>
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="rounded-full border border-white/25 bg-black/55 px-3 py-1 text-[10px] uppercase tracking-[0.15em] text-white/80 transition hover:border-[#D4AF37]/60 hover:text-[#D4AF37]"
        >
          {isCollapsed ? 'Open' : 'Collapse'}
        </button>
      </div>

      {!isCollapsed ? (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/80">
            <span className="rounded-full border border-white/15 bg-white/5 px-2 py-1">
              State: <span className="text-[#D4AF37]">{visualState}</span>
            </span>
            <span className="rounded-full border border-white/15 bg-white/5 px-2 py-1">
              Event: <span className="text-[#8BD3FF]">{activeEventType ?? 'none'}</span>
            </span>
          </div>

          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
            <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-white/65">A. Event Trigger</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onTriggerContribution}
                className="rounded-lg border border-[#D4AF37]/45 bg-[#D4AF37]/10 px-2.5 py-1.5 text-left text-[11px] text-[#F4D67F] transition hover:bg-[#D4AF37]/15"
              >
                Trigger Contribution
              </button>
              <button
                type="button"
                onClick={onTriggerTransit}
                className="rounded-lg border border-[#7FD6FF]/45 bg-[#7FD6FF]/10 px-2.5 py-1.5 text-left text-[11px] text-[#A8E3FF] transition hover:bg-[#7FD6FF]/15"
              >
                Trigger Transit
              </button>
              <button
                type="button"
                onClick={onTriggerDual}
                className="rounded-lg border border-[#C89CFF]/45 bg-[#C89CFF]/10 px-2.5 py-1.5 text-left text-[11px] text-[#DDC3FF] transition hover:bg-[#C89CFF]/15"
              >
                Trigger Dual Event
              </button>
              <button
                type="button"
                onClick={onPulseMagnetism}
                className="rounded-lg border border-[#4DE6BE]/45 bg-[#4DE6BE]/10 px-2.5 py-1.5 text-left text-[11px] text-[#8DF3DA] transition hover:bg-[#4DE6BE]/15"
              >
                Pulse Magnetism
              </button>
            </div>
            <button
              type="button"
              onClick={onResetField}
              className="mt-2 w-full rounded-lg border border-white/15 bg-black/45 px-2.5 py-1.5 text-[11px] text-white/80 transition hover:border-white/40"
            >
              Reset Field
            </button>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
            <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-white/65">B. Live Controls</div>
            <div className="space-y-2.5">
              {sliderDefs.map((slider) => (
                <label key={slider.key} className="block">
                  <div className="mb-1 flex items-center justify-between text-[11px] text-white/80">
                    <span>{slider.label}</span>
                    <span className="tabular-nums text-[#D4AF37]">{controls[slider.key]}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={controls[slider.key]}
                    onChange={(event) => onControlChange(slider.key, Number(event.target.value))}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/20"
                    aria-label={slider.label}
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
            <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-white/65">C. Display Modes</div>
            <div className="grid grid-cols-2 gap-1.5">
              {displayModeDefs.map((mode) => (
                <label key={mode.key} className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/25 px-2 py-1.5 text-[11px] text-white/80">
                  <input
                    type="checkbox"
                    checked={displayModes[mode.key]}
                    onChange={() => onDisplayModeToggle(mode.key)}
                    className="h-3.5 w-3.5 rounded border-white/25 bg-black/40"
                    aria-label={mode.label}
                  />
                  <span>{mode.label}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5 text-[10px] uppercase tracking-[0.14em] text-white/65">
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              <span>Magnet Runtime: <strong className="text-[#8DF3DA]">{formatPercent(runtime.effectiveMagnetFlow)}</strong></span>
              <span>Density Runtime: <strong className="text-[#8BD3FF]">{formatPercent(runtime.effectiveSpaceDensity)}</strong></span>
              <span>Pair Distance: <strong className="text-[#F4D67F]">{runtime.pairDistance.toFixed(2)}</strong></span>
              <span>Discharge: <strong className="text-[#DDC3FF]">{formatPercent(runtime.dischargeFrequency)}</strong></span>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
};
