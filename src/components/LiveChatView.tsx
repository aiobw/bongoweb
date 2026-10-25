import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Send, ShieldCheck, CheckCheck, 
  RotateCcw, X, Phone, AlertCircle,
  User, CheckCircle2, ChevronRight,
  Copy, Check, LogOut, Sparkles, Pencil
} from 'lucide-react';
import { 
  apiActivateChat, 
  apiSendChatMessage, 
  apiEndChat, 
  apiReopenChat, 
  subscribeToSingleChatThread, 
  apiGetLiveChatEnabled,
  normalizePhone 
} from '../utils/api';
import { SupportChatThread, SupportChatMessage, UserAccount } from '../types';
import { getClientSecurityCode, getSecurityCodeRemainingSeconds, formatRemainingTime } from '../utils/securityCode';
import { useLanguage } from '../utils/LanguageContext';
import { realtimeManager } from '../utils/realtime';

interface LiveChatViewProps {
  onExitChat?: () => void;
}

export default function LiveChatView({ onExitChat }: LiveChatViewProps) {
  const { t, language } = useLanguage();

  // Admin status (online / offline)
  const [isLiveOnline, setIsLiveOnline] = useState<boolean>(true);

  // Client Identification State
  const [currentUser] = useState<UserAccount | null>(() => {
    try {
      const stored = localStorage.getItem('bongoweb_user') || sessionStorage.getItem('bongoweb_user');
      if (stored) return JSON.parse(stored);
    } catch (_) {}
    return null;
  });

  const [clientName, setClientName] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('bongoweb_user') || sessionStorage.getItem('bongoweb_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u.name) return u.name;
      }
      const session = localStorage.getItem('bongoweb_chat_active_session');
      if (session) {
        const s = JSON.parse(session);
        if (s.name) return s.name;
      }
    } catch (_) {}
    return '';
  });

  const [clientPhone, setClientPhone] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('bongoweb_user') || sessionStorage.getItem('bongoweb_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u.phone) return u.phone;
      }
      const session = localStorage.getItem('bongoweb_chat_active_session');
      if (session) {
        const s = JSON.parse(session);
        if (s.phone) return s.phone;
      }
    } catch (_) {}
    return '';
  });

  // Active Chat State
  const [isChatActive, setIsChatActive] = useState<boolean>(() => {
    try {
      const session = localStorage.getItem('bongoweb_chat_active_session');
      return !!session;
    } catch (_) {}
    return false;
  });

  const [thread, setThread] = useState<SupportChatThread | null>(null);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Client Rename State
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [editNameInput, setEditNameInput] = useState<string>('');

  const handleSaveNewName = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = editNameInput.trim();
    if (!clean) return;

    setClientName(clean);
    setIsEditingName(false);

    try {
      const activeSession = localStorage.getItem('bongoweb_chat_active_session');
      if (activeSession) {
        const s = JSON.parse(activeSession);
        s.name = clean;
        localStorage.setItem('bongoweb_chat_active_session', JSON.stringify(s));
      }
      const user = localStorage.getItem('bongoweb_user');
      if (user) {
        const u = JSON.parse(user);
        u.name = clean;
        localStorage.setItem('bongoweb_user', JSON.stringify(u));
      }
    } catch (_) {}

    if (thread) {
      setThread(prev => prev ? { ...prev, userName: clean } : prev);
    }
  };

  // 5-Min Rotating Security Code Countdown
  const [codeCountdown, setCodeCountdown] = useState<number>(getSecurityCodeRemainingSeconds());
  const [currentSecurityCode, setCurrentSecurityCode] = useState<string>('');

  // Chat stream auto-scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);

  // Clean, focused quick questions
  const quickQuestions = [
    { labelBn: '৳১,৯৯০ প্যাকেজ', labelEn: '৳1,990 Package', query: '৳১,৯৯০ ওয়েবসাইট প্যাকেজে কী কী সুবিধা আছে?' },
    { labelBn: '২৪ ঘণ্টার ডেলিভারি', labelEn: '24h Delivery', query: 'অর্ডারের পর ২৪ ঘণ্টার মধ্যে কীভাবে ওয়েবসাইট লাইভ হবে?' },
    { labelBn: 'পেমেন্ট নিয়ম', labelEn: 'Payment Info', query: 'বিকাশ ও নগদ পেমেন্ট নিশ্চিত করার নিয়ম কী?' },
    { labelBn: 'ডোমেন ও হোস্টিং', labelEn: 'Domain & Host', query: 'ফ্রি .com ডোমেন ও ক্লাউড হোস্টিং কীভাবে পাব?' }
  ];

  // Exit Chat handler: Ends active chat, archives it into database, clears active session, and navigates
  const handleExit = async () => {
    const phoneToClose = clientPhone || (() => {
      try {
        const s = localStorage.getItem('bongoweb_chat_active_session');
        if (s) return JSON.parse(s).phone;
      } catch (_) {}
      return '';
    })();

    if (phoneToClose) {
      try {
        await apiEndChat(phoneToClose, !!currentUser);
      } catch (err) {
        console.warn('Error closing chat on exit:', err);
      }
    }

    try {
      localStorage.removeItem('bongoweb_chat_active_session');
      sessionStorage.removeItem('bongoweb_chat_active_session');
    } catch (_) {}

    setIsChatActive(false);
    setThread(null);
    setInputMessage('');

    if (onExitChat) {
      onExitChat();
    } else {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  // 1. Monitor Live Chat Online/Offline status
  useEffect(() => {
    apiGetLiveChatEnabled().then(enabled => setIsLiveOnline(enabled));

    const unsubscribe = realtimeManager.on('system:chat_status', (data: { enabled: boolean }) => {
      if (data && typeof data.enabled === 'boolean') {
        setIsLiveOnline(data.enabled);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // 2. Synchronize rotating security code every second
  useEffect(() => {
    if (!clientPhone) return;
    setCurrentSecurityCode(getClientSecurityCode(clientPhone));

    const interval = setInterval(() => {
      const remaining = getSecurityCodeRemainingSeconds();
      setCodeCountdown(remaining);
      if (remaining === 300 || remaining === 0) {
        setCurrentSecurityCode(getClientSecurityCode(clientPhone));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [clientPhone]);

  // 3. Subscribe to real-time chat messages and monitor when admin closes chat
  useEffect(() => {
    const cleanPhone = normalizePhone(clientPhone);
    if (!cleanPhone || !isChatActive) return;

    // Direct Firestore real-time listener
    const unsubscribe = subscribeToSingleChatThread(cleanPhone, (incomingThread) => {
      if (!incomingThread) {
        // Document deleted by admin -> immediately end active session
        try {
          localStorage.removeItem('bongoweb_chat_active_session');
          sessionStorage.removeItem('bongoweb_chat_active_session');
        } catch (_) {}
        setIsChatActive(false);
        setThread(null);
        return;
      }

      // If admin has closed or archived the chat, immediately close and archive it on the client
      if (incomingThread.isClosed || incomingThread.isArchived) {
        try {
          localStorage.removeItem('bongoweb_chat_active_session');
          sessionStorage.removeItem('bongoweb_chat_active_session');
        } catch (_) {}
        setIsChatActive(false);
        setThread(null);
        setErrorMessage(language === 'bn' 
          ? 'এডমিন লাইভ চ্যাটটি সমাপ্ত করেছেন। পূর্ববর্তী চ্যাট আর্কাইভে সংরক্ষিত হয়েছে।' 
          : 'Live chat has been closed by admin. Previous session has been archived.');
        return;
      }

      setThread(incomingThread);
      setIsChatActive(true);
    });

    // Realtime broadcast listener (chat:ended from admin or server)
    const unsubscribeEnded = realtimeManager.on('chat:ended', (data: any) => {
      const endedDigits = data?.phone ? normalizePhone(data.phone).slice(-10) : '';
      const myDigits = cleanPhone.slice(-10);
      if (!endedDigits || endedDigits === myDigits) {
        try {
          localStorage.removeItem('bongoweb_chat_active_session');
          sessionStorage.removeItem('bongoweb_chat_active_session');
        } catch (_) {}
        setIsChatActive(false);
        setThread(null);
        setErrorMessage(language === 'bn' 
          ? 'এডমিন লাইভ চ্যাটটি সমাপ্ত করেছেন। পূর্ববর্তী চ্যাট আর্কাইভে সংরক্ষিত হয়েছে।' 
          : 'Live chat has been closed by admin. Previous session has been archived.');
      }
    });

    const handleWindowChatEnded = (e: any) => {
      const endedDigits = e?.detail?.phone ? normalizePhone(e.detail.phone).slice(-10) : '';
      const myDigits = cleanPhone.slice(-10);
      if (!endedDigits || endedDigits === myDigits) {
        try {
          localStorage.removeItem('bongoweb_chat_active_session');
          sessionStorage.removeItem('bongoweb_chat_active_session');
        } catch (_) {}
        setIsChatActive(false);
        setThread(null);
      }
    };
    window.addEventListener('bongoweb_chat_ended', handleWindowChatEnded);

    // Local server fallback cache
    fetch(`/api/chat/thread/${encodeURIComponent(cleanPhone)}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          if (data.isClosed || data.isArchived) {
            try {
              localStorage.removeItem('bongoweb_chat_active_session');
              sessionStorage.removeItem('bongoweb_chat_active_session');
            } catch (_) {}
            setIsChatActive(false);
            setThread(null);
          } else if (!thread) {
            setThread(data);
          }
        }
      })
      .catch(() => {});

    return () => {
      if (unsubscribe) unsubscribe();
      if (typeof unsubscribeEnded === 'function') unsubscribeEnded();
      window.removeEventListener('bongoweb_chat_ended', handleWindowChatEnded);
    };
  }, [clientPhone, isChatActive, language]);

  // Auto-scroll chat to latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [thread?.messages]);

  // Copy Security Code
  const handleCopyCode = () => {
    const code = currentSecurityCode || getClientSecurityCode(clientPhone);
    if (!code) return;
    navigator.clipboard?.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Start direct chat with admin
  const handleStartChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    const cleanPhone = normalizePhone(clientPhone);
    const cleanName = clientName.trim();

    if (!cleanName) {
      setErrorMessage(t('অনুগ্রহ করে আপনার নাম লিখুন', 'Please enter your name'));
      return;
    }

    if (!cleanPhone || cleanPhone.length < 8) {
      setErrorMessage(t('সঠিক মোবাইল নম্বর প্রদান করুন (যেমন: 017xxxxxxxx)', 'Please provide a valid phone number'));
      return;
    }

    setInitialLoading(true);

    try {
      const welcomeText = language === 'bn'
        ? `স্বাগতম ${cleanName}! BongoWeb লাইভ সাপোর্ট সেন্টারে আপনাকে স্বাগতম। আপনার যেকোনো প্রশ্ন লিখুন, আমাদের টিম সরাসরি সহায়তা দিচ্ছেন।`
        : `Welcome ${cleanName}! You are connected with BongoWeb Live Support. How may we assist you?`;

      const newThread = await apiActivateChat({
        name: cleanName,
        phone: cleanPhone,
        language: language as 'bn' | 'en',
        welcomeText
      });

      setThread(newThread);
      setIsChatActive(true);
      localStorage.setItem('bongoweb_chat_active_session', JSON.stringify({
        name: cleanName,
        phone: cleanPhone,
        language
      }));
    } catch (err) {
      console.error('Failed to start chat:', err);
      setErrorMessage(t('চ্যাট চালু করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।', 'Failed to connect. Please try again.'));
    } finally {
      setInitialLoading(false);
    }
  };

  // Send message to admin panel
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    const cleanPhone = normalizePhone(clientPhone);

    if (!text || !cleanPhone || isSending) return;

    setIsSending(true);
    setInputMessage('');

    try {
      const newMsg: SupportChatMessage = {
        id: `client-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        sender: 'client',
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      // Optimistic update
      setThread(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          lastMessage: text,
          lastUpdated: 'এখনই',
          isClosed: false,
          messages: [...(prev.messages || []), newMsg]
        };
      });

      await apiSendChatMessage({
        phone: cleanPhone,
        sender: 'client',
        text,
        name: clientName,
        message: newMsg
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  };

  // End chat session
  const handleEndChat = async () => {
    if (!clientPhone) return;
    const confirmClose = window.confirm(
      t('আপনি কি চ্যাট সেশনটি সমাপ্ত করতে চান?', 'Are you sure you want to end this chat session?')
    );
    if (!confirmClose) return;

    try {
      await apiEndChat(clientPhone, !!currentUser);
      localStorage.removeItem('bongoweb_chat_active_session');
      setIsChatActive(false);
      setThread(null);
    } catch (err) {
      console.error('Failed to end chat:', err);
    }
  };

  // Reopen closed chat
  const handleReopen = async () => {
    if (!clientPhone) return;
    try {
      await apiReopenChat(clientPhone);
      setIsChatActive(true);
      if (thread) {
        setThread({
          ...thread,
          isClosed: false,
          isArchived: false,
          expiresAt: Date.now() + 5 * 60 * 1000
        });
      }
    } catch (err) {
      console.error('Failed to reopen chat:', err);
    }
  };

  const cleanMsgs = (() => {
    const msgs = thread?.messages || [];
    const seen = new Set<string>();
    return msgs.filter(m => {
      if (!m || !m.text) return false;
      const key = `${m.sender}:${m.text.trim()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  })();

  return (
    <div className="w-full max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto px-3 sm:px-6 h-[calc(100dvh-130px)] sm:h-[calc(100dvh-146px)] lg:h-[calc(100vh-105px)] flex flex-col overflow-hidden font-sans select-none pb-1">
      
      {!isChatActive ? (
        /* STEP 1: COMPACT, PRECISELY SIZED START CHAT CARD (NO PAGE SCROLL) */
        <div className="h-full flex flex-col justify-center items-center py-2">
          <div className="w-full max-w-md bg-white border border-[#EDE4F5] rounded-[24px] sm:rounded-[28px] shadow-[0_10px_35px_-5px_rgba(91,44,138,0.08)] p-6 sm:p-8 overflow-hidden animate-fadeIn">
            
            {/* Header with Centered Title & Status */}
            <div className="flex items-center justify-center pb-3.5 mb-4 border-b border-[#EDE4F5] w-full">
              <div className="flex items-center justify-center gap-2.5 text-center">
                <div className="w-10 h-10 rounded-2xl bg-[#F8F5FC] text-[#5B2C8A] border border-[#EDE4F5] flex items-center justify-center shadow-xs shrink-0">
                  <MessageSquare className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="text-left">
                  <h2 className="text-sm sm:text-base font-extrabold text-[#1F1F2E] leading-tight">
                    {t('BongoWeb লাইভ চ্যাট', 'BongoWeb Live Chat')}
                  </h2>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-bold mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{isLiveOnline ? t('সরাসরি অনলাইন (২৪/৭)', 'Online Now (24/7)') : t('অনলাইন', 'Online')}</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-[#6B7280] mb-4 text-center leading-relaxed">
              {t('সরাসরি আমাদের সাপোর্ট টিমের সাথে কথা বলতে নিচের তথ্য দিন:', 'Connect directly with our support team:')}
            </p>

            {errorMessage && (
              <div className="mb-3.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleStartChat} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#1F1F2E] mb-1">
                  {t('আপনার নাম', 'Your Name')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B7280]">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder={t('যেমন: মো: তানভীর আহমেদ', 'e.g. Tanvir Ahmed')}
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#F8F5FC] border border-[#EDE4F5] text-xs sm:text-sm text-[#1F1F2E] placeholder-[#6B7280] focus:outline-none focus:border-[#5B2C8A] focus:bg-white transition-all shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F1F2E] mb-1">
                  {t('মোবাইল / হোয়াটসঅ্যাপ নম্বর', 'WhatsApp / Mobile')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B7280]">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder="017xxxxxxxx"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#F8F5FC] border border-[#EDE4F5] text-xs sm:text-sm text-[#1F1F2E] placeholder-[#6B7280] font-mono focus:outline-none focus:border-[#5B2C8A] focus:bg-white transition-all shadow-2xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={initialLoading}
                className="w-full mt-1 py-3 px-5 rounded-xl bg-[#5B2C8A] hover:bg-[#4A1F6E] active:bg-[#3C165C] text-white text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 hover:scale-[1.01] active:scale-95"
              >
                {initialLoading ? (
                  <span>{t('সংযোগ হচ্ছে...', 'Connecting...')}</span>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    <span>{t('সরাসরি চ্যাট শুরু করুন', 'Start Chat Now')}</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Reassurance */}
            <div className="mt-4 pt-3 border-t border-[#EDE4F5] flex items-center justify-center text-xs text-[#6B7280]">
              <span className="flex items-center gap-1 text-emerald-800 font-semibold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>এনক্রিপ্টেড ও সুরক্ষিত</span>
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* STEP 2: FIXED HEIGHT CHAT CONTAINER - ONLY INNER MESSAGE STREAM SCROLLS */
        <div className="h-full flex flex-col lg:flex-row bg-white border border-[#EDE4F5] rounded-3xl shadow-sm overflow-hidden">
          
          {/* Left Desktop Sidebar (Laptop/Computer View Only) */}
          <aside className="hidden lg:flex lg:w-72 shrink-0 flex-col justify-between bg-[#F8F5FC] border-r border-[#EDE4F5] p-5 select-none">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#5B2C8A] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  BW
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#1F1F2E]">BongoWeb সাপোর্ট</h4>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>অনলাইন (২৪/৭)</span>
                  </div>
                </div>
              </div>

              {/* Quick Questions on Desktop */}
              <div className="pt-3 border-t border-[#EDE4F5] space-y-2">
                <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">
                  দ্রুত প্রশ্নসমূহ
                </span>
                <div className="space-y-1.5">
                  {quickQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setInputMessage(q.query)}
                      className="w-full text-left p-2 rounded-xl bg-white hover:bg-purple-50 text-[#1F1F2E] hover:text-[#5B2C8A] border border-[#EDE4F5] text-xs font-medium transition-all shadow-2xs cursor-pointer"
                    >
                      {language === 'bn' ? q.labelBn : q.labelEn}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Hotline at bottom */}
            <div className="p-3 rounded-xl bg-white border border-[#EDE4F5] text-xs text-[#6B7280] space-y-1">
              <span className="font-bold text-[#1F1F2E] block">জরুরি হেল্পলাইন:</span>
              <a href="tel:+8801955570912" className="text-[#5B2C8A] font-mono font-bold block hover:underline">
                01955570912
              </a>
            </div>
          </aside>

          {/* Right Main Chat Thread & Input */}
          <div className="flex-1 flex flex-col h-full min-w-0">
            {/* Top Bar: Agent Info + Security Code + EXIT CHAT button */}
            <div className="px-3.5 sm:px-5 py-2.5 sm:py-3 bg-[#F8F5FC] border-b border-[#EDE4F5] flex items-center justify-between shrink-0 gap-2">
            
            {/* Left: Agent Info */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-[#5B2C8A] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  BW
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
              </div>

              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-[#1F1F2E] truncate">
                  {t('BongoWeb লাইভ সাপোর্ট', 'BongoWeb Live Support')}
                </h3>
              </div>
            </div>

            {/* Right: Exit Button */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={handleExit}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#5B2C8A] hover:bg-[#4A1F6E] active:bg-[#3C165C] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs hover:scale-[1.02] active:scale-95"
                title={t('চ্যাট সমাপ্ত করে হোম পেজে ফিরে যান', 'Exit chat and return to Home')}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t('এক্সিট', 'Exit')}</span>
              </button>
            </div>
          </div>

          {/* Chat Messages Stream (ONLY THIS SCROLLS) */}
          <div 
            ref={chatScrollContainerRef}
            className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3 bg-[#F8F5FC]/40"
          >

            {/* Closed Session Warning */}
            {thread && (thread.isClosed || thread.isArchived) && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-2 text-xs animate-fadeIn shadow-xs">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{t('চ্যাট সেশনটি সমাপ্ত ও আর্কাইভে সংরক্ষিত হয়েছে।', 'Chat session ended and archived.')}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      localStorage.removeItem('bongoweb_chat_active_session');
                      sessionStorage.removeItem('bongoweb_chat_active_session');
                    } catch (_) {}
                    setIsChatActive(false);
                    setThread(null);
                  }}
                  className="px-3 py-1 rounded-xl bg-[#5B2C8A] hover:bg-[#4A1F6E] text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{t('নতুন চ্যাট শুরু করুন', 'Start New Chat')}</span>
                </button>
              </div>
            )}

            {/* Messages */}
            {cleanMsgs.map((msg, idx) => {
              const isAdmin = msg.sender === 'admin';

              return (
                <div
                  key={msg.id ? `${msg.id}-${idx}` : `msg-${idx}`}
                  className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'} max-w-full`}
                >
                  {/* Sender Header */}
                  <div className={`flex items-center gap-1 mb-1 px-1 text-[11px] font-bold ${
                    isAdmin ? 'text-[#5B2C8A]' : 'text-slate-500'
                  }`}>
                    {isAdmin ? (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-[#5B2C8A]" />
                        <span>{t('BongoWeb সাপোর্ট', 'BongoWeb Support')}</span>
                      </>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span>{clientName || t('আপনি', 'You')}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditNameInput(clientName || '');
                            setIsEditingName(true);
                          }}
                          className="p-0.5 text-slate-400 hover:text-[#5B2C8A] rounded transition-colors cursor-pointer"
                          title={t('নাম পরিবর্তন করুন', 'Change name')}
                        >
                          <Pencil className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[88%] sm:max-w-[76%] p-3 sm:p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isAdmin
                        ? 'bg-white border border-[#EDE4F5] text-[#1F1F2E] rounded-tl-xs shadow-xs'
                        : 'bg-[#5B2C8A] text-white rounded-tr-xs shadow-xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap select-text font-sans">{msg.text}</p>
                  </div>

                  {/* Timestamp */}
                  <span className="text-[10px] font-mono mt-0.5 px-1 flex items-center gap-1 text-[#6B7280]">
                    <span>{msg.timestamp}</span>
                    {!isAdmin && <CheckCheck className="w-3 h-3 text-[#5B2C8A]" />}
                  </span>
                </div>
              );
            })}

            <div ref={messagesEndRef} />
          </div>


          {/* Input Bar Footer */}
          <div className="p-2.5 sm:p-3 border-t border-[#EDE4F5] bg-white shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                disabled={thread?.isClosed || isSending}
                placeholder={
                  thread?.isClosed
                    ? t('চ্যাট বন্ধ রয়েছে। পুনরায় চালু করুন...', 'Chat is closed. Reopen to chat...')
                    : t('বার্তা লিখুন (Enter চাপুন)...', 'Type your message (Press Enter)...')
                }
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 px-3.5 py-2 sm:py-2.5 rounded-xl bg-[#F8F5FC] border border-[#EDE4F5] text-xs sm:text-sm text-[#1F1F2E] placeholder-[#6B7280] focus:outline-none focus:border-[#5B2C8A] focus:bg-white transition-all disabled:opacity-60 shadow-2xs"
              />

              <button
                type="submit"
                disabled={!inputMessage.trim() || thread?.isClosed || isSending}
                className="px-4 py-2 sm:py-2.5 rounded-xl bg-[#5B2C8A] hover:bg-[#4A1F6E] active:bg-[#3C165C] text-white text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">{t('পাঠান', 'Send')}</span>
              </button>
            </form>
          </div>
          </div>
        </div>
      )}

      {/* Edit Name Modal */}
      {isEditingName && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl border border-[#EDE4F5]">
            <h3 className="text-sm font-bold text-[#1F1F2E] mb-1.5 flex items-center gap-2">
              <User className="w-4 h-4 text-[#5B2C8A]" />
              <span>{t('আপনার নাম পরিবর্তন করুন', 'Change Your Name')}</span>
            </h3>
            <p className="text-xs text-[#6B7280] mb-3">
              {t('চ্যাটে প্রদর্শিত আপনার নাম আপডেট করুন:', 'Update your name displayed in chat:')}
            </p>
            <form onSubmit={handleSaveNewName} className="space-y-3">
              <input
                type="text"
                autoFocus
                required
                value={editNameInput}
                onChange={(e) => setEditNameInput(e.target.value)}
                placeholder={t('আপনার নাম লিখুন', 'Enter your name')}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F5FC] border border-[#EDE4F5] text-xs sm:text-sm text-[#1F1F2E] focus:outline-none focus:border-[#5B2C8A] focus:bg-white transition-all shadow-2xs"
              />
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditingName(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  {t('বাতিল', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-xl bg-[#5B2C8A] hover:bg-[#4A1F6E] active:bg-[#3C165C] text-xs font-bold text-white shadow-xs cursor-pointer"
                >
                  {t('সংরক্ষণ করুন', 'Save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
