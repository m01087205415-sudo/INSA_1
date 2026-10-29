import React from 'react';

interface YangwooLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const YangwooLogo: React.FC<YangwooLogoProps> = ({ className = '', size = 'md' }) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const subSizes = {
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-xs',
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Yangwoo stylized flower/heart symbol with '양우내안愛' badge */}
      <div className={`relative flex items-center justify-center ${iconSizes[size]} flex-shrink-0`}>
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
          <circle cx="50" cy="50" r="48" fill="#1e293b" />
          {/* Stylized Y shape petals */}
          <path
            d="M50 20 C62 30, 78 32, 75 52 C72 70, 52 82, 50 82 C48 82, 28 70, 25 52 C22 32, 38 30, 50 20 Z"
            fill="#38bdf8"
            opacity="0.85"
          />
          <path
            d="M50 32 C58 40, 68 42, 65 56 C62 70, 50 75, 50 75 C50 75, 38 70, 35 56 C32 42, 42 40, 50 32 Z"
            fill="#ffffff"
          />
          <circle cx="50" cy="46" r="6" fill="#f59e0b" />
        </svg>
      </div>

      <div className="flex flex-col">
        <div className="flex items-baseline gap-1.5">
          <span className={`font-extrabold tracking-tight text-slate-900 ${textSizes[size]} font-sans`}>
            양우종합건설
          </span>
          <span className={`font-semibold text-sky-700 tracking-wider ${subSizes[size]}`}>
            양우내안愛
          </span>
        </div>
        <span className="text-[10px] text-slate-500 tracking-widest uppercase">
          Yangwoo General Construction Co., Ltd.
        </span>
      </div>
    </div>
  );
};
