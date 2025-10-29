import { useState } from 'react';
import { ArrowLeft, Users, Settings, Calendar } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { Page } from '../App';

interface LeagueCreationProps {
  onNavigate: (page: Page) => void;
  onLeagueCreated: (name: string) => void;
}

export function LeagueCreation({ onNavigate, onLeagueCreated }: LeagueCreationProps) {
  const [leagueName, setLeagueName] = useState('');
  const [teamCount, setTeamCount] = useState('10');
  const [scoringType, setScoringType] = useState('h2h');
  const [draftType, setDraftType] = useState('snake');

  const handleCreateLeague = () => {
    if (leagueName.trim()) {
      onLeagueCreated(leagueName);
      onNavigate('draft');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button
            variant="ghost"
            onClick={() => onNavigate('home')}
            className="mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <h1>Create Your League</h1>
          <p className="text-slate-600 mt-2">
            Set up your fantasy baseball league in minutes. Customize scoring, roster rules, and draft settings.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 text-center">
            <Users className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <h3 className="mb-2">Step 1</h3>
            <p className="text-slate-600">League basics & team count</p>
          </Card>
          <Card className="p-6 text-center">
            <Settings className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="mb-2">Step 2</h3>
            <p className="text-slate-600">Scoring & roster rules</p>
          </Card>
          <Card className="p-6 text-center">
            <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="mb-2">Step 3</h3>
            <p className="text-slate-600">Schedule draft & invite</p>
          </Card>
        </div>

        <Card className="p-8">
          <h2 className="mb-6">League Settings</h2>
          
          <div className="space-y-6">
            <div>
              <Label htmlFor="league-name">League Name *</Label>
              <Input
                id="league-name"
                placeholder="Enter league name (e.g., 'Commissioner's Cup 2025')"
                value={leagueName}
                onChange={(e) => setLeagueName(e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="team-count">Number of Teams</Label>
              <Select value={teamCount} onValueChange={setTeamCount}>
                <SelectTrigger id="team-count" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="8">8 Teams</SelectItem>
                  <SelectItem value="10">10 Teams</SelectItem>
                  <SelectItem value="12">12 Teams</SelectItem>
                  <SelectItem value="14">14 Teams</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="scoring-type">Scoring Format</Label>
              <Select value={scoringType} onValueChange={setScoringType}>
                <SelectTrigger id="scoring-type" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="h2h">Head-to-Head Points</SelectItem>
                  <SelectItem value="h2h-cat">Head-to-Head Categories</SelectItem>
                  <SelectItem value="roto">Rotisserie</SelectItem>
                  <SelectItem value="points">Points Only</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-slate-500 mt-2">
                {scoringType === 'h2h' && 'Weekly matchups with fantasy points scoring'}
                {scoringType === 'h2h-cat' && 'Weekly matchups across stat categories'}
                {scoringType === 'roto' && 'Season-long rankings across categories'}
                {scoringType === 'points' && 'Cumulative points throughout season'}
              </p>
            </div>

            <div>
              <Label htmlFor="draft-type">Draft Type</Label>
              <Select value={draftType} onValueChange={setDraftType}>
                <SelectTrigger id="draft-type" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="snake">Snake Draft</SelectItem>
                  <SelectItem value="auction">Auction Draft</SelectItem>
                  <SelectItem value="linear">Linear Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h4 className="mb-3">Default Roster Positions</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-700">
                <div>C: 1</div>
                <div>1B: 1</div>
                <div>2B: 1</div>
                <div>3B: 1</div>
                <div>SS: 1</div>
                <div>OF: 3</div>
                <div>UTIL: 2</div>
                <div>SP: 4</div>
                <div>RP: 2</div>
                <div>P: 2</div>
                <div>Bench: 5</div>
                <div>DL: 2</div>
              </div>
              <p className="text-slate-500 mt-3">
                You can customize roster positions after creating the league
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleCreateLeague}
                disabled={!leagueName.trim()}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                Create League & Continue
              </Button>
              <Button
                variant="outline"
                onClick={() => onNavigate('home')}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6 mt-6 bg-blue-50 border-blue-200">
          <h4 className="mb-2">What happens next?</h4>
          <ul className="space-y-2 text-slate-700">
            <li>• You'll get a unique league invite link to share with friends</li>
            <li>• Schedule your draft date and time</li>
            <li>• Customize scoring rules and roster settings</li>
            <li>• Start drafting when everyone joins!</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
