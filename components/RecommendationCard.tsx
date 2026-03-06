
import React, { useState } from 'react';
import { RecommendedScheme } from '../types';
import { motion } from 'framer-motion';

interface RecommendationCardProps {
  bank: RecommendedScheme;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ bank }) => {
  const isStrict = bank.matchType === 'strict';
  const [imgError, setImgError] = useState(false);

  // Function to get initials if image fails
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(w => !['bank', 'of', 'india', 'mahindra'].includes(w.toLowerCase()))
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || name.substring(0, 2).toUpperCase();
  };

  return (
    <motion.div 
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className={`bg-white border rounded-xl p-5 transition group relative flex flex-col h-full ${isStrict ? 'border-slate-200 hover:border-indigo-300 hover:shadow-lg' : 'border-orange-200 bg-orange-50/30'}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="relative">
          {/* Rectangular logo container standardized for all banks */}
          <div className="h-16 w-24 rounded-lg bg-white p-1.5 border border-slate-100 flex items-center justify-center shadow-sm overflow-hidden shrink-0 ring-1 ring-slate-100/50">
            {!imgError ? (
              <img 
                src={bank.logoUrl} 
                alt={bank.bankName} 
                className={`w-auto h-auto max-w-[90%] max-h-[70%] object-contain transition-transform duration-300 ${bank.logoClass || ''}`} 
                onError={() => setImgError(true)}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-slate-50 flex items-center justify-center text-[11px] font-black text-indigo-500 text-center px-1">
                {getInitials(bank.bankName)}
              </div>
            )}
          </div>
          {/* Verified Checkmark Badge */}
          {bank.isLive && (
            <div className="absolute -bottom-1 -right-1 bg-indigo-600 rounded-full p-0.5 border-2 border-white shadow-md z-10">
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end space-y-1.5">
          <div className={`text-[9px] font-black px-2.5 py-1 rounded uppercase shrink-0 tracking-widest ${isStrict ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-orange-100 text-orange-700 border border-orange-200'}`}>
            {isStrict ? 'Primary' : 'Potential'}
          </div>
          {bank.isLive && (
            <div className="flex items-center space-x-1.5 px-2 py-0.5 bg-slate-900 rounded-full shadow-sm ring-1 ring-white/10">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
              </span>
              <span className="text-[7.5px] font-black text-white uppercase tracking-[0.1em]">Synced</span>
            </div>
          )}
        </div>
      </div>
      
      <h3 className="text-slate-900 font-bold text-sm mb-3 line-clamp-2 min-h-[40px] leading-tight group-hover:text-indigo-600 transition-colors">{bank.bankName}</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Interest Rate</div>
          <div className="text-base font-black text-indigo-600">{bank.interestRate}% <span className="text-[9px] font-normal text-slate-400">p.a</span></div>
        </div>
        <div>
          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Max Term</div>
          <div className="text-base font-black text-slate-800">{bank.maxTenure} <span className="text-[9px] font-normal text-slate-400">Yrs</span></div>
        </div>
      </div>

      {bank.lastUpdated && (
        <div className="mb-4 text-[9px] text-slate-500 font-bold flex items-center space-x-1.5 bg-indigo-50/50 px-2.5 py-1.5 rounded-lg border border-indigo-100/50">
          <svg className="w-3 h-3 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="tabular-nums">Verified: {new Date(bank.lastUpdated).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      )}

      {!isStrict && bank.matchReason && (
        <div className="mb-4 text-[10px] font-medium text-orange-600 bg-orange-50 p-2 rounded border border-orange-100 flex items-start space-x-1.5">
           <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
           <span>{bank.matchReason}</span>
        </div>
      )}

      <div className="space-y-1.5 mb-6 flex-grow">
        <div className="flex justify-between text-[11px] items-center">
          <span className="text-slate-500 font-medium">Processing Fee</span>
          <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{bank.processingFee}</span>
        </div>
        <div className="flex justify-between text-[11px] items-center">
          <span className="text-slate-500 font-medium">Bureau Threshold</span>
          <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{bank.minCibil}+</span>
        </div>
      </div>

      <div className="mt-auto">
        <a 
          href={bank.officialUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block w-full text-center bg-slate-900 text-white text-[11px] font-bold py-3 rounded-lg hover:bg-indigo-600 transition shadow-sm active:scale-[0.98] ring-offset-2 focus:ring-2 focus:ring-indigo-500"
        >
          Institutional Portal
        </a>
      </div>
    </motion.div>
  );
};

export default RecommendationCard;
