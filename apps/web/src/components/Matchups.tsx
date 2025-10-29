import { ArrowLeft, TrendingUp, Trophy, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import type { Page } from '../App';

interface MatchupsProps {
  onNavigate: (page: Page) => void;
  userTeamName: string;
}

interface Matchup {
  id: number;
  team1: string;
  team2: string;
  team1Score: number;
  team2Score: number;
  team1Record: string;
  team2Record: string;
  isUserMatchup: boolean;
}

const MATCHUPS: Matchup[] = [
  { id: 1, team1: 'The Bombers', team2: 'Diamond Kings', team1Score: 87.4, team2Score: 72.3, team1Record: '8-4', team2Record: '6-6', isUserMatchup: true },
  { id: 2, team1: 'Sluggers United', team2: 'Fastball Fanatics', team1Score: 65.8, team2Score: 81.2, team1Record: '7-5', team2Record: '5-7', isUserMatchup: false },
  { id: 3, team1: 'Home Run Heroes', team2: 'Curveball Crew', team1Score: 78.5, team2Score: 76.9, team1Record: '9-3', team2Record: '4-8', isUserMatchup: false },
  { id: 4, team1: 'Playoff Bound', team2: 'Championship Chasers', team1Score: 69.3, team2Score: 88.1, team1Record: '6-6', team2Record: '10-2', isUserMatchup: false },
];

interface PlayerPerformance {
  name: string;
  position: string;
  points: number;
  stats: string;
}

const USER_TEAM_PERFORMANCES: PlayerPerformance[] = [
  { name: 'Spencer Strider', position: 'SP', points: 28.5, stats: '7 IP, 11 K, 1 ER, W' },
  { name: 'Ronald Acuña Jr.', position: 'OF', points: 24.5, stats: '3-5, 2 HR, 4 RBI, 1 SB' },
  { name: 'Gerrit Cole', position: 'SP', points: 25.2, stats: '6.2 IP, 9 K, 2 ER, W' },
  { name: 'Shohei Ohtani', position: 'DH', points: 22.1, stats: '2-4, 1 HR, 2 RBI, 2 BB' },
  { name: 'Jose Ramirez', position: '3B', points: 21.3, stats: '4-5, 1 HR, 3 RBI, 1 SB' },
  { name: 'Mookie Betts', position: 'OF', points: 19.6, stats: '3-4, 1 2B, 2 RBI, 1 R' },
  { name: 'Bobby Witt Jr.', position: 'SS', points: 18.2, stats: '2-4, 1 HR, 2 RBI, 1 SB' },
  { name: 'Julio Rodríguez', position: 'OF', points: 16.7, stats: '2-5, 1 2B, 1 RBI, 2 R' },
];

const OPPONENT_PERFORMANCES: PlayerPerformance[] = [
  { name: 'Kyle Tucker', position: 'OF', points: 22.3, stats: '3-4, 1 HR, 3 RBI' },
  { name: 'Corbin Burnes', position: 'SP', points: 19.8, stats: '6 IP, 8 K, 2 ER' },
  { name: 'Freddie Freeman', position: '1B', points: 18.5, stats: '3-5, 1 HR, 2 RBI' },
  { name: 'Matt Olson', position: '1B', points: 11.7, stats: '2-4, 1 RBI, 1 R' },
];

export function Matchups({ onNavigate, userTeamName }: MatchupsProps) {
  const userMatchup = MATCHUPS.find(m => m.isUserMatchup)!;
  const isUserTeam1 = userMatchup.team1 === userTeamName;
  const userScore = isUserTeam1 ? userMatchup.team1Score : userMatchup.team2Score;
  const opponentScore = isUserTeam1 ? userMatchup.team2Score : userMatchup.team1Score;
  const opponentName = isUserTeam1 ? userMatchup.team2 : userMatchup.team1;
  const totalScore = userScore + opponentScore;
  const userPercentage = (userScore / totalScore) * 100;

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
          <div className="flex items-center justify-between">
            <div>
              <h1>Week 12 Matchups</h1>
              <p className="text-slate-600 mt-1">Live scoring • Updates every 5 minutes</p>
            </div>
            <Button variant="outline" onClick={() => onNavigate('standings')}>
              View Standings
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* User's Featured Matchup */}
        <Card className="p-8 mb-6 bg-gradient-to-br from-emerald-50 to-blue-50 border-emerald-200">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Trophy className="w-5 h-5 text-emerald-600" />
            <h3 className="text-emerald-900">Your Matchup</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-center mb-6">
            {/* User Team */}
            <div className="text-center">
              <Badge className="bg-emerald-600 mb-3">YOU</Badge>
              <h2>{userTeamName}</h2>
              <p className="text-slate-600 mb-4">{isUserTeam1 ? userMatchup.team1Record : userMatchup.team2Record}</p>
              <div className="text-emerald-600">{userScore} pts</div>
            </div>

            {/* VS */}
            <div className="text-center">
              <div className="text-slate-400 mb-2">WEEK 12</div>
              <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto border-2 border-slate-200">
                <span>VS</span>
              </div>
              <div className="mt-4">
                {userScore > opponentScore ? (
                  <Badge className="bg-emerald-600">Winning</Badge>
                ) : userScore < opponentScore ? (
                  <Badge variant="destructive">Losing</Badge>
                ) : (
                  <Badge variant="outline">Tied</Badge>
                )}
              </div>
            </div>

            {/* Opponent */}
            <div className="text-center">
              <Badge variant="outline" className="mb-3">OPPONENT</Badge>
              <h2>{opponentName}</h2>
              <p className="text-slate-600 mb-4">{isUserTeam1 ? userMatchup.team2Record : userMatchup.team1Record}</p>
              <div>{opponentScore} pts</div>
            </div>
          </div>

          {/* Score Progress Bar */}
          <div className="mb-2">
            <Progress value={userPercentage} className="h-3" />
          </div>
          <div className="flex justify-between text-slate-600">
            <span>You're {userScore > opponentScore ? 'ahead' : 'behind'} by {Math.abs(userScore - opponentScore).toFixed(1)} points</span>
            <span>{(userPercentage).toFixed(1)}%</span>
          </div>
        </Card>

        {/* Detailed Performance */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* User Team Performance */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <h3>Your Top Performers</h3>
            </div>
            <div className="space-y-3">
              {USER_TEAM_PERFORMANCES.map((player, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">{player.position}</Badge>
                      <span>{player.name}</span>
                    </div>
                    <div className="text-slate-600">{player.stats}</div>
                  </div>
                  <div className="text-emerald-600">{player.points}</div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4" onClick={() => onNavigate('team')}>
              View Full Roster
            </Button>
          </Card>

          {/* Opponent Performance */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-slate-600" />
              <h3>Opponent's Top Performers</h3>
            </div>
            <div className="space-y-3">
              {OPPONENT_PERFORMANCES.map((player, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">{player.position}</Badge>
                      <span>{player.name}</span>
                    </div>
                    <div className="text-slate-600">{player.stats}</div>
                  </div>
                  <div>{player.points}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Other Matchups */}
        <Card className="p-6">
          <h3 className="mb-4">Other Matchups This Week</h3>
          <div className="space-y-4">
            {MATCHUPS.filter(m => !m.isUserMatchup).map(matchup => (
              <div key={matchup.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-6 flex-1">
                  <div className="text-center min-w-[140px]">
                    <div>{matchup.team1}</div>
                    <div className="text-slate-500">{matchup.team1Record}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={matchup.team1Score > matchup.team2Score ? 'text-emerald-600' : ''}>
                      {matchup.team1Score}
                    </div>
                    <span className="text-slate-400">-</span>
                    <div className={matchup.team2Score > matchup.team1Score ? 'text-emerald-600' : ''}>
                      {matchup.team2Score}
                    </div>
                  </div>
                  <div className="text-center min-w-[140px]">
                    <div>{matchup.team2}</div>
                    <div className="text-slate-500">{matchup.team2Record}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
