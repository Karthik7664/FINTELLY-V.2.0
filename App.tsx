
import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import FintellyLogo from './components/FintellyLogo';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Dashboard from './pages/Dashboard';
import AuthModal from './components/AuthModal';
import RecommendationCard from './components/RecommendationCard';
import { BANK_SCHEMES } from './constants';
import { RecommendedScheme, User } from './types';
import { StorageService } from './services/storageService';
import { motion, AnimatePresence } from 'framer-motion';

type ViewState = 'home' | 'privacy' | 'terms' | 'schemes' | 'dashboard';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const user = StorageService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (currentView === 'home') {
       // Stay on home if they just logged in from there
    } else {
       setCurrentView('dashboard');
    }
  };

  const handleLogout = () => {
    StorageService.logout();
    setCurrentUser(null);
    setCurrentView('home');
  };

  return (
    <div className="h-[100dvh] w-full bg-slate-50 flex flex-col font-sans overflow-hidden">
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onLogin={handleLogin}
      />

      <header className="bg-white border-b border-slate-200 shrink-0 z-20 shadow-sm/50 backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setCurrentView('home')}>
            <div className="relative w-10 h-10 rounded-full overflow-hidden shadow-sm transition-transform group-hover:scale-105">
              <FintellyLogo className="w-full h-full" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-extrabold text-slate-900 leading-none font-brand tracking-tight">
                Fintelly
              </h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Digital Loan Advisor</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <button onClick={() => setCurrentView('home')} className={`text-sm font-semibold transition ${currentView === 'home' ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}>Home</button>
            <button onClick={() => setCurrentView('schemes')} className={`text-sm font-semibold transition ${currentView === 'schemes' ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}>All Schemes</button>
            {currentUser ? (
              <button onClick={() => setCurrentView('dashboard')} className={`text-sm font-semibold transition ${currentView === 'dashboard' ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}>Dashboard</button>
            ) : (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="text-sm font-bold bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition"
              >
                Sign In
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-2 sm:px-4 py-4 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {currentView === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full"
            >
              <div className="hidden sm:block mb-4 text-center sm:text-left shrink-0">
                <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 font-brand">
                  Smart Loan <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Advice</span>
                </h2>
              </div>

              <div className="flex-1 min-h-0 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden flex flex-col relative z-10 mb-2 sm:mb-10 ring-1 ring-slate-900/5">
                <ChatInterface currentUser={currentUser} />
              </div>

              <div className="hidden md:grid grid-cols-3 gap-6 mb-4 shrink-0">
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-900 font-brand text-sm">Secure Analysis</h3>
                  <p className="text-xs text-slate-500 mt-1">Local data processing.</p>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-900 font-brand text-sm">Instant Insights</h3>
                  <p className="text-xs text-slate-500 mt-1">Real-time eligibility checks.</p>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-900 font-brand text-sm">Top Banks</h3>
                  <p className="text-xs text-slate-500 mt-1">SBI, HDFC, ICICI & more.</p>
                </div>
              </div>
            </motion.div>
          )}

          {currentView === 'dashboard' && currentUser && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 h-full"
            >
              <Dashboard user={currentUser} onLogout={handleLogout} />
            </motion.div>
          )}

          {currentView === 'schemes' && (
            <motion.div 
              key="schemes"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 overflow-y-auto custom-scrollbar"
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Institutional Inventory</h2>
                <p className="text-sm text-slate-500">Displaying all {BANK_SCHEMES.length} registered bank schemes for verification.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-10">
                {BANK_SCHEMES.map((scheme) => (
                  <RecommendationCard 
                    key={scheme.id} 
                    bank={{
                      ...scheme,
                      matchType: 'strict',
                      matchReason: 'Database Entry',
                      isLive: true,
                      lastUpdated: new Date().toISOString()
                    } as RecommendedScheme} 
                  />
                ))}
              </div>
            </motion.div>
          )}

          {currentView === 'privacy' && (
            <motion.div 
              key="privacy"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="overflow-y-auto custom-scrollbar"
            >
              <PrivacyPolicy />
            </motion.div>
          )}
          
          {currentView === 'terms' && (
             <motion.div 
               key="terms"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               transition={{ duration: 0.2 }}
               className="overflow-y-auto custom-scrollbar"
             >
               <TermsOfService />
             </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      <div className="md:hidden bg-white border-t border-slate-200 flex justify-around py-3 pb-safe safe-pb shrink-0">
         <button onClick={() => setCurrentView('home')} className={`flex flex-col items-center ${currentView === 'home' ? 'text-indigo-600' : 'text-slate-400'}`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            <span className="text-[10px] font-bold mt-1">Chat</span>
         </button>
         
         {currentUser ? (
           <button onClick={() => setCurrentView('dashboard')} className={`flex flex-col items-center ${currentView === 'dashboard' ? 'text-indigo-600' : 'text-slate-400'}`}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              <span className="text-[10px] font-bold mt-1">Dash</span>
           </button>
         ) : (
           <button onClick={() => setIsAuthModalOpen(true)} className={`flex flex-col items-center text-slate-400`}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
              <span className="text-[10px] font-bold mt-1">Sign In</span>
           </button>
         )}

         <button onClick={() => setCurrentView('schemes')} className={`flex flex-col items-center ${currentView === 'schemes' ? 'text-indigo-600' : 'text-slate-400'}`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            <span className="text-[10px] font-bold mt-1">Banks</span>
         </button>
      </div>
    </div>
  );
};

export default App;
