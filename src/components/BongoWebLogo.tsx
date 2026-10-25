import React, { useState, useEffect } from 'react';
import { BrandLogoConfig } from '../types';
import { DEFAULT_LOGO_CONFIG, apiGetLogoConfig, subscribeToLogoConfig } from '../utils/api';

interface BongoWebLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textColor?: string;
  variant?: 'default' | 'white';
}

/**
 * Official BongoWeb Logo Component
 * - Dual Engine: Supports both Official Image Logo (SVG insignia / custom image upload)
 *   and Dynamic Typed Text Logo (controlled from Admin Settings)
 * - White Variant: White circular “B” logo + “BongoWeb” text for solid purple header
 * - Universal Cloud Sync: Real-time synchronization across all devices
 */
export default function BongoWebLogo({
  className = '',
  size = 'md',
  showText = true,
  textColor,
  variant = 'default'
}: BongoWebLogoProps) {
  const [config, setConfig] = useState<BrandLogoConfig>(() => {
    try {
      const stored = localStorage.getItem('bongoweb_logo_config');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (_) {}
    return DEFAULT_LOGO_CONFIG;
  });

  useEffect(() => {
    // 1. Initial fetch from universal database on mount
    apiGetLogoConfig().then((latest) => {
      if (latest && latest.logoType) {
        setConfig(latest);
      }
    });

    // 2. Realtime listener to Cloud Firestore (updates all devices globally in real-time)
    const unsubscribeFirestore = subscribeToLogoConfig((updated) => {
      if (updated && updated.logoType) {
        setConfig(updated);
      }
    });

    // 3. Local events & storage listeners
    const handleUpdate = (e: any) => {
      if (e?.detail) {
        setConfig(e.detail);
      } else {
        try {
          const stored = localStorage.getItem('bongoweb_logo_config');
          if (stored) setConfig(JSON.parse(stored));
        } catch (_) {}
      }
    };

    window.addEventListener('bongoweb_logo_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      unsubscribeFirestore();
      window.removeEventListener('bongoweb_logo_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Auto-perfect dimensions for mobile, tablet, and desktop (Balanced & refined)
  const dimensions = {
    sm: { 
      iconPx: 40, 
      text: 'text-lg sm:text-xl', 
      containerH: 'h-9 sm:h-10', 
      maxImgH: 42,
      chatTextSize: 'text-xl sm:text-2xl'
    },
    md: { 
      iconPx: 68, 
      text: 'text-xl sm:text-2xl md:text-[28px]', 
      containerH: 'h-11 sm:h-13 md:h-[60px]', 
      maxImgH: 58,
      chatTextSize: 'text-2xl sm:text-3xl md:text-4xl'
    },
    lg: { 
      iconPx: 72, 
      text: 'text-2xl sm:text-3xl md:text-4xl', 
      containerH: 'h-14 sm:h-16 md:h-18', 
      maxImgH: 62,
      chatTextSize: 'text-3xl sm:text-4xl md:text-5xl'
    },
    xl: { 
      iconPx: 88, 
      text: 'text-3xl sm:text-4xl md:text-5xl', 
      containerH: 'h-18 sm:h-20 md:h-22', 
      maxImgH: 76,
      chatTextSize: 'text-4xl sm:text-5xl md:text-6xl'
    },
  }[size];

  // Effective icon / image height respecting admin slider if set, or auto-perfect default
  const configuredH = config.imageSizePx && config.imageSizePx >= 30 ? config.imageSizePx : 0;
  const effectiveMaxHeight = configuredH || dimensions.maxImgH;
  const effectiveIconPx = configuredH || dimensions.iconPx;
  const effectiveImageUrl = config.imageUrl || '/bongoweb-logo-horizontal.svg';

  // Determine text gradient class using official brand colors from logo
  const getGradientClass = (theme?: string) => {
    switch (theme) {
      case 'sunset':
        return 'bg-gradient-to-r from-[#DC2626] via-[#EA580C] to-[#F59E0B]';
      case 'emerald':
        return 'bg-gradient-to-r from-[#00B261] via-[#059669] to-[#0D9488]';
      case 'monochrome':
        return 'bg-gradient-to-r from-[#0F172A] via-[#334155] to-[#475569]';
      case 'royal':
        return 'bg-gradient-to-r from-[#6B46C1] via-[#4F46E5] to-[#7C3AED]';
      case 'violet':
      default:
        return 'bg-gradient-to-r from-[#5521B5] via-[#6B46C1] to-[#9F7AEA]';
    }
  };

  // ==========================================
  // MODE 1: TYPED TEXT LOGO (Only if explicitly set to text AND no image URL)
  // ==========================================
  if (config.logoType === 'text' && !config.imageUrl) {
    const textToShow = config.typedLogoText || 'BongoWeb';
    const gradientClass = getGradientClass(config.textGradientTheme);

    return (
      <div 
        className={`inline-flex items-center gap-2 select-none ${dimensions.containerH} ${className}`}
        title={`${textToShow} ${config.typedSubtitle || ''}`}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span 
            className={`font-black tracking-[-0.03em] ${dimensions.chatTextSize} font-sans leading-none ${gradientClass} bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(220,38,38,0.2)]`}
          >
            {textToShow}
          </span>

          {config.typedSubtitle && (
            <span className="px-2 py-0.5 rounded-lg bg-[#DC2626]/10 text-[#DC2626] text-xs sm:text-sm font-black tracking-wider uppercase border border-[#DC2626]/20 font-mono shadow-2xs">
              {config.typedSubtitle}
            </span>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // MODE 2: OFFICIAL BRAND LOGO IMAGE (Always stays online, perfect size)
  // ==========================================
  const brandName = config.typedLogoText || 'BongoWeb';

  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3.5 select-none ${dimensions.containerH} ${className}`}>
      {/* 1. Official Image Logo (Universal Cloud Sync across all devices, perfectly sized) */}
      {effectiveImageUrl ? (
        <img
          src={effectiveImageUrl}
          alt={brandName}
          style={configuredH ? { maxHeight: `${configuredH}px`, width: 'auto' } : { width: 'auto' }}
          className="shrink-0 object-contain rounded-lg drop-shadow-[0_2px_8px_rgba(107,70,193,0.18)] transition-all duration-300 hover:scale-105 h-[44px] sm:h-[52px] md:h-[58px] max-h-[46px] sm:max-h-[53px] md:max-h-[58px] w-auto max-w-[240px] sm:max-w-[315px] md:max-w-[385px]"
        />
      ) : (
        /* 2. Official Vector Logo */
        <svg
          viewBox="0 0 440 110"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0 drop-shadow-[0_4px_12px_rgba(107,70,193,0.22)] transition-transform duration-300 hover:scale-105 h-[44px] sm:h-[52px] md:h-[58px] max-h-[46px] sm:max-h-[53px] md:max-h-[58px] w-auto max-w-[240px] sm:max-w-[315px] md:max-w-[385px]"
        >
          <defs>
            <linearGradient id="bwCircleGradientInline" x1="10" y1="15" x2="95" y2="95" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#5521B5" />
              <stop offset="25%" stopColor="#6B46C1" />
              <stop offset="65%" stopColor="#805AD5" />
              <stop offset="100%" stopColor="#9F7AEA" />
            </linearGradient>

            <linearGradient id="bwTextGradientInline" x1="120" y1="20" x2="430" y2="85" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="55%" stopColor="#F1F5F9" />
              <stop offset="80%" stopColor="#C084FC" />
              <stop offset="100%" stopColor="#A855F7" />
            </linearGradient>
          </defs>

          {/* Circular Emblem with Stylized Geometric 'B' Monogram */}
          <g id="emblem-inline" transform="translate(10, 8)">
            <circle 
              cx="47" 
              cy="47" 
              r="45" 
              fill={variant === 'white' ? '#FFFFFF' : 'url(#bwCircleGradientInline)'} 
            />
            <circle 
              cx="47" 
              cy="47" 
              r="44.25" 
              stroke={variant === 'white' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.25)'} 
              strokeWidth="1.5" 
            />
            <path
              d="M 23 25 C 23 23.34 24.34 22 26 22 L 48.5 C 59.8 22 69 31.2 69 42.5 C 69 49.6 65.3 55.8 59.5 59.3 C 57.2 60.7 54.3 61.5 51 61.5 L 34.5 61.5 L 43.5 45 L 30 45 L 23 25 Z"
              fill={variant === 'white' ? '#5B2C8A' : '#FFFFFF'}
            />
            <path
              d="M 23 70 C 23 71.66 24.34 73 26 73 L 53 C 65.2 73 74 63.8 74 52 C 74 46.5 71.8 41.5 68 38 L 57.5 48 C 59.5 50 61 52.8 61 56 C 61 62.5 55.5 67 48.5 67 L 33 67 L 40 54 L 27.5 54 L 23 70 Z"
              fill={variant === 'white' ? '#5B2C8A' : '#FFFFFF'}
            />
            <path
              d="M 37.5 31 L 47.5 31 C 53.5 31 58 35.5 58 41.5 C 58 47.5 53.5 52 47.5 52 L 40.5 52 L 37.5 31 Z"
              fill={variant === 'white' ? '#FFFFFF' : 'url(#bwCircleGradientInline)'}
            />
            <circle cx="34" cy="47" r="3.5" fill={variant === 'white' ? '#5B2C8A' : '#FFFFFF'} opacity="0.9" />
          </g>

          {/* Typographic Wordmark: BongoWeb */}
          <g id="wordmark-inline" transform="translate(125, 0)">
            <text
              x="0"
              y="75"
              fontFamily="'Plus Jakarta Sans', 'Inter', -apple-system, system-ui, sans-serif"
              fontWeight="900"
              fontSize="62"
              letterSpacing="-1.8px"
              fill={variant === 'white' ? '#FFFFFF' : (textColor || "url(#bwTextGradientInline)")}
            >BongoWeb</text>
            <path
              d="M 76 81 C 76 88 94 88 94 81"
              stroke={variant === 'white' ? '#EDE4F5' : (textColor || "#6B46C1")}
              strokeWidth="4.5"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="85" cy="27" r="4.5" fill={variant === 'white' ? '#FFFFFF' : '#9F7AEA'} />
          </g>
        </svg>
      )}
    </div>
  );
}

