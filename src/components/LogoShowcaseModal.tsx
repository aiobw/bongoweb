import React, { useState } from 'react';
import { X, Download, Copy, Check, Sparkles, Layers, ShieldCheck, Eye, ExternalLink } from 'lucide-react';

interface LogoShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LogoShowcaseModal({ isOpen, onClose }: LogoShowcaseModalProps) {
  const [copiedV1, setCopiedV1] = useState(false);
  const [copiedV2, setCopiedV2] = useState(false);
  const [previewBg, setPreviewBg] = useState<'light' | 'dark'>('light');
  const [showMaskGuide, setShowMaskGuide] = useState(true);

  if (!isOpen) return null;

  const handleCopySvg = async (version: 1 | 2) => {
    try {
      const url = version === 1 ? '/bongoweb-logo-horizontal.svg' : '/bongoweb-icon-square.svg';
      const res = await fetch(url);
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      if (version === 1) {
        setCopiedV1(true);
        setTimeout(() => setCopiedV1(false), 2000);
      } else {
        setCopiedV2(true);
        setTimeout(() => setCopiedV2(false), 2000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-5xl bg-[#0e0e12] text-[#f5f5f7] rounded-2xl border border-white/[0.08] shadow-dark-card overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-[#14141a]/80 border-b border-white/[0.08] flex items-center justify-between gap-4 shrink-0">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] text-[#3b5bff] text-xs font-medium mb-1 border border-white/[0.08]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Official Brand Identity · BongoWeb</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-[#f5f5f7] tracking-tight">
              BongoWeb Professional Vector Logos
            </h2>
            <p className="text-xs sm:text-sm text-[#a1a1b0] mt-0.5 font-normal">
              Two official production versions: Full Horizontal Wordmark (4:1) & Centered Square Icon (1:1).
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Light / Dark Canvas Toggle */}
            <div className="bg-white/[0.04] border border-white/[0.08] p-1 rounded-xl flex items-center gap-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setPreviewBg('light')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  previewBg === 'light'
                    ? 'bg-[#3b5bff] text-white shadow-2xs'
                    : 'text-[#a1a1b0] hover:text-[#f5f5f7]'
                }`}
              >
                Light Canvas
              </button>
              <button
                type="button"
                onClick={() => setPreviewBg('dark')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  previewBg === 'dark'
                    ? 'bg-[#3b5bff] text-white shadow-2xs'
                    : 'text-[#a1a1b0] hover:text-[#f5f5f7]'
                }`}
              >
                Dark Canvas
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-[#a1a1b0] hover:text-[#f5f5f7] border border-white/[0.08] flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-8 overflow-y-auto space-y-8 flex-1 bg-[#09090b]">
          {/* Side by Side Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* ========================================================= */}
            {/* VERSION 1: FULL LOGO (HORIZONTAL 4:1)                     */}
            {/* ========================================================= */}
            <div className="lg:col-span-7 flex flex-col justify-between bg-[#0e0e12] border border-white/[0.08] rounded-2xl p-5 sm:p-6 space-y-4 shadow-dark-card">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full bg-[#3b5bff] text-white text-xs font-medium uppercase tracking-wider">
                    Version 1
                  </span>
                  <span className="text-xs font-mono font-medium text-[#71717a]">
                    Ratio: ~4:1 (440 × 110 px)
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-[#f5f5f7]">
                  Full Logo (Horizontal)
                </h3>
                <p className="text-xs text-[#a1a1b0] font-normal">
                  Icon emblem + "BongoWeb" wordmark. Styled for website headers, navigation, invoices, and brand cards.
                </p>
              </div>

              {/* Display Box */}
              <div 
                className={`relative w-full h-44 sm:h-52 rounded-xl border transition-all duration-300 flex items-center justify-center p-6 overflow-hidden ${
                  previewBg === 'light'
                    ? 'bg-white border-white/[0.2] shadow-sm'
                    : 'bg-[#09090b] border-white/[0.08] shadow-inner'
                }`}
              >
                <img
                  src="/bongoweb-logo-horizontal.svg"
                  alt="BongoWeb Full Horizontal Logo"
                  className="max-h-20 sm:max-h-24 w-auto object-contain transition-transform duration-300 hover:scale-105"
                />
              </div>

              {/* Version 1 Actions & Specs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2">
                <div className="flex items-center gap-1.5 text-[11px] text-[#71717a]">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Ultra-crisp SVG vector · Scaling 16px - 2000px</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopySvg(1)}
                    className="px-3 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-[#f5f5f7] border border-white/[0.08] text-xs font-medium inline-flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {copiedV1 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedV1 ? 'Copied SVG' : 'Copy SVG'}</span>
                  </button>

                  <a
                    href="/bongoweb-logo-horizontal.svg"
                    download="bongoweb-logo-horizontal.svg"
                    className="px-4 py-1.5 rounded-full bg-[#3b5bff] hover:bg-[#324ecc] text-white text-xs font-medium inline-flex items-center gap-1.5 transition-all shadow-md shadow-[#3b5bff]/25 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download SVG</span>
                  </a>
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* VERSION 2: ICON ONLY (SQUARE 1:1)                         */}
            {/* ========================================================= */}
            <div className="lg:col-span-5 flex flex-col justify-between bg-[#0e0e12] border border-white/[0.08] rounded-2xl p-5 sm:p-6 space-y-4 shadow-dark-card">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full bg-white/[0.08] text-[#f5f5f7] border border-white/[0.1] text-xs font-medium uppercase tracking-wider">
                    Version 2
                  </span>
                  <span className="text-xs font-mono font-medium text-[#71717a]">
                    Ratio: 1:1 (256 × 256 px)
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-[#f5f5f7]">
                  Icon Only (Square)
                </h3>
                <p className="text-xs text-[#a1a1b0] font-normal">
                  Gradient emblem with adaptive margin for Android maskable icons, iOS, and favicons.
                </p>
              </div>

              {/* Display Box */}
              <div 
                className={`relative w-full h-44 sm:h-52 rounded-xl border transition-all duration-300 flex items-center justify-center p-6 overflow-hidden ${
                  previewBg === 'light'
                    ? 'bg-white border-white/[0.2] shadow-sm'
                    : 'bg-[#09090b] border-white/[0.08] shadow-inner'
                }`}
              >
                <img
                  src="/bongoweb-icon-square.svg"
                  alt="BongoWeb Square Icon"
                  className="max-h-28 sm:max-h-32 w-auto object-contain transition-transform duration-300 hover:scale-110"
                />

                {/* Adaptive Maskable Safe Zone Overlay Guide */}
                {showMaskGuide && (
                  <div 
                    className="absolute inset-0 pointer-events-none flex items-center justify-center"
                    title="Android Adaptive Icon 66% Keyline Circle Safe Zone"
                  >
                    <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full border-2 border-dashed border-[#3b5bff]/40 flex items-center justify-center">
                      <span className="text-[9px] font-mono font-medium text-[#3b5bff] tracking-wider bg-[#09090b]/80 px-1 rounded">
                        Safe Zone
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Version 2 Actions & Specs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMaskGuide(!showMaskGuide)}
                  className="inline-flex items-center gap-1.5 text-[11px] text-[#a1a1b0] hover:text-[#f5f5f7] font-medium cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-[#3b5bff]" />
                  <span>{showMaskGuide ? 'Hide Safe Zone' : 'Show Safe Zone'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopySvg(2)}
                    className="px-3 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-[#f5f5f7] border border-white/[0.08] text-xs font-medium inline-flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {copiedV2 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedV2 ? 'Copied' : 'Copy'}</span>
                  </button>

                  <a
                    href="/bongoweb-icon-square.svg"
                    download="bongoweb-icon-square.svg"
                    className="px-4 py-1.5 rounded-full bg-[#3b5bff] hover:bg-[#324ecc] text-white text-xs font-medium inline-flex items-center gap-1.5 transition-all shadow-md shadow-[#3b5bff]/25 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download SVG</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* BRAND COLOR PALETTE & DESIGN TOKENS                       */}
          {/* ========================================================= */}
          <div className="bg-[#0e0e12] border border-white/[0.08] rounded-2xl p-5 sm:p-6 space-y-3">
            <h4 className="text-xs font-semibold text-[#f5f5f7] uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#3b5bff]" />
              <span>Official Brand Palette & Design Tokens</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#09090b] border border-white/[0.1] shrink-0" />
                <div>
                  <p className="text-xs font-mono font-medium text-[#f5f5f7]">#09090b</p>
                  <p className="text-[10px] text-[#71717a]">Dark Base</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#0e0e12] border border-white/[0.1] shrink-0" />
                <div>
                  <p className="text-xs font-mono font-medium text-[#f5f5f7]">#0e0e12</p>
                  <p className="text-[10px] text-[#71717a]">Dark Surface</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#3b5bff] shadow-inner shrink-0" />
                <div>
                  <p className="text-xs font-mono font-medium text-[#f5f5f7]">#3b5bff</p>
                  <p className="text-[10px] text-[#71717a]">Royal Blue Accent</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#f5f5f7] shadow-inner shrink-0" />
                <div>
                  <p className="text-xs font-mono font-medium text-[#f5f5f7]">#f5f5f7</p>
                  <p className="text-[10px] text-[#71717a]">Primary Text</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-[#14141a]/80 border-t border-white/[0.08] flex items-center justify-between flex-wrap gap-3 shrink-0">
          <p className="text-xs text-[#71717a] font-normal">
            Files stored in public directory: <code className="px-1.5 py-0.5 rounded bg-white/[0.06] text-[#a1a1b0] text-[11px] font-mono">/public/bongoweb-logo-horizontal.svg</code>
          </p>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#3b5bff] hover:bg-[#324ecc] text-white text-xs font-medium cursor-pointer transition-all shadow-md shadow-[#3b5bff]/25 ml-auto"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
}
