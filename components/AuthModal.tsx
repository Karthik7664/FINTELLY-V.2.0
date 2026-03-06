
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StorageService } from '../services/storageService';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin }) => {
  // Step 0: Details, Step 1: OTP
  const [step, setStep] = useState<0 | 1>(0);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [receiveUpdates, setReceiveUpdates] = useState(true);
  const [otp, setOtp] = useState('');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Timer for OTP
  const [timer, setTimer] = useState(30);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (step === 1) {
      setTimer(30);
      timerRef.current = window.setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
             if (timerRef.current) clearInterval(timerRef.current);
             return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!name.trim() || !email.trim()) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    try {
        // Now returns a promise and handles network request
        await StorageService.generateOTP(email, name);
        setIsLoading(false);
        setStep(1);
    } catch (err) {
        setIsLoading(false);
        setError('Failed to send OTP. Please try again.');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (otp.length !== 6) {
        setError('Please enter a valid 6-digit code');
        return;
    }

    setIsLoading(true);
    
    // Simulate Network check for verification (local check is fast, but adding slight delay for UX)
    setTimeout(() => {
        const isValid = StorageService.verifyOTP(email, otp);
        
        if (isValid) {
            const user = StorageService.loginOrSignup(name, email, receiveUpdates);
            onLogin(user);
            handleClose();
        } else {
            setError('Invalid or expired OTP code.');
        }
        setIsLoading(false);
    }, 600);
  };

  const handleResend = async () => {
      setIsLoading(true);
      await StorageService.generateOTP(email, name);
      setIsLoading(false);
      setTimer(30);
      
      // Restart timer logic
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = window.setInterval(() => {
        setTimer((prev) => {
            if (prev <= 1) {
                if (timerRef.current) clearInterval(timerRef.current);
                return 0;
            }
            return prev - 1;
        });
      }, 1000);
  };

  const handleClose = () => {
    setStep(0);
    setName('');
    setEmail('');
    setOtp('');
    setError('');
    setIsLoading(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-violet-600" />
            
            <div className="mb-6 text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4 text-2xl">
                {step === 0 ? '🔐' : '📩'}
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                  {step === 0 ? 'Welcome to Fintelly' : 'Verify Identity'}
              </h2>
              <p className="text-slate-500 mt-1 text-sm">
                  {step === 0 ? 'Secure login to save your reports.' : `Enter the code sent to ${email}`}
              </p>
            </div>

            <AnimatePresence mode="wait">
                {step === 0 ? (
                    <motion.form 
                        key="step0"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        onSubmit={handleSendOtp} 
                        className="space-y-5"
                    >
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Full Name</label>
                            <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                            placeholder="e.g. Rahul Sharma"
                            autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Email Address</label>
                            <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                            placeholder="name@example.com"
                            />
                        </div>

                        <div className="flex items-start space-x-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                            <div className="flex items-center h-5">
                            <input
                                id="updates"
                                type="checkbox"
                                checked={receiveUpdates}
                                onChange={(e) => setReceiveUpdates(e.target.checked)}
                                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                            />
                            </div>
                            <label htmlFor="updates" className="text-xs text-slate-600 leading-snug cursor-pointer">
                            <span className="font-bold text-indigo-900 block mb-0.5">Stay Updated</span>
                            Receive product updates, new bank schemes, and financial tips directly to your inbox.
                            </label>
                        </div>

                        {error && (
                            <div className="text-red-500 text-xs text-center font-medium bg-red-50 p-2 rounded-lg">
                            {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-slate-900 hover:bg-indigo-600 disabled:opacity-70 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center"
                        >
                            {isLoading ? (
                                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : "Send OTP"}
                        </button>
                    </motion.form>
                ) : (
                    <motion.form 
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        onSubmit={handleVerifyOtp} 
                        className="space-y-5"
                    >
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 text-center">One-Time Password</label>
                            <input
                            type="text"
                            value={otp}
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                if (val.length <= 6) setOtp(val);
                            }}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-center text-2xl font-mono tracking-[0.5em] text-slate-900 placeholder:text-slate-300"
                            placeholder="000000"
                            autoFocus
                            />
                        </div>

                        <div className="text-center text-xs">
                             {timer > 0 ? (
                                 <span className="text-slate-400">Resend code in {timer}s</span>
                             ) : (
                                 <button type="button" onClick={handleResend} className="text-indigo-600 font-bold hover:underline">
                                     Resend Code
                                 </button>
                             )}
                        </div>

                        {error && (
                            <div className="text-red-500 text-xs text-center font-medium bg-red-50 p-2 rounded-lg">
                            {error}
                            </div>
                        )}

                        <div className="flex space-x-3">
                             <button
                                type="button"
                                onClick={() => setStep(0)}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3.5 rounded-xl transition-all"
                             >
                                Back
                             </button>
                             <button
                                type="submit"
                                disabled={isLoading || otp.length < 6}
                                className="flex-[2] bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 disabled:hover:bg-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center"
                            >
                                {isLoading ? (
                                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                ) : "Verify & Login"}
                            </button>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>
            
            <button 
              onClick={handleClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
