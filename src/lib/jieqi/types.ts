export interface JieqiTerm {
  index: number;
  name: string;
  nameDE: string;
  longitude: number;
  approxDate: string;
}

export interface JieqiState {
  current: JieqiTerm;
  next: JieqiTerm;
  nextTransitionAt: string;
  secondsToNext: number;
  isTransitionWindow: boolean;
}
