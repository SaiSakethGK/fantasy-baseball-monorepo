import { useState } from 'react';
import { Home } from './components/Home';
import { LeagueCreation } from './components/LeagueCreation';
import { DraftRoom } from './components/DraftRoom';
import { TeamManagement } from './components/TeamManagement';
import { Matchups } from './components/Matchups';
import { Standings } from './components/Standings';
import { PlayerSearch } from './components/PlayerSearch';
import { Trades } from './components/Trades';
import Waivers from './components/Waivers';

export type Page = 'home' | 'create-league' | 'draft' | 'team' | 'matchups' | 'standings' | 'players' | 'trades' | 'waivers';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [userTeamName, setUserTeamName] = useState('The Bombers');
  const [leagueName, setLeagueName] = useState('');

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onNavigate={setCurrentPage} />;
      case 'create-league':
        return <LeagueCreation onNavigate={setCurrentPage} onLeagueCreated={setLeagueName} />;
      case 'draft':
        return <DraftRoom onNavigate={setCurrentPage} userTeamName={userTeamName} />;
      case 'team':
        return <TeamManagement onNavigate={setCurrentPage} userTeamName={userTeamName} />;
      case 'matchups':
        return <Matchups onNavigate={setCurrentPage} userTeamName={userTeamName} />;
      case 'standings':
        return <Standings onNavigate={setCurrentPage} leagueName={leagueName} />;
      case 'players':
        return <PlayerSearch onNavigate={setCurrentPage} />;
      case 'trades':
        return <Trades onNavigate={setCurrentPage} userTeamName={userTeamName} />;
      case 'waivers':
        return <Waivers onNavigate={setCurrentPage} userTeamName={userTeamName} />;
      default:
        return <Home onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {renderPage()}
    </div>
  );
}
