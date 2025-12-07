import React, { useState } from 'react';
import HomePage from './pages/HomePage';
import OverviewPage from './pages/OverviewPage';
import ComparePage from './pages/ComparePage';
import DocsPage from './pages/DocsPage';

export type View = 'home' | 'overview' | 'compare' | 'docs';

const App: React.FC = () => {
  const [view, setView] = useState<View>('home');
  const [homeSelectedCode, setHomeSelectedCode] = useState<string | null>(null);
  const [homeSelectedName, setHomeSelectedName] = useState<string | null>(null);

  return (
    <div className="app-shell">
      {view === 'home' && (
        <HomePage
          setView={setView}
          setSelectedCode={setHomeSelectedCode}
          setSelectedName={setHomeSelectedName}
        />
      )}
      {view === 'overview' && (
        <OverviewPage
          goHome={() => setView('home')}
          initialCode={homeSelectedCode}
          initialName={homeSelectedName}
        />
      )}
      {view === 'compare' && (
        <ComparePage goHome={() => setView('home')} />
      )}
      {view === 'docs' && (
        <DocsPage goHome={() => setView('home')} />
      )}
    </div>
  );
};

export default App;
