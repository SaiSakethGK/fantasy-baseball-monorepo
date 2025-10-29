import { ArrowLeft, Trophy, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import type { Page } from '../App';

interface StandingsProps {
  onNavigate: (page: Page) => void;
  leagueName: string;
}

interface TeamStanding {
  rank: number;
  team: string;
  owner: string;
  wins: number;
  losses: number;
  ties: number;
  winPct: number;
  pointsFor: number;
  pointsAgainst: number;
  streak: string;
  isUser: boolean;
}

const STANDINGS: TeamStanding[] = [
  { rank: 1, team: 'Championship Chasers', owner: 'Alex M.', wins: 10, losses: 2, ties: 0, winPct: .833, pointsFor: 1245.8, pointsAgainst: 1089.3, streak: 'W5', isUser: false },
  { rank: 2, team: 'Home Run Heroes', owner: 'Jordan K.', wins: 9, losses: 3, ties: 0, winPct: .750, pointsFor: 1198.6, pointsAgainst: 1102.7, streak: 'W3', isUser: false },
  { rank: 3, team: 'The Bombers', owner: 'You', wins: 8, losses: 4, ties: 0, winPct: .667, pointsFor: 1187.4, pointsAgainst: 1078.5, streak: 'W2', isUser: true },
  { rank: 4, team: 'Sluggers United', owner: 'Sam T.', wins: 7, losses: 5, ties: 0, winPct: .583, pointsFor: 1156.2, pointsAgainst: 1134.8, streak: 'L1', isUser: false },
  { rank: 5, team: 'Diamond Kings', owner: 'Taylor R.', wins: 6, losses: 6, ties: 0, winPct: .500, pointsFor: 1112.9, pointsAgainst: 1145.3, streak: 'L2', isUser: false },
  { rank: 6, team: 'Playoff Bound', owner: 'Morgan P.', wins: 6, losses: 6, ties: 0, winPct: .500, pointsFor: 1089.7, pointsAgainst: 1156.1, streak: 'W1', isUser: false },
  { rank: 7, team: 'Fastball Fanatics', owner: 'Casey W.', wins: 5, losses: 7, ties: 0, winPct: .417, pointsFor: 1078.4, pointsAgainst: 1167.9, streak: 'L3', isUser: false },
  { rank: 8, team: 'Curveball Crew', owner: 'Riley D.', wins: 4, losses: 8, ties: 0, winPct: .333, pointsFor: 1023.5, pointsAgainst: 1198.2, streak: 'L1', isUser: false },
];

export function Standings({ onNavigate, leagueName }: StandingsProps) {
  const playoffCutoff = 6;
  
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
              <h1>{leagueName || 'Fantasy Baseball League'} Standings</h1>
              <p className="text-slate-600 mt-1">2025 Season • Week 12 of 24</p>
            </div>
            <Button variant="outline" onClick={() => onNavigate('matchups')}>
              View Matchups
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* League Info Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card className="p-6 text-center">
            <div className="text-slate-600 mb-2">Your Rank</div>
            <div className="text-emerald-600 flex items-center justify-center gap-2">
              <Trophy className="w-5 h-5" />
              <span>3rd</span>
            </div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-slate-600 mb-2">Your Record</div>
            <div>8-4-0</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-slate-600 mb-2">Games Back</div>
            <div>2.0 GB</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-slate-600 mb-2">Playoff Position</div>
            <Badge className="bg-emerald-600">Clinched</Badge>
          </Card>
        </div>

        {/* Standings Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-100">
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead className="text-center">W</TableHead>
                  <TableHead className="text-center">L</TableHead>
                  <TableHead className="text-center">T</TableHead>
                  <TableHead className="text-center">Win %</TableHead>
                  <TableHead className="text-right">PF</TableHead>
                  <TableHead className="text-right">PA</TableHead>
                  <TableHead className="text-center">Streak</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {STANDINGS.map((team) => (
                  <TableRow 
                    key={team.rank} 
                    className={`
                      ${team.isUser ? 'bg-emerald-50' : ''}
                      ${team.rank <= playoffCutoff ? '' : 'opacity-60'}
                    `}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{team.rank}</span>
                        {team.rank === 1 && <Trophy className="w-4 h-4 text-amber-500" />}
                        {team.rank <= playoffCutoff && team.rank !== 1 && (
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {team.team}
                        {team.isUser && <Badge className="bg-emerald-600">YOU</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">{team.owner}</TableCell>
                    <TableCell className="text-center">{team.wins}</TableCell>
                    <TableCell className="text-center">{team.losses}</TableCell>
                    <TableCell className="text-center">{team.ties}</TableCell>
                    <TableCell className="text-center">{team.winPct.toFixed(3)}</TableCell>
                    <TableCell className="text-right">{team.pointsFor.toFixed(1)}</TableCell>
                    <TableCell className="text-right">{team.pointsAgainst.toFixed(1)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {team.streak.startsWith('W') ? (
                          <TrendingUp className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                        <span className={team.streak.startsWith('W') ? 'text-emerald-600' : 'text-red-600'}>
                          {team.streak}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Legend */}
          <div className="bg-slate-50 border-t border-slate-200 p-4">
            <div className="flex flex-wrap gap-6 text-slate-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Playoff Position</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>1st Place</span>
              </div>
              <div>PF = Points For</div>
              <div>PA = Points Against</div>
            </div>
          </div>
        </Card>

        {/* Additional Stats */}
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <Card className="p-6">
            <h3 className="mb-4">Playoff Picture</h3>
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 rounded-lg">
                <div className="text-emerald-900 mb-1">Top 6 teams make playoffs</div>
                <div className="text-emerald-700">Top 2 teams get first-round bye</div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Weeks remaining</span>
                  <span>12 weeks</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Playoff start</span>
                  <span>Week 23</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Championship</span>
                  <span>Week 24</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4">League Leaders</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <div className="text-slate-600">Most Points For</div>
                  <div>Championship Chasers</div>
                </div>
                <div className="text-emerald-600">1,245.8</div>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <div className="text-slate-600">Longest Win Streak</div>
                  <div>Championship Chasers</div>
                </div>
                <div className="text-emerald-600">5 wins</div>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <div className="text-slate-600">Highest Single Week</div>
                  <div>Home Run Heroes</div>
                </div>
                <div className="text-emerald-600">142.7</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
