import { useState } from 'react';
import { ArrowLeft, User, TrendingUp, Clock, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import type { Page } from '../App';

interface TeamManagementProps {
  onNavigate: (page: Page) => void;
  userTeamName: string;
}

interface RosterPlayer {
  id: number;
  name: string;
  team: string;
  position: string;
  slot: string;
  status: 'active' | 'bench' | 'injured';
  weekPoints: number;
  seasonPoints: number;
  nextGame: string;
}

const MOCK_ROSTER: RosterPlayer[] = [
  { id: 1, name: 'Ronald Acuña Jr.', team: 'ATL', position: 'OF', slot: 'OF1', status: 'active', weekPoints: 24.5, seasonPoints: 485, nextGame: 'vs PHI 7:20 PM' },
  { id: 2, name: 'Bobby Witt Jr.', team: 'KC', position: 'SS', slot: 'SS', status: 'active', weekPoints: 18.2, seasonPoints: 422, nextGame: 'vs DET 8:10 PM' },
  { id: 3, name: 'Freddie Freeman', team: 'LAD', position: '1B', slot: '1B', status: 'active', weekPoints: 15.8, seasonPoints: 385, nextGame: '@ SF 9:45 PM' },
  { id: 4, name: 'Jose Ramirez', team: 'CLE', position: '3B', slot: '3B', status: 'active', weekPoints: 21.3, seasonPoints: 391, nextGame: 'vs CWS 7:10 PM' },
  { id: 5, name: 'Marcus Semien', team: 'TEX', position: '2B', slot: '2B', status: 'active', weekPoints: 12.4, seasonPoints: 358, nextGame: 'vs LAA 8:05 PM' },
  { id: 6, name: 'Mookie Betts', team: 'LAD', position: 'OF', slot: 'OF2', status: 'active', weekPoints: 19.6, seasonPoints: 462, nextGame: '@ SF 9:45 PM' },
  { id: 7, name: 'Julio Rodríguez', team: 'SEA', position: 'OF', slot: 'OF3', status: 'active', weekPoints: 16.7, seasonPoints: 428, nextGame: 'vs OAK 9:40 PM' },
  { id: 8, name: 'Will Smith', team: 'LAD', position: 'C', slot: 'C', status: 'active', weekPoints: 8.3, seasonPoints: 242, nextGame: '@ SF 9:45 PM' },
  { id: 9, name: 'Shohei Ohtani', team: 'LAD', position: 'DH', slot: 'UTIL1', status: 'active', weekPoints: 22.1, seasonPoints: 458, nextGame: '@ SF 9:45 PM' },
  { id: 10, name: 'Kyle Tucker', team: 'HOU', position: 'OF', slot: 'UTIL2', status: 'active', weekPoints: 14.9, seasonPoints: 401, nextGame: 'vs BAL 8:10 PM' },
  { id: 11, name: 'Spencer Strider', team: 'ATL', position: 'SP', slot: 'SP1', status: 'active', weekPoints: 28.5, seasonPoints: 398, nextGame: 'Tue vs PHI' },
  { id: 12, name: 'Gerrit Cole', team: 'NYY', position: 'SP', slot: 'SP2', status: 'active', weekPoints: 25.2, seasonPoints: 367, nextGame: 'Wed @ BOS' },
  { id: 13, name: 'Blake Snell', team: 'SF', position: 'SP', slot: 'SP3', status: 'active', weekPoints: 18.4, seasonPoints: 334, nextGame: 'Mon vs LAD' },
  { id: 14, name: 'Corbin Burnes', team: 'BAL', position: 'SP', slot: 'SP4', status: 'active', weekPoints: 22.7, seasonPoints: 356, nextGame: 'Thu @ HOU' },
  { id: 15, name: 'Josh Hader', team: 'HOU', position: 'RP', slot: 'RP1', status: 'active', weekPoints: 12.3, seasonPoints: 198, nextGame: 'Available' },
  { id: 16, name: 'Emmanuel Clase', team: 'CLE', position: 'RP', slot: 'RP2', status: 'active', weekPoints: 10.8, seasonPoints: 186, nextGame: 'Available' },
  { id: 17, name: 'Nolan Arenado', team: 'STL', position: '3B', slot: 'BENCH', status: 'bench', weekPoints: 0, seasonPoints: 312, nextGame: 'vs MIL 7:45 PM' },
  { id: 18, name: 'Anthony Santander', team: 'BAL', position: 'OF', slot: 'BENCH', status: 'bench', weekPoints: 0, seasonPoints: 298, nextGame: '@ HOU 8:10 PM' },
  { id: 19, name: 'Shane Bieber', team: 'CLE', position: 'SP', slot: 'IL', status: 'injured', weekPoints: 0, seasonPoints: 145, nextGame: 'Out 4-6 weeks' },
];

export function TeamManagement({ onNavigate, userTeamName }: TeamManagementProps) {
  const [roster, setRoster] = useState(MOCK_ROSTER);
  const [selectedPlayer, setSelectedPlayer] = useState<RosterPlayer | null>(null);

  const activePlayers = roster.filter(p => p.status === 'active');
  const benchPlayers = roster.filter(p => p.status === 'bench');
  const injuredPlayers = roster.filter(p => p.status === 'injured');

  const totalWeekPoints = activePlayers.reduce((sum, p) => sum + p.weekPoints, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => onNavigate('home')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onNavigate('players')}>
                <Search className="w-4 h-4 mr-2" />
                Add Players
              </Button>
              <Button variant="outline" onClick={() => onNavigate('trades')}>
                Trade Players
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1>{userTeamName}</h1>
              <p className="text-slate-600 mt-1">Manage your roster & set your lineup</p>
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-slate-600">This Week</div>
                <div className="text-emerald-600">{totalWeekPoints.toFixed(1)} pts</div>
              </div>
              <div className="text-center">
                <div className="text-slate-600">Record</div>
                <div>8-4-0</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Lineup Status Banner */}
        <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <h4 className="text-blue-900">Lineup locks in 2 hours 34 minutes</h4>
                <p className="text-blue-700">Make sure all starting positions are filled</p>
              </div>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              Save Lineup
            </Button>
          </div>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Roster */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="lineup" className="w-full">
              <TabsList className="w-full justify-start mb-4">
                <TabsTrigger value="lineup">Starting Lineup</TabsTrigger>
                <TabsTrigger value="bench">Bench ({benchPlayers.length})</TabsTrigger>
                <TabsTrigger value="injured">IL ({injuredPlayers.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="lineup">
                <Card className="p-6">
                  <h3 className="mb-4">Active Roster</h3>
                  <div className="space-y-2">
                    {activePlayers.map(player => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        onClick={() => setSelectedPlayer(player)}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-16 text-center">
                            <Badge variant="outline">{player.position}</Badge>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span>{player.name}</span>
                              <span className="text-slate-500">{player.team}</span>
                            </div>
                            <div className="text-slate-500">{player.nextGame}</div>
                          </div>
                        </div>
                        <div className="flex gap-6 text-center">
                          <div>
                            <div className="text-slate-600">Week</div>
                            <div className="text-emerald-600">{player.weekPoints}</div>
                          </div>
                          <div>
                            <div className="text-slate-600">Season</div>
                            <div>{player.seasonPoints}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="bench">
                <Card className="p-6">
                  <h3 className="mb-4">Bench Players</h3>
                  {benchPlayers.length === 0 ? (
                    <p className="text-slate-600 text-center py-8">No bench players</p>
                  ) : (
                    <div className="space-y-2">
                      {benchPlayers.map(player => (
                        <div
                          key={player.id}
                          className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                          onClick={() => setSelectedPlayer(player)}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <Badge variant="outline">{player.position}</Badge>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span>{player.name}</span>
                                <span className="text-slate-500">{player.team}</span>
                              </div>
                              <div className="text-slate-500">{player.nextGame}</div>
                            </div>
                          </div>
                          <Button size="sm">Move to Lineup</Button>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="injured">
                <Card className="p-6">
                  <h3 className="mb-4">Injured List</h3>
                  {injuredPlayers.length === 0 ? (
                    <p className="text-slate-600 text-center py-8">No injured players</p>
                  ) : (
                    <div className="space-y-2">
                      {injuredPlayers.map(player => (
                        <div
                          key={player.id}
                          className="flex items-center justify-between p-4 bg-red-50 rounded-lg"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <Badge variant="outline" className="border-red-300 text-red-700">
                              {player.position}
                            </Badge>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span>{player.name}</span>
                                <span className="text-slate-500">{player.team}</span>
                              </div>
                              <div className="text-red-600">{player.nextGame}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-600">Roster Spots</span>
                  <span>{roster.length}/25</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Active</span>
                  <span className="text-emerald-600">{activePlayers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Bench</span>
                  <span>{benchPlayers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">IL</span>
                  <span className="text-red-600">{injuredPlayers.length}</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="mb-4">Roster Requirements</h3>
              <div className="space-y-2 text-slate-700">
                <div className="flex justify-between">
                  <span>C</span>
                  <span className="text-emerald-600">✓ 1/1</span>
                </div>
                <div className="flex justify-between">
                  <span>1B</span>
                  <span className="text-emerald-600">✓ 1/1</span>
                </div>
                <div className="flex justify-between">
                  <span>2B</span>
                  <span className="text-emerald-600">✓ 1/1</span>
                </div>
                <div className="flex justify-between">
                  <span>3B</span>
                  <span className="text-emerald-600">✓ 1/1</span>
                </div>
                <div className="flex justify-between">
                  <span>SS</span>
                  <span className="text-emerald-600">✓ 1/1</span>
                </div>
                <div className="flex justify-between">
                  <span>OF</span>
                  <span className="text-emerald-600">✓ 3/3</span>
                </div>
                <div className="flex justify-between">
                  <span>UTIL</span>
                  <span className="text-emerald-600">✓ 2/2</span>
                </div>
                <div className="flex justify-between">
                  <span>SP</span>
                  <span className="text-emerald-600">✓ 4/4</span>
                </div>
                <div className="flex justify-between">
                  <span>RP</span>
                  <span className="text-emerald-600">✓ 2/2</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-emerald-50 border-emerald-200">
              <h4 className="mb-2 text-emerald-900">Lineup Valid ✓</h4>
              <p className="text-emerald-700">
                All positions filled. You're ready to compete this week!
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
