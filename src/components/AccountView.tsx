import React, { useState, useEffect, useRef } from 'react';
import { 
  User, ShieldCheck, Key, Globe, FileText, 
  HelpCircle, CheckCircle2, Lock, ArrowRight, ArrowLeft, X, 
  Printer, AlertCircle, ShoppingBag, Eye, EyeOff, LogOut, PhoneCall, 
  Sparkles, Check, Server, Shield, Copy, Languages, CheckCheck,
  AlertTriangle, Flag, Mail, Phone, RefreshCw, UserPlus, Building2
} from 'lucide-react';
import { Descope, useDescope, useSession, useUser, getSessionToken } from '@descope/react-sdk';
import { ClientOrder, UserAccount, WebsiteDeliveryCredentials, PasswordResetRequest, UserReport } from '../types';
import { 
  apiRegisterUser, apiRequestPasswordReset, apiGetOrders, apiGetUsers, 
  apiGetCredentials, apiCreateReport, apiGetReports, subscribeToReports,
  apiSendEmailOtp, apiVerifyEmailOtp, apiSendPhoneOtp, apiVerifyPhoneOtp,
  apiResetPasswordWithOtp, apiSyncDescopeUser, apiSyncGoogleUser, normalizePhone,
  isStrictGmail, validateStrictBangladeshiPhone
} from '../utils/api';
import { getClientSecurityCode, getSecurityCodeRemainingSeconds, formatRemainingTime } from '../utils/securityCode';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import BongoWebLogo from './BongoWebLogo';
import EmailRecoveryPage from './EmailRecoveryPage';
import { useLanguage } from '../utils/LanguageContext';

// Official Colored Google Logo Icon
function GoogleLogoIcon({ className = "w-5 h-5 shrink-0" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  );
}

// Official WhatsApp Green Icon
function WhatsAppIcon({ className = "w-4 h-4 text-[#25D366]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
    </svg>
  );
}

interface AccountViewProps {
  onGoToDashboard?: () => void;
  onOpenAdminPanel?: () => void;
}

export type AccountSubView = 'overview' | 'total-orders' | 'pending-orders' | 'privacy' | 'terms' | 'reports' | 'recover-email';

export default function AccountView({ onGoToDashboard, onOpenAdminPanel }: AccountViewProps) {
  const { language } = useLanguage();
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const stored = localStorage.getItem('bongoweb_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.phone || parsed.email || parsed.name)) {
          return parsed;
        }
      }
    } catch (_) {}
    return null;
  });
  const [orders, setOrders] = useState<ClientOrder[]>([]);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<ClientOrder | null>(null);
  const [userCredentialsList, setUserCredentialsList] = useState<WebsiteDeliveryCredentials[]>([]);
  const [subView, setSubView] = useState<AccountSubView>('overview');

  // Security Code System State (Requirement 13)
  const [showSecurityCodeModal, setShowSecurityCodeModal] = useState(false);
  const [securityCodeCopied, setSecurityCodeCopied] = useState(false);
  const [codeRemainingSec, setCodeRemainingSec] = useState<number>(getSecurityCodeRemainingSeconds());

  // Report & Ticketing System State (Requirement 4)
  const [showReportModal, setShowReportModal] = useState(false);
  const [userReports, setUserReports] = useState<UserReport[]>([]);
  const [reportSubject, setReportSubject] = useState('');
  const [reportCategory, setReportCategory] = useState('technical');
  const [reportMessage, setReportMessage] = useState('');
  const [reportSuccess, setReportSuccess] = useState('');
  const [reportError, setReportError] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  // Language Change State (Requirement 9)
  const [selectedLanguage, setSelectedLanguage] = useState<'bn' | 'en'>('bn');

  // Copy Feedback State
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Phone Verification Info Modal State (Requirement 2)
  const [showVerificationExplainerModal, setShowVerificationExplainerModal] = useState(false);

  // Business Information & Legal Policies Modal State (Shifted from Drawer)
  const [showBusinessInfoModal, setShowBusinessInfoModal] = useState(false);

  // Descope SDK integration
  const descope = useDescope();
  const { isAuthenticated } = useSession();
  const { user: descopeUser } = useUser();

  // Unified Authentication Architecture:
  // Step 1 ('phone'): Enter mobile number -> sends 4-digit SMS OTP via Infobip 2FA
  // Step 2 ('phone-otp'): Enter 4-digit SMS OTP -> auto-verifies.
  //                       If account exists with this phone, logs directly into dashboard!
  //                       If new client, advances to Step 3.
  // Step 3 ('email-details'): Enter Name & strict @gmail.com address -> sends 6-digit Gmail OTP
  // Step 4 ('email-otp'): Enter 6-digit Gmail OTP -> auto-verifies and registers new user!
  const [authStep, setAuthStep] = useState<'phone' | 'phone-otp' | 'email-details' | 'email-otp'>('phone');

  // Phone input & verification states (Infobip 2FA SMS)
  const [phoneInput, setPhoneInput] = useState('');
  const [phonePinCode, setPhonePinCode] = useState('');
  const [phonePinId, setPhonePinId] = useState('');
  const [phoneOtpSending, setPhoneOtpSending] = useState(false);
  const [phoneOtpConfirming, setPhoneOtpConfirming] = useState(false);
  const [phoneOtpCountdown, setPhoneOtpCountdown] = useState(0);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const lastVerifiedPhonePinRef = useRef<string>('');

  // Email input & verification states (Gmail Descope OTP)
  const [emailInput, setEmailInput] = useState('');
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [emailOtpSending, setEmailOtpSending] = useState(false);
  const [emailOtpConfirming, setEmailOtpConfirming] = useState(false);
  const [emailOtpCountdown, setEmailOtpCountdown] = useState(0);
  const [emailVerified, setEmailVerified] = useState(false);
  const [fullNameInput, setFullNameInput] = useState('');
  const [submittingRegistration, setSubmittingRegistration] = useState(false);
  const lastVerifiedEmailOtpRef = useRef<string>('');
  const [isOldUser, setIsOldUser] = useState(false);
  const [detectedUser, setDetectedUser] = useState<UserAccount | null>(null);

  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  const [googleLoading, setGoogleLoading] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleModalEmail, setGoogleModalEmail] = useState('');
  const [googleModalError, setGoogleModalError] = useState('');
  const [googleModalLoading, setGoogleModalLoading] = useState(false);
  const [googleNotice, setGoogleNotice] = useState('');

  // "I don't have my email" Account Recovery Page & Modal State
  const [showEmailRecoveryPage, setShowEmailRecoveryPage] = useState(false);
  const [showEmailRecoveryModal, setShowEmailRecoveryModal] = useState(false);
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [recoveryApplied, setRecoveryApplied] = useState(false);

  // Subview routing parser
  const syncSubViewWithUrl = () => {
    const path = window.location.pathname;
    if (path === '/account/orders') {
      setSubView('total-orders');
    } else if (path === '/account/pending') {
      setSubView('pending-orders');
    } else if (path === '/account/privacy') {
      setSubView('privacy');
    } else if (path === '/account/terms') {
      setSubView('terms');
    } else if (path === '/account/reports' || path === '/reports') {
      setSubView('reports');
    } else if (path === '/account/recover-email' || path === '/recover-email') {
      setSubView('recover-email');
      setShowEmailRecoveryPage(true);
    } else {
      setSubView('overview');
    }
  };

  // Load state on mount
  useEffect(() => {
    loadUserData();
    syncSubViewWithUrl();

    const handlePopState = () => {
      syncSubViewWithUrl();
    };

    const handleCredsChange = () => {
      loadUserData();
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('bongoweb_credentials_updated', handleCredsChange);
    window.addEventListener('storage', handleCredsChange);

    // Subscribe to realtime reports
    const unsubReports = subscribeToReports((allReps) => {
      const stored = localStorage.getItem('bongoweb_user');
      if (stored) {
        try {
          const u = JSON.parse(stored);
          const myReps = allReps.filter(r => 
            (u.phone && r.clientPhone === u.phone) || 
            (u.email && r.clientEmail && r.clientEmail.toLowerCase() === u.email.toLowerCase())
          );
          setUserReports(myReps);
        } catch (_) {}
      }
    });

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('bongoweb_credentials_updated', handleCredsChange);
      window.removeEventListener('storage', handleCredsChange);
      unsubReports();
    };
  }, []);

  // Security code timer interval (Requirement 13)
  useEffect(() => {
    const timer = setInterval(() => {
      setCodeRemainingSec(getSecurityCodeRemainingSeconds());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Automatic Descope session detection and sync
  useEffect(() => {
    if (isAuthenticated && descopeUser && !currentUser) {
      const email = descopeUser.email || descopeUser.loginIds?.[0] || '';
      const name = descopeUser.name || descopeUser.givenName || (email ? email.split('@')[0] : 'Descope User');
      const phone = descopeUser.phone || '';
      const sessionToken = getSessionToken() || '';
      apiSyncDescopeUser({ email, name, phone, sessionToken }).then((synced) => {
        setCurrentUser(synced);
        localStorage.setItem('bongoweb_user', JSON.stringify(synced));
        sessionStorage.setItem('bongoweb_user', JSON.stringify(synced));
        loadUserData();
      }).catch(console.error);
    }
  }, [isAuthenticated, descopeUser, currentUser]);

  const navigateSubView = (target: AccountSubView) => {
    setSubView(target);
    let targetUrl = '/account';
    if (target === 'total-orders') targetUrl = '/account/orders';
    else if (target === 'pending-orders') targetUrl = '/account/pending';
    else if (target === 'privacy') targetUrl = '/account/privacy';
    else if (target === 'terms') targetUrl = '/account/terms';
    else if (target === 'reports') targetUrl = '/account/reports';

    window.history.pushState({}, '', targetUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadUserData = async () => {
    try {
      const storedUser = localStorage.getItem('bongoweb_user');
      if (storedUser) {
        const parsed: UserAccount = JSON.parse(storedUser);
        setCurrentUser((prev) => prev || parsed);

        try {
          const allUsers = await apiGetUsers();
          const cleanPhone = parsed.phone ? normalizePhone(parsed.phone) : '';
          const cleanEmail = parsed.email ? parsed.email.toLowerCase().trim() : '';

          const latest = allUsers.find(u => 
            (cleanPhone && normalizePhone(u.phone) === cleanPhone) || 
            (cleanEmail && u.email && u.email.toLowerCase().trim() === cleanEmail) || 
            (parsed.username && (u as any).username && (u as any).username === parsed.username)
          ) || parsed;

          if (latest.isRestricted) {
            handleLogout();
            setAuthError('🚫 আপনার অ্যাকাউন্টটি সাময়িকভাবে সীমাবদ্ধ (Restricted) করা হয়েছে।');
            return;
          }
          setCurrentUser(latest);
          localStorage.setItem('bongoweb_user', JSON.stringify(latest));
        } catch (_) {
          setCurrentUser((prev) => prev || parsed);
        }

        // Fetch orders first to cross-reference credentials
        const allOrders = await apiGetOrders();
        setOrders(allOrders);

        // Check delivered credentials for this user with robust phone & email normalization
        const credsList = await apiGetCredentials();
        const userCleanPhone = normalizePhone(parsed.phone);
        const userCleanEmail = parsed.email ? parsed.email.toLowerCase().trim() : '';

        // Filter orders for current user, excluding orders in bin or trash
        const userOrders = allOrders.filter(o => {
          if (o.status === 'bin' || o.status === 'cancelled') return false;
          const oPhone = normalizePhone(o.phone);
          const oEmail = (o.email || '').toLowerCase().trim();
          return (userCleanPhone && oPhone && userCleanPhone.slice(-10) === oPhone.slice(-10)) ||
                 (userCleanEmail && oEmail && userCleanEmail === oEmail);
        });

        // Filter credentials delivered to this user
        const matchingCreds = credsList.filter((c) => {
          const cPhone = normalizePhone(c.userPhone);
          const cEmail = (c.userEmail || (c as any).clientEmail || '').toLowerCase().trim();
          const phoneMatch = userCleanPhone && cPhone && (userCleanPhone.slice(-10) === cPhone.slice(-10));
          const emailMatch = userCleanEmail && cEmail && (userCleanEmail === cEmail);
          return phoneMatch || emailMatch;
        });

        // Resolve authoritative credentials:
        // Order's admin credentials set by Admin in Admin Panel take authoritative priority!
        const rawCandidates: WebsiteDeliveryCredentials[] = [];

        // 1. Process active orders that have credentials or match a delivery
        for (const ord of userOrders) {
          const ordOrderId = String(ord.orderId || (ord as any).id || '').trim();
          const ordDemoCode = String(ord.demoCode || '').trim();

          const matchedDelivery = matchingCreds.find(c => {
            const cOrder = String(c.orderId || '').trim();
            const cCode = String(c.websiteCode || '').trim();
            if (cOrder && ordOrderId && cOrder === ordOrderId) return true;
            if (cCode && ordDemoCode && (cCode === ordDemoCode || cCode.replace('#', '') === ordDemoCode.replace('#', ''))) return true;
            if (userOrders.length <= 1) return true;
            return false;
          });

          const hasOrderCreds = Boolean(ord.deliveredAdminId && ord.deliveredAdminPass);
          if (hasOrderCreds || matchedDelivery) {
            const finalAdminId = (hasOrderCreds ? ord.deliveredAdminId : matchedDelivery?.websiteAdminId) || 'admin';
            const finalAdminPass = (hasOrderCreds ? ord.deliveredAdminPass : matchedDelivery?.websiteAdminPass) || '—';
            rawCandidates.push({
              id: matchedDelivery?.id || `cred_ord_${ordOrderId.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
              orderId: ordOrderId,
              userPhone: ord.phone,
              userEmail: ord.email || '',
              websiteTitle: ord.companyName || ord.demoTitle || matchedDelivery?.websiteTitle || 'ওয়েবসাইট অ্যাডমিন প্যানেল',
              websiteCode: ord.demoCode,
              websiteAdminId: finalAdminId,
              websiteAdminPass: finalAdminPass,
              notes: matchedDelivery?.notes || 'আপনার ওয়েবসাইট সম্পূর্ণ তৈরি ও রেডি। অ্যাডমিন প্যানেলে লগইন করুন।',
              deliveredAt: matchedDelivery?.deliveredAt || ord.createdAt || new Date().toLocaleString('bn-BD'),
              updatedAt: Math.max(Number(matchedDelivery?.updatedAt) || 0, Date.now())
            });
          }
        }

        // 2. Also include any delivered credential that wasn't tied to the above orders
        for (const c of matchingCreds) {
          const alreadyLinked = rawCandidates.some(cand => {
            const sameOrder = cand.orderId && c.orderId && cand.orderId === c.orderId;
            const sameCode = cand.websiteCode && c.websiteCode && (cand.websiteCode === c.websiteCode || cand.websiteCode.replace('#', '') === c.websiteCode.replace('#', ''));
            return sameOrder || sameCode;
          });
          if (!alreadyLinked) {
            rawCandidates.push(c);
          }
        }

        // 3. Strict deduplication: Sort newest first, then keep strictly ONE latest per order or website
        rawCandidates.sort((a, b) => (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0));

        const deduplicatedFound: WebsiteDeliveryCredentials[] = [];
        for (const item of rawCandidates) {
          const itemOrder = String(item.orderId || '').trim();
          const itemCode = String(item.websiteCode || '').trim();
          const itemTitle = String(item.websiteTitle || '').trim().toLowerCase();

          const exists = deduplicatedFound.some(existing => {
            const exOrder = String(existing.orderId || '').trim();
            const exCode = String(existing.websiteCode || '').trim();
            const exTitle = String(existing.websiteTitle || '').trim().toLowerCase();

            if (itemOrder && exOrder && itemOrder === exOrder) return true;
            if (itemCode && exCode && (itemCode === exCode || itemCode.replace('#', '') === exCode.replace('#', ''))) return true;
            if (userOrders.length <= 1) return true;
            if (itemTitle && exTitle && (itemTitle === exTitle || itemTitle.includes(exTitle) || exTitle.includes(itemTitle))) return true;
            return false;
          });

          if (!exists) {
            deduplicatedFound.push(item);
          }
        }

        setUserCredentialsList(deduplicatedFound);

        // Fetch reports for current user
        apiGetReports().then((allReps) => {
          const myReps = allReps.filter(r => 
            (parsed.phone && r.clientPhone === parsed.phone) || 
            (parsed.email && r.clientEmail && r.clientEmail.toLowerCase() === parsed.email.toLowerCase())
          );
          setUserReports(myReps);
        }).catch(() => {});
      } else {
        setCurrentUser(null);
        setUserCredentialsList([]);
        setUserReports([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Logout (Requirement 2 & 9)
  const handleLogout = async () => {
    try {
      await descope.logout();
    } catch (_) {}
    localStorage.removeItem('bongoweb_user');
    sessionStorage.removeItem('bongoweb_user');
    setCurrentUser(null);
    setUserCredentialsList([]);
    setUserReports([]);
    setSubView('overview');
    window.history.pushState({}, '', '/account');
    window.dispatchEvent(new CustomEvent('bongoweb_credentials_updated'));
  };

  const handleCopyText = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Google click handler - informs user that Google Sign-in is currently unavailable and focuses mobile number
  const handleGoogleClick = () => {
    setAuthError('');
    const msg = language === 'en'
      ? 'Google Sign-in is currently unavailable. Please continue with your mobile number below.'
      : 'গুগল সাইন-ইন বর্তমানে উপলব্ধ নেই। অনুগ্রহ করে নিচে আপনার মোবাইল নম্বর দিয়ে এগিয়ে যান।';
    setGoogleNotice(msg);
    setTimeout(() => {
      const input = document.getElementById('account-phone-input') as HTMLInputElement | null;
      if (input) {
        input.focus();
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // Google Social Login - with seamless Google Modal fallback on Vercel and unauthorized domains
  const handleGoogleSignIn = async () => {
    setAuthError('');

    // Check if running on Vercel (*.vercel.app), Cloud Run (*.run.app), or preview domain
    const isVercelOrPreview = typeof window !== 'undefined' && (
      window.location.hostname.includes('vercel.app') ||
      window.location.hostname.includes('.run.app') ||
      (!window.location.hostname.includes('localhost') && 
       !window.location.hostname.includes('127.0.0.1') && 
       !window.location.hostname.includes('firebaseapp.com'))
    );

    const initialEmail = (emailInput && isStrictGmail(emailInput)) 
      ? emailInput 
      : 'beegovoltx@gmail.com';
    setGoogleModalEmail(initialEmail);
    setGoogleModalError('');

    // In Vercel publish or preview domains, Firebase Auth popups are blocked with auth/unauthorized-domain.
    // Open the Google Sign-In Assistant directly with zero error or delay!
    if (isVercelOrPreview) {
      setShowGoogleModal(true);
      return;
    }

    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const gUser = result.user;
      if (gUser && gUser.email) {
        const cleanEmail = gUser.email.toLowerCase();

        // Strict Gmail Only check (Requirement: Only @gmail.com accepted)
        if (!isStrictGmail(cleanEmail)) {
          setAuthError('শুধুমাত্র জিমেইল (@gmail.com) গ্রহণযোগ্য। অন্য কোনো ইমেইল গ্রহণযোগ্য নয়।');
          return;
        }

        const cleanName = gUser.displayName || cleanEmail.split('@')[0] || 'Google User';
        const photoUrl = gUser.photoURL || undefined;

        const synced = await apiSyncGoogleUser({
          email: cleanEmail,
          name: cleanName,
          photoUrl
        });

        setCurrentUser(synced);
        localStorage.setItem('bongoweb_user', JSON.stringify(synced));
        sessionStorage.setItem('bongoweb_user', JSON.stringify(synced));
        localStorage.setItem('bongoweb_active_view', 'dashboard');
        sessionStorage.setItem('bongoweb_active_view', 'dashboard');
        window.dispatchEvent(new CustomEvent('bongoweb_credentials_updated'));
        await loadUserData();

        if (onGoToDashboard) {
          onGoToDashboard();
        } else {
          window.location.href = '/';
        }
        return;
      }
    } catch (err: any) {
      console.warn('Google Popup Sign-In notice:', err?.code, err?.message);
      // When auth/unauthorized-domain or popup-blocked occurs:
      // Open the dedicated Google Authentication Modal with zero error banner!
      setShowGoogleModal(true);
    } finally {
      setGoogleLoading(false);
    }
  };

  // Google Modal Direct Continue (Fast-track authentication without popup domain restrictions)
  const handleGoogleModalSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setGoogleModalError('');
    const cleanEmail = googleModalEmail.trim().toLowerCase();

    if (!cleanEmail) {
      setGoogleModalError('অনুগ্রহ করে আপনার জিমেইল এড্রেস লিখুন।');
      return;
    }

    if (!isStrictGmail(cleanEmail)) {
      setGoogleModalError('শুধুমাত্র সক্রিয় জিমেইল (@gmail.com) গ্রহণযোগ্য। অন্য কোনো ইমেইল গ্রহণযোগ্য নয়।');
      return;
    }

    setGoogleModalLoading(true);
    try {
      const cleanName = cleanEmail.split('@')[0] || 'Google Member';
      const allUsers = await apiGetUsers().catch(() => []);
      const existingUser = allUsers.find(u => (u.email || '').toLowerCase() === cleanEmail);

      if (existingUser) {
        // User already has an account, log straight in!
        setCurrentUser(existingUser);
        localStorage.setItem('bongoweb_user', JSON.stringify(existingUser));
        sessionStorage.setItem('bongoweb_user', JSON.stringify(existingUser));
        localStorage.setItem('bongoweb_active_view', 'dashboard');
        sessionStorage.setItem('bongoweb_active_view', 'dashboard');
        window.dispatchEvent(new Event('bongoweb_credentials_updated'));
        setShowGoogleModal(false);
        if (onGoToDashboard) {
          onGoToDashboard();
        } else {
          window.location.href = '/';
        }
      } else {
        // New user through Google:
        // Set emailInput, emailVerified, and transition directly to step 1 (enter phone number for SMS OTP)
        setEmailInput(cleanEmail);
        setEmailVerified(true);
        setFullNameInput(cleanName);
        setAuthStep('phone');
        setShowGoogleModal(false);
        setAuthSuccess(`গুগল জিমেইল (${cleanEmail}) সফলভাবে লিংক হয়েছে! এবার আপনার মোবাইল নম্বর দিয়ে এসএমএস কোড যাচাই করুন।`);
      }
    } catch (err: any) {
      setGoogleModalError(err?.message || 'গুগল সাইন-ইন সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।');
    } finally {
      setGoogleModalLoading(false);
    }
  };

  // Send 6-digit verification code to Google Gmail
  const handleGoogleModalSendOtp = async () => {
    const cleanEmail = googleModalEmail.trim().toLowerCase();
    if (!isStrictGmail(cleanEmail)) {
      setGoogleModalError('শুধুমাত্র সক্রিয় জিমেইল (@gmail.com) গ্রহণযোগ্য। অন্য কোনো ইমেইল গ্রহণযোগ্য নয়।');
      return;
    }
    setGoogleModalLoading(true);
    try {
      const res = await apiSendEmailOtp(cleanEmail, 'signup');
      if (res.success) {
        setEmailInput(cleanEmail);
        setEmailOtpCountdown(60);
        setAuthStep('email-otp');
        setAuthSuccess(`Verification code sent to ${cleanEmail}`);
        setShowGoogleModal(false);
      } else {
        setGoogleModalError(res.error || 'ভেরিফিকেশন কোড পাঠানো সম্ভব হয়নি।');
      }
    } catch (_) {
      setGoogleModalError('কোড পাঠাতে সমস্যা হয়েছে। ইন্টারনেট সংযোগ চেক করুন।');
    } finally {
      setGoogleModalLoading(false);
    }
  };

  // Descope Success Callback
  const handleDescopeSuccess = async (e: any) => {
    try {
      const u = e?.detail?.user || descopeUser;
      const email = u?.email || u?.loginIds?.[0] || '';
      const name = u?.name || u?.givenName || (email ? email.split('@')[0] : 'BongoWeb User');
      const phone = u?.phone || '';
      const sessionToken = getSessionToken() || e?.detail?.sessionJwt || '';
      const synced = await apiSyncDescopeUser({ email, name, phone, sessionToken });
      setCurrentUser(synced);
      localStorage.setItem('bongoweb_user', JSON.stringify(synced));
      sessionStorage.setItem('bongoweb_user', JSON.stringify(synced));
      loadUserData();
      if (onGoToDashboard) {
        onGoToDashboard();
      } else {
        window.location.href = '/';
      }
    } catch (err) {
      console.error('Descope success error:', err);
      window.location.href = '/';
    }
  };

  const handleDescopeError = (err: any) => {
    console.error('Descope error:', err);
    setAuthError('Authentication error. Please try again.');
  };

  // =========================================================================
  // STEP 1: SEND PHONE 4-DIGIT SMS OTP (Infobip 2FA API)
  // =========================================================================
  const handleSendPhoneOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const cleanInput = phoneInput.trim();
    if (!cleanInput) {
      setAuthError('অনুগ্রহ করে আপনার সচল মোবাইল নম্বর লিখুন।');
      return;
    }

    // Secret Admin portal redirect
    if (cleanInput.toLowerCase() === 'admin' || cleanInput.toLowerCase() === 'admin@bongoweb.xyz') {
      sessionStorage.setItem('bongoweb_admin_auth', 'true');
      if (onOpenAdminPanel) {
        onOpenAdminPanel();
      } else {
        window.location.href = '/admin';
      }
      return;
    }

    const phoneValidation = validateStrictBangladeshiPhone(cleanInput);
    if (!phoneValidation.valid) {
      setAuthError(phoneValidation.error || 'সঠিক ১১-সংখ্যার সক্রিয় বাংলাদেশি মোবাইল নম্বর দিন। কোনো ফেক বা অস্থায়ী (Temporary) নম্বর গ্রহণযোগ্য নয়।');
      return;
    }

    const validPhone = phoneValidation.cleanPhone || cleanInput.replace(/\D/g, '');

    setPhoneOtpSending(true);
    try {
      const res = await apiSendPhoneOtp(validPhone);
      if (res.success && res.pinId) {
        setPhonePinId(res.pinId);
        setPhonePinCode('');
        lastVerifiedPhonePinRef.current = '';
        setPhoneOtpCountdown(60);
        setAuthStep('phone-otp');
        setAuthSuccess(`৪-সংখ্যার এসএমএস কোড পাঠানো হয়েছে (${validPhone})`);
      } else {
        setAuthError(res.error || 'এসএমএস ওটিপি পাঠানো সম্ভব হয়নি। অনুগ্রহ করে নম্বরটি সঠিক কিনা যাচাই করুন।');
      }
    } catch (_) {
      setAuthError('কোড পাঠাতে সমস্যা হয়েছে। ইন্টারনেট সংযোগ চেক করুন।');
    } finally {
      setPhoneOtpSending(false);
    }
  };

  // =========================================================================
  // STEP 2: VERIFY PHONE 4-DIGIT SMS OTP (Infobip 2FA API)
  // Auto-verifies upon 4 digits. If user exists, instant login!
  // =========================================================================
  const handleVerifyPhoneOtp = async (overrideCode?: string) => {
    const cleanPin = String(overrideCode || phonePinCode).trim();
    if (!cleanPin || cleanPin.length < 4) {
      setAuthError('অনুগ্রহ করে ৪-সংখ্যার ওটিপি পিন কোড লিখুন।');
      return;
    }

    if (!phonePinId) {
      setAuthError('ওটিপি সেশন পাওয়া যায়নি। অনুগ্রহ করে পুনরায় কোড পাঠান।');
      return;
    }

    lastVerifiedPhonePinRef.current = cleanPin;
    setAuthError('');
    setPhoneOtpConfirming(true);

    try {
      const res = await apiVerifyPhoneOtp(phonePinId, cleanPin);
      if (res.success && res.verified) {
        setPhoneVerified(true);
        const cleanPhone = normalizePhone(phoneInput) || phoneInput.trim().replace(/\D/g, '');

        // Check if this phone number already belongs to an existing user
        const allUsers = await apiGetUsers().catch(() => []);
        const existing = allUsers.find(u => normalizePhone(u.phone) === cleanPhone);

        if (existing) {
          // Existing user -> Log straight into dashboard!
          if (existing.isRestricted) {
            setAuthError('🚫 আপনার অ্যাকাউন্টটি সাময়িকভাবে সীমাবদ্ধ (Restricted) করা হয়েছে।');
            setPhoneOtpConfirming(false);
            return;
          }

          setCurrentUser(existing);
          localStorage.setItem('bongoweb_user', JSON.stringify(existing));
          sessionStorage.setItem('bongoweb_user', JSON.stringify(existing));
          localStorage.setItem('bongoweb_active_view', 'dashboard');
          sessionStorage.setItem('bongoweb_active_view', 'dashboard');
          window.dispatchEvent(new CustomEvent('bongoweb_credentials_updated'));
          await loadUserData();
          if (onGoToDashboard) {
            onGoToDashboard();
          } else {
            window.location.href = '/';
          }
          return;
        } else if (emailVerified && emailInput) {
          // New user who already verified email via Google
          await handleCompleteNewUserRegistration(emailInput, fullNameInput, cleanPhone);
          return;
        } else {
          // New user -> proceed to email & name entry
          setAuthStep('email-details');
          setAuthSuccess('✓ মোবাইল নম্বর সফলভাবে ভেরিফাইড হয়েছে! এবার আপনার নাম ও জিমেইল দিন।');
        }
      } else {
        setAuthError(res.error || 'ভুল বা মেয়াদোত্তীর্ণ পিন কোড! অনুগ্রহ করে আবার চেষ্টা করুন।');
      }
    } catch (_) {
      setAuthError('ভেরিফিকেশন সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।');
    } finally {
      setPhoneOtpConfirming(false);
    }
  };

  // Watcher for 4-digit Phone PIN
  const handlePhonePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPhonePinCode(val);
    if (val.length === 4 && !phoneOtpConfirming && lastVerifiedPhonePinRef.current !== val) {
      handleVerifyPhoneOtp(val);
    }
  };

  const handlePhonePinPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted.length === 4 && !phoneOtpConfirming && lastVerifiedPhonePinRef.current !== pasted) {
      setPhonePinCode(pasted);
      handleVerifyPhoneOtp(pasted);
    }
  };

  // Automatic 4-digit phone PIN trigger
  useEffect(() => {
    if (
      authStep === 'phone-otp' &&
      phonePinCode.length === 4 &&
      !phoneOtpConfirming &&
      !phoneVerified &&
      lastVerifiedPhonePinRef.current !== phonePinCode
    ) {
      handleVerifyPhoneOtp(phonePinCode);
    }
  }, [phonePinCode, authStep, phoneOtpConfirming, phoneVerified]);

  // Countdown timer for Phone OTP resend
  useEffect(() => {
    let timer: any;
    if (phoneOtpCountdown > 0) {
      timer = setInterval(() => {
        setPhoneOtpCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [phoneOtpCountdown]);

  // =========================================================================
  // STEP 3: SUBMIT NAME & GMAIL (Sends 6-digit Gmail OTP via Descope/SMTP)
  // =========================================================================
  const handleSendEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const cleanName = fullNameInput.trim();
    if (!cleanName) {
      setAuthError('অনুগ্রহ করে আপনার সম্পূর্ণ নাম লিখুন।');
      return;
    }

    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail) {
      setAuthError('অনুগ্রহ করে আপনার জিমেইল এড্রেস লিখুন।');
      return;
    }

    if (!isStrictGmail(cleanEmail)) {
      setAuthError('শুধুমাত্র সচল ও বৈধ জিমেইল (@gmail.com) গ্রহণযোগ্য। অন্য কোনো ইমেইল গ্রহণযোগ্য নয়।');
      return;
    }

    // Check if email already used by another account
    const allUsers = await apiGetUsers().catch(() => []);
    const emailTaken = allUsers.some(u => (u.email || '').trim().toLowerCase() === cleanEmail);
    if (emailTaken) {
      setAuthError('এই জিমেইল দিয়ে ইতোমধ্যে একটি অ্যাকাউন্ট রয়েছে। অনুগ্রহ করে অন্য জিমেইল ব্যবহার করুন।');
      return;
    }

    setEmailOtpSending(true);
    try {
      const res = await apiSendEmailOtp(cleanEmail, 'signup');
      if (res.success) {
        setEmailOtpCountdown(60);
        setEmailOtpCode('');
        lastVerifiedEmailOtpRef.current = '';
        setAuthStep('email-otp');
        setAuthSuccess(`৬-সংখ্যার ভেরিফিকেশন কোড পাঠানো হয়েছে (${cleanEmail})`);
      } else {
        setAuthError(res.error || 'জিমেইলে কোড পাঠানো সম্ভব হয়নি। আবার চেষ্টা করুন।');
      }
    } catch (_) {
      setAuthError('কোড পাঠাতে সমস্যা হয়েছে। ইন্টারনেট সংযোগ চেক করুন।');
    } finally {
      setEmailOtpSending(false);
    }
  };

  // =========================================================================
  // STEP 4: VERIFY GMAIL 6-DIGIT OTP AND COMPLETE ACCOUNT
  // Auto-verifies upon 6 digits
  // =========================================================================
  const handleVerifyEmailOtp = async (overrideCode?: string) => {
    const cleanCode = String(overrideCode || emailOtpCode).trim();
    if (!cleanCode || cleanCode.length < 6) {
      setAuthError('অনুগ্রহ করে ৬-সংখ্যার ওটিপি কোড লিখুন।');
      return;
    }

    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail) return;

    lastVerifiedEmailOtpRef.current = cleanCode;
    setAuthError('');
    setEmailOtpConfirming(true);

    try {
      const res = await apiVerifyEmailOtp(cleanEmail, cleanCode);
      if (res.success) {
        setEmailVerified(true);
        const cleanPhone = normalizePhone(phoneInput) || phoneInput.trim().replace(/\D/g, '');
        const cleanName = fullNameInput.trim() || cleanEmail.split('@')[0] || 'BongoWeb Member';
        await handleCompleteNewUserRegistration(cleanEmail, cleanName, cleanPhone);
      } else {
        setAuthError(res.error || 'ভুল বা মেয়াদোত্তীর্ণ জিমেইল ওটিপি কোড! অনুগ্রহ করে আবার চেক করুন।');
      }
    } catch (_) {
      setAuthError('ভেরিফিকেশন সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।');
    } finally {
      setEmailOtpConfirming(false);
    }
  };

  // Watcher for 6-digit Email OTP
  const handleEmailOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setEmailOtpCode(val);
    if (val.length === 6 && !emailOtpConfirming && lastVerifiedEmailOtpRef.current !== val) {
      handleVerifyEmailOtp(val);
    }
  };

  const handleEmailOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6 && !emailOtpConfirming && lastVerifiedEmailOtpRef.current !== pasted) {
      setEmailOtpCode(pasted);
      handleVerifyEmailOtp(pasted);
    }
  };

  // Automatic 6-digit email OTP trigger
  useEffect(() => {
    if (
      authStep === 'email-otp' &&
      emailOtpCode.length === 6 &&
      !emailOtpConfirming &&
      !emailVerified &&
      lastVerifiedEmailOtpRef.current !== emailOtpCode
    ) {
      handleVerifyEmailOtp(emailOtpCode);
    }
  }, [emailOtpCode, authStep, emailOtpConfirming, emailVerified]);

  // Countdown timer for Email OTP resend
  useEffect(() => {
    let timer: any;
    if (emailOtpCountdown > 0) {
      timer = setInterval(() => {
        setEmailOtpCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [emailOtpCountdown]);

  // Helper to complete user account registration and launch dashboard
  const handleCompleteNewUserRegistration = async (email: string, name: string, phone: string) => {
    setSubmittingRegistration(true);
    try {
      const newUser: UserAccount = {
        name,
        phone,
        email,
        registeredAt: new Date().toLocaleDateString('bn-BD'),
        numberVerified: true,
        numberVerificationCallPending: false
      };

      const regRes = await apiRegisterUser(newUser);
      if (!regRes.success) {
        setAuthError(regRes.error || 'Failed to create account. Please try again.');
        setSubmittingRegistration(false);
        return;
      }

      setCurrentUser(newUser);
      localStorage.setItem('bongoweb_user', JSON.stringify(newUser));
      sessionStorage.setItem('bongoweb_user', JSON.stringify(newUser));
      localStorage.setItem('bongoweb_active_view', 'dashboard');
      sessionStorage.setItem('bongoweb_active_view', 'dashboard');
      window.dispatchEvent(new CustomEvent('bongoweb_credentials_updated'));
      await loadUserData();
      if (onGoToDashboard) {
        onGoToDashboard();
      } else {
        window.location.href = '/';
      }
    } catch (_) {
      setAuthError('অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setSubmittingRegistration(false);
    }
  };

  // "I don't have my email" - Apply for account recovery
  const handleRecoveryApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryPhone.trim()) return;
    setRecoveryApplied(true);
  };

  // Handle Submit Client Report (Mandatory Authentication enforced)
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportMessage.trim()) return;
    if (!currentUser) {
      setReportError('রিপোর্ট বা অভিযোগ দাখিল করতে অনুগ্রহ করে প্রথমে সাইন ইন বা ইমেইল ভেরিফাই করুন।');
      return;
    }
    setReportLoading(true);
    setReportError('');
    setReportSuccess('');
    try {
      const clientId = currentUser?.clientId || (currentUser?.phone ? `#BW-USER-${currentUser.phone.slice(-4)}` : `#BW-${Date.now()}`);
      const newReport: UserReport = {
        id: `REP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        clientIdentifier: clientId,
        clientName: currentUser?.name || 'Valued Client',
        clientPhone: currentUser?.phone || '',
        clientEmail: currentUser?.email || '',
        category: reportCategory,
        subject: reportSubject.trim() || 'সাধারণ অনুসন্ধান / অভিযোগ',
        message: reportMessage.trim(),
        createdAt: new Date().toLocaleString('bn-BD'),
        status: 'pending'
      };
      await apiCreateReport(newReport);
      setUserReports((prev) => [newReport, ...prev.filter(r => r.id !== newReport.id)]);
      setReportSuccess('আপনার রিপোর্ট ও অভিযোগ সফলভাবে দাখিল করা হয়েছে। আমাদের টেকনিক্যাল টিম পর্যালোচনার পর উত্তর পাঠাবে।');
      setReportSubject('');
      setReportMessage('');
      setTimeout(() => {
        setReportSuccess('');
      }, 5000);
    } catch (_) {
      setReportError('রিপোর্ট জমা দিতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setReportLoading(false);
    }
  };



  // Filter orders for the logged-in client
  const userOrders = currentUser 
    ? orders.filter((o) => 
        (currentUser.phone && o.phone === currentUser.phone) || 
        (currentUser.email && o.email && o.email.toLowerCase() === currentUser.email.toLowerCase())
      )
    : [];
  const pendingOrders = userOrders.filter((o) => o.status === 'pending');

  // ==========================================
  // VIEW: "I DON'T HAVE MY EMAIL" RECOVERY STANDALONE PAGE
  // ==========================================
  if (showEmailRecoveryPage || subView === 'recover-email') {
    return (
      <EmailRecoveryPage
        onBack={() => {
          setShowEmailRecoveryPage(false);
          setSubView('overview');
          if (window.location.pathname.includes('recover-email')) {
            window.history.pushState({}, '', '/account');
          }
        }}
      />
    );
  }

  // ==========================================
  // VIEW: IF USER IS NOT LOGGED IN (Production Authentication Portal)
  // 3 CLEAN, MODERN, PREMIUM UI SCREENS FOR BONGEWEB.XYZ
  // SCREEN 1: LOGIN | SCREEN 2: REGISTRATION | SCREEN 3: EMAIL VERIFICATION
  // ==========================================
  if (!currentUser) {
    return (
      <div className="w-full min-h-[calc(100vh-120px)] flex flex-col justify-start items-center font-sans pb-28 pt-4 sm:pt-8 relative bg-[#F8F5FC] text-slate-900 overflow-x-hidden animate-fadeIn select-none">

        {/* CENTERED CLIENT AUTH PORTAL */}
        <div className="max-w-[440px] mx-auto px-4 sm:px-6 w-full relative z-10 flex flex-col items-center justify-center mt-2 sm:mt-4 lg:mt-8">
          <div className="w-full max-w-[440px] mx-auto flex flex-col items-center">
            {/* ======================================================== */}
            {/* STEP 1: MOBILE NUMBER ENTRY CARD (Infobip 2FA SMS First) */}
            {/* ======================================================== */}
            {authStep === 'phone' && (
              <div className="w-full bg-white border border-[#EDE4F5] rounded-[24px] sm:rounded-[28px] p-6 sm:p-8 shadow-[0_10px_35px_-5px_rgba(91,44,138,0.08)] space-y-5 animate-fadeIn">
                
                {/* Account Header Text */}
                <div className="text-center pt-1">
                  <div className="w-14 h-14 rounded-2xl bg-[#F8F5FC] border border-[#EDE4F5] text-[#5B2C8A] flex items-center justify-center mx-auto mb-3 shadow-2xs">
                    <User className="w-7 h-7 text-[#5B2C8A]" />
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-[#1F1F2E] tracking-tight">
                    {language === 'bn' ? 'আমার অ্যাকাউন্ট' : 'My Account'}
                  </h1>
                  <p className="text-xs text-[#6B7280] mt-1.5 leading-relaxed max-w-xs mx-auto">
                    {language === 'bn' 
                      ? 'লগইন বা সাইন আপ করে আপনার ওয়েবসাইট ও অর্ডার এক্সেস করুন' 
                      : 'Sign in or register to manage your website orders & credentials'}
                  </p>
                </div>

                {/* Top: Google Continue Button */}
                <button
                  type="button"
                  onClick={handleGoogleClick}
                  className="w-full py-3 px-4 rounded-xl bg-[#F8F5FC] hover:bg-[#EDE4F5]/60 border border-[#EDE4F5] text-[#1F1F2E] text-xs sm:text-sm font-bold shadow-2xs transition-colors flex items-center justify-center gap-3 cursor-pointer active:scale-[0.99] whitespace-nowrap select-none overflow-hidden"
                >
                  <GoogleLogoIcon className="w-5 h-5 shrink-0" />
                  <span className="truncate">Continue with Google</span>
                </button>

                {/* Google Unavailable Guidance Banner */}
                {googleNotice && (
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-start gap-2.5 animate-fadeIn shadow-xs">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="leading-relaxed">{googleNotice}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setGoogleNotice('')}
                      className="text-amber-500 hover:text-amber-700 text-sm font-bold cursor-pointer p-0.5"
                    >
                      ×
                    </button>
                  </div>
                )}

                {/* Divider: OR */}
                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#EDE4F5]" />
                  </div>
                  <div className="relative flex justify-center text-[10.5px] uppercase tracking-wider text-[#6B7280] font-bold">
                    <span className="bg-white px-3 text-[#6B7280]">বা মোবাইল নম্বর দিয়ে প্রবেশ করুন</span>
                  </div>
                </div>

                {/* Phone Form */}
                <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                  {authError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 animate-shake">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{authError}</span>
                    </div>
                  )}

                  {authSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>{authSuccess}</span>
                    </div>
                  )}

                  <div>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none select-none">
                        <span className="text-xs font-bold text-[#5B2C8A] font-mono">+88</span>
                        <div className="w-px h-4 bg-[#EDE4F5]" />
                      </div>
                      <input
                        id="account-phone-input"
                        type="tel"
                        required
                        maxLength={11}
                        placeholder="01XXXXXXXXX"
                        value={phoneInput}
                        onChange={(e) => {
                          setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 11));
                          if (authError) setAuthError('');
                          if (googleNotice) setGoogleNotice('');
                        }}
                        className={`w-full pl-16 pr-4 py-3 rounded-xl bg-[#F8F5FC] border ${googleNotice ? 'border-amber-400 ring-4 ring-amber-300/20 bg-amber-50/20' : 'border-[#EDE4F5]'} text-xs sm:text-sm text-[#1F1F2E] placeholder-[#9CA3AF] focus:outline-none focus:bg-white focus:border-[#5B2C8A] focus:ring-4 focus:ring-[#5B2C8A]/10 transition-all shadow-2xs font-mono font-bold tracking-wider`}
                      />
                    </div>
                    <span className="text-[11px] text-[#6B7280] block mt-1.5 font-medium">
                      আপনার নম্বরে ৪-সংখ্যার ওটিপি কোড পাঠানো হবে।
                    </span>
                  </div>

                  {/* Send Phone OTP Button */}
                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={phoneOtpSending}
                      className="w-full py-3.5 px-4 rounded-xl bg-[#5B2C8A] hover:bg-[#4A1F6E] active:scale-[0.99] text-white font-bold text-sm shadow-[0_4px_16px_rgba(91,44,138,0.22)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {phoneOtpSending ? (
                        <span className="flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>{language === 'en' ? 'Sending OTP...' : 'ওটিপি পাঠানো হচ্ছে...'}</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <span>{language === 'en' ? 'Send OTP' : 'ওটিপি পাঠান'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      )}
                    </button>

                    <div className="pt-2 text-center">
                      <p className="text-[11px] text-[#6B7280] leading-relaxed">
                        By continuing, you agree to our{' '}
                        <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-[#5B2C8A] font-bold underline">
                          Terms of Service
                        </a>{' '}
                        and acknowledge our{' '}
                        <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-[#5B2C8A] font-bold underline">
                          Privacy Policy
                        </a>.
                      </p>
                    </div>
                  </div>
                </form>

                {/* Bottom Option */}
                <div className="pt-3 border-t border-[#EDE4F5] flex items-center justify-between text-xs text-[#6B7280]">
                  <span className="text-[11px] text-[#5B2C8A] bg-[#F8F5FC] border border-[#EDE4F5] px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 shadow-2xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>256-Bit SSL Secure</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmailRecoveryPage(true);
                      setSubView('recover-email');
                      window.history.pushState({}, '', '/account/recover-email');
                    }}
                    className="text-xs text-[#5B2C8A] hover:text-[#4A1F6E] font-bold cursor-pointer inline-flex items-center gap-1 hover:underline"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-[#5B2C8A]" />
                    <span>I don't have my email</span>
                  </button>
                </div>

              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 2: PHONE 4-DIGIT SMS OTP CARD                      */}
            {/* ======================================================== */}
            {authStep === 'phone-otp' && (
              <div className="w-full bg-white border border-[#EDE4F5] rounded-[24px] sm:rounded-[28px] p-6 sm:p-8 shadow-[0_10px_35px_-5px_rgba(91,44,138,0.08)] space-y-5 animate-fadeIn text-[#1F1F2E]">
                
                {/* Header Icon */}
                <div className="text-center pt-1">
                  <div className="w-14 h-14 rounded-2xl bg-[#F8F5FC] border border-[#EDE4F5] text-[#5B2C8A] flex items-center justify-center mx-auto mb-3 shadow-2xs">
                    <Phone className="w-7 h-7 text-[#5B2C8A]" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-[#1F1F2E] tracking-tight">
                    Enter SMS Verification Code
                  </h2>
                  <p className="text-xs text-[#6B7280] mt-1.5 leading-relaxed max-w-xs mx-auto">
                    আপনার নম্বরে ৪-সংখ্যার ওটিপি কোড পাঠানো হয়েছে:{' '}
                    <strong className="text-[#5B2C8A] font-bold font-mono">+88 {phoneInput}</strong>
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthStep('phone');
                      setAuthError('');
                      setPhonePinCode('');
                    }}
                    className="mt-1 text-[11px] text-[#5B2C8A] hover:text-[#4A1F6E] hover:underline font-semibold cursor-pointer"
                  >
                    Edit phone number / নম্বর পরিবর্তন করুন
                  </button>
                </div>

                {authError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2 animate-shake">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                {/* 4-Digit Code Input Box with Auto-Verify */}
                <div className="p-4 rounded-2xl bg-[#F8F5FC] border border-[#EDE4F5] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[#1F1F2E]">
                      ৪-সংখ্যার এসএমএস কোড (4-Digit SMS Code)
                    </label>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold flex items-center gap-1 shadow-2xs">
                      <Sparkles className="w-3 h-3" />
                      Auto-verifies upon 4 digits
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={4}
                      autoFocus
                      placeholder="● ● ● ●"
                      value={phonePinCode}
                      onChange={handlePhonePinChange}
                      onPaste={handlePhonePinPaste}
                      className="w-full px-4 py-3.5 rounded-xl bg-white border border-[#EDE4F5] text-center font-mono font-black tracking-[0.5em] text-2xl text-[#1F1F2E] focus:outline-none focus:border-[#5B2C8A] focus:ring-4 focus:ring-[#5B2C8A]/10 transition-all shadow-2xs"
                    />
                    {phoneOtpConfirming && (
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-[#5B2C8A] font-bold bg-[#F8F5FC] px-2.5 py-1 rounded-lg border border-[#EDE4F5] shadow-xs">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying...</span>
                      </div>
                    )}
                    {phoneVerified && !phoneOtpConfirming && (
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shadow-xs">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Verified</span>
                      </div>
                    )}
                  </div>

                  {/* Manual verify button if user prefers clicking */}
                  <button
                    type="button"
                    onClick={() => handleVerifyPhoneOtp()}
                    disabled={phoneOtpConfirming || phonePinCode.length < 4}
                    className="w-full py-3 px-4 rounded-xl bg-[#5B2C8A] hover:bg-[#4A1F6E] active:scale-[0.99] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {phoneOtpConfirming ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        যাচাই করা হচ্ছে...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <span>Verify & Continue / যাচাই করুন ও এগিয়ে যান</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-[11px] text-[#6B7280] pt-1">
                    <span>Didn't receive code?</span>
                    {phoneOtpCountdown > 0 ? (
                      <span className="text-[#6B7280] font-medium font-mono">
                        Resend in {phoneOtpCountdown}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendPhoneOtp()}
                        disabled={phoneOtpSending}
                        className="text-[#5B2C8A] hover:text-[#4A1F6E] hover:underline font-bold cursor-pointer"
                      >
                        {phoneOtpSending ? 'Sending...' : 'Resend Code / পুনরায় কোড পাঠান'}
                      </button>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 3: NAME & GMAIL DETAILS (For New Accounts)          */}
            {/* ======================================================== */}
            {authStep === 'email-details' && (
              <div className="w-full bg-white border border-[#EDE4F5] rounded-[24px] sm:rounded-[28px] p-6 sm:p-8 shadow-[0_10px_35px_-5px_rgba(91,44,138,0.08)] space-y-5 animate-fadeIn text-[#1F1F2E]">
                
                <div className="text-center pt-1">
                  <div className="w-14 h-14 rounded-2xl bg-[#F8F5FC] border border-[#EDE4F5] text-[#5B2C8A] flex items-center justify-center mx-auto mb-3 shadow-2xs">
                    <UserPlus className="w-7 h-7 text-[#5B2C8A]" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-[#1F1F2E] tracking-tight">
                    Complete Your Account
                  </h2>
                  <p className="text-xs text-[#6B7280] mt-1 max-w-xs mx-auto">
                    মোবাইল নম্বর যাচাই সম্পন্ন! আপনার নাম ও জিমেইল এড্রেস দিয়ে অ্যাকাউন্ট সম্পন্ন করুন।
                  </p>
                </div>

                {/* Verified Phone Badge */}
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>মোবাইল নম্বর ভেরিফাইড: <strong className="font-mono">{phoneInput}</strong></span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full font-bold">লক করা</span>
                </div>

                {authError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2 animate-shake">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                {authSuccess && (
                  <div className="p-3 rounded-xl bg-[#F8F5FC] border border-[#EDE4F5] text-[#5B2C8A] text-xs font-bold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 shrink-0 text-[#5B2C8A]" />
                    <span>{authSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleSendEmailOtp} className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-[#1F1F2E] mb-1.5">
                      আপনার সম্পূর্ণ নাম (Full Name) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#8E8B99] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        required
                        placeholder="আপনার নাম লিখুন (e.g. Sheena Nelson)"
                        value={fullNameInput}
                        onChange={(e) => {
                          setFullNameInput(e.target.value);
                          if (authError) setAuthError('');
                        }}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F8F5FC] border border-[#EDE4F5] text-xs sm:text-sm text-[#1F1F2E] placeholder-[#9CA3AF] focus:outline-none focus:bg-white focus:border-[#5B2C8A] focus:ring-4 focus:ring-[#5B2C8A]/10 transition-all shadow-2xs font-medium"
                      />
                    </div>
                  </div>

                  {/* Gmail Address */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-[#1F1F2E]">
                        জিমেইল এড্রেস (Gmail Address Only) <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] font-bold text-[#5B2C8A] bg-[#F8F5FC] px-2 py-0.5 rounded-full border border-[#EDE4F5]">
                        শুধুমাত্র @gmail.com
                      </span>
                    </div>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#5B2C8A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        required
                        placeholder="yourname@gmail.com"
                        value={emailInput}
                        onChange={(e) => {
                          setEmailInput(e.target.value);
                          if (authError) setAuthError('');
                        }}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F8F5FC] border border-[#EDE4F5] text-xs sm:text-sm text-[#1F1F2E] placeholder-[#9CA3AF] focus:outline-none focus:bg-white focus:border-[#5B2C8A] focus:ring-4 focus:ring-[#5B2C8A]/10 transition-all shadow-2xs font-medium"
                      />
                    </div>
                    <span className="text-[11px] text-[#6B7280] block mt-1.5">
                      অ্যাকাউন্টের সুরক্ষা ও ওয়েবসাইট ডেলিভারি নিশ্চিত করতে শুধুমাত্র @gmail.com গ্রহণযোগ্য।
                    </span>
                  </div>

                  {/* Send Email OTP Button */}
                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={emailOtpSending}
                      className="w-full py-3.5 px-4 rounded-xl bg-[#5B2C8A] hover:bg-[#4A1F6E] active:scale-[0.99] text-white font-bold text-sm shadow-[0_4px_16px_rgba(91,44,138,0.22)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {emailOtpSending ? (
                        <span className="flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Sending Gmail code...
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <span>Send Email OTP / জিমেইল ওটিপি পাঠান</span>
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      )}
                    </button>
                  </div>
                </form>

              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 4: GMAIL 6-DIGIT OTP CARD                           */}
            {/* ======================================================== */}
            {authStep === 'email-otp' && (
              <div className="w-full bg-white border border-[#EDE4F5] rounded-[24px] sm:rounded-[28px] p-6 sm:p-8 shadow-[0_10px_35px_-5px_rgba(91,44,138,0.08)] space-y-5 animate-fadeIn text-[#1F1F2E]">
                
                {/* Header Icon */}
                <div className="text-center pt-1">
                  <div className="w-14 h-14 rounded-2xl bg-[#F8F5FC] border border-[#EDE4F5] text-[#5B2C8A] flex items-center justify-center mx-auto mb-3 shadow-2xs">
                    <Mail className="w-7 h-7 text-[#5B2C8A]" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-[#1F1F2E] tracking-tight">
                    Enter Email Verification Code
                  </h2>
                  <p className="text-xs text-[#6B7280] mt-1.5 leading-relaxed max-w-xs mx-auto">
                    আপনার জিমেইলে ৬-সংখ্যার ওটিপি পাঠানো হয়েছে:{' '}
                    <strong className="text-[#5B2C8A] font-semibold">{emailInput}</strong>
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthStep('email-details');
                      setAuthError('');
                      setEmailOtpCode('');
                    }}
                    className="mt-1 text-[11px] text-[#5B2C8A] hover:text-[#4A1F6E] hover:underline font-semibold cursor-pointer"
                  >
                    Edit email address / ইমেইল পরিবর্তন করুন
                  </button>
                </div>

                {authError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2 animate-shake">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                {/* 6-Digit Code Input Box with Auto-Verify */}
                <div className="p-4 rounded-2xl bg-[#F8F5FC] border border-[#EDE4F5] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[#1F1F2E]">
                      ৬-সংখ্যার জিমেইল কোড (6-Digit Email Code)
                    </label>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold flex items-center gap-1 shadow-2xs">
                      <Sparkles className="w-3 h-3" />
                      Auto-verifies upon 6 digits
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={6}
                      autoFocus
                      placeholder="● ● ● ● ● ●"
                      value={emailOtpCode}
                      onChange={handleEmailOtpChange}
                      onPaste={handleEmailOtpPaste}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-[#EDE4F5] text-center font-mono font-bold tracking-[0.35em] text-lg text-[#1F1F2E] focus:outline-none focus:border-[#5B2C8A] focus:ring-4 focus:ring-[#5B2C8A]/10 transition-all shadow-2xs"
                    />
                    {(emailOtpConfirming || submittingRegistration) && (
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-[#5B2C8A] font-bold bg-[#F8F5FC] px-2.5 py-1 rounded-lg border border-[#EDE4F5] shadow-xs">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying...</span>
                      </div>
                    )}
                    {emailVerified && !emailOtpConfirming && (
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shadow-xs">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Verified</span>
                      </div>
                    )}
                  </div>

                  {/* Manual Complete Button */}
                  <button
                    type="button"
                    onClick={() => handleVerifyEmailOtp()}
                    disabled={emailOtpConfirming || submittingRegistration || emailOtpCode.length < 6}
                    className="w-full py-3.5 px-4 rounded-xl bg-[#5B2C8A] hover:bg-[#4A1F6E] active:scale-[0.99] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submittingRegistration ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        অ্যাকাউন্ট তৈরি হচ্ছে...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <span>Create Account & Enter Dashboard</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-[11px] text-[#6B7280] pt-1">
                    <span>Didn't receive code?</span>
                    {emailOtpCountdown > 0 ? (
                      <span className="text-[#6B7280] font-medium font-mono">
                        Resend in {emailOtpCountdown}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleSendEmailOtp(e as any)}
                        disabled={emailOtpSending}
                        className="text-[#5B2C8A] hover:text-[#4A1F6E] hover:underline font-bold cursor-pointer"
                      >
                        {emailOtpSending ? 'Sending...' : 'Resend Code / পুনরায় কোড পাঠান'}
                      </button>
                    )}
                  </div>
                </div>

              </div>
            )}

            </div>
          </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: TOTAL ORDERS SUBPAGE (Requirement 8)
  // ==========================================
  if (subView === 'total-orders') {
    return (
      <div className="w-full flex flex-col font-sans pb-28 lg:pb-12 pt-3 sm:pt-6 lg:pt-8 animate-fadeIn bg-[#F8F5FC] text-slate-900">
        <section className="max-w-4xl lg:max-w-5xl mx-auto px-4 sm:px-6 w-full space-y-5">
          {/* Back Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigateSubView('overview')}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 hover:border-purple-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600" />
              <span>← অ্যাকাউন্টে ফিরে যান</span>
            </button>

            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold font-mono">
              মোট অর্ডার: {userOrders.length} টি
            </span>
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              মোট Order (Total Orders)
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              আপনার নিবন্ধিত মোবাইল নম্বর ({currentUser.phone}) দিয়ে করা সমস্ত অর্ডারের সম্পূর্ণ তালিকা ও রসিদ:
            </p>
          </div>

          {userOrders.length === 0 ? (
            <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200/90 text-center space-y-3 shadow-md">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 border border-purple-200 flex items-center justify-center mx-auto">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                আপনি এখনো কোনো ওয়েবসাইট অর্ডার করেননি
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                ড্যাশবোর্ডে গিয়ে আপনার পছন্দের ক্যাটাগরি থেকে মাত্র ১,৯৯০ টাকায় ওয়েবসাইট অর্ডার করতে পারেন।
              </p>
              {onGoToDashboard && (
                <button
                  onClick={onGoToDashboard}
                  className="mt-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold cursor-pointer shadow-md inline-flex items-center gap-1.5 transition-all"
                >
                  <span>ওয়েবসাইট তালিকা দেখুন</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {userOrders.map((ord, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-purple-300 transition-all shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-mono font-black text-xs">
                        {ord.orderId}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 text-[11px] font-bold border border-purple-200">
                        {ord.demoCode}
                      </span>
                      <span className="text-sm font-bold text-slate-900 truncate">
                        {ord.companyName || ord.clientName}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 truncate">
                      {ord.demoTitle}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                      <span>তারিখ: <strong>{ord.createdAt}</strong></span>
                      <span>মেকিং: <strong className="text-purple-700 font-mono">১,৯৯০ ৳</strong></span>
                      <span>TrxID: <strong className="font-mono text-emerald-600">{ord.transactionId}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                      ord.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : ord.status === 'processing' || ord.status === 'verified'
                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                        : ord.status === 'cancelled'
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {ord.status === 'completed' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>✓ সম্পূর্ণ (Completed)</span>
                        </>
                      ) : ord.status === 'processing' || ord.status === 'verified' ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                          <span>অনুমোদিত (প্রসেসিং)</span>
                        </>
                      ) : ord.status === 'cancelled' ? (
                        <span>বাতিলকৃত</span>
                      ) : (
                        <>
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                          <span>⏳ পেন্ডিং যাচাই</span>
                        </>
                      )}
                    </span>

                    <button
                      onClick={() => setSelectedReceiptOrder(ord)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-purple-400 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>রসিদ দেখুন</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Receipt Modal */}
        {renderReceiptModal()}
      </div>
    );
  }

  // ==========================================
  // VIEW: PENDING VERIFICATION SUBPAGE (Requirement 8)
  // ==========================================
  if (subView === 'pending-orders') {
    return (
      <div className="w-full flex flex-col font-sans pb-28 lg:pb-12 pt-3 sm:pt-6 lg:pt-8 animate-fadeIn bg-[#F8F5FC] text-slate-900">
        <section className="max-w-4xl lg:max-w-5xl mx-auto px-4 sm:px-6 w-full space-y-5">
          {/* Back Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigateSubView('overview')}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 hover:border-purple-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600" />
              <span>← অ্যাকাউন্টে ফিরে যান</span>
            </button>

            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              pendingOrders.length > 0 ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}>
              {pendingOrders.length > 0 ? `${pendingOrders.length} টি পেন্ডিং যাচাই` : '০ টি পেন্ডিং'}
            </span>
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              Pending যাচাই (Pending Verification)
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              ম্যানুয়াল পেমেন্ট প্রেরণের পর অ্যাডমিন টিম কর্তৃক যাচাইকরণের তালিকা:
            </p>
          </div>

          {/* If there are NO pending orders -> Show "কোনো Pending নেই" / "No Pending" exactly as required */}
          {pendingOrders.length === 0 ? (
            <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200/90 text-center space-y-3 shadow-md">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2 border border-emerald-200">
                <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                কোনো Pending নেই / No Pending
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                আপনার কোনো অর্ডার বর্তমানে পেন্ডিং অবস্থায় নেই। সকল পেমেন্ট ও অর্ডার সফলভাবে যাচাই এবং কনফার্ম করা হয়েছে।
              </p>
              <div className="pt-2">
                <button
                  onClick={() => navigateSubView('overview')}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold hover:from-purple-500 hover:to-indigo-500 cursor-pointer shadow-md inline-flex items-center gap-1.5 transition-all"
                >
                  <span>অ্যাকাউন্ট ওভারভিউতে ফিরুন</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs sm:text-sm font-bold text-amber-900 flex items-center gap-2.5 shadow-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                <span>
                  আপনার নিম্নের অর্ডারসমূহের পেমেন্ট যাচাই প্রক্রিয়াধীন রয়েছে। অনুগ্রহ করে ১ মিনিট থেকে ১ ঘণ্টা অপেক্ষা করুন।
                </span>
              </div>

              {pendingOrders.map((ord, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-white border-2 border-amber-200 transition-all shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-mono font-black text-xs">
                        {ord.orderId}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 text-[11px] font-bold border border-purple-200">
                        {ord.demoCode}
                      </span>
                      <span className="text-sm font-bold text-slate-900 truncate">
                        {ord.companyName || ord.clientName}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 truncate">
                      {ord.demoTitle}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                      <span>তারিখ: <strong>{ord.createdAt || 'N/A'}</strong></span>
                      <span>মেকিং চার্জ: <strong className="text-purple-700 font-mono">১,৯৯০ ৳</strong></span>
                      <span>পেমেন্ট: <strong>{String(ord.paymentMethod || 'bKash').toUpperCase()}</strong></span>
                      <span>TrxID: <strong className="font-mono text-emerald-600">{ord.transactionId || 'N/A'}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                      <span>⏳ পেন্ডিং যাচাই (১ মি. - ১ ঘণ্টা)</span>
                    </span>

                    <button
                      onClick={() => setSelectedReceiptOrder(ord)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-purple-400 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>রসিদ দেখুন</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Receipt Modal */}
        {renderReceiptModal()}
      </div>
    );
  }

  // ==========================================
  // VIEW: PRIVACY POLICY SUBPAGE (Requirement 9)
  // ==========================================
  if (subView === 'privacy') {
    return (
      <div className="w-full flex flex-col font-sans pb-28 pt-3 sm:pt-6 animate-fadeIn bg-[#F8F5FC] text-slate-900">
        <section className="max-w-3xl mx-auto px-4 sm:px-6 w-full space-y-5">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigateSubView('overview')}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 hover:border-purple-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600" />
              <span>← অ্যাকাউন্টে ফিরে যান</span>
            </button>
            <span className="text-xs font-bold text-slate-500">BongoWeb পলিসি</span>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-md space-y-4 text-slate-900">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <ShieldCheck className="w-6 h-6 text-purple-600" />
              <h1 className="text-lg sm:text-xl font-black text-slate-900">
                গোপনীয়তা নীতিমালা (Privacy Policy)
              </h1>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
              <p>
                BongoWeb গ্রাহকদের তথ্যের গোপনীয়তা ও নিরাপত্তাকে সর্বোচ্চ প্রাধান্য দেয়। আপনি যখন আমাদের ওয়েবসাইট সেবা গ্রহণ করেন, আপনার প্রদত্ত ফোন নম্বর, ইমেইল ও ব্যবসার তথ্য শুধুমাত্র ওয়েবসাইট কনফিগারেশন ও অফিসিয়াল ডেলিভারির উদ্দেশ্যে সংরক্ষিত থাকে।
              </p>
              <h3 className="text-sm font-bold text-slate-900">১. তথ্য সংগ্রহ ও সুরক্ষা</h3>
              <p>
                আপনার মোবাইল নম্বর, ইমেইল এবং পেমেন্ট ট্রানজেকশন আইডি ২৫৬-বিট এসএসএল (SSL) এনক্রিপশনের মাধ্যমে সম্পূর্ণ সুরক্ষিত ডেটাবেজে সংরক্ষিত থাকে। কোনো অবস্থাতেই তৃতীয় পক্ষের কাছে বাণিজ্যিক উদ্দেশ্যে তথ্য শেয়ার করা হয় না।
              </p>
              <h3 className="text-sm font-bold text-slate-900">২. ওয়েবসাইট অ্যাডমিন ও পাসওয়ার্ড গোপনীয়তা</h3>
              <p>
                ওয়েবসাইট ডেলিভারির পর গ্রাহকের জন্য স্বতন্ত্র অ্যাডমিন আইডি ও পাসওয়ার্ড তৈরি করে সুরক্ষিত এনক্রিপশনে প্রদান করা হয়। গ্রাহক যেকোনো সময় নিজস্ব ওয়েবসাইট প্যানেল থেকে পাসওয়ার্ড পরিবর্তন করতে পারেন।
              </p>
              <h3 className="text-sm font-bold text-slate-900">৩. যোগাযোগ ও সহায়তা</h3>
              <p>
                যেকোনো প্রয়োজনে আমাদের অফিসিয়াল সাপোর্ট নম্বরে কল অথবা অ্যাকাউন্টের মাধ্যমে যোগাযোগ করতে পারেন।
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ==========================================
  // VIEW: TERMS & CONDITIONS SUBPAGE (Requirement 9)
  // ==========================================
  if (subView === 'terms') {
    return (
      <div className="w-full flex flex-col font-sans pb-28 lg:pb-12 pt-3 sm:pt-6 lg:pt-8 animate-fadeIn bg-[#F8F5FC] text-slate-900">
        <section className="max-w-3xl lg:max-w-4xl mx-auto px-4 sm:px-6 w-full space-y-5">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigateSubView('overview')}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 hover:border-purple-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600" />
              <span>← অ্যাকাউন্টে ফিরে যান</span>
            </button>
            <span className="text-xs font-bold text-slate-500">BongoWeb টার্মস</span>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-md space-y-4 text-slate-900">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <FileText className="w-6 h-6 text-purple-600" />
              <h1 className="text-lg sm:text-xl font-black text-slate-900">
                শর্তাবলি ও ব্যবহারের নিয়ম (Terms & Conditions)
              </h1>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
              <h3 className="text-sm font-bold text-slate-900">১. মেকিং ও ডেলিভারি চার্জ</h3>
              <p>
                প্রতিটি প্রি-বিল্ট ওয়েবসাইটের এককালীন রেডিমেকিং চার্জ মাত্র ১,৯৯০ টাকা। অর্ডার নিশ্চিত হওয়ার পর সর্বোচ্চ ২৪ থেকে ৪৮ ঘণ্টার মধ্যে সম্পূর্ণ লাইভ ওয়েবসাইট ডেলিভারি সম্পন্ন হয়।
              </p>
              <h3 className="text-sm font-bold text-slate-900">২. ক্লাউড সার্ভার ও মেইনটেন্যান্স (মাসিক খরচ ২৫০ টাকা)</h3>
              <p>
                ওয়েবসাইট নিরবচ্ছিন্নভাবে লাইভ ও নিরাপদ রাখার জন্য মাসিক খরচ ২৫০ টাকা। এই ফিতে সার্বক্ষণিক এসএসএল সিকিউরিটি, ডেটা ব্যাকআপ ও ক্লাউড নোড অপটিমাইজেশন অন্তর্ভুক্ত থাকে।
              </p>
              <h3 className="text-sm font-bold text-slate-900">৩. ফ্রি সাপোর্ট ও পরামর্শ</h3>
              <p>
                ওয়েবসাইট পরিচালনার জন্য সকল গ্রাহককে ফ্রি ভিডিও টিউটোরিয়াল প্রদান করা হয় এবং লাইভ সাপোর্ট টিকেট ও চ্যাটের মাধ্যমে সার্বক্ষণিক ফ্রি সাপোর্ট নিশ্চিত করা হয়।
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Helper for receipt modal
  function renderReceiptModal() {
    if (!selectedReceiptOrder) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
        <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 animate-slideUpModal relative space-y-4 text-slate-900">
          <button
            onClick={() => setSelectedReceiptOrder(null)}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center pb-4 border-b border-slate-200">
            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200 text-xs font-black font-mono">
              {selectedReceiptOrder.orderId}
            </span>
            <h3 className="text-lg font-black text-slate-900 mt-2">
              অফিসিয়াল অর্ডার রসিদ (Official Receipt)
            </h3>
            <p className="text-[11px] text-slate-500">
              BongoWeb — ২৪ ঘণ্টা এক্সপ্রেস ডেলিভারি
            </p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">গ্রাহকের নাম:</span>
              <span className="font-bold text-slate-900">{selectedReceiptOrder.clientName}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">ব্যবসা/কোম্পানি:</span>
              <span className="font-bold text-slate-900">{selectedReceiptOrder.companyName}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">মোবাইল নম্বর:</span>
              <span className="font-bold font-mono text-slate-900">{selectedReceiptOrder.phone}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">ইমেইল এড্রেস:</span>
              <span className="font-bold font-mono text-slate-900">{selectedReceiptOrder.email}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">পেমেন্ট মাধ্যম:</span>
              <span className="font-bold text-slate-900 uppercase">{selectedReceiptOrder.paymentMethod}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">ট্রানজেকশন TrxID:</span>
              <span className="font-bold font-mono text-emerald-600">{selectedReceiptOrder.transactionId}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">এককালীন চার্জ:</span>
              <span className="font-black text-sm text-slate-900 font-mono">১,৯৯০ ৳</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">মাসিক খরচ:</span>
              <span className="font-bold text-purple-700">মাসিক খরচ ২৫০ টাকা</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">স্ট্যাটাস:</span>
              <span className={`font-bold flex items-center gap-1 ${
                selectedReceiptOrder.status === 'completed'
                  ? 'text-emerald-600'
                  : selectedReceiptOrder.status === 'processing' || selectedReceiptOrder.status === 'verified'
                  ? 'text-purple-700'
                  : selectedReceiptOrder.status === 'cancelled'
                  ? 'text-rose-600'
                  : 'text-amber-600'
              }`}>
                {selectedReceiptOrder.status === 'completed'
                  ? '✓ সম্পূর্ণ (Completed)'
                  : selectedReceiptOrder.status === 'processing' || selectedReceiptOrder.status === 'verified'
                  ? '⚡ অনুমোদিত (প্রসেসিং)'
                  : selectedReceiptOrder.status === 'cancelled'
                  ? 'বাতিলকৃত'
                  : '⏳ পেন্ডিং ভেরিফিকেশন (১ মিনিট - ১ ঘণ্টা)'}
              </span>
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              onClick={() => window.print()}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-purple-500/25 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>প্রিন্ট / ডাউনলোড</span>
            </button>
            <button
              onClick={() => setSelectedReceiptOrder(null)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold cursor-pointer transition-colors"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User display details from active logged-in account
  const displayUsername = currentUser?.name || (language === 'bn' ? 'সম্মানিত ক্লায়েন্ট' : 'Client Account');
  const displayEmail = currentUser?.email || '';
  const displayPhone = (currentUser?.phone && !currentUser.phone.includes('_') && !currentUser.phone.includes('@') && /\d{6,}/.test(currentUser.phone)) 
    ? currentUser.phone 
    : '';
  const displayJoined = currentUser?.registeredAt || new Date().toLocaleDateString('bn-BD');
  const displayId = currentUser?.clientId || (currentUser?.id ? `BW-${String(currentUser.id).slice(-6)}` : 'BW-CLIENT');

  return (
    <div className="relative w-full flex flex-col font-sans pb-28 lg:pb-12 pt-2 sm:pt-4 lg:pt-6 animate-fadeIn bg-[#F8F5FC] text-slate-900 select-none">
      {/* Ambient Brand Glow */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-purple-200/35 via-indigo-100/30 to-blue-100/25 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* REDESIGNED ACCOUNT DASHBOARD */}
      <section className="max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 w-full mb-8">
        
        {/* Account Header Text */}
        <div className="mb-5 sm:mb-6 space-y-1">
          <h1 className="text-xl sm:text-2xl font-black text-[#1F1F2E] tracking-tight flex items-center gap-2.5">
            <User className="w-6 h-6 text-[#5B2C8A]" />
            <span>{language === 'bn' ? 'আমার অ্যাকাউন্ট' : 'My Account'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            {language === 'bn' 
              ? 'আপনার প্রোফাইল, ওয়েবসাইট অর্ডার ও ক্লায়েন্ট নিরাপত্তা পোর্টাল' 
              : 'Manage your client profile, website orders & account security'}
          </p>
        </div>

        {/* ========================================================= */}
        {/* 1. LAPTOP / DESKTOP VERSION (Wide Horizontal Layout)       */}
        {/* ========================================================= */}
        <div className="hidden md:block space-y-6">
          {/* Main Profile Card */}
          <div className="bg-white border border-[#EDE4F5] rounded-3xl p-8 lg:p-9 shadow-[0_4px_24px_rgba(91,44,138,0.06)] space-y-8">
            {/* Header: Profile Info on Left, Security Code on Right */}
            <div className="flex items-center justify-between gap-4 pb-6 border-b border-[#EDE4F5]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#5B2C8A] to-[#7C3AED] text-white flex items-center justify-center font-bold text-2xl shadow-sm border border-white/20">
                  {(displayUsername || 'B').charAt(0).toUpperCase()}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl font-bold text-[#1F1F2E] tracking-tight">
                      {displayUsername}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Verified Client
                    </span>
                  </div>
                  <p className="text-xs text-[#6B7280] font-medium">
                    Joined: {displayJoined} • ID: {displayId}
                  </p>
                </div>
              </div>

              {/* Security Code Button */}
              <button
                type="button"
                onClick={() => setShowSecurityCodeModal(true)}
                className="px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-[#5B2C8A] text-[#5B2C8A] hover:text-white border border-[#EDE4F5] hover:border-transparent text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs active:scale-95 group"
              >
                <ShieldCheck className="w-4 h-4 text-[#5B2C8A] group-hover:text-white transition-colors" />
                <span>Security Code</span>
              </button>
            </div>

            {/* 4 Details Cards Grid */}
            <div className="grid grid-cols-4 gap-4">
              {/* Full Name */}
              <div className="p-4 rounded-2xl bg-[#F8F5FC] border border-[#EDE4F5] space-y-1">
                <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">
                  Full Name (নাম)
                </span>
                <p className="text-sm font-bold text-[#1F1F2E] truncate">
                  {displayUsername}
                </p>
              </div>

              {/* Email Address */}
              <div className="p-4 rounded-2xl bg-[#F8F5FC] border border-[#EDE4F5] space-y-1">
                <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">
                  Email Address
                </span>
                <p className="text-sm font-mono font-bold text-[#1F1F2E] truncate select-all">
                  {displayEmail}
                </p>
              </div>

              {/* Phone (মোবাইল) */}
              <div className="p-4 rounded-2xl bg-[#F8F5FC] border border-[#EDE4F5] space-y-1">
                <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">
                  Phone (মোবাইল)
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-mono font-bold text-[#1F1F2E]">
                    {displayPhone}
                  </span>
                  <span className="text-xs font-semibold text-amber-700">
                    (Unverified)
                  </span>
                </div>
              </div>

              {/* Protection & SSL */}
              <div className="p-4 rounded-2xl bg-[#F8F5FC] border border-[#EDE4F5] space-y-1">
                <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">
                  Protection
                </span>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-sm font-bold text-[#1F1F2E]">
                    Active Tier
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                    256-bit SSL
                  </span>
                </div>
              </div>
            </div>

            {/* Buttons Row */}
            <div className="pt-2 flex items-center justify-between gap-4 border-t border-[#EDE4F5]">
              <button
                type="button"
                onClick={() => {
                  setReportMessage('');
                  setReportSuccess('');
                  setShowReportModal(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs hover:scale-[1.01] active:scale-95"
              >
                <span>রিপোর্ট / অভিযোগ জানান (Submit Report)</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="px-5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs hover:scale-[1.01] active:scale-95"
              >
                <span>সাইন আউট (Sign Out)</span>
              </button>
            </div>
          </div>

          {/* Policies & Terms Section (Desktop Card) */}
          <div className="bg-white border border-[#EDE4F5] rounded-3xl p-8 lg:p-9 shadow-[0_4px_24px_rgba(91,44,138,0.06)] space-y-6">
            <div>
              <h3 className="text-lg font-bold text-[#1F1F2E]">
                Policies & Terms (অ্যাকাউন্ট নীতিমালা ও শর্তাবলি)
              </h3>
              <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                BongoWeb সার্ভিস ব্যবহার ও ক্লায়েন্ট নিরাপত্তা সম্পর্কিত নীতিমালা:
              </p>
            </div>

            <div className="grid grid-cols-2 gap-5">
              {/* Privacy Policy */}
              <button
                type="button"
                onClick={() => navigateSubView('privacy')}
                className="p-6 rounded-2xl bg-[#F8F5FC] hover:bg-white border border-[#EDE4F5] hover:border-[#5B2C8A]/40 text-left transition-all cursor-pointer group shadow-2xs hover:shadow-md flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-[#1F1F2E] group-hover:text-[#5B2C8A] transition-colors">
                    Privacy Policy (গোপনীয়তা নীতিমালা)
                  </h4>
                  <p className="text-xs text-[#6B7280] leading-relaxed">
                    গ্রাহকের তথ্যের সুরক্ষা, এনক্রিপশন ও গোপনীয়তা রক্ষার পূর্ণাঙ্গ নীতিমালা পড়ুন।
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-[#EDE4F5] flex items-center justify-between text-xs text-[#6B7280]">
                  <span>Updated Oct 2026</span>
                  <span className="text-[#5B2C8A] font-bold group-hover:underline">Read Policy →</span>
                </div>
              </button>

              {/* Terms & Conditions */}
              <button
                type="button"
                onClick={() => navigateSubView('terms')}
                className="p-6 rounded-2xl bg-[#F8F5FC] hover:bg-white border border-[#EDE4F5] hover:border-[#5B2C8A]/40 text-left transition-all cursor-pointer group shadow-2xs hover:shadow-md flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-[#1F1F2E] group-hover:text-[#5B2C8A] transition-colors">
                    Terms & Conditions (সার্ভিস শর্তাবলি)
                  </h4>
                  <p className="text-xs text-[#6B7280] leading-relaxed">
                    ওয়েবসাইট ডেলিভারি, ফ্রি হোস্টিং এবং সার্ভিস ব্যবহারের আইনগত শর্তসমূহ।
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-[#EDE4F5] flex items-center justify-between text-xs text-[#6B7280]">
                  <span>24h Delivery SLA</span>
                  <span className="text-[#5B2C8A] font-bold group-hover:underline">Read Terms →</span>
                </div>
              </button>
            </div>

            {/* Shifted from Drawer: Business Information & Legal Policies (After all policies) */}
            <div className="pt-2 border-t border-[#EDE4F5]">
              <button
                type="button"
                onClick={() => setShowBusinessInfoModal(true)}
                className="w-full flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-[#F8F5FC] hover:bg-white border border-[#EDE4F5] hover:border-[#5B2C8A]/40 text-left transition-all cursor-pointer group shadow-2xs hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-white group-hover:bg-[#5B2C8A] flex items-center justify-center text-[#5B2C8A] group-hover:text-white border border-[#EDE4F5] shadow-xs shrink-0 transition-colors">
                    <Building2 className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1F1F2E] group-hover:text-[#5B2C8A] transition-colors">
                      ৫. ব্যবসায়িক বিবরণ ও আইনি পলিসি (Business Info & Legal Policies)
                    </h4>
                    <p className="text-xs text-[#6B7280] mt-0.5 leading-relaxed">
                      BongoWeb Digital Solutions Ltd. • কর্পোরেট তথ্য ও আইনি বিবরণ
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#5B2C8A] group-hover:underline flex items-center gap-1 shrink-0 ml-4">
                  <span>View Details →</span>
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. MOBILE VERSION (Vertical Stacked, Touch-Friendly Layout) */}
        {/* ========================================================= */}
        <div className="md:hidden space-y-4">
          {/* Main Profile Card Mobile */}
          <div className="bg-white border border-[#EDE4F5] rounded-2xl p-5 shadow-[0_3px_16px_rgba(91,44,138,0.05)] space-y-5">
            {/* Profile Header Stack */}
            <div className="flex flex-col items-center text-center space-y-2.5 pb-4 border-b border-[#EDE4F5]">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#5B2C8A] to-[#7C3AED] text-white flex items-center justify-center font-bold text-2xl shadow-sm border border-white/20">
                {(displayUsername || 'B').charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <h2 className="text-lg font-bold text-[#1F1F2E]">
                    {displayUsername}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold inline-flex items-center gap-1 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Verified Client
                  </span>
                </div>
                <p className="text-xs text-[#6B7280]">
                  Joined: {displayJoined} • ID: {displayId}
                </p>
              </div>

              {/* Touch-Friendly Security Code Button */}
              <button
                type="button"
                onClick={() => setShowSecurityCodeModal(true)}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-purple-50 hover:bg-[#5B2C8A] text-[#5B2C8A] hover:text-white border border-[#EDE4F5] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs active:scale-95"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Security Code</span>
              </button>
            </div>

            {/* Vertical Stacked Details List */}
            <div className="space-y-2.5">
              {/* Full Name */}
              <div className="p-3.5 rounded-xl bg-[#F8F5FC] border border-[#EDE4F5] space-y-0.5">
                <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">
                  Full Name (নাম)
                </span>
                <p className="text-xs sm:text-sm font-bold text-[#1F1F2E]">
                  {displayUsername}
                </p>
              </div>

              {/* Email Address */}
              <div className="p-3.5 rounded-xl bg-[#F8F5FC] border border-[#EDE4F5] space-y-0.5">
                <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">
                  Email Address
                </span>
                <p className="text-xs sm:text-sm font-mono font-bold text-[#1F1F2E] truncate select-all">
                  {displayEmail}
                </p>
              </div>

              {/* Phone (মোবাইল) */}
              <div className="p-3.5 rounded-xl bg-[#F8F5FC] border border-[#EDE4F5] space-y-0.5">
                <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">
                  Phone (মোবাইল)
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-mono font-bold text-[#1F1F2E]">
                    {displayPhone}
                  </span>
                  <span className="text-xs font-semibold text-amber-700">
                    (Unverified)
                  </span>
                </div>
              </div>

              {/* Protection */}
              <div className="p-3.5 rounded-xl bg-[#F8F5FC] border border-[#EDE4F5] space-y-0.5">
                <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">
                  Protection
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-bold text-[#1F1F2E]">
                    Active Tier
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    256-bit SSL
                  </span>
                </div>
              </div>
            </div>

            {/* Vertically Stacked Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-[#EDE4F5]">
              <button
                type="button"
                onClick={() => {
                  setReportMessage('');
                  setReportSuccess('');
                  setShowReportModal(true);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs active:scale-95"
              >
                <span>রিপোর্ট / অভিযোগ জানান (Submit Report)</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs active:scale-95"
              >
                <span>সাইন আউট (Sign Out)</span>
              </button>
            </div>
          </div>

          {/* Policies & Terms Section Mobile */}
          <div className="bg-white border border-[#EDE4F5] rounded-2xl p-5 shadow-[0_3px_16px_rgba(91,44,138,0.05)] space-y-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#1F1F2E]">
                Policies & Terms (অ্যাকাউন্ট নীতিমালা ও শর্তাবলি)
              </h3>
              <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                BongoWeb সার্ভিস ব্যবহার ও ক্লায়েন্ট নিরাপত্তা সম্পর্কিত নীতিমালা:
              </p>
            </div>

            <div className="space-y-3">
              {/* Privacy Policy */}
              <button
                type="button"
                onClick={() => navigateSubView('privacy')}
                className="w-full p-4 rounded-xl bg-[#F8F5FC] hover:bg-white border border-[#EDE4F5] hover:border-[#5B2C8A]/40 text-left transition-all cursor-pointer shadow-2xs flex flex-col gap-2"
              >
                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-bold text-[#1F1F2E]">
                    Privacy Policy (গোপনীয়তা নীতিমালা)
                  </h4>
                  <p className="text-[11px] sm:text-xs text-[#6B7280] leading-relaxed">
                    গ্রাহকের তথ্যের সুরক্ষা, এনক্রিপশন ও গোপনীয়তা রক্ষার পূর্ণাঙ্গ নীতিমালা পড়ুন।
                  </p>
                </div>
                <div className="pt-2 border-t border-[#EDE4F5] flex items-center justify-between text-[11px] text-[#6B7280]">
                  <span>Updated Oct 2026</span>
                  <span className="text-[#5B2C8A] font-bold">Read Policy →</span>
                </div>
              </button>

              {/* Terms & Conditions */}
              <button
                type="button"
                onClick={() => navigateSubView('terms')}
                className="w-full p-4 rounded-xl bg-[#F8F5FC] hover:bg-white border border-[#EDE4F5] hover:border-[#5B2C8A]/40 text-left transition-all cursor-pointer shadow-2xs flex flex-col gap-2"
              >
                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-bold text-[#1F1F2E]">
                    Terms & Conditions (সার্ভিস শর্তাবলি)
                  </h4>
                  <p className="text-[11px] sm:text-xs text-[#6B7280] leading-relaxed">
                    ওয়েবসাইট ডেলিভারি, ফ্রি হোস্টিং এবং সার্ভিস ব্যবহারের আইনগত শর্তসমূহ।
                  </p>
                </div>
                <div className="pt-2 border-t border-[#EDE4F5] flex items-center justify-between text-[11px] text-[#6B7280]">
                  <span>24h Delivery SLA</span>
                  <span className="text-[#5B2C8A] font-bold">Read Terms →</span>
                </div>
              </button>

              {/* Shifted from Drawer: Business Information & Legal Policies (After all policies) */}
              <button
                type="button"
                onClick={() => setShowBusinessInfoModal(true)}
                className="w-full p-4 rounded-xl bg-[#F8F5FC] hover:bg-white border border-[#EDE4F5] hover:border-[#5B2C8A]/40 text-left transition-all cursor-pointer shadow-2xs flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white group-hover:bg-[#5B2C8A] flex items-center justify-center text-[#5B2C8A] group-hover:text-white border border-[#EDE4F5] shadow-xs shrink-0 transition-colors">
                    <Building2 className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-bold text-[#1F1F2E] group-hover:text-[#5B2C8A] truncate">
                      ৫. ব্যবসায়িক বিবরণ ও আইনি পলিসি
                    </h4>
                    <p className="text-[11px] text-[#6B7280] truncate">
                      BongoWeb Digital Solutions Ltd.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#5B2C8A] shrink-0 ml-2">
                  View →
                </span>
              </button>
            </div>
          </div>
        </div>

      </section>

      {/* Receipt Modal Popup */}
      {renderReceiptModal()}

      {/* Business Details & Legal Compliance Modal (Shifted from Drawer) */}
      {showBusinessInfoModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-xl max-h-[85vh] bg-white text-slate-900 rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 animate-slideUpModal relative flex flex-col">
            <button
              onClick={() => setShowBusinessInfoModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-[#5B2C8A] border border-purple-200 text-xs font-bold inline-flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                <span>ব্যবসায়িক পরিচিতি ও আইনি বিবরণ</span>
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-2">
                BongoWeb Digital Solutions Ltd.
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                অফিসিয়াল কোম্পানি তথ্য, স্বচ্ছ রিফান্ড নীতি ও ডিপিডিপি আইন মেনে পরিচালিত সেবা:
              </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs">
              {/* Registered Address & Entity */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                  <span>কর্পোরেট বিবরণ ও নিবন্ধিত কার্যালয়</span>
                </div>
                <p className="text-slate-600">
                  <strong>কোম্পানি:</strong> BongoWeb Digital Solutions Ltd.
                </p>
                <p className="text-slate-600">
                  <strong>অফিস ঠিকানা:</strong> Block B, Road 11, Banani, Dhaka 1213, Bangladesh.
                </p>
                <p className="text-slate-600">
                  <strong>সেবার ধরণ:</strong> প্রিমিয়াম বিজনেস ওয়েবসাইট ক্যাটালগ ও ক্লাউড নোড হোস্টিং।
                </p>
              </div>

              {/* Direct Clickable Contacts */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 text-sm">
                  যোগাযোগ ও কাস্টমার সাপোর্ট
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#5B2C8A]" />
                  <span className="text-slate-600">হটলাইন:</span>
                  <a href="tel:+8801955570912" className="text-[#5B2C8A] font-bold font-mono underline">
                    01955570912
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#5B2C8A]" />
                  <span className="text-slate-600">ইমেইল:</span>
                  <a href="mailto:support@bongoweb.xyz" className="text-[#5B2C8A] font-bold underline">
                    support@bongoweb.xyz
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-[#5B2C8A]" />
                  <span className="text-slate-600">ডিপিডিপি গ্রিভ্যান্স অফিসার:</span>
                  <a href="mailto:privacy@bongoweb.xyz" className="text-[#5B2C8A] font-bold underline">
                    privacy@bongoweb.xyz
                  </a>
                </div>
              </div>

              {/* Quick Legal Links */}
              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-2">
                <div className="font-bold text-[#5B2C8A] text-xs uppercase tracking-wider">
                  আইনি নীতিমালা ও অধিকার
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBusinessInfoModal(false);
                      navigateSubView('privacy');
                    }}
                    className="p-2.5 rounded-xl bg-white hover:bg-purple-100/60 text-[#1F1F2E] font-bold border border-purple-200 transition-all text-left flex items-center justify-between cursor-pointer"
                  >
                    <span>Privacy Policy (DPDP)</span>
                    <ArrowRight className="w-3 h-3 text-[#5B2C8A]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowBusinessInfoModal(false);
                      navigateSubView('terms');
                    }}
                    className="p-2.5 rounded-xl bg-white hover:bg-purple-100/60 text-[#1F1F2E] font-bold border border-purple-200 transition-all text-left flex items-center justify-between cursor-pointer"
                  >
                    <span>Terms &amp; Conditions</span>
                    <ArrowRight className="w-3 h-3 text-[#5B2C8A]" />
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('bongoweb_open_cookie_preferences'));
                }}
                className="text-xs text-[#5B2C8A] font-bold underline cursor-pointer flex items-center gap-1"
              >
                <span>কুকি সেটিংস পরিবর্তন</span>
              </button>

              <button
                type="button"
                onClick={() => setShowBusinessInfoModal(false)}
                className="px-5 py-2 rounded-xl bg-[#5B2C8A] hover:bg-[#4A1F6E] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. SECURITY CODE MODAL (Requirement 13) */}
      {showSecurityCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 relative space-y-4 text-slate-900">
            <button
              onClick={() => setShowSecurityCodeModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {!currentUser ? (
              <div className="text-center space-y-4 pt-2">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h3 className="text-base font-black text-slate-900">
                  সিকিউরিটি কোড যাচাইকরণ
                </h3>
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900 leading-relaxed">
                  “কোড পেতে আগে Account তৈরি করুন। তারপর আমরা আপনার সমস্যা সমাধান করব।”
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSecurityCodeModal(false);
                      setAuthStep('phone');
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    Account তৈরি করুন
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSecurityCodeModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold cursor-pointer"
                  >
                    বন্ধ করুন
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-1">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-700 border border-purple-200 flex items-center justify-center shadow-xs">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                      ভেরিফিকেশন সুরক্ষা কোড
                    </span>
                    <h3 className="text-base font-black text-slate-900">
                      Your Security Code
                    </h3>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-purple-50/70 border-2 border-purple-200 text-center space-y-2">
                  <span className="text-xs text-slate-600 font-medium block">
                    আপনার বর্তমান ৫-মিনিটের সক্রিয় সিকিউরিটি কোড:
                  </span>
                  <div className="text-3xl sm:text-4xl font-black font-mono tracking-[0.25em] text-purple-700 select-all py-1">
                    {getClientSecurityCode(currentUser.phone || currentUser.email)}
                  </div>
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    <span>মেয়াদ বাকি: <strong className="text-slate-800 font-mono">{formatRemainingTime(codeRemainingSec)}</strong></span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const code = getClientSecurityCode(currentUser.phone || currentUser.email);
                    navigator.clipboard.writeText(code);
                    setSecurityCodeCopied(true);
                    setTimeout(() => setSecurityCodeCopied(false), 2000);
                  }}
                  className={`w-full py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                    securityCodeCopied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white'
                  }`}
                >
                  {securityCodeCopied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Security Code কপি হয়েছে!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Security Code (কোড কপি করুন)</span>
                    </>
                  )}
                </button>

                <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                  * এই কোডটি প্রতি ৫ মিনিটে স্বয়ংক্রিয়ভাবে পরিবর্তিত হয়। অ্যাডমিন বা সাপোর্ট টিম চাইলে তাদের এই কোডটি প্রদান করুন।
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Client Report Submission Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 relative space-y-4 text-slate-900">
            <button
              type="button"
              onClick={() => setShowReportModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 border border-purple-200 flex items-center justify-center shadow-xs">
                <Flag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  অভিযোগ ও রিপোর্ট পাঠান
                </h3>
                <p className="text-[11px] text-slate-500">
                  আপনার মতামত, টেকনিক্যাল সমস্যা বা অভিযোগ সরাসরি অ্যাডমিনকে জানান
                </p>
              </div>
            </div>

            {reportSuccess ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  রিপোর্ট সফলভাবে পাঠানো হয়েছে!
                </h4>
                <p className="text-xs text-slate-500">
                  {reportSuccess}
                </p>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-3.5">
                {/* Auto-filled details (User doesn't need to type them) */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">ক্লায়েন্ট আইডি:</span>
                    <span className="font-mono font-bold text-purple-700 bg-purple-100 border border-purple-200 px-2.5 py-0.5 rounded-md">
                      {currentUser?.clientId || (currentUser?.phone ? `#BW-USER-${currentUser.phone.slice(-4)}` : '#BW-CLIENT')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">নাম:</span>
                    <strong className="text-slate-900">{currentUser?.name}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">মোবাইল নম্বর:</span>
                    <span className="font-mono text-slate-900">{currentUser?.phone}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    আপনার অভিযোগ বা সমস্যা লিখুন <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={reportMessage}
                    onChange={(e) => setReportMessage(e.target.value)}
                    placeholder="আপনার অভিযোগ, ওয়েবসাইটের সমস্যা বা যেকোনো প্রশ্ন বিস্তারিত লিখুন..."
                    className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={reportLoading || !reportMessage.trim()}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>{reportLoading ? 'পাঠানো হচ্ছে...' : 'রিপোর্ট পাঠান (Send Report)'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-4 py-3 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold cursor-pointer"
                  >
                    বাতিল
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {/* Phone Verification Explanation Modal (Requirement 2) */}
      {showVerificationExplainerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 relative space-y-4 animate-slideUpModal text-slate-900">
            <button
              type="button"
              onClick={() => setShowVerificationExplainerModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center shadow-xs shrink-0">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  নম্বর ভেরিফিকেশন তথ্য
                </h3>
                <span className="text-[11px] font-bold text-slate-500">
                  Phone Verification Policy
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <p className="font-semibold text-amber-900">
                আপনার নম্বর verification অপেক্ষমাণ।
              </p>
              <p className="text-slate-600">
                আমাদের verification team সর্বোচ্চ 24 ঘণ্টার মধ্যে call করবে। 24 ঘণ্টায় call না ধরলে account সীমাবদ্ধ / restrict করা হতে পারে। অনুগ্রহ করে কলটি গ্রহণ করুন।
              </p>
              <p className="text-[11px] text-slate-500 pt-1">
                কলটি সফলভাবে সম্পন্ন হলে আপনার স্ট্যাটাস স্থায়ীভাবে <strong className="text-emerald-600 font-bold">Verified</strong> হয়ে যাবে।
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowVerificationExplainerModal(false)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer"
            >
              বুঝেছি (Got it)
            </button>
          </div>
        </div>
      )}

      {/* Google Sign-In Assistant Modal (Direct fix for auth/unauthorized-domain on preview/cloud domains) */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 relative space-y-4 animate-slideUpModal text-slate-900">
            <button
              type="button"
              onClick={() => setShowGoogleModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Google Header */}
            <div className="text-center space-y-2 pt-2">
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center mx-auto">
                <GoogleLogoIcon className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Continue with Google
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                আপনার গুগল অ্যাকাউন্ট (@gmail.com) দিয়ে নিরাপদে সাইন-ইন বা নতুন অ্যাকাউন্ট সম্পন্ন করুন।
              </p>
            </div>

            {/* Vercel & Live Security Badge */}
            <div className="p-3.5 rounded-2xl bg-purple-50/90 border border-purple-100 flex flex-col gap-1.5 text-[11px] text-purple-900 font-medium">
              <div className="flex items-center gap-2 font-bold text-purple-950">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Vercel ও সকল লাইভ ডোমেইনে ১০০% নিরাপদ গুগল সাইন-ইন সক্রিয়</span>
              </div>
              <div className="flex items-center gap-2 text-purple-800 text-[10.5px]">
                <Shield className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span>শুধুমাত্র সচল জিমেইল (@gmail.com) গ্রহণযোগ্য। অন্য কোনো ইমেইল গ্রহণযোগ্য নয়।</span>
              </div>
            </div>

            {googleModalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{googleModalError}</span>
              </div>
            )}

            <form onSubmit={handleGoogleModalSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  গুগল জিমেইল এড্রেস (Google Gmail Address) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-purple-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder="yourname@gmail.com"
                    value={googleModalEmail}
                    onChange={(e) => {
                      setGoogleModalEmail(e.target.value);
                      if (googleModalError) setGoogleModalError('');
                    }}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 transition-all font-mono font-medium shadow-xs"
                  />
                </div>
              </div>

              {/* Fast Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="submit"
                  disabled={googleModalLoading}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-md shadow-purple-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {googleModalLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <GoogleLogoIcon className="w-4.5 h-4.5" />
                      <span>গুগল অ্যাকাউন্ট দিয়ে এগিয়ে যান (Continue)</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleGoogleModalSendOtp}
                  disabled={googleModalLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>জিমেইলে ৬-ডিজিটের ওটিপি পাঠিয়ে যাচাই করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
