import { useState, useEffect, useMemo } from 'react';
import { apiGet, apiPost, type Player as ApiPlayer, type TeamResp, type DraftState } from '../lib/api';
import { ArrowLeft, Clock, User, TrendingUp, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import type { Page } from '../App';

interface DraftRoomProps {
  onNavigate: (page: Page) => void;
  userTeamName: string;
}

/** Local display model (id is string now to match backend) */
interface Player {
  id: string;
  name: string;
  team: string;
  position: string;
  adp: number;                // synthetic for display (rank)
  projectedPoints: number;    // computed client-side for the list view
}

const TEAMS = [
  'The Bombers', 'Sluggers United', 'Diamond Kings', 'Fastball Fanatics',
  'Home Run Heroes', 'Curveball Crew', 'Playoff Bound', 'Championship Chasers'
];

/** Client-side scoring mirror (for list projectedPoints display only). */
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
  if (typeof stats.ERA === 'number') pts += Math.max(0, 4.00 - stats.ERA) * 2;
  if (typeof stats.WHIP === 'number') pts += Math.max(0, 1.30 - stats.WHIP) * 5;

  return Math.round(pts * 100) / 100;
}

export function DraftRoom({ onNavigate, userTeamName }: DraftRoomProps) {
  const userId = 'u1';

  // Raw API players
  const [apiPlayers, setApiPlayers] = useState<ApiPlayer[]>([]);
  // Display list mapped from apiPlayers (with adp/proj points for UI)
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

  const [searchTerm, setSearchTerm] = useState('');
  const [filterPosition, setFilterPosition] = useState<string>('ALL');
  const [queue, setQueue] = useState<Player[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Determine drafted players by team roster (single-user demo)
  const draftedIds = useMemo(() => new Set((team?.players ?? []).map(p => String(p.id))), [team?.players]);

  // Countdown from server pickEndsAt
  const secondsLeft = useMemo(() => {
    if (!draftState?.pickEndsAt) return 0;
    const ms = draftState.pickEndsAt - Date.now();
    return ms > 0 ? Math.ceil(ms / 1000) : 0;
  }, [draftState?.pickEndsAt]);

  // Initial load
  useEffect(() => {
    (async () => {
      try {
        const [ps, st] = await Promise.all([
          apiGet<ApiPlayer[]>('/api/players'),
          apiGet<DraftState>('/api/draft/state'),
        ]);
        setApiPlayers(ps);
        setDraftState(st);
        try {
          setTeam(await apiGet<TeamResp>(`/api/team/${userId}`));
        } catch {
          setTeam({ userId, teamName: userTeamName || 'Team Demo', totalPoints: 0, players: [] });
        }
      } catch (e: any) {
        setError(String(e?.message ?? e));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll to drive countdown + auto-pick on server
  useEffect(() => {
    const iv = setInterval(async () => {
      try {
        await apiPost('/api/draft/tick');
        const [st, t] = await Promise.all([
          apiGet<DraftState>('/api/draft/state'),
          apiGet<TeamResp>(`/api/team/${userId}`),
        ]);
        setDraftState(st);
        setTeam(t);
      } catch {
        // ignore transient polling errors
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [userId]);

  // Actions
  async function handleDraftPlayer(p: Player) {
    try {
      await apiPost('/api/draft/pick', { userId, playerId: p.id });
      const t = await apiGet<TeamResp>(`/api/team/${userId}`);
      setTeam(t);
      // Reset queue entry if it was there
      setQueue((q) => q.filter(x => x.id !== p.id));
    } catch (e: any) {
      setError(String(e?.message ?? e));
    }
  }

  async function removeFromTeam(p: Player) {
    try {
      await apiPost('/api/draft/remove', { userId, playerId: p.id });
      const t = await apiGet<TeamResp>(`/api/team/${userId}`);
      setTeam(t);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    }
  }

  function addToQueue(p: Player) {
    setQueue((q) => (q.find(x => x.id === p.id) ? q : [...q, p]));
  }

  // Filters
  const filteredPlayers = displayPlayers
    .filter(p => !draftedIds.has(String(p.id)))
    .filter(p => filterPosition === 'ALL' || p.position === filterPosition)
    .filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.team.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // UI-only current pick/round (kept for your header display)
  const totalPicks = TEAMS.length * 15;
  const currentPick = Math.min((team?.players?.length ?? 0) + 1, totalPicks);
  const currentRound = Math.floor((currentPick - 1) / TEAMS.length) + 1;
  const isUserPick = true; // single-user demo; you're always on the clock visually
  const currentTeam = userTeamName || 'Your Team';

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button
            variant="ghost"
            onClick={() => onNavigate('home')}
            className="text-slate-300 hover:text-white mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Exit Draft
          </Button>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-white">Live Draft - Round {currentRound}</h2>
              <p className="text-slate-400">Pick {currentPick} of {totalPicks}</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="flex items-center gap-2 text-slate-300 mb-1">
                  <Clock className="w-4 h-4" />
                  <span>Time Remaining</span>
                </div>
                <div className={`${secondsLeft <= 10 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {secondsLeft}s
                </div>
              </div>
              {isUserPick && (
                <Badge className="bg-emerald-500 px-4 py-2">
                  YOUR PICK
                </Badge>
              )}
            </div>
          </div>
          {error && (
            <div className="text-red-400 mt-2">
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Draft Board */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800 border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white">Now Drafting</h3>
                <User className="w-5 h-5 text-slate-400" />
              </div>
              <div className="bg-slate-700 rounded-lg p-6 mb-6">
                <div className="text-emerald-400 mb-2">
                  {currentTeam}
                </div>
                <p className="text-slate-300">
                  {isUserPick ? "It's your turn! Select a player below." : 'Waiting for pick...'}
                </p>
              </div>

              {/* Player Search & Filters */}
              <div className="mb-4">
                <Input
                  placeholder="Search players..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white mb-3"
                />
                <div className="flex gap-2 flex-wrap">
                  {['ALL', 'C', '1B', '2B', '3B', 'SS', 'OF', 'SP', 'RP', 'UT'].map(pos => (
                    <Button
                      key={pos}
                      variant={filterPosition === pos ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterPosition(pos)}
                      className={filterPosition === pos ? 'bg-emerald-600' : 'bg-slate-700 border-slate-600 text-slate-300'}
                    >
                      {pos}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Available Players */}
              <Tabs defaultValue="all" className="text-white">
                <TabsList className="bg-slate-700">
                  <TabsTrigger value="all">All Players</TabsTrigger>
                  <TabsTrigger value="queue">My Queue ({queue.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="max-h-[500px] overflow-y-auto">
                  <div className="space-y-2">
                    {filteredPlayers.slice(0, 50).map(player => {
                      const drafted = draftedIds.has(player.id);
                      return (
                        <div
                          key={player.id}
                          className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                            drafted ? 'bg-slate-800 opacity-60' : 'bg-slate-700 hover:bg-slate-600'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="border-slate-500 text-slate-300">
                                {player.position}
                              </Badge>
                              <span className="text-white">{player.name}</span>
                              <span className="text-slate-400">{player.team}</span>
                            </div>
                            <div className="flex gap-4 mt-1 text-slate-400">
                              <span>ADP: {player.adp}</span>
                              <span>Proj: {player.projectedPoints} pts</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addToQueue(player)}
                              className="border-slate-500 text-slate-300"
                              disabled={drafted}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleDraftPlayer(player)}
                              className="bg-emerald-600 hover:bg-emerald-700"
                              disabled={!isUserPick || drafted}
                            >
                              {drafted ? 'Drafted' : 'Draft'}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>

                <TabsContent value="queue" className="max-h-[500px] overflow-y-auto">
                  {queue.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      No players in queue. Click + to add players.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {queue.map((player, index) => {
                        const drafted = draftedIds.has(player.id);
                        return (
                          <div
                            key={player.id}
                            className="flex items-center justify-between p-3 bg-slate-700 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-slate-400">#{index + 1}</span>
                              <Badge variant="outline" className="border-slate-500 text-slate-300">
                                {player.position}
                              </Badge>
                              <span className="text-white">{player.name}</span>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleDraftPlayer(player)}
                              className="bg-emerald-600 hover:bg-emerald-700"
                              disabled={!isUserPick || drafted}
                            >
                              {drafted ? 'Drafted' : 'Draft'}
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

          {/* Draft Summary Sidebar */}
          <div className="space-y-6">
            <Card className="bg-slate-800 border-slate-700 p-6">
              <h3 className="text-white mb-4">Draft Order</h3>
              <div className="space-y-2">
                {/* For demo: highlight user team at top */}
                {[userTeamName, ...TEAMS.filter(t => t !== userTeamName)].slice(0, TEAMS.length).map((teamName, index) => (
                  <div
                    key={`${teamName}-${index}`}
                    className={`p-2 rounded ${
                      index === 0 ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">#{index + 1}</span>
                      <span>{teamName}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="bg-slate-800 border-slate-700 p-6">
              <h3 className="text-white mb-2">Your Team</h3>
              <div className="text-slate-300 mb-3">
                Total Points: <span className="text-emerald-400 font-medium">{team?.totalPoints ?? 0}</span>
              </div>
              <div className="space-y-3">
                {(team?.players ?? []).length === 0 && (
                  <p className="text-slate-400 text-center py-2">No picks yet</p>
                )}
                {(team?.players ?? []).map((p, i) => (
                  <div key={p.id} className="bg-slate-700 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-emerald-400">Pick {i + 1}</span>
                      <Badge variant="outline" className="border-slate-500 text-slate-300">
                        {p.position}
                      </Badge>
                    </div>
                    <div className="text-white">{p.name}</div>
                    <div className="text-slate-400">{p.team}</div>
                    <div className="flex justify-end mt-2">
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
                            projectedPoints: 0
                          })
                        }
                        className="border-slate-500 text-slate-300"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="bg-slate-800 border-slate-700 p-6">
              <h3 className="text-white mb-4">Trends</h3>
              <div className="text-slate-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>Top projected players highlight in list</span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
