import React from 'react';
import { 
  Phone, Mail, MapPin, ShieldCheck, ExternalLink, 
  Cookie, Lock, ArrowUpRight, Heart, CheckCircle2 
} from 'lucide-react';
import BongoWebLogo from './BongoWebLogo';

interface AppFooterProps {
  onNavigateHome: () => void;
  onNavigateTemplates: () => void;
  onNavigateLiveChat: () => void;
  onNavigateAccount: () => void;
  onNavigatePrivacy: () => void;
  onNavigateTerms: () => void;
  onNavigateCookies: () => void;
  onNavigateRefund: () => void;
}

export default function AppFooter({
  onNavigateHome,
  onNavigateTemplates,
  onNavigateLiveChat,
  onNavigateAccount,
  onNavigatePrivacy,
  onNavigateTerms,
  onNavigateCookies,
  onNavigateRefund
}: AppFooterProps) {
  const currentYear = new Date().getFullYear();

  const handleOpenCookiePreferences = () => {
    window.dispatchEvent(new CustomEvent('bongoweb_open_cookie_preferences'));
  };

  return (
    <footer 
      role="contentinfo" 
      aria-label="Site Footer" 
      className="w-full bg-white border-t border-[#EDE4F5] text-[#1F1F2E] font-sans pt-12 pb-20 md:pb-12 mt-auto"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Grid: Brand & Business Details, Quick Navigation, Legal, Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 pb-10 border-b border-[#EDE4F5]">
          
          {/* Column 1 & 2: Brand Identity & Business Registration Info */}
          <div className="lg:col-span-2 space-y-4">
            {/* Clickable Logo */}
            <div 
              onClick={onNavigateHome}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigateHome(); } }}
              aria-label="BongoWeb Home"
              className="inline-flex items-center cursor-pointer group active:scale-95 transition-transform"
              title="Return to BongoWeb Home"
            >
              <BongoWebLogo size="md" />
            </div>

            <p className="text-xs sm:text-sm text-[#5C4E4B] leading-relaxed max-w-sm">
              Stripe-standard business website catalog, custom web development, and instant deployment solutions. Explore verified live demos with 24-hour setup assistance and 24/7 dedicated support.
            </p>

            {/* Official Business Details */}
            <div className="p-3.5 rounded-2xl bg-[#F8F5FC] border border-[#EDE4F5] text-xs space-y-1.5 text-[#4A4A5A]">
              <div className="flex items-center gap-1.5 font-bold text-[#1F1F2E]">
                <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                <span>BongoWeb Digital Solutions Ltd.</span>
              </div>
              <p className="text-[11px] text-[#6B7280]">
                Registered digital agency &amp; managed cloud orchestrator.
              </p>
              <div className="flex items-start gap-1.5 text-[11px] text-[#4A4A5A] pt-1">
                <MapPin className="w-3.5 h-3.5 text-[#5B2C8A] shrink-0 mt-0.5" />
                <span>Block B, Banani, Dhaka 1213, Bangladesh</span>
              </div>
            </div>
          </div>

          {/* Column 3: Platform Navigation */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F1F2E]">
              Platform
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={onNavigateHome}
                  className="text-[#5C4E4B] hover:text-[#5B2C8A] transition-colors cursor-pointer"
                >
                  Home (ক্যাটাগরি সমূহ)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onNavigateTemplates}
                  className="text-[#5C4E4B] hover:text-[#5B2C8A] transition-colors cursor-pointer"
                >
                  All Templates (সব টেমপ্লেট)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onNavigateLiveChat}
                  className="text-[#5C4E4B] hover:text-[#5B2C8A] transition-colors cursor-pointer"
                >
                  24/7 Live Chat Support
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onNavigateAccount}
                  className="text-[#5C4E4B] hover:text-[#5B2C8A] transition-colors cursor-pointer"
                >
                  Customer Account &amp; Vault
                </button>
              </li>
              <li>
                <a
                  href="/admin"
                  onClick={(e) => {
                    e.preventDefault();
                    window.history.pushState({}, '', '/admin');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                  className="text-[#5B2C8A] hover:underline font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin Panel (/admin)</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal & Compliance */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F1F2E]">
              Legal &amp; Trust
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={onNavigatePrivacy}
                  className="text-[#5C4E4B] hover:text-[#5B2C8A] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>Privacy Policy (DPDP Act)</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onNavigateTerms}
                  className="text-[#5C4E4B] hover:text-[#5B2C8A] transition-colors cursor-pointer"
                >
                  Terms &amp; Conditions
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onNavigateRefund}
                  className="text-[#5C4E4B] hover:text-[#5B2C8A] transition-colors cursor-pointer"
                >
                  Refund Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onNavigateCookies}
                  className="text-[#5C4E4B] hover:text-[#5B2C8A] transition-colors cursor-pointer"
                >
                  Cookie Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleOpenCookiePreferences}
                  className="text-[#5B2C8A] hover:underline font-semibold cursor-pointer flex items-center gap-1"
                >
                  <Cookie className="w-3.5 h-3.5" />
                  <span>Cookie Settings</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 5: Clickable Contact Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F1F2E]">
              Contact &amp; Assistance
            </h3>
            <div className="space-y-2 text-xs text-[#5C4E4B]">
              <p>
                <span className="block text-[11px] text-[#6B7280]">Customer Support Hotline:</span>
                <a 
                  href="tel:+8801955570912" 
                  aria-label="Call customer support at 01955570912"
                  className="text-[#5B2C8A] hover:underline font-bold text-xs sm:text-sm font-mono inline-flex items-center gap-1 mt-0.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>01955570912</span>
                </a>
              </p>

              <p>
                <span className="block text-[11px] text-[#6B7280]">Official Inquiries Email:</span>
                <a 
                  href="mailto:support@bongoweb.xyz" 
                  aria-label="Email customer support at support@bongoweb.xyz"
                  className="text-[#5B2C8A] hover:underline font-semibold inline-flex items-center gap-1 mt-0.5 break-all"
                >
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span>support@bongoweb.xyz</span>
                </a>
              </p>

              <p>
                <span className="block text-[11px] text-[#6B7280]">Privacy &amp; Grievance Officer:</span>
                <a 
                  href="mailto:privacy@bongoweb.xyz" 
                  aria-label="Email Data Protection & Grievance Officer at privacy@bongoweb.xyz"
                  className="text-[#4A4A5A] hover:text-[#5B2C8A] hover:underline inline-flex items-center gap-1 mt-0.5 break-all"
                >
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span>privacy@bongoweb.xyz</span>
                </a>
              </p>

              <div className="pt-1 text-[11px] text-[#10B981] flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>24/7 Live Desk Active</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Compliance */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6B7280]">
          <p className="text-center sm:text-left">
            &copy; {currentYear} BongoWeb Digital Solutions Ltd. All rights reserved.
          </p>

          <div className="flex items-center gap-4 text-[11px] flex-wrap justify-center">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
              <span>SSL 256-Bit Encrypted</span>
            </span>
            <span>•</span>
            <span>DPDP Act (India) Compliant</span>
            <span>•</span>
            <span>GDPR Ready</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
