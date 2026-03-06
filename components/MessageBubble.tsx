
import React from 'react';
import { Message } from '../types';
import BotAvatar from './BotAvatar';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isBot = message.role === 'bot';

  return (
    <div id={message.id} className={`flex ${isBot ? 'justify-start' : 'justify-end'} group`}>
      <div className={`max-w-[88%] sm:max-w-[82%] flex flex-col ${isBot ? 'items-start' : 'items-end'}`}>
        {/* Adjusted Header: Better vertical alignment and eliminated layout shifts */}
        <div className={`flex items-center space-x-2 mb-1.5 ${isBot ? 'ml-0' : 'mr-0'}`}>
          {isBot ? (
             <div className="w-7 h-7 shrink-0 flex items-center justify-center bg-indigo-50 rounded-lg p-0.5 border border-indigo-100/50">
               <BotAvatar className="w-full h-full" />
             </div>
          ) : (
             <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center order-2 ml-1.5 shadow-inner">
               <svg className="w-3 h-3 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                 <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
               </svg>
             </div>
          )}
          <span className={`text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ${!isBot ? 'order-1' : ''}`}>
            {isBot ? 'Fintelly Agent' : 'You'}
          </span>
        </div>
        
        {/* Bubble: Fixed padding and whitespace handling to ensure text starts flush */}
        <div 
          className={`
            px-4 py-2.5 rounded-2xl text-[13.5px] leading-[1.55] shadow-sm whitespace-pre-line
            ${isBot 
              ? 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/50' 
              : 'bg-indigo-600 text-white rounded-tr-none font-medium shadow-md shadow-indigo-100'}
          `}
        >
          {/* Force trim on render to catch any unexpected whitespace in the data stream */}
          {message.content.trim().replace(/^\s+/, '')}
        </div>
        
        <div className={`mt-1 flex items-center space-x-1 ${isBot ? 'ml-1' : 'mr-1'}`}>
           <span className="text-[8.5px] font-bold text-slate-300 uppercase">
             {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
           </span>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
