import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, X, Plus, Trash2, DollarSign, Timer, ListChecks } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { Page } from '../App';
import { apiGet, apiPost } from '../lib/api';

interface WaiversProps {
  onNavigate: (page: Page) => void;
  userTeamName: string;
}

interface Player {
  id: string;           // keep string for consistency with DraftRoom
  name: string;
  team: string;
  position: string;
  projectedPoints?: number;
}

type WaiverStatus = 'pending' | 'executed' | 'canceled' | 'failed';

interface WaiverClaim {
  id: string;
  userId: string;
  addPlayer: Player;
  dropPlayer: Player;
  bid?: number | null;      // FAAB bid (optional)
  priority?: number | null; // rolling priority (optional)
  status: WaiverStatus;
  createdAt: number;        // epoch ms
  executedAt?: number | null;
  note?: string;
}

const POSITIONS = ['ALL', 'C', '1B', '2B', '3B', 'SS', 'OF', 'SP', 'RP', 'UT'];

export default function Waivers({ onNavigate, userTeamName }: WaiversProps) {
  const [activeUserId] = useState('u1');

  // My roster & free agents
  const [myPlayers, setMyPlayers] = useState<Player[]>([]);
  const [freeAgents, setFreeAgents] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Filters
  const [searchFA, setSearchFA] = useState('');
  const [posFA, setPosFA] = useState('ALL');

  // Selection for a new claim
  const [dropPlayer, setDropPlayer] = useState<Player | null>(null);
  const [addPlayer, setAddPlayer] = useState<Player | null>(null);
  const [bid, setBid] = useState<string>('');           // store as string for input
  const [priority, setPriority] = useState<string>(''); // store as string for input

  // Claims
  const [pending, setPending] = useState<WaiverClaim[]>([]);
  const [history, setHistory] = useState<WaiverClaim[]>([]);

  // Load data
  async function loadAll() {
    setLoading(true);
    setErr(null);
    try {
      // your backend should expose these; they mirror your existing api style
      const [teamResp, faResp, claimsResp] = await Promise.all([
        apiGet<{ players: Player[] }>(`/api/team/${activeUserId}`),
        apiGet<Player[]>(`/api/free-agents`),
        apiGet<WaiverClaim[]>(`/api/waivers/user/${activeUserId}`),
      ]);

      setMyPlayers(teamResp?.players ?? []);
      setFreeAgents(faResp ?? []);

      const p = (claimsResp ?? []).filter(c => c.status === 'pending').sort((a,b)=>b.createdAt-a.createdAt);
      const h = (claimsResp ?? []).filter(c => c.status !== 'pending').sort((a,b)=>b.createdAt-a.createdAt);
      setPending(p);
      setHistory(h);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // light poll to keep claims fresh
    const iv = setInterval(() => {
      apiGet<WaiverClaim[]>(`/api/waivers/user/${activeUserId}`)
        .then(claimsResp => {
          const p = (claimsResp ?? []).filter(c => c.status === 'pending').sort((a,b)=>b.createdAt-a.createdAt);
          const h = (claimsResp ?? []).filter(c => c.status !== 'pending').sort((a,b)=>b.createdAt-a.createdAt);
          setPending(p);
          setHistory(h);
        })
        .catch(() => {});
    }, 3000);
    return () => clearInterval(iv);
  }, [activeUserId]);

  // Derived filters
  const filteredFA = useMemo(() => {
    let rows = [...freeAgents];
    if (posFA !== 'ALL') rows = rows.filter(p => p.position === posFA);
    if (searchFA.trim()) {
      const q = searchFA.toLowerCase();
      rows = rows.filter(p =>
        p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q)
      );
    }
    return rows.slice(0, 300);
  }, [freeAgents, posFA, searchFA]);

  async function submitClaim() {
    if (!addPlayer || !dropPlayer) return;
    const bidNum = bid.trim() === '' ? null : Math.max(0, Number(bid));
    const prNum  = priority.trim() === '' ? null : Math.max(1, Number(priority));
    try {
      await apiPost('/api/waivers/request', {
        userId: activeUserId,
        addPlayerId: addPlayer.id,
        dropPlayerId: dropPlayer.id,
        bid: bidNum,
        priority: prNum,
      });
      // reset form
      setAddPlayer(null);
      setDropPlayer(null);
      setBid('');
      setPriority('');
      await loadAll();
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    }
  }

  async function cancelClaim(id: string) {
    try {
      await apiPost('/api/waivers/cancel', { id, userId: activeUserId });
      await loadAll();
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    }
  }

  // Optional demo-only: force execute all pending (your server can noop in prod)
  async function processNow() {
    try {
      await apiPost('/api/waivers/execute', {});
      await loadAll();
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button variant="ghost" onClick={() => onNavigate('home')} className="mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1>Waivers</h1>
              <p className="text-muted-foreground mt-1">
                Submit add/drop claims from the free agent pool
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={loadAll}>
                Refresh
              </Button>
              <Button variant="outline" onClick={processNow} title="Demo: process pending claims now">
                <ListChecks className="w-4 h-4 mr-2" />
                Process (demo)
              </Button>
            </div>
          </div>

          {err && <div className="text-destructive mt-2">{err}</div>}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="propose" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="propose">Submit Claim</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Submit Claim */}
          <TabsContent value="propose">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Drop from My Roster */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base">Drop from Your Roster</h3>
                  <Badge>{userTeamName}</Badge>
                </div>

                {loading ? (
                  <div className="text-muted-foreground">Loading...</div>
                ) : (myPlayers.length === 0) ? (
                  <div className="text-muted-foreground">No players on your roster</div>
                ) : (
                  <div className="space-y-2">
                    {myPlayers.map(p => (
                      <div
                        key={p.id}
                        className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                          dropPlayer?.id === p.id
                            ? 'border-amber-500 bg-amber-50'
                            : 'border-border hover:border-muted-foreground/30 bg-card'
                        }`}
                        onClick={() => setDropPlayer(p)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{p.position}</Badge>
                            <div>
                              <div className="font-medium">{p.name}</div>
                              <div className="text-muted-foreground">{p.team}</div>
                            </div>
                          </div>
                          {dropPlayer?.id === p.id ? (
                            <Trash2 className="w-4 h-4 text-amber-600" />
                          ) : (
                            <X className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Add from Free Agents */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base">Add from Free Agents</h3>
                  <div className="flex items-center gap-2">
                    <Select value={posFA} onValueChange={setPosFA}>
                      <SelectTrigger className="w-[110px]">
                        <SelectValue placeholder="Position" />
                      </SelectTrigger>
                      <SelectContent>
                        {POSITIONS.map(p => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Search free agents..."
                      value={searchFA}
                      onChange={e => setSearchFA(e.target.value)}
                      className="w-[180px]"
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="text-muted-foreground">Loading...</div>
                ) : (freeAgents.length === 0) ? (
                  <div className="text-muted-foreground">No free agents available</div>
                ) : (
                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    {filteredFA.map(p => (
                      <div
                        key={p.id}
                        className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                          addPlayer?.id === p.id
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-border hover:border-muted-foreground/30 bg-card'
                        }`}
                        onClick={() => setAddPlayer(p)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{p.position}</Badge>
                            <div>
                              <div className="font-medium">{p.name}</div>
                              <div className="text-muted-foreground">{p.team}</div>
                            </div>
                          </div>
                          <Plus className="w-4 h-4 text-emerald-600" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Claim details / submit */}
            {(dropPlayer || addPlayer) && (
              <Card className="p-6 mt-6 bg-muted/50">
                <h3 className="mb-4 text-base">Waiver Claim Summary</h3>

                <div className="grid md:grid-cols-3 gap-4">
                  {/* Pair */}
                  <div className="md:col-span-2">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg border bg-card">
                        <div className="text-muted-foreground mb-2">Drop</div>
                        {dropPlayer ? (
                          <>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{dropPlayer.position}</Badge>
                              <span className="font-medium">{dropPlayer.name}</span>
                            </div>
                            <div className="text-muted-foreground">{dropPlayer.team}</div>
                          </>
                        ) : (
                          <div className="text-muted-foreground">Select a player to drop</div>
                        )}
                      </div>

                      <div className="p-4 rounded-lg border bg-card">
                        <div className="text-muted-foreground mb-2">Add</div>
                        {addPlayer ? (
                          <>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{addPlayer.position}</Badge>
                              <span className="font-medium">{addPlayer.name}</span>
                            </div>
                            <div className="text-muted-foreground">{addPlayer.team}</div>
                          </>
                        ) : (
                          <div className="text-muted-foreground">Select a free agent to add</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bid/Priority */}
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign className="w-4 h-4 text-emerald-700" />
                      <span className="font-medium">Claim Options</span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm block mb-1">FAAB Bid (optional)</label>
                        <Input
                          type="number"
                          min={0}
                          value={bid}
                          onChange={(e) => setBid(e.target.value)}
                          placeholder="e.g. 12"
                        />
                      </div>
                      <div>
                        <label className="text-sm block mb-1">Priority (optional)</label>
                        <Input
                          type="number"
                          min={1}
                          value={priority}
                          onChange={(e) => setPriority(e.target.value)}
                          placeholder="1 = highest"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      If both are empty, league default rules apply (rolling priority or first-come-first-serve).
                    </p>
                  </div>
                </div>

                <Button
                  className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700"
                  disabled={!addPlayer || !dropPlayer}
                  onClick={submitClaim}
                >
                  Submit Waiver Claim
                </Button>
              </Card>
            )}
          </TabsContent>

          {/* Pending */}
          <TabsContent value="pending">
            {pending.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">No pending claims</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {pending.map(c => (
                  <Card key={c.id} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Timer className="w-4 h-4 text-amber-600" />
                        <Badge variant="outline" className="border-amber-500 text-amber-700">Pending</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(c.createdAt).toLocaleString()}
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg border bg-card">
                        <div className="text-muted-foreground mb-2">Drop</div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{c.dropPlayer.position}</Badge>
                          <span className="font-medium">{c.dropPlayer.name}</span>
                        </div>
                        <div className="text-muted-foreground">{c.dropPlayer.team}</div>
                      </div>

                      <div className="p-4 rounded-lg border bg-card">
                        <div className="text-muted-foreground mb-2">Add</div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{c.addPlayer.position}</Badge>
                          <span className="font-medium">{c.addPlayer.name}</span>
                        </div>
                        <div className="text-muted-foreground">{c.addPlayer.team}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                      {typeof c.bid === 'number' && <span>Bid: <strong>${c.bid}</strong></span>}
                      {typeof c.priority === 'number' && <span>Priority: <strong>{c.priority}</strong></span>}
                      {c.note && <span className="italic">({c.note})</span>}
                    </div>

                    <div className="flex gap-3 mt-6">
                      <Button variant="outline" className="flex-1" onClick={() => cancelClaim(c.id)}>
                        <X className="w-4 h-4 mr-2" />
                        Cancel Claim
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* History */}
          <TabsContent value="history">
            {history.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">No waiver history yet</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {history.map(c => (
                  <Card key={c.id} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {c.status === 'executed' && <Check className="w-4 h-4 text-emerald-600" />}
                        {c.status !== 'executed' && <X className="w-4 h-4 text-red-600" />}
                        <Badge
                          className={
                            c.status === 'executed'
                              ? 'bg-emerald-600'
                              : c.status === 'canceled'
                              ? 'bg-slate-500'
                              : 'bg-red-600'
                          }
                        >
                          {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(c.executedAt ?? c.createdAt).toLocaleString()}
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg border bg-card">
                        <div className="text-muted-foreground mb-2">Dropped</div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{c.dropPlayer.position}</Badge>
                          <span className="font-medium">{c.dropPlayer.name}</span>
                        </div>
                        <div className="text-muted-foreground">{c.dropPlayer.team}</div>
                      </div>

                      <div className="p-4 rounded-lg border bg-card">
                        <div className="text-muted-foreground mb-2">Added</div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{c.addPlayer.position}</Badge>
                          <span className="font-medium">{c.addPlayer.name}</span>
                        </div>
                        <div className="text-muted-foreground">{c.addPlayer.team}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                      {typeof c.bid === 'number' && <span>Bid: <strong>${c.bid}</strong></span>}
                      {typeof c.priority === 'number' && <span>Priority: <strong>{c.priority}</strong></span>}
                      {c.note && <span className="italic">({c.note})</span>}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Waiver Rules */}
        <Card className="p-6 mt-6 bg-blue-50 border-blue-200">
          <h4 className="mb-2">Waiver Rules & Notes</h4>
          <ul className="space-y-2 text-foreground/80">
            <li>• Claims are processed at scheduled windows or by commissioner (demo button here).</li>
            <li>• If multiple bids exist for the same player, highest FAAB bid wins; ties break by priority.</li>
            <li>• If a claim cannot be executed (e.g., player taken), it will be marked as <em>failed</em>.</li>
            <li>• Add/Drop is atomic — both must succeed or the claim fails.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
