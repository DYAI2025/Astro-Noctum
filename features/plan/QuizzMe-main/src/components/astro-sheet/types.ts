import type { BaZiData } from './model';

export interface Stat {
  label: string;
  value: number; // 0-100
  suffix?: string;
}

export interface UserProfile {
  name: string;
  level: number;
  status: string;
}

export interface Badge {
  label: string;
  type: 'western' | 'bazi';
  subType?: 'sun' | 'moon' | 'rising';
  signKey?: string;
  icon?: string;
}

export interface MasterIdentity {
  tierkreis: string;
  monatstier: string;
  tagestier: string;
  stundenMeister: string;
  element: string;
  animal?: string;
  konstellation: {
    sun: string;
    moon: string;
    rising: string;
  };
  bedeutung: string;
  symbol?: {
    svg: string;
    description: string;
  };
  bazi?: BaZiData | null;
}

export interface QuizItem {
  id: string;
  title: string;
  status: 'completed' | 'in_progress';
  progress?: number;
  recommendation?: string;
}

export interface Agent {
  id: string;
  name: string;
  type: string;
  description: string;
  premium?: boolean;
}
