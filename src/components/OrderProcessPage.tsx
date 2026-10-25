import { ArrowLeft, PhoneCall, Sparkles, Rocket, MessageCircle, ShieldCheck } from 'lucide-react';

interface OrderProcessPageProps {
  onBack: () => void;
}

export default function OrderProcessPage({ onBack }: OrderProcessPageProps) {
  const steps = [
    {
      number: '1',
      icon: PhoneCall,
      title: 'আপনাকে আমরা phone করে বিস্তারিত জেনে নিবো।'
    },
    {
      number: '2',
      icon: Sparkles,
      title: 'আপনার ব্যবসার logo ও প্রয়োজনীয় তথ্য আমরা সংগ্রহ করবো।'
    },
    {
      number: '3',
      icon: Rocket,
      title: 'আপনার পছন্দের color ধরন ও website এর প্রয়োজনীয় বিষয়গুলো নিয়ে আমরা website টা ready করে দিব।'
    },
    {
      number: '4',
      icon: ShieldCheck,
      title: '৪৮ ঘন্টার মধ্যে website delivery + Free Support'
    }
  ];

  return (
    <div 
      id="order-process-page"
      className="min-h-screen w-full bg-[#F1F5F9] text-slate-900 flex flex-col font-sans transition-colors duration-300"
    >
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <button
            onClick={onBack}
            id="order-process-back-btn"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold transition-all border border-slate-200 cursor-pointer shadow-xs active:scale-[0.99]"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
            <span>← ক্যাটালগে ফিরুন</span>
          </button>

          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>৪৮ ঘণ্টার ডেলিভারি গ্যারান্টি</span>
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14 flex flex-col items-center animate-fadeIn">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 mb-3 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>অর্ডার প্রসেস ও ওয়ার্কফ্লো</span>
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            অর্ডারের পর <span className="text-purple-700 underline decoration-purple-300 underline-offset-8">ধারাবাহিক পদক্ষেপসমূহ</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            অর্ডার কনফার্ম করার পর থেকে লাইভ ডেলিভারি পর্যন্ত প্রতিটি ধাপের বিস্তারিত।
          </p>
        </div>

        {/* 4 Points Cards Grid */}
        <div className="w-full space-y-4 mb-10">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-purple-300 hover:shadow-md transition-all flex items-center gap-4 sm:gap-5 hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-base sm:text-lg font-bold text-slate-400 font-mono">
                    {step.number}
                  </span>
                  <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center shrink-0 shadow-xs">
                    <Icon className="w-5 h-5 stroke-[2]" />
                  </div>
                </div>

                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">
                    {step.title}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Return Action */}
        <div className="flex justify-center w-full">
          <button
            onClick={onBack}
            id="order-process-return-bottom-btn"
            className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md cursor-pointer transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
            <span>Return to Catalog</span>
          </button>
        </div>
      </main>
    </div>
  );
}
