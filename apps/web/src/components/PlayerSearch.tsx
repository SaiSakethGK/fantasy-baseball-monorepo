import { useState } from 'react';
import { ArrowLeft, Search, TrendingUp, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import type { Page } from '../App';

interface PlayerSearchProps {
  onNavigate: (page: Page) => void;
}

interface Player {
  id: number;
  name: string;
  team: string;
  position: string;
  status: 'available' | 'rostered' | 'waiver';
  rosteredBy?: string;
  projectedPoints: number;
  lastWeekPoints: number;
  rank: number;
}

const ALL_PLAYERS: Player[] = [
  { id: 1, name: 'Ronald Acuña Jr.', team: 'ATL', position: 'OF', status: 'rostered', rosteredBy: 'The Bombers', projectedPoints: 485, lastWeekPoints: 24.5, rank: 1 },
  { id: 2, name: 'Mookie Betts', team: 'LAD', position: 'OF', status: 'rostered', rosteredBy: 'Championship Chasers', projectedPoints: 462, lastWeekPoints: 22.1, rank: 2 },
  { id: 3, name: 'Shohei Ohtani', team: 'LAD', position: 'DH', status: 'rostered', rosteredBy: 'Home Run Heroes', projectedPoints: 458, lastWeekPoints: 21.8, rank: 3 },
  { id: 4, name: 'Gunnar Henderson', team: 'BAL', position: 'SS', status: 'available', projectedPoints: 387, lastWeekPoints: 18.3, rank: 15 },
  { id: 5, name: 'Elly De La Cruz', team: 'CIN', position: 'SS', status: 'available', projectedPoints: 392, lastWeekPoints: 16.7, rank: 12 },
  { id: 6, name: 'Yordan Alvarez', team: 'HOU', position: 'DH', status: 'available', projectedPoints: 405, lastWeekPoints: 19.2, rank: 9 },
  { id: 7, name: 'Paul Skenes', team: 'PIT', position: 'SP', status: 'available', projectedPoints: 298, lastWeekPoints: 24.6, rank: 28 },
  { id: 8, name: 'Jackson Merrill', team: 'SD', position: 'OF', status: 'available', projectedPoints: 312, lastWeekPoints: 14.8, rank: 42 },
  { id: 9, name: 'Bryce Harper', team: 'PHI', position: '1B', status: 'waiver', projectedPoints: 378, lastWeekPoints: 17.5, rank: 18 },
  { id: 10, name: 'Tarik Skubal', team: 'DET', position: 'SP', status: 'available', projectedPoints: 364, lastWeekPoints: 26.3, rank: 21 },
  { id: 11, name: 'Juan Soto', team: 'NYY', position: 'OF', status: 'rostered', rosteredBy: 'Sluggers United', projectedPoints: 445, lastWeekPoints: 20.4, rank: 5 },
  { id: 12, name: 'Pete Alonso', team: 'NYM', position: '1B', status: 'available', projectedPoints: 342, lastWeekPoints: 13.7, rank: 35 },
  { id: 13, name: 'Trea Turner', team: 'PHI', position: 'SS', status: 'available', projectedPoints: 368, lastWeekPoints: 15.9, rank: 24 },
  { id: 14, name: 'Logan Webb', team: 'SF', position: 'SP', status: 'available', projectedPoints: 324, lastWeekPoints: 19.8, rank: 38 },
  { id: 15, name: 'Randy Arozarena', team: 'TB', position: 'OF', status: 'available', projectedPoints: 298, lastWeekPoints: 11.2, rank: 52 },
];

export function PlayerSearch({ onNavigate }: PlayerSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPosition, setFilterPosition] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('rank');

  let filteredPlayers = ALL_PLAYERS
    .filter(p => filterPosition === 'ALL' || p.position === filterPosition)
    .filter(p => filterStatus === 'all' || p.status === filterStatus)
    .filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.team.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Sort players
  filteredPlayers = [...filteredPlayers].sort((a, b) => {
    switch (sortBy) {
      case 'rank':
        return a.rank - b.rank;
      case 'projected':
        return b.projectedPoints - a.projectedPoints;
      case 'lastWeek':
        return b.lastWeekPoints - a.lastWeekPoints;
      default:
        return 0;
    }
  });

  const availablePlayers = filteredPlayers.filter(p => p.status === 'available');
  const waiverPlayers = filteredPlayers.filter(p => p.status === 'waiver');

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
              <h1>Player Search</h1>
              <p className="text-slate-600 mt-1">Browse and add players to your roster</p>
            </div>
            <Button variant="outline" onClick={() => onNavigate('team')}>
              My Roster
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search & Filters */}
        <Card className="p-6 mb-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Search players or teams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Select value={filterPosition} onValueChange={setFilterPosition}>
                <SelectTrigger>
                  <SelectValue placeholder="Position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Positions</SelectItem>
                  <SelectItem value="C">Catcher</SelectItem>
                  <SelectItem value="1B">First Base</SelectItem>
                  <SelectItem value="2B">Second Base</SelectItem>
                  <SelectItem value="3B">Third Base</SelectItem>
                  <SelectItem value="SS">Shortstop</SelectItem>
                  <SelectItem value="OF">Outfield</SelectItem>
                  <SelectItem value="DH">Designated Hitter</SelectItem>
                  <SelectItem value="SP">Starting Pitcher</SelectItem>
                  <SelectItem value="RP">Relief Pitcher</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rank">Overall Rank</SelectItem>
                  <SelectItem value="projected">Projected Points</SelectItem>
                  <SelectItem value="lastWeek">Last Week Points</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Players Tabs */}
        <Tabs value={filterStatus} onValueChange={setFilterStatus}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Players</TabsTrigger>
            <TabsTrigger value="available">Available ({availablePlayers.length})</TabsTrigger>
            <TabsTrigger value="waiver">Waivers ({waiverPlayers.length})</TabsTrigger>
            <TabsTrigger value="rostered">Rostered</TabsTrigger>
          </TabsList>

          <TabsContent value={filterStatus}>
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-100 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left">Rank</th>
                      <th className="px-4 py-3 text-left">Player</th>
                      <th className="px-4 py-3 text-left">Team</th>
                      <th className="px-4 py-3 text-center">Pos</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Proj</th>
                      <th className="px-4 py-3 text-right">Last Week</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredPlayers.map((player) => (
                      <tr key={player.id} className="hover:bg-slate-50">
                        <td className="px-4 py-4 text-slate-600">
                          #{player.rank}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            {player.name}
                            {player.lastWeekPoints > 20 && (
                              <TrendingUp className="w-4 h-4 text-emerald-600" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-slate-600">{player.team}</td>
                        <td className="px-4 py-4 text-center">
                          <Badge variant="outline">{player.position}</Badge>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {player.status === 'available' && (
                            <Badge className="bg-emerald-600">Available</Badge>
                          )}
                          {player.status === 'waiver' && (
                            <Badge variant="outline" className="border-amber-500 text-amber-700">
                              Waiver
                            </Badge>
                          )}
                          {player.status === 'rostered' && (
                            <Badge variant="outline" className="border-slate-400 text-slate-600">
                              Rostered
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right text-slate-600">
                          {player.projectedPoints}
                        </td>
                        <td className="px-4 py-4 text-right text-emerald-600">
                          {player.lastWeekPoints}
                        </td>
                        <td className="px-4 py-4 text-right">
                          {player.status === 'available' && (
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                              <Plus className="w-4 h-4 mr-1" />
                              Add
                            </Button>
                          )}
                          {player.status === 'waiver' && (
                            <Button size="sm" variant="outline">
                              Claim
                            </Button>
                          )}
                          {player.status === 'rostered' && (
                            <span className="text-slate-500">{player.rosteredBy}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredPlayers.length === 0 && (
                <div className="text-center py-12 text-slate-600">
                  <p>No players found matching your criteria</p>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        {/* Info Card */}
        <Card className="p-6 mt-6 bg-blue-50 border-blue-200">
          <h4 className="mb-2">How to Add Players</h4>
          <ul className="space-y-2 text-slate-700">
            <li>• <strong>Available:</strong> Add immediately to your roster (drop required if full)</li>
            <li>• <strong>Waivers:</strong> Submit a claim; processed Wed/Sat at 3am ET</li>
            <li>• <strong>Rostered:</strong> Request a trade with the current owner</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
