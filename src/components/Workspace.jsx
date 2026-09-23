import React, { useState, useRef, useEffect } from 'react';
import { CourseAssistantChat } from './CourseAssistantChat';
import { Flashcards } from './Flashcards';
import { getFilesFromDB, saveFileToDB } from '../services/dbService';
import { extractTextFromPDF } from '../services/pdfService';
import './Workspace.css';

export function Workspace({ currentSession, onSaveSession }) {
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [activePdfUrl, setActivePdfUrl] = useState(null);
  const [sources, setSources] = useState([]);
  
  // Resizing state
  const [rightPanelWidth, setRightPanelWidth] = useState(40); // 40% width
  const [isDragging, setIsDragging] = useState(false);
  
  // Upload Animation state
  const [isUploading, setIsUploading] = useState(false);
  const [isQuizMode, setIsQuizMode] = useState(false);
  
  // PDF Text Context
  const [contextText, setContextText] = useState("");
  
  const fileInputRef = useRef(null);

  // Load persistent PDFs on mount
  useEffect(() => {
    if (currentSession && currentSession.id) {
      getFilesFromDB(currentSession.id).then(async (dbFiles) => {
        if (dbFiles.length > 0) {
          setSources(dbFiles);
          setActivePdfUrl(URL.createObjectURL(dbFiles[0]));
          
          // Extract text for AI context
          let fullText = "";
          for (const f of dbFiles) fullText += await extractTextFromPDF(f) + "\n";
          setContextText(fullText);

          window.dispatchEvent(new CustomEvent('workspace-files-added', { detail: dbFiles }));
        }
      }).catch(err => console.error("Error loading files from DB:", err));
    }
  }, [currentSession?.id]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const containerWidth = document.body.clientWidth;
      const newWidth = ((containerWidth - e.clientX) / containerWidth) * 100;
      if (newWidth > 20 && newWidth < 70) {
        setRightPanelWidth(newWidth);
      }
    };
    const handleMouseUp = () => setIsDragging(false);
    
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Listen for the global Navbar Flashcard button toggle
  useEffect(() => {
    const handleToggleQuiz = () => setIsQuizMode(prev => !prev);
    window.addEventListener('toggle-quiz-mode', handleToggleQuiz);
    return () => window.removeEventListener('toggle-quiz-mode', handleToggleQuiz);
  }, []);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setIsUploading(true);
      // Simulate a beautiful upload delay
      setTimeout(async () => {
        setSources(prev => [...prev, ...files]);
        if (!activePdfUrl) {
          const url = URL.createObjectURL(files[0]);
          setActivePdfUrl(url);
        }
        
        // Save to IndexedDB persistently
        if (currentSession && currentSession.id) {
          files.forEach(f => saveFileToDB(currentSession.id, f).catch(console.error));
        }

        // Extract text
        let newText = "";
        for (const f of files) newText += await extractTextFromPDF(f) + "\n";
        setContextText(prev => prev + "\n" + newText);

        window.dispatchEvent(new CustomEvent('workspace-files-added', { detail: files }));
        setIsUploading(false);
      }, 1500);
    }
  };

  const openPdf = (file) => {
    const url = URL.createObjectURL(file);
    setActivePdfUrl(url);
  };

  return (
    <div className={`workspace-container ${isDragging ? 'resizing' : ''}`}>
      
      {/* Left Panel: Source Manager */}
      <div className={`workspace-left-panel ${isLeftPanelOpen ? 'open' : 'closed'}`}>
        <div className="left-panel-header">
          {isLeftPanelOpen && <h3>Sources</h3>}
          <button className="btn-toggle-panel" onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}>
            {isLeftPanelOpen ? '◁' : '▷'}
          </button>
        </div>
        
        {isLeftPanelOpen && (
          <div className="left-panel-content">
            <input 
              type="file" 
              accept=".pdf" 
              multiple 
              ref={fileInputRef} 
              style={{display: 'none'}} 
              onChange={handleFileUpload} 
            />
            <button className="btn-add-source" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
              {isUploading ? (
                <div className="upload-spinner"></div>
              ) : (
                "+ Add Source"
              )}
            </button>
            
            <div className="sources-list">
              {sources.length === 0 ? (
                <div className="empty-sources">No sources uploaded yet.</div>
              ) : (
                sources.map((file, idx) => (
                  <div key={idx} className="source-item" onClick={() => openPdf(file)}>
                    📄 {file.name}
                  </div>
                ))
              )}
            </div>

            {sources.length > 0 && (
              <button 
                className="btn-quiz-mode" 
                onClick={() => setIsQuizMode(!isQuizMode)}
                style={{marginTop: '24px', width: '100%', padding: '12px', background: isQuizMode ? 'var(--bg-input)' : 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500'}}
              >
                {isQuizMode ? 'Exit Flashcards' : '🧠 Study Flashcards'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Center Panel: Chat or Quiz Interface */}
      <div className="workspace-center-panel">
        {isQuizMode ? (
          <Flashcards sources={sources} currentSession={currentSession} contextText={contextText} />
        ) : (
          <CourseAssistantChat 
            onChatSave={onSaveSession} 
            initialMessages={currentSession ? currentSession.messages : []}
            contextText={contextText}
          />
        )}
      </div>

      {/* RESIZER HANDLE */}
      <div 
        className="resizer-handle" 
        onMouseDown={(e) => { e.preventDefault(); setIsDragging(true); }}
      />

      {/* Right Panel: PDF Viewer */}
      <div className="workspace-right-panel" style={{ width: `${rightPanelWidth}%`, minWidth: 'auto' }}>
        {activePdfUrl ? (
          <iframe 
            src={activePdfUrl} 
            className="pdf-viewer-iframe" 
            title="PDF Viewer"
          />
        ) : (
          <div className="empty-pdf-viewer">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{opacity: 0.3, marginBottom: '16px'}}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            <p>Upload or select a source<br/>to view it here.</p>
          </div>
        )}
      </div>
      
    </div>
  );
}
