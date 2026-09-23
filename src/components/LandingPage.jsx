import React from 'react';
import './LandingPage.css';

export function LandingPage({ sessions, onNewChat, onOpenSession, onDeleteSession }) {
  return (
    <div className="landing-container">
      <div className="landing-header">
        <h1>Welcome to Course AI</h1>
        <p>Your intelligent, source-grounded study assistant.</p>
      </div>

      <div className="landing-actions">
        <button className="btn-new-notebook" onClick={onNewChat}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          New Notebook
        </button>
      </div>

      <div className="recent-notebooks-section">
        <h2>Recent Notebooks</h2>
        {sessions.length === 0 ? (
          <div className="empty-state">No recent notebooks. Create a new one to get started!</div>
        ) : (
          <div className="notebook-grid">
            {sessions.map((session, idx) => (
              <div key={idx} className="notebook-card" onClick={() => onOpenSession(session)}>
                <div className="notebook-icon">📓</div>
                <div className="notebook-title">{session.title || `Notebook ${idx + 1}`}</div>
                <div className="notebook-meta">{session.messages.length} messages</div>
                <button 
                  className="btn-delete-session" 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onDeleteSession(session); 
                  }}
                  title="Delete Notebook"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
