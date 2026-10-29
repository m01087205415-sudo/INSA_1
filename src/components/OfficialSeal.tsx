import React from 'react';

interface OfficialSealProps {
  size?: number;
  rotation?: number;
  opacity?: number;
  customImageUrl?: string | null;
  className?: string;
  showBorderGuideline?: boolean;
}

/**
 * Yangwoo General Construction (양우종합건설 주식회사)
 * Official Corporate Seal (인감) Component
 * Replicated faithfully from Document Page 5 with high-res vector rendering
 * and custom uploaded seal support.
 */
export const OfficialSeal: React.FC<OfficialSealProps> = ({
  size = 72,
  rotation = -4,
  opacity = 0.88,
  customImageUrl,
  className = '',
  showBorderGuideline = false
}) => {
  return (
    <div
      className={`inline-block select-none relative transition-transform ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        transform: `rotate(${rotation}deg)`,
        opacity: opacity,
      }}
      title="양우종합건설(주) 공인 사용인감 (전자날인)"
    >
      {customImageUrl ? (
        <img
          src={customImageUrl}
          alt="양우종합건설 주식회사 인감"
          className="w-full h-full object-contain pointer-events-none filter drop-shadow-sm"
        />
      ) : (
        <svg
          viewBox="0 0 160 160"
          className="w-full h-full text-red-600 drop-shadow-sm"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer circle double border characteristic of Korean corporate seal */}
          <circle cx="80" cy="80" r="74" stroke="#c02626" strokeWidth="5" />
          <circle cx="80" cy="80" r="67" stroke="#c02626" strokeWidth="1.8" />

          {/* Authentic Korean Corporate Seal Typography: 양우종합건설 주식회사 대표이사지인 */}
          {/* Left / Center / Right traditional column layout */}
          <g fill="#c02626" style={{ fontFamily: '"Nanum Myeongjo", "Batang", serif', fontWeight: 900 }}>
            <text x="36" y="52" fontSize="22" textAnchor="middle">양</text>
            <text x="36" y="84" fontSize="22" textAnchor="middle">우</text>
            <text x="36" y="116" fontSize="22" textAnchor="middle">종</text>

            <text x="80" y="38" fontSize="22" textAnchor="middle">합</text>
            <text x="80" y="68" fontSize="22" textAnchor="middle">건</text>
            <text x="80" y="98" fontSize="22" textAnchor="middle">설</text>
            <text x="80" y="128" fontSize="20" textAnchor="middle">주</text>

            <text x="124" y="52" fontSize="22" textAnchor="middle">대</text>
            <text x="124" y="84" fontSize="22" textAnchor="middle">표</text>
            <text x="124" y="116" fontSize="22" textAnchor="middle">인</text>
          </g>

          {/* Stamped ink grain / texture marks for authenticity */}
          <circle cx="48" cy="70" r="1.5" fill="#c02626" opacity="0.4" />
          <circle cx="112" cy="62" r="1.2" fill="#c02626" opacity="0.5" />
          <circle cx="75" cy="115" r="1.4" fill="#c02626" opacity="0.3" />
        </svg>
      )}

      {showBorderGuideline && (
        <div className="absolute inset-0 border border-dashed border-blue-400 pointer-events-none rounded-full" />
      )}
    </div>
  );
};
