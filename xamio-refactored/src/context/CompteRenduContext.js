/**
 * XAMIO — Context Compte Rendu Intelligent v2
 * Sépare : analyse initiale / régénération / typing chat
 */
import React, { createContext, useContext, useState, useCallback } from 'react';

const CompteRenduContext = createContext(null);

export const ANALYZE_STEPS = [
  'Lecture du document…',
  'Extraction du contenu…',
  'Analyse sémantique IA…',
  'Génération du résumé…',
];

export function CompteRenduProvider({ children }) {
  const [document,       setDocument]       = useState(null);
  const [isAnalyzing,    setIsAnalyzing]    = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isAnalyzed,     setIsAnalyzed]     = useState(false);
  const [analyzeStep,    setAnalyzeStep]    = useState(0);
  const [summary,        setSummary]        = useState(null);
  const [keyPoints,      setKeyPoints]      = useState(null);
  const [messages,       setMessages]       = useState([]);
  const [isTyping,       setIsTyping]       = useState(false);

  const uploadDocument = useCallback((file, mockDoc) => {
    setDocument({ ...mockDoc, file });
    setIsAnalyzing(true);
    setIsAnalyzed(false);
    setAnalyzeStep(0);
    setSummary(null);
    setKeyPoints(null);
    setMessages([]);

    let step = 0;
    const iv = setInterval(() => {
      step++;
      if (step < 4) setAnalyzeStep(step);
      else clearInterval(iv);
    }, 600);

    setTimeout(() => {
      clearInterval(iv);
      import('../data/compteRenduMock').then(({ MOCK_SUMMARY, MOCK_KEY_POINTS }) => {
        setSummary(MOCK_SUMMARY);
        setKeyPoints(MOCK_KEY_POINTS);
        setIsAnalyzing(false);
        setIsAnalyzed(true);
        setAnalyzeStep(0);
      });
    }, 2800);
  }, []);

  const regenerateSummary = useCallback(() => {
    setIsRegenerating(true);
    setSummary(null);
    setTimeout(() => {
      import('../data/compteRenduMock').then(({ MOCK_SUMMARY }) => {
        setSummary(MOCK_SUMMARY);
        setIsRegenerating(false);
      });
    }, 1600);
  }, []);

  const sendMessage = useCallback((text) => {
    const userMsg = { id: Date.now(), role: 'user', text, ts: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    import('../data/compteRenduMock').then(({ getAIResponse }) => {
      const responseText = getAIResponse(text);
      const delay = Math.min(900 + responseText.length * 1.2, 3000);
      setTimeout(() => {
        const aiMsg = { id: Date.now() + 1, role: 'ai', text: responseText, ts: new Date() };
        setMessages(prev => [...prev, aiMsg]);
        setIsTyping(false);
      }, delay);
    });
  }, []);

  const reset = useCallback(() => {
    setDocument(null);
    setIsAnalyzing(false);
    setIsRegenerating(false);
    setIsAnalyzed(false);
    setAnalyzeStep(0);
    setSummary(null);
    setKeyPoints(null);
    setMessages([]);
    setIsTyping(false);
  }, []);

  return (
    <CompteRenduContext.Provider value={{
      document, isAnalyzing, isRegenerating, isAnalyzed, analyzeStep,
      summary, keyPoints, messages, isTyping,
      uploadDocument, regenerateSummary, sendMessage, reset,
    }}>
      {children}
    </CompteRenduContext.Provider>
  );
}

export function useCompteRendu() {
  const ctx = useContext(CompteRenduContext);
  if (!ctx) throw new Error('useCompteRendu must be inside CompteRenduProvider');
  return ctx;
}
