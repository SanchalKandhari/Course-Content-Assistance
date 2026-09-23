import React, { useState, useEffect } from 'react';
import { sendQueryToCourseAgent } from '../services/foundryService';
import './CourseAssistantChat.css';

export function CourseAssistantChat({ onChatSave, initialMessages = [], contextText = "" }) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // If initialMessages change (user switches notebook), update chat.
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const currentQuery = input.trim();
    const updatedMessages = [...messages, { role: 'user', content: currentQuery }];

    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    let finalMessages = updatedMessages;

    try {
      const assistantReply = await sendQueryToCourseAgent(currentQuery, messages, contextText);
      finalMessages = [
        ...updatedMessages,
        { role: 'assistant', content: assistantReply }
      ];
      setMessages(finalMessages);
    } catch (err) {
      finalMessages = [
        ...updatedMessages,
        { role: 'assistant', content: `Error: ${err.message}` }
      ];
      setMessages(finalMessages);
    } finally {
      setIsLoading(false);
      if (onChatSave) onChatSave(finalMessages);
    }
  };

  return (
    <div className="chat-container">
      
      {/* Messages Window */}
      <div className="messages-window">
        {messages.length === 0 && (
          <div className="empty-chat-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{opacity: 0.3, marginBottom: '16px'}}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            <p>Upload a source in the Left Panel,<br/>then ask a question here!</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-bubble-wrapper ${msg.role}`}>
            <div className={`chat-bubble ${msg.role}`}>
              <span className="role-indicator">
                {msg.role === 'user' ? 'You' : 'Assistant'}
              </span>
              <p>{msg.content}</p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="loading-indicator">
            <div className="typing-dots">
              <span></span><span></span><span></span>
            </div>
            <p>Analyzing context...</p>
          </div>
        )}
      </div>

      {/* User Input Bar */}
      <div className="input-bar">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your sources..."
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button id="send-btn" className="btn-send" onClick={handleSend} disabled={isLoading || !input.trim()}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </div>
    </div>
  );
}
