import { Trophy, Users, TrendingUp, Award } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ImageWithFallback } from './figma/ImageWithFallback';
import type { Page } from '../App';

interface HomeProps {
  onNavigate: (page: Page) => void;
}

export function Home({ onNavigate }: HomeProps) {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative h-[500px] bg-slate-900 overflow-hidden">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1471295253337-3ceaaedca402?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2068"
          alt="Baseball stadium"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center items-center text-center">
          <Trophy className="w-16 h-16 text-emerald-400 mb-4" />
          <h1 className="text-white mb-4">Fantasy Baseball League Manager</h1>
          <p className="text-slate-300 max-w-2xl mb-8">
            Create your league, draft your dream team, and compete with friends in real-time fantasy baseball. 
            Live scoring, trades, waivers, and everything you need to dominate your league.
          </p>
          <div className="flex gap-4 flex-wrap justify-center">
            <Button 
              size="lg" 
              onClick={() => onNavigate('create-league')}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              Create a League
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              onClick={() => onNavigate('draft')}
            >
              View Demo Draft
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-center mb-12">Everything You Need to Win</h2>
        
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate('draft')}>
            <Users className="w-12 h-12 text-emerald-500 mb-4" />
            <h3 className="mb-2">Demo Snake Draft</h3>
            <p className="text-slate-600">
              Real-time draft room with auto-pick, queue management, and timer. Mobile-friendly for drafting anywhere.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate('matchups')}>
            <TrendingUp className="w-12 h-12 text-blue-500 mb-4" />
            <h3 className="mb-2">Live Scoring</h3>
            <p className="text-slate-600">
              Real-time fantasy points updated as games happen. Track head-to-head matchups and see your rank live.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate('trades')}>
            <Award className="w-12 h-12 text-amber-500 mb-4" />
            <h3 className="mb-3">Trades & Waivers</h3>
            <p className="text-slate-600">
              Propose trades, manage waivers, and add free agents. Commissioner tools for league management.
            </p>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="bg-slate-100 rounded-lg p-8">
          <h3 className="text-center mb-6">Explore the Platform</h3>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button variant="outline" onClick={() => onNavigate('team')}>
              Team Management
            </Button>
            <Button variant="outline" onClick={() => onNavigate('standings')}>
              League Standings
            </Button>
            <Button variant="outline" onClick={() => onNavigate('players')}>
              Player Search
            </Button>
            <Button variant="outline" onClick={() => onNavigate('matchups')}>
              Weekly Matchups
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
