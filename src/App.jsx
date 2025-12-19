import { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Navigation from './components/Navigation/Navigation';
import Home from './components/Home/Home';
import Calendar from './components/Calendar/Calendar';
import Analytics from './components/Analytics/Analytics';
import Transactions from './components/Transactions/Transactions';
import Settings from './components/Settings/Settings';

// Import component styles
import './components/Home/Home.css';
import './components/Calendar/Calendar.css';
import './components/Analytics/Analytics.css';
import './components/Transactions/Transactions.css';
import './components/Settings/Settings.css';

function AppContent() {
  const { activeTab, settings } = useApp();

  // Apply theme to document body
  useEffect(() => {
    const theme = settings?.theme || 'dark';
    document.body.setAttribute('data-theme', theme);
  }, [settings?.theme]);

  const renderTab = () => {
    switch (activeTab) {
      case 'home':
        return <Home />;
      case 'calendar':
        return <Calendar />;
      case 'analytics':
        return <Analytics />;
      case 'transactions':
        return <Transactions />;
      case 'settings':
        return <Settings />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="app-container">
      <main className="main-content">
        {renderTab()}
      </main>
      <Navigation />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
