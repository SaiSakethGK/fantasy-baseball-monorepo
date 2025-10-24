export type Position = "C" | "1B" | "2B" | "3B" | "SS" | "OF" | "UT" | "SP" | "RP";
export type BatterStats = { HR?: number; RBI?: number; R?: number; SB?: number; AVG?: number };
export type PitcherStats = { W?: number; SV?: number; K?: number; ERA?: number; WHIP?: number };
export type Stats = BatterStats & PitcherStats;

export interface Player {
  id: string;
  name: string;
  team: string;
  position: Position;
  stats: Stats;
}

export interface Team {
  userId: string;
  name: string;
  picks: string[]; // player ids
  points: number;
}

export interface DraftState {
  isActive: boolean;
  onTheClockUserId?: string;
  pickEndsAt?: number; // epoch ms
  pickSeconds: number;
  order: string[];
}
