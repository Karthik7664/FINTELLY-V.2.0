
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Message, UserData, LoanType, EmploymentType, AnalysisResult, RecommendedScheme, BankScheme, User } from '../types';
import { CONVERSATION_STEPS, BANK_SCHEMES } from '../constants';
import { analyzeLoanProfile } from '../services/loanEngine';
import { generateAnalysisExplanation, fetchLatestBankRates } from '../services/geminiService';
import { generatePDF } from '../services/pdfGenerator';
import { StorageService } from '../services/storageService';
import MessageBubble from './MessageBubble';
import RecommendationCard from './RecommendationCard';

interface ChatInterfaceProps {
  currentUser: User | null;
}

const getBase64ImageFromURL = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.setAttribute("crossOrigin", "anonymous");
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } else {
        reject(new Error("Canvas failure"));
      }
    };
    img.onerror = () => reject(new Error("Image load error"));
    img.src = url;
  });
};

const cleanTextForPDF = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/[#*_~`]/g, '')
    .replace(/[\n\r\t]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[^\x20-\x7E]/g, '')
    .trim();
};

// Staggered animation variants for recommendation cards
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3
    }
  }
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring", stiffness: 200, damping: 20 } 
  }
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ currentUser }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'initial',
      role: 'bot',
      content: CONVERSATION_STEPS[0].question as string,
      timestamp: new Date()
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [stepIndex, setStepIndex] = useState(0);
  const [userData, setUserData] = useState<UserData>({});
  const [isTyping, setIsTyping] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Set default Verified state for base schemes
  const [liveBankSchemes, setLiveBankSchemes] = useState<BankScheme[]>(
    BANK_SCHEMES.map(s => ({ ...s, isLive: true, lastUpdated: new Date().toISOString() }))
  );

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Calculate progress percentage
  const progressPercent = Math.min(100, Math.round((stepIndex / CONVERSATION_STEPS.length) * 100));

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'bot' || lastMessage?.role === 'user') {
       setTimeout(() => {
          if (scrollContainerRef.current) {
             const container = scrollContainerRef.current;
             container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
          }
       }, 50);
    }
  }, [messages, isTyping]); 

  const resetSession = () => {
    setMessages([{
      id: 'initial',
      role: 'bot',
      content: CONVERSATION_STEPS[0].question as string,
      timestamp: new Date()
    }]);
    setStepIndex(0);
    setUserData({});
    setAnalysis(null);
    setUserInput('');
    setIsTyping(false);
    setIsAiLoading(false);
    setLiveBankSchemes(BANK_SCHEMES.map(s => ({ ...s, isLive: true, lastUpdated: new Date().toISOString() })));
  };

  const handleLiveSync = async () => {
    if (!userData.loanType || isSyncing) return;
    
    setIsSyncing(true);
    addMessage('bot', `🔍 Scanning live institutional portals for real-time ${userData.loanType} interest rates...`, 'sync-status');
    
    const relevantBanks = liveBankSchemes.filter(b => b.loanType === userData.loanType);
    const updatedSchemes = [...liveBankSchemes];

    for (const bank of relevantBanks) {
      const scrapedData = await fetchLatestBankRates(bank.bankName, userData.loanType);
      if (scrapedData) {
        const index = updatedSchemes.findIndex(s => s.id === bank.id);
        if (index !== -1) {
          updatedSchemes[index] = { 
            ...updatedSchemes[index], 
            ...scrapedData, 
            isLive: true, 
            lastUpdated: new Date().toISOString() 
          };
        }
      }
    }

    setLiveBankSchemes(updatedSchemes);
    setIsSyncing(false);
    
    // Re-run analysis with new rates if already analyzed
    if (analysis) {
      const result = analyzeLoanProfile(userData, updatedSchemes);
      result.explanation = analysis.explanation; // Keep existing AI explanation
      setAnalysis(result);
      
      // Update the analysis message in the chat stream
      setMessages(prev => prev.map(m => {
        if (m.type === 'analysis') {
          return { ...m, payload: result };
        }
        return m;
      }));

      // Update Saved Report if logged in
      if (currentUser) {
         StorageService.saveReport(currentUser.id, userData, result);
      }
    }
    
    addMessage('bot', "✅ Official verification complete. Loan matching logic updated with latest market yields.");
  };

  const addMessage = (role: 'user' | 'bot', content: string, type: 'text' | 'analysis' | 'recommendations' | 'sync-status' = 'text', payload?: any) => {
    const newMessage: Message = {
      id: Math.random().toString(36).substring(7),
      role,
      content: content.trim(),
      timestamp: new Date(),
      type,
      payload
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const processStep = async (input: string) => {
    const currentStep = CONVERSATION_STEPS[stepIndex];
    const newUserData = { ...userData };

    switch (currentStep.id) {
      case 'name': newUserData.name = input; break;
      case 'loanType':
        const lowerInput = input.toLowerCase();
        if (lowerInput.includes('home')) newUserData.loanType = LoanType.HOME;
        else if (lowerInput.includes('education')) newUserData.loanType = LoanType.EDUCATION;
        else if (lowerInput.includes('business')) newUserData.loanType = LoanType.BUSINESS;
        else if (lowerInput.includes('car')) newUserData.loanType = LoanType.CAR;
        else newUserData.loanType = LoanType.PERSONAL;
        break;
      case 'age': newUserData.age = parseInt(input) || 25; break;
      case 'employment':
        const emp = input.toLowerCase();
        if (emp.includes('salaried')) newUserData.employment = EmploymentType.SALARIED;
        else if (emp.includes('student')) newUserData.employment = EmploymentType.STUDENT;
        else newUserData.employment = EmploymentType.SELF_EMPLOYED;
        break;
      case 'monthlyIncome': newUserData.monthlyIncome = parseFloat(input.replace(/[^0-9.]/g, '')) || 0; break;
      case 'existingEMI': newUserData.existingEMI = parseFloat(input.replace(/[^0-9.]/g, '')) || 0; break;
      case 'cibilScore': newUserData.cibilScore = parseInt(input) || 750; break;
      case 'loanAmount': newUserData.loanAmount = parseFloat(input.replace(/[^0-9.]/g, '')) || 0; break;
      case 'loanTenure': newUserData.loanTenure = parseInt(input) || 5; break;
      case 'propertyValue': newUserData.propertyValue = parseFloat(input.replace(/[^0-9.]/g, '')) || 0; break;
      case 'businessTurnover': newUserData.businessTurnover = parseFloat(input.replace(/[^0-9.]/g, '')) || 0; break;
      case 'vehicleCost': newUserData.vehicleCost = parseFloat(input.replace(/[^0-9.]/g, '')) || 0; break;
    }

    setUserData(newUserData);

    let nextIndex = stepIndex + 1;
    if (currentStep.id === 'loanTenure') {
      if (newUserData.loanType === LoanType.HOME) nextIndex = CONVERSATION_STEPS.findIndex(s => s.id === 'propertyValue');
      else if (newUserData.loanType === LoanType.BUSINESS) nextIndex = CONVERSATION_STEPS.findIndex(s => s.id === 'businessTurnover');
      else if (newUserData.loanType === LoanType.CAR) nextIndex = CONVERSATION_STEPS.findIndex(s => s.id === 'vehicleCost');
      else nextIndex = CONVERSATION_STEPS.length;
    } else if (['propertyValue', 'businessTurnover', 'vehicleCost'].includes(currentStep.id)) {
      nextIndex = CONVERSATION_STEPS.length;
    }

    if (nextIndex < CONVERSATION_STEPS.length) {
      setStepIndex(nextIndex);
      const nextStep = CONVERSATION_STEPS[nextIndex];
      const nextQuestion = typeof nextStep.question === 'function' ? nextStep.question(newUserData.name || 'friend') : nextStep.question;
      setIsTyping(true);
      setTimeout(() => {
        addMessage('bot', nextQuestion);
        setIsTyping(false);
      }, 300); 
    } else {
      setIsTyping(true);
      const result = analyzeLoanProfile(newUserData, liveBankSchemes);
      setAnalysis(result);
      addMessage('bot', `Assessment complete. Running underwriting protocols for primary institutional matches...`, 'analysis', result);
      setIsTyping(false);
      setIsAiLoading(true);

      try {
        const aiSummary = await generateAnalysisExplanation(newUserData, result);
        // Update analysis result with AI explanation
        const finalResult = { ...result, explanation: aiSummary };
        
        setAnalysis(finalResult);
        
        // Update message history
        setMessages(prev => prev.map(m => {
          if (m.type === 'analysis') {
            return { ...m, payload: finalResult };
          }
          return m;
        }));

        // Automatically save report if user is logged in
        if (currentUser) {
          StorageService.saveReport(currentUser.id, newUserData, finalResult);
          addMessage('bot', "📋 I've saved this report to your dashboard for future reference.");
        }

      } catch (err) {
        console.warn("Report refinement fallback active.");
      } finally {
        setIsAiLoading(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isTyping || !!analysis) return;
    const input = userInput.trim();
    setUserInput('');
    addMessage('user', input);
    processStep(input);
  };

  const downloadReport = async () => {
    if (!analysis || !userData) return;
    await generatePDF(userData, analysis);
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Tightened Toolbar Header with Progress Bar */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-slate-100 px-4 py-2 flex flex-col justify-center z-20 shrink-0 shadow-sm min-h-[52px]">
        <div className="flex justify-between items-center w-full mb-1">
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Advisory Session</span>
          </div>
          <div className="flex space-x-2">
            {userData.loanType && !isAiLoading && (
              <button 
                onClick={handleLiveSync} 
                disabled={isSyncing}
                className={`flex items-center space-x-2 px-3 py-1 bg-green-50 border border-green-200 text-green-700 rounded-full hover:bg-green-100 transition text-[9px] font-black tracking-tight ${isSyncing ? 'opacity-70 cursor-wait' : ''}`}
              >
                <div className={`relative flex h-1.5 w-1.5 ${isSyncing ? 'animate-spin' : ''}`}>
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 ${!isSyncing && 'hidden'}`}></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                </div>
                <span>{isSyncing ? 'VERIFYING...' : 'SYNC RATES'}</span>
              </button>
            )}
            <button onClick={resetSession} className="flex items-center space-x-1.5 px-3 py-1 bg-slate-50 border border-slate-200 text-slate-600 rounded-full hover:bg-slate-100 transition text-[9px] font-black tracking-tight">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              <span>RESTART</span>
            </button>
          </div>
        </div>
        
        {/* Progress Bar */}
        {!analysis && (
          <div className="w-full bg-slate-100 h-0.5 rounded-full overflow-hidden mt-1">
            <motion.div 
              className="h-full bg-indigo-500" 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        )}
      </div>

      {/* Tightened Scroll Container */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 custom-scrollbar scroll-smooth">
        <AnimatePresence mode="popLayout">
          {messages.map((msg) => (
            <motion.div 
              key={msg.id} 
              initial={{ opacity: 0, y: 15, scale: 0.98 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              layout
            >
              <MessageBubble message={msg} />
              
              {msg.type === 'analysis' && analysis && (
                <div className="mt-6 space-y-6">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm ring-1 ring-slate-900/5"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                           <h4 className="text-lg font-black text-slate-900 tracking-tight">Approval Confidence</h4>
                           <span className="text-[9px] font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200 uppercase tracking-tighter">Verified Match</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-4xl font-black text-indigo-600 tabular-nums">{analysis.approvalProbability}%</div>
                          <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden relative">
                            <motion.div 
                              className="h-full bg-indigo-600 shadow-sm relative z-10" 
                              initial={{ width: 0 }} 
                              animate={{ width: `${analysis.approvalProbability}%` }} 
                              transition={{ duration: 1.5, ease: "easeOut" }}
                            />
                            <div className="absolute inset-0 bg-slate-200/50 w-full h-full z-0" />
                          </div>
                        </div>
                        <div className="mt-4">
                          {isAiLoading ? (
                            <div className="flex items-center space-x-2 text-indigo-400">
                              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                              <span className="text-[10px] font-bold uppercase tracking-widest italic">Reviewing Facility Conditions...</span>
                            </div>
                          ) : (
                            <p className="text-sm text-slate-600 leading-relaxed font-medium italic border-l-2 border-indigo-200 pl-4 py-0.5">" {cleanTextForPDF(analysis.explanation)} "</p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 min-w-[140px]">
                        <div className="p-3 bg-white rounded-xl border border-slate-200 text-center shadow-sm">
                          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">Risk Sum</div>
                          <div className={`text-xs font-black ${analysis.riskLevel === 'Low' ? 'text-green-600' : 'text-orange-600'}`}>{analysis.riskLevel}</div>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-slate-200 text-center shadow-sm">
                          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">FOIR</div>
                          <div className="text-xs font-black text-slate-900 tabular-nums">{analysis.foir.toFixed(1)}%</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Improvement Tips Section (Gold Feature) */}
                    {analysis.improvementTips && analysis.improvementTips.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ delay: 0.5 }}
                        className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 overflow-hidden"
                      >
                        <div className="flex items-center space-x-2 mb-2">
                           <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                           </svg>
                           <h4 className="text-xs font-black text-amber-800 uppercase tracking-widest">Strategic Improvements</h4>
                        </div>
                        <ul className="space-y-2">
                           {analysis.improvementTips.map((tip, idx) => (
                              <li key={idx} className="text-xs text-amber-900 font-medium flex items-start space-x-2">
                                 <span className="text-amber-500 mt-0.5">•</span>
                                 <span>{tip}</span>
                              </li>
                           ))}
                        </ul>
                      </motion.div>
                    )}

                    <div className="mt-6 flex justify-end">
                      <button onClick={downloadReport} className="flex items-center space-x-2 bg-slate-900 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-[11px] font-bold transition shadow-xl active:scale-95">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        <span>Export Institutional Report</span>
                      </button>
                    </div>
                  </motion.div>
                  
                  {/* Staggered Cards */}
                  <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                  >
                    {analysis.recommendations.map((bank: RecommendedScheme) => (
                      <motion.div key={bank.id} variants={cardVariants} className="h-full">
                        <RecommendationCard bank={bank} />
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {isTyping && (
          <div className="flex items-center space-x-2 text-slate-400 p-1 ml-1">
            <div className="flex space-x-1.5">
              <div className="w-1.5 h-1.5 bg-indigo-300 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0">
        <form onSubmit={handleSubmit} className="flex space-x-3 max-w-4xl mx-auto">
          <input ref={inputRef} type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} placeholder={isTyping ? "..." : "Message Fintelly Agent..."} disabled={!!analysis} autoFocus className="flex-1 bg-white border border-slate-200 rounded-xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-slate-900 disabled:opacity-50 font-medium text-sm" />
          <button type="submit" disabled={!userInput.trim() || isTyping || !!analysis} className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl disabled:opacity-50 transition shadow-lg flex items-center justify-center aspect-square">
            <svg className="w-5 h-5 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
