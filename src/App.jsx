import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { Workspace } from './components/Workspace';

function App() {
  const [sessions, setSessions] = useState([]);
  const [currentView, setCurrentView] = useState('landing');
  const [currentSession, setCurrentSession] = useState(null);
  
  // Settings & Context state
  const [theme, setTheme] = useState('dark');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');

  useEffect(() => {
    // Load history
    const saved = localStorage.getItem('course_chat_history');
    if (saved) {
      try { setSessions(JSON.parse(saved)); } catch(e) {}
    }
    // Load Theme
    const savedTheme = localStorage.getItem('app_theme') || 'dark';
    setTheme(savedTheme);
    document.body.setAttribute('data-theme', savedTheme);
    // Load API Key
    const key = localStorage.getItem('foundry_api_key') || '';
    setApiKeyInput(key);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('app_theme', newTheme);
  };

  const saveSettings = () => {
    localStorage.setItem('foundry_api_key', apiKeyInput);
    setIsSettingsOpen(false);
  };

  const startNewChat = () => {
    const newSession = {
      id: Date.now().toString(),
      title: `Notebook ${sessions.length + 1}`,
      messages: []
    };
    setCurrentSession(newSession);
    
    const updatedSessions = [newSession, ...sessions];
    setSessions(updatedSessions);
    localStorage.setItem('course_chat_history', JSON.stringify(updatedSessions));
    
    setCurrentView('workspace');
  };

  const openSession = (session) => {
    if (!session.id) session.id = Date.now().toString(); // Fallback for old history
    setCurrentSession(session);
    setCurrentView('workspace');
  };

  const deleteSession = async (sessionToDelete) => {
    const updatedSessions = sessions.filter(s => s !== sessionToDelete);
    setSessions(updatedSessions);
    localStorage.setItem('course_chat_history', JSON.stringify(updatedSessions));
    // Also delete associated PDFs from IndexedDB dynamically
    if (sessionToDelete.id) {
      try {
        const { deleteFilesFromDB } = await import('./services/dbService');
        await deleteFilesFromDB(sessionToDelete.id);
      } catch (e) {
        console.error("Failed to delete PDFs from DB", e);
      }
    }
  };

  const goHome = () => {
    setCurrentView('landing');
    setCurrentSession(null);
  };

  return (
    <div className="app-container">
      
      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>API Settings</h3>
            <p style={{fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px'}}>
              Enter your Azure AI Foundry API Key here.
            </p>
            <input 
              type="password" 
              placeholder="Paste Azure API Key..." 
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
            />
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setIsSettingsOpen(false)}>Cancel</button>
              <button className="btn-primary" onClick={saveSettings}>Save Key</button>
            </div>
          </div>
        </div>
      )}

      {/* Global Navbar */}
      <nav className="navbar">
        <div className="nav-left" onClick={goHome} style={{cursor: 'pointer'}}>
          <svg className="logo-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="logo-text">Course AI</span>
        </div>
        
        <div className="nav-center">
          {/* Empty center */}
        </div>

        <div className="nav-right" style={{display: 'flex', alignItems: 'center', gap: '24px'}}>
          <div className="nav-dropdown">
            <div className="nav-link">SETTINGS <span>▼</span></div>
            <div className="nav-dropdown-content">
              <a onClick={() => setIsSettingsOpen(true)}>API Keys</a>
              <a onClick={toggleTheme}>Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode</a>
            </div>
          </div>

          {currentView === 'workspace' && (
             <div style={{display: 'flex', gap: '12px'}}>
               <button 
                 className="btn-primary" 
                 style={{background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', border: 'none', padding: '10px 16px', borderRadius: '50px'}}
                 onClick={() => window.dispatchEvent(new Event('toggle-quiz-mode'))}
               >
                 🧠 FlashCards
               </button>
               <button className="btn-secondary" onClick={startNewChat}>New Chat</button>
             </div>
          )}
        </div>
      </nav>

      {/* Main View Router */}
      {currentView === 'landing' ? (
        <LandingPage 
          sessions={sessions} 
          onNewChat={startNewChat}
          onOpenSession={openSession}
          onDeleteSession={deleteSession}
        />
      ) : (
        <Workspace 
          currentSession={currentSession}
          onSaveSession={(messages) => {
            if (!currentSession) return;
            
            let title = currentSession.title;
            // Generate a smart title from the first message if it's currently generic
            if (messages.length > 0 && title.startsWith('Notebook')) {
                title = messages[0].content.substring(0, 25) + '...';
            }

            const updatedSession = { ...currentSession, title, messages };
            setCurrentSession(updatedSession);
            
            // Update the session in the global list
            const updatedSessions = sessions.map(s => s.id === updatedSession.id ? updatedSession : s);
            setSessions(updatedSessions);
            localStorage.setItem('course_chat_history', JSON.stringify(updatedSessions));
           }}
        />
      )}

    </div>
  );
}

export default App;
