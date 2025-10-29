declare global {
  interface ImportMetaEnv {
    VITE_API_BASE?: string;
    [key: string]: string | undefined;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:5174";

export async function apiGet<T>(path: string): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`);
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json() as Promise<T>;
}

export async function apiPost<T = any>(path: string, body?: unknown): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json() as Promise<T>;
}

export type Position = "C" | "1B" | "2B" | "3B" | "SS" | "OF" | "UT" | "SP" | "RP";
export type Stats = Record<string, number>;
export type Player = { id: string; name: string; team: string; position: Position; stats: Stats };
export type TeamItem = { id: string; name: string; position: Position; team: string; points: number };
export type TeamResp = { userId: string; teamName: string; totalPoints: number; players: TeamItem[] };
export type DraftState = {
  isActive: boolean;
  onTheClockUserId?: string;
  pickEndsAt?: number;
  pickSeconds: number;
  order: string[];
  draftedIds?: string[];
  positionLimits?: Record<string, number>;
};

