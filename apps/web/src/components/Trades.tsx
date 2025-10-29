import { useState } from 'react';
import { ArrowLeft, ArrowRightLeft, Check, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { Page } from '../App';

interface TradesProps {
  onNavigate: (page: Page) => void;
  userTeamName: string;
}

interface Player {
  id: number;
  name: string;
  team: string;
  position: string;
  projectedPoints: number;
}

interface TradeOffer {
  id: number;
  status: 'pending' | 'accepted' | 'rejected';
  fromTeam: string;
  toTeam: string;
  offeredPlayers: Player[];
  requestedPlayers: Player[];
  date: string;
  direction: 'sent' | 'received';
}

const MY_PLAYERS: Player[] = [
  { id: 1, name: 'Ronald Acuña Jr.', team: 'ATL', position: 'OF', projectedPoints: 485 },
  { id: 2, name: 'Bobby Witt Jr.', team: 'KC', position: 'SS', projectedPoints: 422 },
  { id: 3, name: 'Freddie Freeman', team: 'LAD', position: '1B', projectedPoints: 385 },
  { id: 4, name: 'Jose Ramirez', team: 'CLE', position: '3B', projectedPoints: 391 },
  { id: 5, name: 'Marcus Semien', team: 'TEX', position: '2B', projectedPoints: 358 },
];

const TRADE_HISTORY: TradeOffer[] = [
  {
    id: 1,
    status: 'pending',
    fromTeam: 'The Bombers',
    toTeam: 'Sluggers United',
    offeredPlayers: [
      { id: 3, name: 'Freddie Freeman', team: 'LAD', position: '1B', projectedPoints: 385 }
    ],
    requestedPlayers: [
      { id: 101, name: 'Juan Soto', team: 'NYY', position: 'OF', projectedPoints: 445 }
    ],
    date: '2025-10-12',
    direction: 'sent'
  },
  {
    id: 2,
    status: 'pending',
    fromTeam: 'Diamond Kings',
    toTeam: 'The Bombers',
    offeredPlayers: [
      { id: 201, name: 'Kyle Tucker', team: 'HOU', position: 'OF', projectedPoints: 401 }
    ],
    requestedPlayers: [
      { id: 2, name: 'Bobby Witt Jr.', team: 'KC', position: 'SS', projectedPoints: 422 }
    ],
    date: '2025-10-11',
    direction: 'received'
  },
  {
    id: 3,
    status: 'accepted',
    fromTeam: 'The Bombers',
    toTeam: 'Home Run Heroes',
    offeredPlayers: [
      { id: 301, name: 'Nolan Arenado', team: 'STL', position: '3B', projectedPoints: 312 }
    ],
    requestedPlayers: [
      { id: 302, name: 'Pete Alonso', team: 'NYM', position: '1B', projectedPoints: 342 }
    ],
    date: '2025-10-08',
    direction: 'sent'
  },
  {
    id: 4,
    status: 'rejected',
    fromTeam: 'Championship Chasers',
    toTeam: 'The Bombers',
    offeredPlayers: [
      { id: 401, name: 'Luis Arraez', team: 'MIA', position: '2B', projectedPoints: 298 }
    ],
    requestedPlayers: [
      { id: 1, name: 'Ronald Acuña Jr.', team: 'ATL', position: 'OF', projectedPoints: 485 }
    ],
    date: '2025-10-05',
    direction: 'received'
  },
];

const TEAMS = [
  'Sluggers United', 'Diamond Kings', 'Fastball Fanatics',
  'Home Run Heroes', 'Curveball Crew', 'Playoff Bound', 'Championship Chasers'
];

export function Trades({ onNavigate, userTeamName }: TradesProps) {
  const [selectedTeam, setSelectedTeam] = useState(TEAMS[0]);
  const [selectedMyPlayer, setSelectedMyPlayer] = useState<Player | null>(null);
  const [selectedTheirPlayer, setSelectedTheirPlayer] = useState<Player | null>(null);

  const pendingTrades = TRADE_HISTORY.filter(t => t.status === 'pending');
  const completedTrades = TRADE_HISTORY.filter(t => t.status !== 'pending');

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button
            variant="ghost"
            onClick={() => onNavigate('home')}
            className="mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1>Trades</h1>
              <p className="text-slate-600 mt-1">Propose trades and manage offers</p>
            </div>
            <Button variant="outline" onClick={() => onNavigate('players')}>
              Browse Players
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="propose" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="propose">Propose Trade</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingTrades.length})</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Propose Trade */}
          <TabsContent value="propose">
            <Card className="p-6 mb-6">
              <h3 className="mb-4">Select Trading Partner</h3>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEAMS.map(team => (
                    <SelectItem key={team} value={team}>
                      {team}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Card>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Your Players */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3>Your Players</h3>
                  <Badge className="bg-emerald-600">{userTeamName}</Badge>
                </div>
                <div className="space-y-2">
                  {MY_PLAYERS.map(player => (
                    <div
                      key={player.id}
                      className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                        selectedMyPlayer?.id === player.id
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                      onClick={() => setSelectedMyPlayer(player)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{player.position}</Badge>
                          <div>
                            <div>{player.name}</div>
                            <div className="text-slate-500">{player.team}</div>
                          </div>
                        </div>
                        <div className="text-slate-600">
                          {player.projectedPoints} pts
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Their Players */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3>Their Players</h3>
                  <Badge variant="outline">{selectedTeam}</Badge>
                </div>
                <div className="space-y-2">
                  {[
                    { id: 101, name: 'Juan Soto', team: 'NYY', position: 'OF', projectedPoints: 445 },
                    { id: 102, name: 'Rafael Devers', team: 'BOS', position: '3B', projectedPoints: 368 },
                    { id: 103, name: 'Francisco Lindor', team: 'NYM', position: 'SS', projectedPoints: 352 },
                  ].map(player => (
                    <div
                      key={player.id}
                      className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                        selectedTheirPlayer?.id === player.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                      onClick={() => setSelectedTheirPlayer(player)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{player.position}</Badge>
                          <div>
                            <div>{player.name}</div>
                            <div className="text-slate-500">{player.team}</div>
                          </div>
                        </div>
                        <div className="text-slate-600">
                          {player.projectedPoints} pts
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Trade Summary */}
            {(selectedMyPlayer || selectedTheirPlayer) && (
              <Card className="p-6 mt-6 bg-slate-50">
                <h3 className="mb-4">Trade Summary</h3>
                <div className="flex items-center justify-center gap-8 mb-6">
                  <div className="text-center">
                    <div className="text-slate-600 mb-2">{userTeamName} sends</div>
                    {selectedMyPlayer ? (
                      <div className="p-4 bg-white rounded-lg border-2 border-emerald-500">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{selectedMyPlayer.position}</Badge>
                          <span>{selectedMyPlayer.name}</span>
                        </div>
                        <div className="text-slate-500">{selectedMyPlayer.projectedPoints} projected pts</div>
                      </div>
                    ) : (
                      <div className="p-4 bg-white rounded-lg border-2 border-dashed border-slate-300 text-slate-400">
                        Select a player
                      </div>
                    )}
                  </div>

                  <ArrowRightLeft className="w-8 h-8 text-slate-400" />

                  <div className="text-center">
                    <div className="text-slate-600 mb-2">{selectedTeam} sends</div>
                    {selectedTheirPlayer ? (
                      <div className="p-4 bg-white rounded-lg border-2 border-blue-500">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{selectedTheirPlayer.position}</Badge>
                          <span>{selectedTheirPlayer.name}</span>
                        </div>
                        <div className="text-slate-500">{selectedTheirPlayer.projectedPoints} projected pts</div>
                      </div>
                    ) : (
                      <div className="p-4 bg-white rounded-lg border-2 border-dashed border-slate-300 text-slate-400">
                        Select a player
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={!selectedMyPlayer || !selectedTheirPlayer}
                >
                  Send Trade Offer
                </Button>
              </Card>
            )}
          </TabsContent>

          {/* Pending Trades */}
          <TabsContent value="pending">
            {pendingTrades.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-slate-600">No pending trade offers</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingTrades.map(trade => (
                  <Card key={trade.id} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <Badge className={trade.direction === 'sent' ? 'bg-blue-600' : 'bg-amber-600'}>
                          {trade.direction === 'sent' ? 'Sent' : 'Received'}
                        </Badge>
                        <p className="text-slate-600 mt-1">{trade.date}</p>
                      </div>
                      <Badge variant="outline" className="border-amber-500 text-amber-700">
                        Pending
                      </Badge>
                    </div>

                    <div className="flex items-center justify-center gap-8 mb-6">
                      <div className="flex-1">
                        <div className="text-slate-600 mb-2">{trade.fromTeam}</div>
                        {trade.offeredPlayers.map(player => (
                          <div key={player.id} className="p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline">{player.position}</Badge>
                              <span>{player.name}</span>
                            </div>
                            <div className="text-slate-500">{player.team}</div>
                          </div>
                        ))}
                      </div>

                      <ArrowRightLeft className="w-6 h-6 text-slate-400 flex-shrink-0" />

                      <div className="flex-1">
                        <div className="text-slate-600 mb-2">{trade.toTeam}</div>
                        {trade.requestedPlayers.map(player => (
                          <div key={player.id} className="p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline">{player.position}</Badge>
                              <span>{player.name}</span>
                            </div>
                            <div className="text-slate-500">{player.team}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      {trade.direction === 'received' && (
                        <>
                          <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                            <Check className="w-4 h-4 mr-2" />
                            Accept Trade
                          </Button>
                          <Button variant="outline" className="flex-1">
                            <X className="w-4 h-4 mr-2" />
                            Decline
                          </Button>
                        </>
                      )}
                      {trade.direction === 'sent' && (
                        <Button variant="outline" className="w-full">
                          Cancel Offer
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Trade History */}
          <TabsContent value="history">
            <div className="space-y-4">
              {completedTrades.map(trade => (
                <Card key={trade.id} className="p-6 opacity-75">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <Badge className={trade.direction === 'sent' ? 'bg-blue-600' : 'bg-slate-600'}>
                        {trade.direction === 'sent' ? 'Sent' : 'Received'}
                      </Badge>
                      <p className="text-slate-600 mt-1">{trade.date}</p>
                    </div>
                    <Badge className={trade.status === 'accepted' ? 'bg-emerald-600' : 'bg-red-600'}>
                      {trade.status === 'accepted' ? 'Accepted' : 'Rejected'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-center gap-8">
                    <div className="flex-1">
                      <div className="text-slate-600 mb-2">{trade.fromTeam}</div>
                      {trade.offeredPlayers.map(player => (
                        <div key={player.id} className="p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{player.position}</Badge>
                            <span>{player.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <ArrowRightLeft className="w-6 h-6 text-slate-400 flex-shrink-0" />

                    <div className="flex-1">
                      <div className="text-slate-600 mb-2">{trade.toTeam}</div>
                      {trade.requestedPlayers.map(player => (
                        <div key={player.id} className="p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{player.position}</Badge>
                            <span>{player.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Trade Rules */}
        <Card className="p-6 mt-6 bg-blue-50 border-blue-200">
          <h4 className="mb-2">Trade Rules & Guidelines</h4>
          <ul className="space-y-2 text-slate-700">
            <li>• Trades process immediately upon acceptance (no veto period)</li>
            <li>• You can include up to 3 players per side in a trade</li>
            <li>• Commissioner can review and reverse trades within 24 hours</li>
            <li>• Trade deadline: Week 20 (September 1st)</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
