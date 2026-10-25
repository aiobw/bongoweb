import { useState } from 'react';
import { 
  Headphones, X, MessageCircle, Phone, Send, 
  ChevronDown, ChevronUp, CheckCircle2, Clock 
} from 'lucide-react';
import { SUPPORT_FAQS } from '../data/mockData';

export default function LiveSupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [callbackName, setCallbackName] = useState('');
  const [callbackPhone, setCallbackPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleCallbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!callbackPhone.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setCallbackName('');
      setCallbackPhone('');
      setIsOpen(false);
    }, 2200);
  };

  const whatsappUrl = `https://wa.me/8801955570912?text=${encodeURIComponent(
    'Hello BongoWeb Team, I am interested in launching a website for my business. Please share details.'
  )}`;

  return (
    <>
      {/* Floating Action Button */}
      <div 
        id="live-support-floating-wrapper"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2"
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          id="live-support-btn"
          aria-label="Live Support"
          className="group relative flex items-center justify-center w-13 h-13 rounded-full btn-maroon text-white shadow-[0_4px_22px_rgba(128,0,32,0.35)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
        >
          <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-85"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-white border-2 border-[#DC2626]"></span>
          </span>

          {isOpen ? (
            <X className="w-5 h-5 transition-transform duration-200 text-white stroke-[2.5]" />
          ) : (
            <Headphones className="w-5 h-5 transition-transform duration-200 text-white stroke-[2.5]" />
          )}
        </button>
      </div>

      {/* Floating Support Drawer */}
      {isOpen && (
        <div 
          id="live-support-drawer"
          className="fixed bottom-22 right-4 sm:right-6 z-50 w-[92vw] sm:w-[380px] bg-white rounded-3xl shadow-[0_20px_60px_rgba(220,38,38,0.18)] border border-slate-200 overflow-hidden flex flex-col text-[#1C1614] animate-fadeIn"
          role="dialog"
        >
          {/* Header */}
          <div className="bg-[#FAF7F2] p-4 text-[#1C1614] border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-baseline select-none">
                  <span className="font-black text-sm text-[#1C1614] tracking-tight">
                    Bongo
                  </span>
                  <span className="font-black text-sm text-[#DC2626] tracking-tight ml-0.5">
                    Web
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] ml-0.5 mb-0.5 shrink-0" />
                  <span className="text-[10px] font-semibold text-[#7A6A66] ml-1.5">Live Assistance</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#7A6A66] mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] animate-pulse"></span>
                  <span>Engineering team online</span>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-[#7A6A66] hover:text-[#DC2626] hover:bg-[#DC2626]/10 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Contact Buttons */}
          <div className="p-3 bg-[#FAF7F2] border-b border-slate-200 flex items-center gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#DC2626] to-[#7C3AED] hover:from-[#B91C1C] hover:to-[#6D28D9] text-white text-xs font-bold shadow-xs transition-all hover:scale-[1.02]"
            >
              <MessageCircle className="w-4 h-4 stroke-[2.5]" />
              <span>WhatsApp Chat</span>
            </a>

            <a
              href="tel:+8801955570912"
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white hover:bg-[#DC2626]/5 text-[#1C1614] border border-slate-200 text-xs font-bold shadow-xs transition-all hover:scale-[1.02]"
            >
              <Phone className="w-3.5 h-3.5 text-[#DC2626]" />
              <span>Direct Call</span>
            </a>
          </div>

          {/* Body */}
          <div className="p-4 max-h-[360px] overflow-y-auto space-y-4">
            {/* Quick Callback Form */}
            <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-[#1C1614] block mb-0.5">
                Free Callback Request
              </span>
              <p className="text-[11px] text-[#DC2626] font-semibold mb-3">
                💡 Leave your phone number and an engineer will call you in ~5 mins.
              </p>

              {submitted ? (
                <div className="p-3 rounded-xl bg-[#DC2626]/10 text-[#DC2626] text-xs font-semibold flex items-center gap-2 border border-[#DC2626]/25">
                  <CheckCircle2 className="w-4 h-4 text-[#DC2626] shrink-0" />
                  <span>Request received. Calling you shortly!</span>
                </div>
              ) : (
                <form onSubmit={handleCallbackSubmit} className="space-y-2">
                  <input
                    type="text"
                    value={callbackName}
                    onChange={(e) => setCallbackName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full px-3 py-2 bg-white border border-slate-200 text-[#1C1614] rounded-xl text-xs placeholder-[#7A6A66]/50 focus:outline-none focus:border-[#DC2626] transition-all"
                  />
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      required
                      value={callbackPhone}
                      onChange={(e) => setCallbackPhone(e.target.value)}
                      placeholder="Mobile or WhatsApp number"
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 text-[#1C1614] rounded-xl text-xs placeholder-[#7A6A66]/50 focus:outline-none focus:border-[#DC2626] font-mono transition-all"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-gradient-to-r from-[#DC2626] to-[#7C3AED] hover:from-[#B91C1C] hover:to-[#6D28D9] text-white text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1 shrink-0 shadow-xs hover:scale-[1.02]"
                    >
                      <Send className="w-3 h-3 text-white stroke-[2.5]" />
                      <span>Request</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Quick FAQs */}
            <div>
              <span className="text-xs font-bold text-[#1C1614] block mb-2">
                Frequently Asked Questions
              </span>
              <div className="space-y-1.5">
                {SUPPORT_FAQS.map((faq, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div 
                      key={idx} 
                      className="rounded-xl border border-slate-200 bg-[#FAF7F2] overflow-hidden text-xs"
                    >
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        className="w-full p-3 text-left font-medium text-[#1C1614] flex items-center justify-between hover:bg-[#DC2626]/5 transition-colors cursor-pointer"
                      >
                        <span className="pr-2">{faq.q}</span>
                        {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-[#DC2626] shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-[#7A6A66] shrink-0" />}
                      </button>
                      {isOpen && (
                        <div className="px-3 pb-3 pt-1 text-[11px] text-[#5C4E4B] bg-white border-t border-slate-200 leading-relaxed">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="p-2.5 bg-[#FAF7F2] border-t border-slate-200 text-center text-[10px] text-[#7A6A66] flex items-center justify-center gap-1.5 font-medium">
            <Clock className="w-3 h-3 text-[#DC2626]" />
            <span>Dedicated developer support active 7 days a week</span>
          </div>
        </div>
      )}
    </>
  );
}
