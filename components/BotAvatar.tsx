import React from 'react';

interface BotAvatarProps {
  className?: string;
}

const BotAvatar: React.FC<BotAvatarProps> = ({ className }) => {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="bot-gradient" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4338ca" /> {/* Indigo 700 */}
          <stop offset="1" stopColor="#6366f1" /> {/* Indigo 500 */}
        </linearGradient>
      </defs>
      
      {/* Background Circle */}
      <circle cx="32" cy="32" r="32" fill="url(#bot-gradient)" />
      
      {/* Robot Head */}
      <rect x="15" y="18" width="34" height="28" rx="8" fill="white" />
      
      {/* Screen/Face Area */}
      <rect x="19" y="24" width="26" height="16" rx="4" fill="#e0e7ff" />
      
      {/* Eyes */}
      <circle cx="26" cy="32" r="3" fill="#4338ca" />
      <circle cx="38" cy="32" r="3" fill="#4338ca" />
      
      {/* Antenna */}
      <line x1="32" y1="18" x2="32" y2="10" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="8" r="4" fill="#fbbf24" /> {/* Amber/Gold light */}
      
      {/* Ears/Headphones */}
      <path d="M15 26 H13 C11.8954 26 11 26.8954 11 28 V 36 C11 37.1046 11.8954 38 13 38 H15" fill="white" />
      <path d="M49 26 H51 C52.1046 26 53 26.8954 53 28 V 36 C53 37.1046 52.1046 38 51 38 H49" fill="white" />
      
      {/* Neck */}
      <path d="M26 46 V 52" stroke="white" strokeWidth="4" strokeLinecap="round" />
      <path d="M38 46 V 52" stroke="white" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
};

export default BotAvatar;