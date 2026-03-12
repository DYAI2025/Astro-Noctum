export type FusionDebugEventType = 'contribution' | 'transit' | 'dual' | 'magnet_pulse';

export type FusionVisualState =
  | 'IDLE'
  | 'PRIMED'
  | 'CHARGING'
  | 'POLARIZING'
  | 'PAIRING'
  | 'STABILIZING';

export type DebugTriggerKind = 'contribution' | 'transit';

export type DebugTriggerNode = {
  id: string;
  sector: number;
  kind: DebugTriggerKind;
  strength: number;
  label: string;
};

export type DebugDisplayModes = {
  showTriggerPoints: boolean;
  showFlowLines: boolean;
  showDensityMap: boolean;
  showPairingZones: boolean;
};

export type DebugControlValues = {
  contributionStrength: number;
  transitStrength: number;
  magnetFlow: number;
  spaceDensity: number;
  pairCoherence: number;
};
