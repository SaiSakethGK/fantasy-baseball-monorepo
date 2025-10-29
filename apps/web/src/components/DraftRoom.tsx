import { useState, useEffect, useMemo, useRef } from 'react';
import {
  apiGet,
  apiPost,
  type Player as ApiPlayer,
  type TeamResp,
  type DraftState,
} from '../lib/api';
import { ArrowLeft, Clock, User, Plus, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import type { Page } from '../App';
import Leaderboard from './Leaderboard';
import TopScorers from './TopScorers';
import SuggestedPick from './SuggestedPick';
import { ListOrdered, Users } from 'lucide-react';


interface DraftRoomProps {
  onNavigate: (page: Page) => void;
  userTeamName: string;
}

interface Player {
  id: string;
  name: string;
  team: string;
  position: string;
  adp: number;
  projectedPoints: number;
}

const LOW_TIME_THRESHOLD = 10;
const POSITIONS = ['C', '1B', '2B', '3B', 'SS', 'OF', 'SP', 'RP', 'UT'];

function scoreStats(stats: Record<string, number>): number {
  let pts = 0;
  if (stats.HR) pts += stats.HR * 4;
  if (stats.RBI) pts += stats.RBI * 1;
  if (stats.R) pts += stats.R * 1;
  if (stats.SB) pts += stats.SB * 2;
  if (typeof stats.AVG === 'number') pts += stats.AVG * 10;
  if (stats.W) pts += stats.W * 5;
  if (stats.SV) pts += stats.SV * 5;
  if (stats.K) pts += stats.K * 1;
  if (typeof stats.ERA === 'number') pts += Math.max(0, 4.0 - stats.ERA) * 2;
  if (typeof stats.WHIP === 'number') pts += Math.max(0, 1.3 - stats.WHIP) * 5;
  return Math.round(pts * 100) / 100;
}

export function DraftRoom({ onNavigate }: DraftRoomProps) {
  const [activeUserId] = useState<string>('u1');

  const [apiPlayers, setApiPlayers] = useState<ApiPlayer[]>([]);
  const displayPlayers: Player[] = useMemo(() => {
    return apiPlayers.map((p, idx) => ({
      id: String(p.id),
      name: p.name,
      team: p.team,
      position: p.position,
      adp: idx + 1,
      projectedPoints: scoreStats(p.stats as Record<string, number>),
    }));
  }, [apiPlayers]);

  const [team, setTeam] = useState<TeamResp | null>(null);
  const [draftState, setDraftState] = useState<DraftState | null>(null);
  const [order, setOrder] = useState<string[]>([]);
  const [userNameById, setUserNameById] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPosition, setFilterPosition] = useState<string>('ALL');
  const [queue, setQueue] = useState<Player[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [openSettings, setOpenSettings] = useState(false);
  const [formPickSeconds, setFormPickSeconds] = useState<number>(20);
  const [formAutoPick, setFormAutoPick] = useState<boolean>(true);
  const [formEnforceLimits, setFormEnforceLimits] = useState<boolean>(true);

  const [formLimits, setFormLimits] = useState<Record<string, number>>({
    C: 1,
    '1B': 1,
    '2B': 1,
    '3B': 1,
    SS: 1,
    OF: 3,
    SP: 2,
    RP: 1,
    UT: 2,
  });

  const [formAllowRemoveAnytime, setFormAllowRemoveAnytime] = useState<boolean>(true);
  const [inlineStatus, setInlineStatus] = useState<string | null>(null);
  const [inlineWarn, setInlineWarn] = useState<boolean>(false);
  const statusTimerRef = useRef<number | null>(null);

  const myDraftedIds = useMemo(
    () => new Set((team?.players ?? []).map((p: any) => String(p.id))),
    [team?.players]
  );

  const globalDraftedIds = useMemo(
    () => new Set<string>(((draftState as any)?.draftedIds ?? []).map(String)),
    [draftState]
  );

  const positionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of (team?.players ?? []) as any[]) {
      counts[p.position] = (counts[p.position] ?? 0) + 1;
    }
    return counts;
  }, [team?.players]);

  const teamPoints = useMemo(() => {
    const items = (team?.players ?? []) as any[];
    const sum = items.reduce((acc, it) => {
      if (typeof it?.points === 'number') return acc + it.points;
      if (it?.stats) return acc + scoreStats(it.stats as Record<string, number>);
      return acc;
    }, 0);
    return Math.round(sum * 100) / 100;
  }, [team?.players]);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(iv);
  }, []);

  const secondsLeft = useMemo(() => {
    if (!draftState?.pickEndsAt) return 0;
    const ms = (draftState as any).pickEndsAt - now;
    return ms > 0 ? Math.ceil(ms / 1000) : 0;
  }, [draftState?.pickEndsAt, now]);

  function toPlayerLike(qItem: any, idx: number): Player {
    return {
      id: String(qItem.id),
      name: qItem.name,
      team: qItem.team,
      position: qItem.position,
      adp: idx + 1,
      projectedPoints: 0,
    };
  }

  async function loadQueueFromServer() {
    try {
      const res = await apiGet<{ userId: string; queue: any[] }>(`/api/queue/${activeUserId}`);
      const asPlayers = (res?.queue ?? []).map((q, i) => toPlayerLike(q, i));
      setQueue(asPlayers);
    } catch {
    }
  }

  async function saveQueueToServer(nextQueue: Player[]) {
    const ids = nextQueue.map((p) => p.id);
    try {
      await apiPost('/api/queue/set', { userId: activeUserId, playerIds: ids });
    } catch {
    }
  }

  useEffect(() => {
    const next = queue.filter(p => !globalDraftedIds.has(p.id));
    if (next.length !== queue.length) {
      setQueue(next);
      saveQueueToServer(next);
    }
  }, [globalDraftedIds]);

  useEffect(() => {
    (async () => {
      try {
        const [ps, st, allTeams] = await Promise.all([
          apiGet<ApiPlayer[]>('/api/players'),
          apiGet<DraftState>('/api/draft/state'),
          apiGet<{ userId: string; name: string; points: number }[]>('/api/teams').catch(() => []),
        ]);
        setApiPlayers(ps);
        setDraftState(st);
        setFormPickSeconds((st as any).pickSeconds ?? 20);
        setFormAutoPick((st as any).autoPick ?? true);
        setOrder(((st as any).order as string[]) ?? []);
        setUserNameById(Object.fromEntries(allTeams.map((t) => [t.userId, t.name])));

        setFormEnforceLimits(!!(st as any)?.enforceLimits);
        setFormLimits((prev) => ({ ...prev, ...((st as any)?.positionLimits ?? {}) }));
        setFormAllowRemoveAnytime(!!(st as any)?.allowRemoveAnytime);

        try {
          setTeam(await apiGet<TeamResp>(`/api/team/${activeUserId}`));
        } catch {
          setTeam(null);
        }

        await loadQueueFromServer();
      } catch (e: any) {
        setError(String(e?.message ?? e));
      }
    })();
  }, []);

  useEffect(() => {
    const iv = setInterval(async () => {
      try {
        await apiPost('/api/draft/tick', {});
        const [st, t, allTeams] = await Promise.all([
          apiGet<DraftState>('/api/draft/state'),
          apiGet<TeamResp>(`/api/team/${activeUserId}`).catch(() => null),
          apiGet<{ userId: string; name: string; points: number }[]>('/api/teams').catch(() => []),
        ]);
        setDraftState(st);
        setTeam(t);
        setOrder(((st as any).order as string[]) ?? []);
        if (allTeams.length) {
          setUserNameById(Object.fromEntries(allTeams.map((x) => [x.userId, x.name])));
        }

        await loadQueueFromServer();
      } catch {}
    }, 1000);
    return () => clearInterval(iv);
  }, [activeUserId]);

  const [wasOnClock, setWasOnClock] = useState(false);
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);
  useEffect(() => {
    const nowOnClock = (draftState as any)?.onTheClockUserId === activeUserId;
    if (nowOnClock && !wasOnClock) {
      new Audio('/sounds/on-the-clock.mp3').play().catch(() => {});
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification("You're on the clock!", {
          body: `Make your pick. ${secondsLeft}s remaining.`,
        });
      }
    }
    setWasOnClock(nowOnClock);
  }, [(draftState as any)?.onTheClockUserId, activeUserId, wasOnClock, secondsLeft]);

  const lastEventIdRef = useRef<string | null>(null);
  useEffect(() => {
    const ev = (draftState as any)?.lastEvent as
      | {
          type: 'PICK' | 'AUTOPICK' | 'SKIPPED';
          userId: string;
          player?: { name: string; team: string; position: string; id: string };
        }
      | undefined;

    const key = ev ? `${ev.type}:${ev.userId}:${ev.player?.id ?? ''}` : null;
    if (!ev || ev.userId !== activeUserId) return;
    if (key && key !== lastEventIdRef.current) {
      lastEventIdRef.current = key;

      if (statusTimerRef.current) window.clearTimeout(statusTimerRef.current);

      if (ev.type === 'AUTOPICK' && ev.player) {
        setInlineStatus(`Auto-drafted: ${ev.player.name} (${ev.player.position}, ${ev.player.team})`);
        setInlineWarn(true);
        new Audio('/sounds/autopick.mp3').play().catch(() => {});
      } else if (ev.type === 'SKIPPED') {
        setInlineStatus('Your pick was skipped (timer expired).');
        setInlineWarn(true);
      } else if (ev.type === 'PICK' && ev.player) {
        setInlineStatus(`You drafted: ${ev.player.name} (${ev.player.position}, ${ev.player.team})`);
        setInlineWarn(false);
      } else {
        setInlineStatus('Update on your pick.');
        setInlineWarn(false);
      }

      statusTimerRef.current = window.setTimeout(() => {
        setInlineStatus(null);
        setInlineWarn(false);
      }, 5000);
    }
  }, [draftState, activeUserId]);

  async function handleDraftPlayer(p: Player) {
    try {
      await apiPost('/api/draft/pick', { userId: activeUserId, playerId: p.id });
      const t = await apiGet<TeamResp>(`/api/team/${activeUserId}`);
      setTeam(t);
      // Also drop from queue locally and server-side if present
      const nextQueue = queue.filter((x) => x.id !== p.id);
      setQueue(nextQueue);
      saveQueueToServer(nextQueue);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    }
  }

  async function removeFromTeam(p: Player) {
    try {
      await apiPost('/api/draft/remove', { userId: activeUserId, playerId: p.id });
      const t = await apiGet<TeamResp>(`/api/team/${activeUserId}`);
      setTeam(t);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    }
  }

  function addToQueue(p: Player) {
    if (queue.find((x) => x.id === p.id)) return;
    if (globalDraftedIds.has(p.id)) return;

    const next = [...queue, p];
    setQueue(next);
    saveQueueToServer(next);
  }

  async function saveSettings() {
    try {
      await apiPost('/api/draft/settings', {
        pickSeconds: Number(formPickSeconds),
        autoPick: formAutoPick,
        enforceLimits: formEnforceLimits,
        positionLimits: formLimits,
        allowRemoveAnytime: formAllowRemoveAnytime,
      });
      const st = await apiGet<DraftState>('/api/draft/state');
      setDraftState(st);
      setOpenSettings(false);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    }
  }

  async function resetDraftAll() {
    try {
      await apiPost('/api/draft/reset', {});
      const [st, t] = await Promise.all([
        apiGet<DraftState>('/api/draft/state'),
        apiGet<TeamResp>(`/api/team/${activeUserId}`).catch(() => null),
      ]);
      setDraftState(st);
      setTeam(t);
      setOpenSettings(false);
      await loadQueueFromServer();
    } catch (e: any) {
      setError(String(e?.message ?? e));
    }
  }

  const filteredPlayers = displayPlayers
    .filter((p) => filterPosition === 'ALL' || p.position === filterPosition)
    .filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.team.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const teamsCount = order.length || 8;
  const totalRounds = (draftState as any)?.totalRounds ?? 15;
  const totalPicks = Math.max(1, teamsCount * totalRounds);

  const completedPicks = ((draftState as any)?.draftedIds?.length ?? 0) as number;
  const currentPickStable = Math.min(draftState?.isActive ? completedPicks + 1 : completedPicks, totalPicks);
  const currentRound = Math.min(Math.max(1, Math.floor((currentPickStable - 1) / teamsCount) + 1), totalRounds);

  const onClockUserId = (draftState as any)?.onTheClockUserId as string | undefined;
  const isUserPick = !!onClockUserId && onClockUserId === activeUserId;
  const currentTeamName = (onClockUserId && userNameById[onClockUserId]) || (onClockUserId ?? '—');

  function disabledByPositionLimit(p: Player) {
    const enforce = !!(draftState as any)?.enforceLimits;
    if (!enforce) return false;
    const limits = ((draftState as any)?.positionLimits ?? {}) as Record<string, number>;
    const limit = limits[p.position];
    if (typeof limit !== 'number' || limit <= 0) return false;
    const curr = positionCounts[p.position] ?? 0;
    return curr >= limit;
  }

  const eligiblePlayers = useMemo(() => {
    return displayPlayers
      .filter((p) => !globalDraftedIds.has(p.id))
      .filter((p) => !disabledByPositionLimit(p))
      .sort((a, b) => b.projectedPoints - a.projectedPoints);
  }, [displayPlayers, globalDraftedIds, draftState, positionCounts]);

  function isActionDisabled(p: Player) {
    const alreadyTaken = globalDraftedIds.has(p.id);
    const byLimit = disabledByPositionLimit(p);
    return alreadyTaken || !isUserPick || byLimit;
  }

  if (openSettings) {
    return (
      <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl">
        {/* Top bar */}
        <div className="border-b border-border bg-card/60 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => setOpenSettings(false)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h2 className="text-base font-semibold">Draft Settings</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setOpenSettings(false)}>
                Cancel
              </Button>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={saveSettings}>
                Save
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid md:grid-cols-2 gap-4">
            {/* General */}
            <Card className="p-4">
              <h3 className="text-base mb-3">General</h3>

              <div className="space-y-5">
                <div>
                  <label className="block mb-1 text-sm">Pick Timer (seconds)</label>
                  <Input
                    type="number"
                    min={5}
                    max={600}
                    value={formPickSeconds}
                    onChange={(e) => setFormPickSeconds(Number(e.target.value))}
                    className="h-9"
                  />
                  <p className="text-muted-foreground text-xs mt-1">Applies immediately and restarts the current timer.</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <div>Auto-pick on timeout</div>
                    <div className="text-muted-foreground text-xs">If off, the turn is skipped on timeout.</div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className={formAutoPick ? 'border-emerald-600 text-emerald-700' : ''}
                    onClick={() => setFormAutoPick((v) => !v)}
                  >
                    {formAutoPick ? 'On' : 'Off'}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <div>Allow remove (undo) anytime</div>
                    <div className="text-muted-foreground text-xs">If off, players can only remove during their own turn.</div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className={formAllowRemoveAnytime ? 'border-emerald-600 text-emerald-700' : ''}
                    onClick={() => setFormAllowRemoveAnytime((v) => !v)}
                  >
                    {formAllowRemoveAnytime ? 'On' : 'Off'}
                  </Button>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px w-full bg-border my-4" />

              {/* Danger Zone */}
              <div>
                <h4 className="text-base mb-3 text-destructive">Danger Zone</h4>
                <div className="space-y-3">
                  <Button size="sm" variant="destructive" onClick={resetDraftAll}>
                    Reset Entire Draft
                  </Button>
                  <p className="text-muted-foreground text-xs">Clears all teams’ picks and restarts at pick #1.</p>
                </div>
              </div>
            </Card>

            {/* Roster Limits */}
            <Card className="p-4">
              <h3 className="text-base mb-3">Roster Limits</h3>

              <div className="flex items-center justify-between mb-3">
                <div className="text-sm">
                  <div>Enforce roster limits</div>
                  <div className="text-muted-foreground text-xs">If off, teams can draft any number of each position.</div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className={formEnforceLimits ? 'border-emerald-600 text-emerald-700' : ''}
                  onClick={() => setFormEnforceLimits((v) => !v)}
                >
                  {formEnforceLimits ? 'On' : 'Off'}
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {POSITIONS.map((pos) => (
                  <div key={pos} className="flex items-center gap-2">
                    <Badge variant="outline" className="w-10 justify-center">
                      {pos}
                    </Badge>
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      value={(formLimits[pos] ?? 0).toString()}
                      onChange={(e) => {
                        const v = Math.max(0, Math.min(10, Number(e.target.value || 0)));
                        setFormLimits((prev) => ({ ...prev, [pos]: v }));
                      }}
                      className="h-8 w-16"
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
              <p className="text-muted-foreground text-xs mt-2">0 means unlimited; leave as 0 to not enforce a position.</p>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Top row: Back + Settings */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => onNavigate('home')} className="mb-2">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setOpenSettings(true)}
                title="Settings"
                className="flex items-center gap-2"
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </Button>
            </div>
          </div>

          {/* Title (left) | Time Remaining or Waiting (center) | Inline Status (right) */}
          <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 mt-3">
            {/* Left: Title */}
            <div>
              <h1>Demo Draft - Round {currentRound}</h1>
              <p className="text-muted-foreground">Pick {currentPickStable} of {totalPicks}</p>
            </div>

            {/* Center */}
            <div className="flex items-center justify-center">
              <div className="text-center">
                {isUserPick ? (
                  <>
                    <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                      <Clock className="w-4 h-4" />
                      <span>Time Remaining</span>
                    </div>
                    <div
                      className={[
                        'font-extrabold text-5xl leading-none tracking-tight',
                        secondsLeft <= LOW_TIME_THRESHOLD ? 'text-red-600' : 'text-emerald-600',
                        secondsLeft <= LOW_TIME_THRESHOLD ? 'animate-pulse' : '',
                      ].join(' ')}
                    >
                      {secondsLeft}s
                    </div>
                  </>
                ) : (
                  <div className="text-lg font-medium text-muted-foreground">Waiting for your turn...</div>
                )}
              </div>
            </div>

            {/* Right: Inline status */}
            <div className="flex items-center justify-end">
              {inlineStatus ? (
                <span className={inlineWarn ? 'text-amber-700 font-semibold' : 'text-emerald-700 font-medium'}>
                  {inlineStatus}
                </span>
              ) : (
                <span className="text-muted-foreground text-sm"> </span>
              )}
            </div>
          </div>

          {error && <div className="text-destructive mt-2">{error}</div>}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Main Draft Board */}
          <div className="lg:col-span-2">
            {/* Suggested Pick panel (NEW) */}
            <SuggestedPick
              suggestions={eligiblePlayers.slice(0, 3)}
              isUserPick={isUserPick}
              onDraft={(p) => handleDraftPlayer(p)}
              onQueue={(p) => addToQueue(p as Player)}
              isDisabled={(p) => isActionDisabled(p as Player)}
            />

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-medium">Now Drafting </h3>
                <User className="w-5 h-5 text-muted-foreground" />
                <span className="text-emerald-700 font-medium">{currentTeamName}</span>
              </div>

              <p className="text-foreground/80 text-sm mb-[2px]">
                {isUserPick ? "It's your turn! Select a player below." : "Waiting for your turn..."}
              </p>

              <p className="text-muted-foreground text-xs leading-tight">
                You can add players to your queue anytime by clicking the{" "}
                <span className="font-semibold text-emerald-600">+</span> button.
              </p>
              {/* Player Search & Filters */}
              <div className="mb-4">
                
                <Input
                  placeholder="Search players..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mb-3"
                />
                <div className="flex gap-2 flex-wrap">
                  {['ALL', ...POSITIONS].map((pos) => (
                    <Button
                      key={pos}
                      variant={filterPosition === pos ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterPosition(pos)}
                    >
                      {pos}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Available Players */}
              <Tabs defaultValue="all">
                <TabsList>
                  <TabsTrigger value="all">All Players</TabsTrigger>
                  <TabsTrigger value="queue">My Queue ({queue.length})</TabsTrigger>
                </TabsList>

                {/* All Players list */}
                <TabsContent value="all" className="max-h-[500px] overflow-y-auto">
                  <div className="space-y-2">
                    {filteredPlayers.slice(0, 500).map((player) => {
                      const alreadyMine = myDraftedIds.has(player.id);
                      const alreadyTaken = globalDraftedIds.has(player.id);
                      const byLimit = disabledByPositionLimit(player);
                      const disabled = alreadyTaken || !isUserPick || byLimit;

                      return (
                        <div
                          key={player.id}
                          className={`flex items-center justify-between p-2 rounded-lg border border-border bg-card ${
                            alreadyTaken ? 'opacity-60' : ''
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline">{player.position}</Badge>
                              <span className="font-medium">{player.name}</span>
                              <span className="text-muted-foreground">{player.team}</span>
                              {alreadyTaken && (
                                <span className="text-xs ml-2 px-2 py-0.5 rounded bg-muted text-foreground/70">
                                  {alreadyMine ? 'Taken • You' : 'Taken'}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-4 mt-1 text-muted-foreground text-sm">
                              <span>ADP: {player.adp}</span>
                              <span>Proj: {player.projectedPoints} pts</span>
                              {byLimit && !alreadyTaken && (
                                <span className="text-destructive">limit reached for {player.position}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addToQueue(player)}
                              disabled={alreadyTaken}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleDraftPlayer(player)}
                              disabled={disabled}
                              className={
                                isUserPick && !byLimit && !alreadyTaken
                                  ? 'bg-emerald-600 hover:bg-emerald-700'
                                  : undefined
                              }
                            >
                              {alreadyTaken ? 'Taken' : byLimit ? 'Limit' : isUserPick ? 'Draft' : 'Wait'}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>

                {/* Queue */}
                <TabsContent value="queue" className="h-[50vh] overflow-y-auto pr-1">
                  {queue.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No players in queue. Click + to add players.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {queue.map((player, index) => {
                        const alreadyMine = myDraftedIds.has(player.id);
                        const alreadyTaken = globalDraftedIds.has(player.id);
                        const byLimit = disabledByPositionLimit(player);
                        const disabled = alreadyTaken || !isUserPick || byLimit;
                        return (
                          <div
                            key={player.id}
                            className={`flex items-center justify-between p-2 rounded-lg border border-border ${
                              alreadyTaken ? 'opacity-60 bg-card' : 'bg-card'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-muted-foreground w-6 text-right text-sm">#{index + 1}</span>
                              <Badge variant="outline">{player.position}</Badge>
                              <span className="font-medium">{player.name}</span>
                              {alreadyTaken && (
                                <span className="text-xs ml-2 px-2 py-0.5 rounded bg-muted text-foreground/70">
                                  {alreadyMine ? 'Taken • You' : 'Taken'}
                                </span>
                              )}
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleDraftPlayer(player)}
                              disabled={disabled}
                              className={
                                isUserPick && !byLimit && !alreadyTaken
                                  ? 'bg-emerald-600 hover:bg-emerald-700'
                                  : undefined
                              }
                            >
                              {alreadyTaken ? 'Taken' : byLimit ? 'Limit' : isUserPick ? 'Draft' : 'Wait'}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            <Leaderboard />

            {/* Draft Order */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-5">
                <ListOrdered className="w-5 h-5 text-emerald-700" />
                <h3 className="text-base">Draft Order (Snake)</h3>
              </div>
              <div className="space-y-2">
                {order.length === 0 ? (
                  <div className="text-muted-foreground text-sm">
                    No league initialized. Use the API to POST /api/league/init.
                  </div>
                ) : (
                  order.map((uid, index) => {
                    const isOnClock = (draftState as any)?.onTheClockUserId === uid;
                    return (
                      <div
                        key={uid}
                        className={`p-2 rounded border border-border ${isOnClock ? 'bg-muted' : 'bg-card'}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-sm">#{index + 1}</span>
                          <span>{userNameById[uid] ?? uid}</span>
                          {isOnClock && (
                            <span className="ml-auto text-xs text-foreground/80">On the clock</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>

            {/* Your Team */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-700" aria-hidden="true" />
                  <span>Your Team</span>
                </h3>

                <div className="text-sm text-foreground/80">
                  Total Points <span className="text-emerald-700 font-semibold">{teamPoints}</span>
                </div>
              </div>

              <div className="space-y-2">
                {(team?.players ?? []).length === 0 && (
                  <p className="text-muted-foreground text-center py-2">No picks yet</p>
                )}

                {(team?.players ?? []).map((p: any, i: number) => {
                  const allowRemoveAnytime = !!(draftState as any)?.allowRemoveAnytime;
                  const onMyTurn = (draftState as any)?.onTheClockUserId === activeUserId;

                  return (
                    <div key={p.id} className="border border-border bg-card p-2 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">Pick {i + 1}</span>
                        <Badge variant="outline">{p.position}</Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{p.name}</div>
                          <div className="text-muted-foreground text-sm">{p.team}</div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            removeFromTeam({
                              id: String(p.id),
                              name: p.name,
                              team: p.team,
                              position: p.position,
                              adp: 0,
                              projectedPoints: 0,
                            })
                          }
                          disabled={!allowRemoveAnytime && !onMyTurn}
                          className="ml-3"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <TopScorers />
          </div>
        </div>
      </div>
    </div>
  );
}
