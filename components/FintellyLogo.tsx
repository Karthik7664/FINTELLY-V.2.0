import React from 'react';

interface LogoProps {
  className?: string;
}

const FintellyLogo: React.FC<LogoProps> = ({ className }) => {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="fintelly-gradient" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4F46E5" /> {/* Indigo 600 */}
          <stop offset="1" stopColor="#7C3AED" /> {/* Violet 600 */}
        </linearGradient>
      </defs>
      
      {/* Background Circle */}
      <circle cx="32" cy="32" r="32" fill="url(#fintelly-gradient)" />
      
      {/* Chart Line */}
      <path 
        d="M16 42 L26 32 L34 40 L48 22" 
        stroke="white" 
        strokeWidth="5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      
      {/* Arrow Head for Chart */}
      <path 
        d="M38 22 H48 V32" 
        stroke="white" 
        strokeWidth="5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      
      {/* Subtle Dot at start */}
      <circle cx="16" cy="42" r="3" fill="white" />
    </svg>
  );
};

export default FintellyLogo;