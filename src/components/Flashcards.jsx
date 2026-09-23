import React, { useState, useEffect, useCallback } from 'react';
import { generateFlashcards } from '../services/foundryService';
import './Flashcards.css';

export function Flashcards({ sources, currentSession, contextText = "" }) {
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);

  const fetchCards = useCallback(async () => {
    if (!contextText.trim()) return;
    try {
      setIsLoading(true);
      setError(null);
      const cards = await generateFlashcards(contextText);
      setFlashcards(cards);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [contextText]);

  useEffect(() => {
    if (contextText.trim()) {
      fetchCards();
    }
  }, [fetchCards, contextText]);

  const handleOptionClick = (idx) => {
    if (isAnswerRevealed) return; 
    setSelectedOption(idx);
    setIsAnswerRevealed(true);
  };

  const nextCard = () => {
    setSelectedOption(null);
    setIsAnswerRevealed(false);
    setCurrentIndex((prev) => prev + 1);
  };

  if (!contextText || contextText.trim() === "") {
    return (
      <div className="flashcards-container centered">
        <h2>No Sources Found</h2>
        <p style={{color: 'var(--text-secondary)'}}>Please upload a PDF document first so the AI has material to test you on!</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flashcards-container centered">
        <div className="upload-spinner" style={{width: '40px', height: '40px'}}></div>
        <p style={{marginTop: '16px', color: 'var(--text-secondary)'}}>Generating a fresh set of flashcards...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flashcards-container centered">
        <div className="error-box">
          <p>Failed to generate flashcards.</p>
          <small>{error}</small>
          <button className="btn-primary" onClick={fetchCards} style={{marginTop: '12px'}}>Try Again</button>
        </div>
      </div>
    );
  }

  if (flashcards.length === 0 || currentIndex >= flashcards.length) {
    return (
      <div className="flashcards-container centered">
        <h2>🎉 Quiz Complete!</h2>
        <p style={{color: 'var(--text-secondary)'}}>You've completed all the flashcards in this set.</p>
        <button 
          className="btn-primary" 
          onClick={() => { 
            setCurrentIndex(0); 
            setIsAnswerRevealed(false); 
            setSelectedOption(null); 
            fetchCards(); // Generate brand new questions!
          }} 
          style={{marginTop: '24px'}}
        >
          Generate New Flashcards
        </button>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];
  
  // Check if it's an Assertion/Reasoning question (which might not have standard options)
  // If the AI didn't provide options, we make some default ones for A/R
  const options = currentCard.options || [
    "Both A and R are true and R is the correct explanation of A",
    "Both A and R are true but R is not the correct explanation of A",
    "A is true but R is false",
    "A is false but R is true"
  ];

  return (
    <div className="flashcards-container">
      <div className="flashcard-header">
        <span className="badge">{currentCard.type === 'mcq' ? 'Multiple Choice' : 'Assertion / Reasoning'}</span>
        <span className="progress">{currentIndex + 1} / {flashcards.length}</span>
      </div>
      
      <div className="flashcard-body">
        <h2 className="flashcard-question">{currentCard.question}</h2>
        
        <div className="flashcard-options">
          {options.map((opt, idx) => {
            let className = "option-btn";
            if (isAnswerRevealed) {
              if (idx === currentCard.answerIndex) className += " correct";
              else if (idx === selectedOption) className += " incorrect";
              else className += " disabled";
            }
            
            return (
              <button 
                key={idx} 
                className={className}
                onClick={() => handleOptionClick(idx)}
              >
                <span className="option-letter">{String.fromCharCode(65 + idx)}</span>
                {opt}
              </button>
            );
          })}
        </div>

        {isAnswerRevealed && (
          <div className={`explanation-box ${selectedOption === currentCard.answerIndex ? 'success' : 'fail'}`}>
            <h4>{selectedOption === currentCard.answerIndex ? '✅ Correct!' : '❌ Incorrect'}</h4>
            <p>{currentCard.explanation}</p>
            <button className="btn-next-card" onClick={nextCard}>
              {currentIndex === flashcards.length - 1 ? 'Finish Quiz' : 'Next Question ➔'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
