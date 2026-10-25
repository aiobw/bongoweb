export type WebsiteCategory = 
  | 'ecommerce' 
  | 'restaurant' 
  | 'landing' 
  | 'grocery' 
  | 'portfolio' 
  | 'newspaper' 
  | 'education' 
  | 'services'
  | 'blogging'
  | 'corporate'
  | 'all';

export type SubscriptionPlanId = 'starter' | 'pro' | 'enterprise' | 'custom';
export type WizardStep = 1 | 2 | 3 | 4 | number;

export interface WebsiteDemoItem {
  name: string;
  price: string;
  tag?: string;
  image: string;
}

export interface WebsiteDemoMockData {
  heroSub: string;
  items: WebsiteDemoItem[];
}

export interface WebsiteDemo {
  id: string;
  fourDigitCode: string;
  title: string;
  englishTitle?: string;
  banglaTitle?: string;
  category: WebsiteCategory;
  categoryLabel?: string;
  description: string;
  priceTag: string;
  demoUrl: string;
  badge?: string;
  accentColor?: string;
  rating?: number;
  ordersCount?: string;
  previewImage: string;
  heroHeadline?: string;
  features?: string[];
  mockData?: WebsiteDemoMockData;
  [key: string]: any;
}

export interface UserAccount {
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
  password?: string;
  ordersCount?: number;
  activeOrdersCount?: number;
  deliveredCount?: number;
  registeredAt?: number | string;
  role?: 'user' | 'admin' | string;
  isBlocked?: boolean;
  isRestricted?: boolean;
  verificationStatus?: 'verified' | 'unverified' | string;
  otpCode?: string;
  otpExpiresAt?: number;
  [key: string]: any;
}

export interface WebsiteDeliveryCredentials {
  id?: string;
  orderId?: string;
  orderNumber?: string;
  websiteTitle?: string;
  websiteCode?: string;
  customerPhone?: string;
  customerEmail?: string;
  userPhone?: string;
  userEmail?: string;
  liveUrl?: string;
  adminUrl?: string;
  adminUsername?: string;
  adminPassword?: string;
  websiteAdminId?: string;
  websiteAdminPass?: string;
  cpanelUrl?: string;
  cpanelUsername?: string;
  cpanelPassword?: string;
  deliveredAt?: number | string;
  deliveryNotes?: string;
  notes?: string;
  updatedAt?: number | string;
  [key: string]: any;
}

export interface ClientOrder {
  id?: string;
  orderId?: string;
  orderNumber?: string;
  customerName?: string;
  clientName?: string;
  customerPhone?: string;
  phone?: string;
  customerEmail?: string;
  email?: string;
  websiteId?: string;
  websiteTitle?: string;
  websiteCategory?: WebsiteCategory | string;
  websiteCode?: string;
  demoCode?: string;
  totalAmount?: string;
  packagePrice?: string;
  status?: 'pending' | 'in_progress' | 'delivered' | 'cancelled' | string;
  orderDate?: string;
  createdAt?: number | string;
  domainName?: string;
  paymentMethod?: string;
  paymentStatus?: 'paid' | 'pending' | string;
  trxId?: string;
  notes?: string;
  credentialsDelivered?: boolean;
  credentials?: WebsiteDeliveryCredentials;
  deliveryTimeEst?: string;
  [key: string]: any;
}

export interface PasswordResetRequest {
  id?: string;
  phone?: string;
  email?: string;
  requestedAt?: number | string;
  resolved?: boolean;
  resolvedAt?: number | string;
  status?: 'pending' | 'reset' | 'approved' | 'rejected' | string;
  newPasswordAssigned?: string;
  approvedAt?: number | string;
  [key: string]: any;
}

export interface AdminConfig {
  adminId?: string;
  adminEntryPassword?: string;
  adminActionPassword?: string;
  masterKey?: string;
  [key: string]: any;
}

export interface SupportChatMessage {
  id?: string;
  sender?: 'user' | 'admin' | 'system' | 'client' | string;
  text?: string;
  timestamp?: number | string;
  read?: boolean;
  attachmentUrl?: string;
  audioUrl?: string;
  [key: string]: any;
}

export interface SupportChatThread {
  id?: string;
  userName?: string;
  userPhone?: string;
  userEmail?: string;
  messages?: SupportChatMessage[];
  status?: 'active' | 'closed' | string;
  createdAt?: number | string;
  updatedAt?: number | string;
  unreadByAdmin?: boolean;
  unreadByUser?: boolean;
  expiresAt?: number;
  [key: string]: any;
}

export interface UserReport {
  id?: string;
  customerName?: string;
  customerPhone?: string;
  category?: string;
  message?: string;
  status?: 'pending' | 'reviewed' | 'resolved' | 'in_progress' | string;
  createdAt?: number | string;
  adminReply?: string;
  adminRepliedAt?: number | string;
  [key: string]: any;
}

export interface BrandLogoConfig {
  logoUrl?: string;
  imageUrl?: string;
  textTitle?: string;
  subText?: string;
  showIcon?: boolean;
  logoType?: string;
  updatedAt?: number | string;
  customDimensions?: { width: number; height: number };
  [key: string]: any;
}

export interface EmailRecoveryRequest {
  id?: string;
  phone?: string;
  oldEmail?: string;
  newEmail?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'completed' | string;
  requestedAt?: number | string;
  createdAt?: number | string;
  approvedAt?: number | string;
  decisionAt?: number | string;
  decisionNote?: string;
  [key: string]: any;
}

export interface CallBackRequest {
  id?: string;
  name?: string;
  phone?: string;
  reason?: string;
  preferredTime?: string;
  status?: 'pending' | 'approved' | 'rejected' | string;
  requestedAt?: number | string;
  createdAt?: number | string;
  approvedAt?: number | string;
  rejectedAt?: number | string;
  [key: string]: any;
}

export interface PhotoMockup {
  id?: string;
  title?: string;
  imageUrl?: string;
  category?: string;
  [key: string]: any;
}
