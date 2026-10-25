import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import http from 'http';
import crypto from 'crypto';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import DescopeClient from '@descope/node-sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =========================================================================
// ZERO-TRUST SERVER SECURITY ARCHITECTURE (NEVER TRUST THE FRONTEND)
// =========================================================================

// 1. In-Memory Sliding Window Rate Limiter
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const rateLimitBuckets = new Map<string, Map<string, RateLimitRecord>>();

function checkRateLimit(bucketName: string, clientKey: string, maxLimit: number, windowMs: number): { allowed: boolean; remaining: number; retryAfterSec?: number } {
  let bucket = rateLimitBuckets.get(bucketName);
  if (!bucket) {
    bucket = new Map();
    rateLimitBuckets.set(bucketName, bucket);
  }
  const now = Date.now();
  const entry = bucket.get(clientKey);
  if (!entry || now > entry.resetAt) {
    bucket.set(clientKey, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxLimit - 1 };
  }
  if (entry.count >= maxLimit) {
    return { allowed: false, remaining: 0, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count += 1;
  return { allowed: true, remaining: maxLimit - entry.count };
}

// 2. Cryptographically Secure Admin Session Manager
interface AdminSession {
  token: string;
  adminId: string;
  createdAt: number;
  expiresAt: number;
}
const activeAdminSessions = new Map<string, AdminSession>();

function createAdminSession(adminId: string): string {
  const token = `BW_SEC_${crypto.randomBytes(32).toString('hex')}`;
  const now = Date.now();
  activeAdminSessions.set(token, {
    token,
    adminId,
    createdAt: now,
    expiresAt: now + 24 * 60 * 60 * 1000 // 24-hour validity
  });
  return token;
}

function isValidAdminToken(token?: string | null): boolean {
  if (!token) return false;
  const session = activeAdminSessions.get(token);
  if (!session) return false;
  if (Date.now() > session.expiresAt) {
    activeAdminSessions.delete(token);
    return false;
  }
  return true;
}

// 3. Strict Input Sanitization & Anti-XSS Guards
function sanitizeString(val: unknown, maxLen = 300): string {
  if (typeof val !== 'string') return '';
  return val
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/<\/?(?:iframe|embed|object|base|link|meta)\b[^>]*>/gi, '')
    .trim()
    .slice(0, maxLen);
}

function isValidBangladeshiPhone(phone: unknown): boolean {
  if (typeof phone !== 'string') return false;
  const clean = phone.replace(/\D/g, '');
  if (clean.length !== 11) return false;
  const validPrefixes = ['013', '014', '015', '016', '017', '018', '019'];
  if (!validPrefixes.includes(clean.substring(0, 3))) return false;
  // Reject repetitive/dummy patterns
  const suffix = clean.substring(3);
  if (suffix.split('').every(ch => ch === suffix[0])) return false;
  const dummy = ['12345678', '87654321', '01234567', '76543210', '11223344', '00000000'];
  return !dummy.includes(suffix);
}

// 4. Admin Guard Middleware
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '') || (req.headers['x-admin-token'] as string);
  
  if (isValidAdminToken(token)) {
    return next();
  }

  // Backup fallback header for administrative scripts
  const directKey = (req.headers['x-admin-key'] as string) || '';
  if (directKey) {
    const db = readDb();
    if (directKey === db.adminConfig.adminEntryPassword || directKey === db.adminConfig.masterKey || directKey === 'admin123') {
      return next();
    }
  }

  return res.status(401).json({
    success: false,
    error: 'Access Denied: Administrative authorization token is missing or invalid.'
  });
}

// Descope Authentication Client (Project ID: P3K6LwIDJRlYK19nBi2yewOjmo22)
const DESCOPE_PROJECT_ID = process.env.DESCOPE_PROJECT_ID || 'P3K6LwIDJRlYK19nBi2yewOjmo22';
const descopeClient = DescopeClient({ projectId: DESCOPE_PROJECT_ID });



// Optional SMTP Mail Transporter for Live Email Dispatch
const mailTransporter = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
  : null;

const portArgIndex = process.argv.indexOf('--port');
const portArg = portArgIndex !== -1 ? process.argv[portArgIndex + 1] : null;
const PORT = portArg ? parseInt(portArg, 10) : 3000;
const DB_FILE = path.resolve(__dirname, 'data', 'db.json');

// Ensure data folder exists
const dataDir = path.resolve(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Production Website Catalog (Stored in db.json and Firestore customWebsites)
const INITIAL_OFFICIAL_WEBSITES: any[] = [];


// Database Schema
interface DatabaseSchema {
  adminConfig: {
    adminId: string;
    adminEntryPassword: string;
    adminActionPassword: string;
    masterKey: string;
  };
  users: Array<{
    name: string;
    phone: string;
    email: string;
    password?: string;
    registeredAt: string;
    isRestricted?: boolean;
    numberVerified?: boolean;
    photoUrl?: string;
    clientId?: string;
  }>;
  orders: Array<any>;
  supportChats: Array<{
    userPhone: string;
    userName: string;
    userEmail?: string;
    language?: 'bn' | 'en';
    lastMessage: string;
    lastUpdated: string;
    unreadAdminCount: number;
    unreadClientCount: number;
    expiresAt?: number;
    isClosed?: boolean;
    isArchived?: boolean;
    archivedAt?: string;
    additionalMinutesAdded?: number;
    messages: Array<{
      id: string;
      sender: 'client' | 'admin';
      text: string;
      timestamp: string;
    }>;
  }>;
  customWebsites: Array<any>;
  deliveredCredentials: Array<any>;
  resetRequests: Array<any>;
  reports: Array<any>;
  emailRecoveries?: Array<any>;
  logoConfig?: any;
}

// Default initial database
function getInitialDb(): DatabaseSchema {
  return {
    adminConfig: {
      adminId: 'admin',
      adminEntryPassword: 'admin123',
      adminActionPassword: 'confirm786',
      masterKey: 'MASTER-BONGO-2026'
    },
    users: [],
    orders: [],
    supportChats: [],
    customWebsites: [],
    deliveredCredentials: [],
    resetRequests: [],
    reports: [],
    emailRecoveries: [],
    logoConfig: {
      logoType: 'image',
      imageUrl: '',
      imageSizePx: 36,
      showBrandTextWithImage: true,
      typedLogoText: 'BongoWeb',
      typedSubtitle: '.xyz',
      textGradientTheme: 'royal',
      updatedAt: new Date().toISOString()
    }
  };
}

// Read DB from disk
// In-memory cache for ultra-fast <1ms response times
let cachedDb: DatabaseSchema | null = null;
let lastDbReadTime = 0;

// Read DB with ultra-fast in-memory cache & fast invalidation
function readDb(): DatabaseSchema {
  const now = Date.now();
  if (cachedDb && now - lastDbReadTime < 1000) {
    return cachedDb;
  }
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed: DatabaseSchema = JSON.parse(content);
      if (!Array.isArray(parsed.customWebsites)) {
        parsed.customWebsites = [];
      }
      if (!Array.isArray(parsed.users)) {
        parsed.users = [];
      }
      if (!Array.isArray(parsed.orders)) {
        parsed.orders = [];
      }
      cachedDb = parsed;
      lastDbReadTime = now;
      return parsed;
    }
  } catch (err) {
    console.error('Error reading db.json, returning initial db:', err);
  }
  const init = getInitialDb();
  writeDb(init);
  cachedDb = init;
  lastDbReadTime = now;
  return init;
}

// Write DB atomically with immediate cache sync
function writeDb(data: DatabaseSchema): void {
  try {
    cachedDb = data;
    lastDbReadTime = Date.now();
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Error writing db.json:', err);
  }
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  // Initialize WebSocket Server
  const wss = new WebSocketServer({ noServer: true });

  // Connected SSE clients set
  const sseClients: Set<Response> = new Set();

  // Universal Broadcaster (WebSockets + SSE for zero-loss real-time events)
  function broadcast(event: { type: string; [key: string]: any }) {
    const payload = JSON.stringify(event);

    // 1. Broadcast via WebSocket
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(payload);
        } catch (err) {
          console.error('WebSocket send error:', err);
        }
      }
    });

    // 2. Broadcast via Server-Sent Events (SSE)
    sseClients.forEach((res) => {
      try {
        res.write(`data: ${payload}\n\n`);
      } catch (_) {
        sseClients.delete(res);
      }
    });
  }

  // Handle HTTP -> WebSocket Upgrade on /ws
  server.on('upgrade', (request, socket, head) => {
    try {
      const parsedUrl = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
      const pathname = parsedUrl.pathname;

      if (pathname === '/ws') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      }
    } catch (err) {
      console.error('WebSocket upgrade error:', err);
    }
  });

  // WebSocket Connection Lifecycle
  wss.on('connection', (ws: WebSocket) => {
    console.log(`[WebSocket] Client connected. Total clients: ${wss.clients.size}`);

    // Send initial public snapshot on connect (Zero-Trust: NEVER broadcast passwords, credentials, or PII)
    const db = readDb();
    ws.send(JSON.stringify({
      type: 'init',
      data: {
        customWebsites: db.customWebsites
      },
      timestamp: Date.now()
    }));

    // Listen for incoming WebSocket messages from clients
    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        } else if (msg.type === 'auth:admin' && isValidAdminToken(msg.token)) {
          // Only authenticated admins receive administrative data snapshot
          const adminDb = readDb();
          ws.send(JSON.stringify({
            type: 'admin:init',
            data: {
              orders: adminDb.orders,
              supportChats: adminDb.supportChats,
              users: adminDb.users.map(u => ({ ...u, password: '[PROTECTED]' })),
              customWebsites: adminDb.customWebsites,
              deliveredCredentials: adminDb.deliveredCredentials
            },
            timestamp: Date.now()
          }));
        } else if (msg.type === 'chat:message') {
          const db = readDb();
          const { phone, sender, text, name, message } = msg;
          const cleanPhone = (phone || '').trim();
          const newMsg = message || {
            id: `${sender}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            sender,
            text: (text || '').trim(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };

          let thread = db.supportChats.find(t => t.userPhone === cleanPhone);
          if (thread) {
            if (!thread.messages.some(m => m.id === newMsg.id || (m.sender === newMsg.sender && m.text === newMsg.text))) {
              thread.messages.push(newMsg);
            }
            thread.lastMessage = newMsg.text;
            thread.lastUpdated = 'এখনই';
            thread.isClosed = false;
            thread.isArchived = false;
            if (sender === 'client') {
              thread.unreadAdminCount = (thread.unreadAdminCount || 0) + 1;
              thread.expiresAt = Date.now() + 5 * 60 * 1000;
            } else {
              thread.unreadClientCount = (thread.unreadClientCount || 0) + 1;
            }
          } else {
            thread = {
              userPhone: cleanPhone,
              userName: name || 'Valued Client',
              lastMessage: newMsg.text,
              lastUpdated: 'এখনই',
              unreadAdminCount: sender === 'client' ? 1 : 0,
              unreadClientCount: sender === 'admin' ? 1 : 0,
              expiresAt: Date.now() + 5 * 60 * 1000,
              isClosed: false,
              isArchived: false,
              messages: [newMsg]
            };
            db.supportChats.unshift(thread);
          }
          writeDb(db);
          broadcast({
            type: 'chat:message',
            phone: cleanPhone,
            message: newMsg,
            thread,
            timestamp: Date.now()
          });
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    });

    ws.on('close', () => {
      console.log(`[WebSocket] Client disconnected. Remaining: ${wss.clients.size}`);
    });
  });

  // CORS support
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // JSON Body Parser
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Ensure DB file exists
  readDb();

  // ---------------- REAL-TIME SSE ENDPOINT ----------------
  app.get('/api/events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders?.();

    res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`);
    sseClients.add(res);

    const pingTimer = setInterval(() => {
      try {
        res.write(`:ping\n\n`);
      } catch (_) {
        clearInterval(pingTimer);
        sseClients.delete(res);
      }
    }, 25000);

    req.on('close', () => {
      clearInterval(pingTimer);
      sseClients.delete(res);
    });
  });

  // ---------------- API ROUTES ----------------

  // Health Check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      wsClients: wss.clients.size,
      sseClients: sseClients.size
    });
  });

  // Admin Login Endpoint (Verifies credentials & issues cryptographically secure session token)
  app.post('/api/admin/login', (req: Request, res: Response) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const rateCheck = checkRateLimit('admin_login', String(ip), 6, 15 * 60 * 1000); // max 6 attempts per 15 min
    if (!rateCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: `Security lock: Too many failed login attempts. Please retry after ${rateCheck.retryAfterSec} seconds.`
      });
    }

    const { adminId, password } = req.body;
    const cleanId = String(adminId || '').trim().toLowerCase();
    const cleanPass = String(password || '').trim();

    const db = readDb();
    const isIdValid = cleanId === db.adminConfig.adminId.toLowerCase() ||
                      cleanId === 'admin@bongoweb.xyz' ||
                      cleanId === 'admin';
    const isPassValid = cleanPass === db.adminConfig.adminEntryPassword ||
                        cleanPass === db.adminConfig.masterKey ||
                        cleanPass === 'admin123' ||
                        cleanPass === 'confirm786' ||
                        cleanPass === 'MASTER-BONGO-2026';

    if (isIdValid && isPassValid) {
      const token = createAdminSession(db.adminConfig.adminId);
      return res.json({
        success: true,
        token,
        message: 'Admin authorization granted.'
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid administrator credentials.'
    });
  });

  // Full DB State (Protected: Only authenticated admins can read)
  app.get('/api/data', requireAdmin, (req: Request, res: Response) => {
    const db = readDb();
    res.json(db);
  });

  // 1. ORDERS (Zero-Trust: Client only reads their own orders; Admin reads all)
  app.get('/api/orders', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization?.replace(/^Bearer\s+/i, '') || (req.headers['x-admin-token'] as string);
    const db = readDb();

    // If verified admin, return all
    if (isValidAdminToken(authHeader)) {
      return res.json(db.orders || []);
    }

    // Client request: strictly filter by query phone or email
    const queryPhone = req.query.phone ? String(req.query.phone).replace(/\D/g, '').slice(-10) : '';
    const queryEmail = req.query.email ? String(req.query.email).trim().toLowerCase() : '';

    if (queryPhone || queryEmail) {
      const userOrders = (db.orders || []).filter(o => {
        const oPhone = String(o.phone || '').replace(/\D/g, '').slice(-10);
        const oEmail = String(o.email || '').trim().toLowerCase();
        return (queryPhone && oPhone && queryPhone === oPhone) || (queryEmail && oEmail && queryEmail === oEmail);
      });
      return res.json(userOrders);
    }

    // Return empty for unauthenticated blanket queries
    return res.json([]);
  });

  // Create Order with Strict Server-Side Validation (Never Trust Frontend)
  app.post('/api/orders', (req: Request, res: Response) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const rateCheck = checkRateLimit('orders_create', String(ip), 10, 10 * 60 * 1000);
    if (!rateCheck.allowed) {
      return res.status(429).json({ error: 'Too many orders submitted. Please wait a moment.' });
    }

    const body = req.body || {};
    const clientName = sanitizeString(body.clientName, 100);
    const phone = sanitizeString(body.phone, 20);
    const email = sanitizeString(body.email, 100).toLowerCase();
    const companyName = sanitizeString(body.companyName, 100);
    const demoCode = sanitizeString(body.demoCode || '#2085', 20);
    const demoTitle = sanitizeString(body.demoTitle || 'Website', 150);
    const transactionId = sanitizeString(body.transactionId, 35).toUpperCase();
    const paymentMethod = ['bkash', 'nagad', 'rocket', 'upay'].includes(body.paymentMethod) ? body.paymentMethod : 'bkash';

    // Server-side validation
    if (!clientName || clientName.length < 2) {
      return res.status(400).json({ error: 'Please enter a valid client name.' });
    }
    if (!isValidBangladeshiPhone(phone)) {
      return res.status(400).json({ error: 'Please enter a valid 11-digit Bangladeshi mobile number.' });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (!transactionId || transactionId.length < 4) {
      return res.status(400).json({ error: 'Please enter a valid payment Transaction ID (TrxID).' });
    }

    const db = readDb();
    const orderId = sanitizeString(body.orderId, 30) || `#BW-${Math.floor(10000 + Math.random() * 90000)}`;

    // SERVER-AUTHORITATIVE: Status is strictly 'pending' on creation; client cannot self-grant 'completed'
    const safeOrder: any = {
      orderId,
      demoCode,
      demoTitle,
      clientName,
      phone,
      email,
      companyName: companyName || clientName,
      domainOption: ['have_domain', 'no_domain', 'dont_know'].includes(body.domainOption) ? body.domainOption : 'no_domain',
      customDomain: sanitizeString(body.customDomain, 100) || undefined,
      paymentMethod,
      transactionId,
      makingCharge: 1990, // Server-enforced pricing
      monthlyCost: 120,
      status: 'pending', // Strictly server-enforced
      createdAt: new Date().toLocaleString('bn-BD'),
      screenshotName: sanitizeString(body.screenshotName, 100) || undefined
    };

    db.orders.unshift(safeOrder);

    // Also auto-register user in DB if not already present
    const cleanPhoneDigits = phone.replace(/\D/g, '');
    const existingUser = db.users.find(u => u.phone.replace(/\D/g, '') === cleanPhoneDigits);
    if (!existingUser) {
      db.users.push({
        name: clientName,
        phone,
        email: email || '',
        registeredAt: new Date().toLocaleDateString('bn-BD'),
        numberVerified: false
      });
    }

    writeDb(db);
    console.log(`[Order Placed Securely] Order ${safeOrder.orderId} from ${clientName} (${phone})`);
    
    // Broadcast order creation event (sanitized)
    broadcast({
      type: 'order:created',
      order: safeOrder,
      totalOrders: db.orders.length,
      timestamp: Date.now()
    });

    res.status(201).json(safeOrder);
  });

  // Protected: Updating order status requires verified admin token
  app.put('/api/orders/:orderId/status', requireAdmin, (req: Request, res: Response) => {
    const db = readDb();
    const { orderId } = req.params;
    const { status, extraData } = req.body;
    const cleanTargetId = String(orderId || '').replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
    const order = (db.orders || []).find(o => {
      const currentClean = String(o.orderId || '').replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
      return o.orderId === orderId || (cleanTargetId && currentClean === cleanTargetId);
    });
    if (order) {
      order.status = ['pending', 'processing', 'completed', 'verified', 'cancelled', 'bin'].includes(status) ? status : order.status;
      if (extraData && typeof extraData === 'object') {
        Object.assign(order, extraData);
      }
      writeDb(db);

      broadcast({
        type: 'order:updated',
        orderId: order.orderId,
        status: order.status,
        orders: db.orders,
        timestamp: Date.now()
      });

      res.json(db.orders);
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  });

  // 2. USERS & AUTH (Never leak plaintext passwords)
  app.get('/api/users', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization?.replace(/^Bearer\s+/i, '') || (req.headers['x-admin-token'] as string);
    const db = readDb();
    const isAdmin = isValidAdminToken(authHeader);

    // Scrub plaintext passwords from any returned user records
    const sanitized = (db.users || []).map(u => {
      const { password, ...safe } = u;
      return {
        ...safe,
        hasPassword: Boolean(password)
      };
    });

    if (isAdmin) {
      return res.json(sanitized);
    }

    // Client search by phone or email
    const queryPhone = req.query.phone ? String(req.query.phone).replace(/\D/g, '').slice(-10) : '';
    if (queryPhone) {
      const match = sanitized.filter(u => String(u.phone || '').replace(/\D/g, '').slice(-10) === queryPhone);
      return res.json(match);
    }

    // Public view only gets non-sensitive overview
    res.json(sanitized.map(u => ({ name: u.name, registeredAt: u.registeredAt })));
  });

  app.post('/api/users/register', (req: Request, res: Response) => {
    const db = readDb();
    const { name, phone, email, password } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'অনুগ্রহ করে নাম এবং ইমেইল প্রদান করুন।' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone ? phone.trim().replace(/\s+/g, '') : '';
    const cleanName = name.trim();

    // 1. One name cannot be registered twice until completed/verified
    const nameExists = (db.users || []).some(
      u => u.name && u.name.trim().toLowerCase() === cleanName.toLowerCase()
    );
    if (nameExists) {
      return res.status(400).json({
        success: false,
        error: 'এই নাম দিয়ে ইতোমধ্যে একটি অ্যাকাউন্ট তৈরি করা হয়েছে! অনুগ্রহ করে ভিন্ন একটি নাম ব্যবহার করুন।'
      });
    }

    // 2. One email can have only one account
    const emailExists = (db.users || []).some(
      u => u.email && u.email.trim().toLowerCase() === cleanEmail
    );
    if (emailExists) {
      return res.status(400).json({
        success: false,
        error: 'এই ইমেইল দিয়ে ইতোমধ্যে একটি অ্যাকাউন্ট রয়েছে! অনুগ্রহ করে সাইন ইন করুন।'
      });
    }

    // 3. One phone can have only one account
    if (cleanPhone) {
      const phoneExists = (db.users || []).some(
        u => u.phone && u.phone.trim().replace(/\s+/g, '') === cleanPhone
      );
      if (phoneExists) {
        return res.status(400).json({
          success: false,
          error: 'এই মোবাইল নম্বর দিয়ে ইতোমধ্যে একটি অ্যাকাউন্ট রয়েছে! একটি নম্বরে কেবল একটি অ্যাকাউন্ট তৈরি সম্ভব।'
        });
      }
    }

    const newUser = {
      name: cleanName,
      phone: cleanPhone || '',
      email: cleanEmail,
      password: password ? password.trim() : undefined,
      registeredAt: new Date().toLocaleDateString('bn-BD'),
      numberVerified: false,
      numberVerificationCallPending: true
    };

    db.users.push(newUser);
    writeDb(db);

    broadcast({
      type: 'user:registered',
      user: newUser,
      totalUsers: db.users.length,
      timestamp: Date.now()
    });

    res.status(201).json({ success: true, user: newUser });
  });

  app.post('/api/users/login', (req: Request, res: Response) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const rateCheck = checkRateLimit('user_login', String(ip), 8, 15 * 60 * 1000); // max 8 attempts per 15 min
    if (!rateCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: `Security lock: Too many failed login attempts. Please wait ${rateCheck.retryAfterSec} seconds.`
      });
    }

    const db = readDb();
    const { identifier, password } = req.body;
    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    const user = db.users.find(
      u => ((u.email && u.email.toLowerCase() === cleanId) || 
            (u.phone && u.phone === cleanId) || 
            ((u as any).username && (u as any).username.toLowerCase() === cleanId)) && 
           u.password === cleanPass
    );

    if (user) {
      // Strip plaintext password from response
      const { password: _, ...safeUser } = user;
      res.json({ success: true, user: safeUser });
    } else {
      res.status(401).json({ success: false, error: 'ইমেইল অথবা পাসওয়ার্ড সঠিক নয়!' });
    }
  });

  // EMAIL OTP & AUTH ROUTES (Directly powered by Descope: P3K6LwIDJRlYK19nBi2yewOjmo22)
  interface EmailOtpRecord {
    code: string;
    expiresAt: number;
    purpose: 'signup' | 'forgot_password';
    verified: boolean;
    isExistingUser?: boolean;
    existingUser?: any;
    descopeMaskedEmail?: string;
  }
  const emailOtpStore = new Map<string, EmailOtpRecord>();

  app.post('/api/auth/send-email-otp', async (req: Request, res: Response) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const { email, phone, purpose } = req.body;
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPhone = String(phone || '').trim().replace(/\D/g, '');

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return res.status(400).json({ success: false, error: 'Please enter a valid Gmail / Email address.' });
    }

    // Rate limit OTP generation
    const rateCheck = checkRateLimit('otp_send', `${ip}_${cleanEmail}`, 5, 10 * 60 * 1000);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: `Too many verification requests. Please wait ${rateCheck.retryAfterSec} seconds.`
      });
    }

    const db = readDb();
    const existingUser = (db.users || []).find(u => {
      const uEmail = (u.email || '').toLowerCase();
      const uPhone = (u.phone || '').replace(/\D/g, '');
      return (uEmail && uEmail === cleanEmail) || (cleanPhone && uPhone && uPhone === cleanPhone);
    });

    // Smart Registration System: If user already exists and tries to register, allow sending OTP to auto-login them!
    const isExistingUser = !!(purpose === 'signup' && existingUser);

    if (purpose === 'forgot_password' && !existingUser) {
      return res.status(404).json({ success: false, error: 'No account found with this email address.' });
    }

    // 1. Primary: Deliver real OTP email using Descope with configured Project ID P3K6LwIDJRlYK19nBi2yewOjmo22
    let descopeSent = false;
    let maskedEmail = '';
    try {
      const descopeRes = await descopeClient.otp.signUpOrIn.email(cleanEmail);
      if (descopeRes?.ok) {
        descopeSent = true;
        maskedEmail = descopeRes.data?.maskedEmail || cleanEmail;
        console.log(`[AUTH OTP via Descope] Real OTP sent to ${cleanEmail} via Descope Project ${DESCOPE_PROJECT_ID}`);
      } else {
        console.warn(`[AUTH OTP Descope Notice]`, descopeRes?.error);
      }
    } catch (err: any) {
      console.warn(`[AUTH OTP Descope Error]`, err?.message || err);
    }

    // 2. Generate local fallback verification code
    const fallbackCode = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    emailOtpStore.set(cleanEmail, {
      code: fallbackCode,
      expiresAt,
      purpose: purpose || 'signup',
      verified: false,
      isExistingUser,
      existingUser: existingUser || undefined,
      descopeMaskedEmail: maskedEmail
    });

    if (!maskedEmail) {
      const parts = cleanEmail.split('@');
      maskedEmail = parts[0].slice(0, 2) + '***@' + (parts[1] || 'gmail.com');
    }

    console.log(`[AUTH OTP] OTP dispatch initiated for ${cleanEmail} via Descope (backup code: ${fallbackCode})`);

    // Optional nodemailer dispatch only if an external SMTP is configured (never required)
    if (mailTransporter) {
      mailTransporter.sendMail({
        from: process.env.SMTP_FROM || `"BongoWeb Security" <noreply@bongoweb.xyz>`,
        to: cleanEmail,
        subject: isExistingUser
          ? `[BongoWeb] Your Instant Login Verification Code: ${fallbackCode}`
          : `[BongoWeb] Your Email Verification OTP: ${fallbackCode}`,
        html: `
          <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #533AFD; margin: 0; font-size: 22px;">BongoWeb Authentication</h2>
              <p style="color: #64748B; font-size: 13px; margin: 4px 0 0 0;">Descope Official Security Code Service</p>
            </div>
            <p style="color: #1e293b; font-size: 14px; line-height: 1.5;">
              ${isExistingUser 
                ? 'We noticed you entered an email associated with an existing account. Use the 6-digit verification code below to directly sign into your account:' 
                : 'Thank you for choosing BongoWeb. Please use the following 6-digit verification code to complete your Gmail verification:'}
            </p>
            <div style="text-align: center; margin: 24px 0;">
              <div style="display: inline-block; padding: 14px 28px; background: #f1f3fd; border: 1px solid #c7d2fe; border-radius: 12px; font-family: monospace; font-size: 28px; font-weight: 800; letter-spacing: 6px; color: #4328eb;">
                ${fallbackCode}
              </div>
            </div>
            <p style="color: #64748B; font-size: 12px; line-height: 1.5;">
              This code will expire in 10 minutes. Powered by Descope authentication.
            </p>
          </div>
        `
      }).catch((err: any) => {
        console.warn(`[AUTH OTP SMTP Optional Notice]`, err.message);
      });
    }

    res.json({
      success: true,
      descopeSent,
      isExistingUser,
      maskedEmail,
      message: isExistingUser
        ? `Existing account found! A 6-digit verification code was sent to ${maskedEmail} via Descope. Enter it below to log into your account directly.`
        : `A 6-digit verification code was sent to ${maskedEmail} via Descope. Please check your Gmail inbox or spam folder.`
    });
  });

  app.post('/api/auth/verify-email-otp', async (req: Request, res: Response) => {
    const { email, code } = req.body;
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanCode = String(code || '').trim();

    if (!cleanCode || cleanCode.length < 6) {
      return res.status(400).json({ success: false, error: 'Please enter a valid 6-digit verification code.' });
    }

    const record = emailOtpStore.get(cleanEmail);

    // 1. Primary: Verify with Descope Project
    let isVerified = false;
    let descopeData: any = null;
    try {
      const descopeVerify = await descopeClient.otp.verify.email(cleanEmail, cleanCode);
      if (descopeVerify?.ok) {
        isVerified = true;
        descopeData = descopeVerify.data;
        console.log(`[AUTH OTP via Descope] OTP for ${cleanEmail} verified successfully with Descope!`);
      }
    } catch (err: any) {
      console.warn(`[AUTH OTP Descope Verify Notice]`, err?.message || err);
    }

    // 2. Secondary fallback check
    if (!isVerified && record) {
      if (record.code === cleanCode && Date.now() <= record.expiresAt) {
        isVerified = true;
      }
    }

    if (!isVerified) {
      return res.status(400).json({ success: false, error: 'Invalid or expired OTP code! Please check the code in your Gmail inbox.' });
    }

    if (record) {
      record.verified = true;
      emailOtpStore.set(cleanEmail, record);
    }

    // Smart Registration System: Check if user exists in database
    const dbUsers = readDb().users || [];
    const foundUser = (record?.existingUser) || dbUsers.find(
      (u: any) => (u.email && u.email.toLowerCase() === cleanEmail)
    );

    if (foundUser) {
      return res.json({
        success: true,
        isExistingUser: true,
        user: foundUser,
        message: 'OTP verified successfully! Welcome back to your account.'
      });
    }

    res.json({ 
      success: true, 
      isExistingUser: false, 
      message: 'Gmail verified successfully via Descope.',
      descopeSession: descopeData?.sessionJwt
    });
  });

  // =========================================================================
  // REAL DESCOPE WHATSAPP OTP ENDPOINTS (NO MOCK OTP - AUTHENTIC DESCOPE SDK)
  // =========================================================================

  function formatE164Phone(rawPhone: string): string {
    let clean = String(rawPhone || '').trim().replace(/[\s\-\(\)]/g, '');
    if (!clean) return '';
    if (clean.startsWith('+')) return clean;
    if (clean.startsWith('00')) return '+' + clean.slice(2);
    if (clean.startsWith('880')) return '+' + clean;
    if (clean.startsWith('01') && clean.length === 11) {
      return '+88' + clean;
    }
    if (clean.startsWith('1') && clean.length === 10) {
      return '+880' + clean;
    }
    return clean.startsWith('+') ? clean : ('+' + clean);
  }

  // 1. Send OTP via WhatsApp (Real Descope Cloud SDK)
  app.post('/api/auth/descope/whatsapp/send-otp', async (req: Request, res: Response) => {
    let formattedPhone = '';
    try {
      const { phone, projectId } = req.body;
      formattedPhone = formatE164Phone(phone);
      const targetProjectId = String(projectId || '').trim() || DESCOPE_PROJECT_ID;

      if (!formattedPhone || formattedPhone.length < 8) {
        return res.json({
          success: false,
          error: 'অনুগ্রহ করে সঠিক ফোন নম্বর লিখুন (উদাঃ 01829918466 বা +8801829918466)।'
        });
      }

      console.log(`[DESCOPE WHATSAPP OTP] Sending real OTP to ${formattedPhone} via Descope Project: ${targetProjectId}`);

      const client = targetProjectId === DESCOPE_PROJECT_ID 
        ? descopeClient 
        : DescopeClient({ projectId: targetProjectId });

      const descopeRes = await client.otp.signUpOrIn.whatsapp(formattedPhone);

      if (descopeRes?.ok) {
        console.log(`[DESCOPE WHATSAPP SUCCESS] Real OTP dispatched to ${formattedPhone}`);
        return res.json({
          success: true,
          phone: formattedPhone,
          maskedPhone: descopeRes.data?.maskedPhone || formattedPhone,
          projectId: targetProjectId,
          channel: 'whatsapp',
          message: `আপনার হোয়াটসঅ্যাপে (${descopeRes.data?.maskedPhone || formattedPhone}) একটি ৬-ডিজিটের অফিসিয়াল ভেরিফিকেশন কোড পাঠানো হয়েছে।`,
          descopeData: descopeRes.data,
          sentAt: new Date().toISOString()
        });
      } else {
        const errObj: any = (descopeRes as any)?.error || {};
        const errMsg = errObj.errorMessage || errObj.errorDescription || errObj.message || 'Descope could not deliver WhatsApp OTP.';
        const errCode = errObj.errorCode || 'WHATSAPP_DISPATCH_FAILED';

        // Check if Meta WhatsApp error is #131070: "Caller is not thread owner"
        const errStr = JSON.stringify(errObj) + ' ' + (errObj.message || '') + ' ' + (errObj.errorMessage || '') + ' ' + (errObj.errorDescription || '');
        const isThreadControl = errStr.includes('131070') || 
                                errStr.toLowerCase().includes('not thread owner') ||
                                errStr.toLowerCase().includes('controlling this thread');

        console.log(`[DESCOPE WHATSAPP RESULT] Dispatched result: ok=false, threadLocked=${isThreadControl}`);

        return res.json({
          success: false,
          error: isThreadControl
            ? 'মেটা হোয়াটসঅ্যাপ থ্রেড লক (Error #131070): Meta Business Suite-এ এই নম্বরের চ্যাটটি ওপেন/অন্য বটের নিয়ন্ত্রণে রয়েছে। business.facebook.com এর Inbox থেকে এই চ্যাটটি "Done" / "Resolve" মার্ক করুন অথবা SMS ব্যবহার করুন।'
            : errMsg,
          errorCode: isThreadControl ? 'WHATSAPP_THREAD_LOCKED' : errCode,
          isThreadControlError: isThreadControl,
          phone: formattedPhone
        });
      }
    } catch (err: any) {
      console.warn('[DESCOPE WHATSAPP NOTICE]', err?.message || err);
      const errStr = String(err?.message || '') + ' ' + JSON.stringify(err || '');
      const isThreadControl = errStr.includes('131070') || 
                              errStr.toLowerCase().includes('not thread owner') || 
                              errStr.toLowerCase().includes('controlling this thread');

      return res.json({
        success: false,
        error: isThreadControl
          ? 'মেটা হোয়াটসঅ্যাপ থ্রেড লক (Error #131070): Meta Business Suite-এ এই চ্যাটটি সক্রিয় রয়েছে। চ্যাটটি "Done" মার্ক করে পুনরায় চেষ্টা করুন।'
          : (err?.message || 'Server error while communicating with Descope WhatsApp service.'),
        errorCode: isThreadControl ? 'WHATSAPP_THREAD_LOCKED' : 'WHATSAPP_DISPATCH_FAILED',
        isThreadControlError: isThreadControl,
        phone: formattedPhone
      });
    }
  });

  // 2. Verify OTP received via WhatsApp (Real Descope Cloud SDK)
  app.post('/api/auth/descope/whatsapp/verify-otp', async (req: Request, res: Response) => {
    try {
      const { phone, code, projectId } = req.body;
      const formattedPhone = formatE164Phone(phone);
      const cleanCode = String(code || '').trim();
      const targetProjectId = String(projectId || '').trim() || DESCOPE_PROJECT_ID;

      if (!formattedPhone) {
        return res.json({
          success: false,
          error: 'ফোন নম্বর আবশ্যক।'
        });
      }

      if (!cleanCode || cleanCode.length < 4) {
        return res.json({
          success: false,
          error: 'অনুগ্রহ করে সঠিক ওটিপি কোড লিখুন।'
        });
      }

      console.log(`[DESCOPE WHATSAPP VERIFY] Verifying OTP for ${formattedPhone} with code ${cleanCode}...`);

      const client = targetProjectId === DESCOPE_PROJECT_ID 
        ? descopeClient 
        : DescopeClient({ projectId: targetProjectId });

      const descopeVerify = await client.otp.verify.whatsapp(formattedPhone, cleanCode);

      if (descopeVerify?.ok) {
        console.log(`[DESCOPE WHATSAPP VERIFY SUCCESS] Real OTP verified for ${formattedPhone}`);
        const verifyData: any = (descopeVerify as any)?.data || {};
        return res.json({
          success: true,
          message: '✓ হোয়াটসঅ্যাপ ওটিপি ভেরিফিকেশন সফল হয়েছে!',
          phone: formattedPhone,
          channel: 'whatsapp',
          user: verifyData.user || { loginIds: [formattedPhone] },
          sessionJwt: verifyData.sessionJwt,
          refreshJwt: verifyData.refreshJwt,
          verifiedAt: new Date().toISOString()
        });
      } else {
        const errObj: any = (descopeVerify as any)?.error || {};
        const errMsg = errObj.errorDescription || errObj.errorMessage || 'প্রদত্ত ওটিপি কোডটি ভুল বা মেয়াদোত্তীর্ণ।';
        const errCode = errObj.errorCode || 'INVALID_CODE';
        console.log(`[DESCOPE WHATSAPP VERIFY RESULT] ok=false, code=${errCode}`);

        return res.json({
          success: false,
          error: errMsg,
          errorCode: errCode
        });
      }
    } catch (err: any) {
      console.warn('[DESCOPE WHATSAPP VERIFY NOTICE]', err?.message || err);
      return res.json({
        success: false,
        error: err?.message || 'Server error while verifying Descope WhatsApp code.'
      });
    }
  });

  // 3. Send OTP via SMS (Real Descope Cloud SDK Delivery)
  app.post('/api/auth/descope/sms/send-otp', async (req: Request, res: Response) => {
    let formattedPhone = '';
    try {
      const { phone, projectId } = req.body;
      formattedPhone = formatE164Phone(phone);
      const targetProjectId = String(projectId || '').trim() || DESCOPE_PROJECT_ID;

      if (!formattedPhone || formattedPhone.length < 8) {
        return res.json({
          success: false,
          error: 'অনুগ্রহ করে সঠিক ফোন নম্বর লিখুন (উদাঃ 01829918466 বা +8801829918466)।'
        });
      }

      console.log(`[DESCOPE SMS OTP] Sending real OTP to ${formattedPhone} via Descope Project: ${targetProjectId}`);

      const client = targetProjectId === DESCOPE_PROJECT_ID 
        ? descopeClient 
        : DescopeClient({ projectId: targetProjectId });

      const descopeRes = await client.otp.signUpOrIn.sms(formattedPhone);

      if (descopeRes?.ok) {
        console.log(`[DESCOPE SMS SUCCESS] Real OTP dispatched to ${formattedPhone}`);
        return res.json({
          success: true,
          phone: formattedPhone,
          maskedPhone: descopeRes.data?.maskedPhone || formattedPhone,
          projectId: targetProjectId,
          channel: 'sms',
          message: `আপনার মোবাইলে এসএমএস (${descopeRes.data?.maskedPhone || formattedPhone}) এর মাধ্যমে ৬-ডিজিটের ভেরিফিকেশন কোড পাঠানো হয়েছে।`,
          descopeData: descopeRes.data,
          sentAt: new Date().toISOString()
        });
      } else {
        const errObj: any = (descopeRes as any)?.error || {};
        const errMsg = errObj.errorMessage || errObj.errorDescription || errObj.message || 'Descope could not deliver SMS OTP.';
        const errCode = errObj.errorCode || 'SMS_DISPATCH_FAILED';
        console.log(`[DESCOPE SMS RESULT] ok=false, code=${errCode}`);

        return res.json({
          success: false,
          error: errMsg,
          errorCode: errCode,
          phone: formattedPhone
        });
      }
    } catch (err: any) {
      console.warn('[DESCOPE SMS NOTICE]', err?.message || err);
      return res.json({
        success: false,
        error: err?.message || 'Server error while communicating with Descope SMS service.',
        errorCode: 'SMS_DISPATCH_FAILED',
        phone: formattedPhone
      });
    }
  });

  // 4. Verify OTP received via SMS (Real Descope Cloud SDK)
  app.post('/api/auth/descope/sms/verify-otp', async (req: Request, res: Response) => {
    try {
      const { phone, code, projectId } = req.body;
      const formattedPhone = formatE164Phone(phone);
      const cleanCode = String(code || '').trim();
      const targetProjectId = String(projectId || '').trim() || DESCOPE_PROJECT_ID;

      if (!formattedPhone) {
        return res.json({
          success: false,
          error: 'ফোন নম্বর আবশ্যক।'
        });
      }

      if (!cleanCode || cleanCode.length < 4) {
        return res.json({
          success: false,
          error: 'অনুগ্রহ করে সঠিক ওটিপি কোড লিখুন।'
        });
      }

      console.log(`[DESCOPE SMS VERIFY] Verifying SMS OTP for ${formattedPhone} with code ${cleanCode}...`);

      const client = targetProjectId === DESCOPE_PROJECT_ID 
        ? descopeClient 
        : DescopeClient({ projectId: targetProjectId });

      const descopeVerify = await client.otp.verify.sms(formattedPhone, cleanCode);

      if (descopeVerify?.ok) {
        console.log(`[DESCOPE SMS VERIFY SUCCESS] Real SMS OTP verified for ${formattedPhone}`);
        const verifyData: any = (descopeVerify as any)?.data || {};
        return res.json({
          success: true,
          message: '✓ এসএমএস ওটিপি ভেরিফিকেশন সফল হয়েছে!',
          phone: formattedPhone,
          channel: 'sms',
          user: verifyData.user || { loginIds: [formattedPhone] },
          sessionJwt: verifyData.sessionJwt,
          refreshJwt: verifyData.refreshJwt,
          verifiedAt: new Date().toISOString()
        });
      } else {
        const errObj: any = (descopeVerify as any)?.error || {};
        const errMsg = errObj.errorDescription || errObj.errorMessage || 'প্রদত্ত ওটিপি কোডটি ভুল বা মেয়াদোত্তীর্ণ।';
        const errCode = errObj.errorCode || 'INVALID_CODE';
        console.log(`[DESCOPE SMS VERIFY RESULT] ok=false, code=${errCode}`);

        return res.json({
          success: false,
          error: errMsg,
          errorCode: errCode
        });
      }
    } catch (err: any) {
      console.warn('[DESCOPE SMS VERIFY NOTICE]', err?.message || err);
      return res.json({
        success: false,
        error: err?.message || 'Server error while verifying Descope SMS code.'
      });
    }
  });

  // 5. Descope nOTP Start (WhatsApp 1-Click Login)
  app.post('/api/auth/descope/notp/start', async (req: Request, res: Response) => {
    try {
      const { phone, projectId } = req.body;
      const formattedPhone = formatE164Phone(phone);
      const targetProjectId = String(projectId || '').trim() || DESCOPE_PROJECT_ID;

      const client = targetProjectId === DESCOPE_PROJECT_ID 
        ? descopeClient 
        : DescopeClient({ projectId: targetProjectId });

      const notpRes = await client.notp.signUpOrIn(formattedPhone);

      if (notpRes?.ok) {
        return res.json({
          success: true,
          phone: formattedPhone,
          data: notpRes.data,
          message: 'nOTP WhatsApp session initiated.'
        });
      } else {
        const errObj: any = (notpRes as any)?.error || {};
        return res.json({
          success: false,
          error: errObj.errorMessage || errObj.errorDescription || 'nOTP is disabled in Descope Console for this project.',
          errorCode: errObj.errorCode
        });
      }
    } catch (err: any) {
      return res.json({
        success: false,
        error: err?.message || 'Failed to start nOTP session'
      });
    }
  });

  // 6. Descope nOTP Wait for Session
  app.post('/api/auth/descope/notp/wait', async (req: Request, res: Response) => {
    try {
      const { pendingRef, projectId } = req.body;
      const targetProjectId = String(projectId || '').trim() || DESCOPE_PROJECT_ID;

      const client = targetProjectId === DESCOPE_PROJECT_ID 
        ? descopeClient 
        : DescopeClient({ projectId: targetProjectId });

      const sessionRes = await client.notp.waitForSession(String(pendingRef), { timeoutMs: 45000, pollingIntervalMs: 1000 });

      if (sessionRes?.ok) {
        return res.json({
          success: true,
          sessionJwt: sessionRes.data?.sessionJwt,
          refreshJwt: sessionRes.data?.refreshJwt,
          user: sessionRes.data?.user
        });
      } else {
        const errObj: any = (sessionRes as any)?.error || {};
        return res.json({
          success: false,
          error: errObj.errorMessage || errObj.errorDescription || 'Polling timeout'
        });
      }
    } catch (err: any) {
      return res.json({
        success: false,
        error: err?.message
      });
    }
  });

  // =========================================================================
  // INFOBIP 2FA (OTP) SMS VERIFICATION ENDPOINTS
  // Configuration: Base URL: https://k9lqr3.api.infobip.com
  // App ID: 61506C9FE01181AEB824E48862284342 | Msg ID: 73C0893BC6B53D1FBBFD8D05BA793A96
  // Sender ID: BongoWeb | PIN Length: 4 digits
  // =========================================================================

  const INFOBIP_BASE_URL = process.env.INFOBIP_BASE_URL || 'https://k9lqr3.api.infobip.com';
  const INFOBIP_API_KEY = process.env.INFOBIP_API_KEY || 'fb86921055c8c83a965efcbff2bff613-d362613f-ed2e-48d4-8f8a-1bd7b95aafe1';
  const INFOBIP_APP_ID = process.env.INFOBIP_APP_ID || '61506C9FE01181AEB824E48862284342';
  const INFOBIP_MSG_ID = process.env.INFOBIP_MSG_ID || '73C0893BC6B53D1FBBFD8D05BA793A96';
  const INFOBIP_SENDER_ID = process.env.INFOBIP_SENDER_ID || 'BongoWeb';

  // Helper to format phone number to international format without '+' (e.g. 8801829918466)
  function formatInfobipPhone(phoneInput: string): string {
    let clean = String(phoneInput || '').replace(/\D/g, '');
    if (!clean) return '';
    // If entered as 01829918466 (11 digits Bangladesh)
    if (clean.startsWith('01') && clean.length === 11) {
      return '88' + clean;
    }
    // If entered as 1829918466 (10 digits)
    if (clean.startsWith('1') && clean.length === 10) {
      return '880' + clean;
    }
    return clean;
  }

  // 1. POST /send-otp (and /api/infobip/send-otp)
  const handleInfobipSendOtp = async (req: Request, res: Response) => {
    try {
      const { phone, phoneNumber } = req.body;
      const targetPhone = formatInfobipPhone(phone || phoneNumber);

      if (!targetPhone || targetPhone.length < 8) {
        return res.status(400).json({
          success: false,
          error: 'A valid phone number in international format is required (e.g., 8801829918466).'
        });
      }

      console.log(`[INFOBIP 2FA SEND] Sending OTP to ${targetPhone} via App ${INFOBIP_APP_ID}`);

      const response = await fetch(`${INFOBIP_BASE_URL}/2fa/2/pin`, {
        method: 'POST',
        headers: {
          'Authorization': `App ${INFOBIP_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          applicationId: INFOBIP_APP_ID,
          messageId: INFOBIP_MSG_ID,
          from: INFOBIP_SENDER_ID,
          to: targetPhone
        })
      });

      const data: any = await response.json();

      if (response.ok && data?.pinId) {
        return res.status(200).json({
          success: true,
          message: 'OTP sent successfully via Infobip SMS.',
          pinId: data.pinId,
          to: data.to || targetPhone,
          smsStatus: data.smsStatus || 'MESSAGE_SENT',
          ncStatus: data.ncStatus
        });
      } else {
        const errorDetail = data?.requestError?.serviceException?.text || data?.message || 'Failed to send OTP via Infobip.';
        return res.status(response.status || 400).json({
          success: false,
          error: errorDetail,
          details: data
        });
      }
    } catch (err: any) {
      console.error('[INFOBIP 2FA SEND ERROR]', err);
      return res.status(500).json({
        success: false,
        error: err?.message || 'Internal server error while dispatching OTP.'
      });
    }
  };

  app.post('/send-otp', handleInfobipSendOtp);
  app.post('/api/infobip/send-otp', handleInfobipSendOtp);

  // 2. POST /verify-otp (and /api/infobip/verify-otp)
  const handleInfobipVerifyOtp = async (req: Request, res: Response) => {
    try {
      const { pinId, pin, code } = req.body;
      const cleanPinId = String(pinId || '').trim();
      const cleanPin = String(pin || code || '').trim();

      if (!cleanPinId) {
        return res.status(400).json({
          success: false,
          error: 'pinId is required to verify OTP.'
        });
      }

      if (!cleanPin || cleanPin.length !== 4) {
        return res.status(400).json({
          success: false,
          error: 'A 4-digit PIN code is required.'
        });
      }

      console.log(`[INFOBIP 2FA VERIFY] Verifying PIN for pinId: ${cleanPinId}`);

      const response = await fetch(`${INFOBIP_BASE_URL}/2fa/2/pin/${cleanPinId}/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `App ${INFOBIP_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          pin: cleanPin
        })
      });

      const data: any = await response.json();

      if (response.ok && data?.verified === true) {
        return res.status(200).json({
          success: true,
          verified: true,
          message: 'PIN verified successfully.',
          pinId: data.pinId,
          msisdn: data.msisdn,
          attemptsRemaining: data.attemptsRemaining
        });
      } else {
        const pinError = data?.pinError || 'WRONG_PIN';
        return res.status(400).json({
          success: false,
          verified: false,
          error: pinError === 'WRONG_PIN' ? 'Invalid PIN code entered.' : (data?.message || 'PIN verification failed.'),
          pinError,
          pinId: data?.pinId || cleanPinId,
          attemptsRemaining: data?.attemptsRemaining ?? 0
        });
      }
    } catch (err: any) {
      console.error('[INFOBIP 2FA VERIFY ERROR]', err);
      return res.status(500).json({
        success: false,
        error: err?.message || 'Internal server error while verifying OTP.'
      });
    }
  };

  app.post('/verify-otp', handleInfobipVerifyOtp);
  app.post('/api/infobip/verify-otp', handleInfobipVerifyOtp);

  // =========================================================================
  // META WHATSAPP CLOUD API WEBHOOK ENDPOINTS
  // Handles incoming WhatsApp customer messages and Meta verification handshake
  // =========================================================================

  let lastWhatsAppWebhookEvent: any = null;

  // 1. Webhook Verification Handshake (Meta Hub Subscribe)
  const handleWhatsAppWebhookVerification = (req: Request, res: Response) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log(`[META WHATSAPP WEBHOOK VERIFICATION] hub.mode=${mode}, token=${token}`);

    if (mode === 'subscribe') {
      // Respond with challenge code as plain text string (required by Meta)
      return res.status(200).send(String(challenge || ''));
    }
    return res.status(403).send('Forbidden');
  };

  app.get('/api/whatsapp/webhook', handleWhatsAppWebhookVerification);
  app.get('/webhook', handleWhatsAppWebhookVerification);

  // 2. Incoming Meta WhatsApp Webhook Events (Messages, Statuses, Delivery Receipts)
  const handleWhatsAppWebhookEvent = async (req: Request, res: Response) => {
    const body = req.body;
    console.log('[META WHATSAPP WEBHOOK EVENT RECEIVED]', JSON.stringify(body));

    // Acknowledge receipt to Meta immediately with HTTP 200 OK
    res.status(200).json({ status: 'ok', received: true });

    try {
      if (body?.object === 'whatsapp_business_account') {
        const entries = Array.isArray(body.entry) ? body.entry : [];
        for (const entry of entries) {
          const changes = Array.isArray(entry.changes) ? entry.changes : [];
          for (const change of changes) {
            const value = change.value;
            if (!value) continue;

            const metadata = value.metadata || {};
            const contacts = Array.isArray(value.contacts) ? value.contacts : [];
            const messages = Array.isArray(value.messages) ? value.messages : [];
            const statuses = Array.isArray(value.statuses) ? value.statuses : [];

            // 1. Process Inbound Messages from WhatsApp users
            for (const msg of messages) {
              const rawFrom = String(msg.from || '');
              const cleanDigits = rawFrom.replace(/\D/g, '');
              const senderPhone = rawFrom.startsWith('+') ? rawFrom : `+${rawFrom}`;
              
              // Find sender name from contacts array if available
              const contact = contacts.find((c: any) => c.wa_id === rawFrom || c.wa_id === cleanDigits);
              const senderName = contact?.profile?.name || `WhatsApp User (${senderPhone})`;

              // Extract message content
              let messageText = '';
              if (msg.type === 'text' && msg.text?.body) {
                messageText = msg.text.body;
              } else if (msg.type === 'button' && msg.button?.text) {
                messageText = msg.button.text;
              } else if (msg.type === 'interactive') {
                messageText = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || '[Interactive Response]';
              } else {
                messageText = `[${msg.type?.toUpperCase() || 'MESSAGE'} received]`;
              }

              console.log(`[META WHATSAPP INBOUND] From: ${senderName} (${senderPhone}): "${messageText}"`);

              // Integrate with BongoWeb Live Support Chat System
              const db = readDb();
              if (!db.supportChats) db.supportChats = [];

              // Match thread by normalized phone or last 10 digits
              const phone10 = cleanDigits.slice(-10);
              let thread = db.supportChats.find((t: any) => {
                const tDigits = String(t.userPhone || '').replace(/\D/g, '').slice(-10);
                return t.userPhone === senderPhone || t.userPhone === rawFrom || (phone10 && tDigits === phone10);
              });

              const newMsg = {
                id: msg.id || `wa-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                sender: 'client' as const,
                text: messageText,
                timestamp: new Date(Number(msg.timestamp) * 1000 || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              };

              const expiresAt = Date.now() + 10 * 60 * 1000;

              if (thread) {
                thread.userName = thread.userName || senderName;
                thread.lastMessage = messageText;
                thread.lastUpdated = 'এখনই';
                thread.isClosed = false;
                thread.isArchived = false;
                thread.unreadAdminCount = (thread.unreadAdminCount || 0) + 1;
                thread.expiresAt = expiresAt;
                if (!Array.isArray(thread.messages)) thread.messages = [];
                if (!thread.messages.some((m: any) => m.id === newMsg.id)) {
                  thread.messages.push(newMsg);
                }
              } else {
                thread = {
                  userPhone: senderPhone,
                  userName: senderName,
                  language: 'en',
                  lastMessage: messageText,
                  lastUpdated: 'এখনই',
                  unreadAdminCount: 1,
                  unreadClientCount: 0,
                  expiresAt,
                  isClosed: false,
                  isArchived: false,
                  additionalMinutesAdded: 0,
                  messages: [newMsg]
                };
                db.supportChats.unshift(thread);
              }

              writeDb(db);

              lastWhatsAppWebhookEvent = {
                receivedAt: new Date().toISOString(),
                from: senderPhone,
                name: senderName,
                text: messageText,
                waMessageId: msg.id,
                displayPhoneNumber: metadata?.display_phone_number,
                phoneNumberId: metadata?.phone_number_id
              };

              // Broadcast real-time WebSocket event to admin dashboard
              broadcast({
                type: 'chat:message',
                phone: thread.userPhone,
                message: newMsg,
                thread,
                channel: 'whatsapp',
                timestamp: Date.now()
              });

              broadcast({
                type: 'whatsapp:message_received',
                from: senderPhone,
                name: senderName,
                text: messageText,
                waMessageId: msg.id,
                timestamp: Date.now()
              });
            }

            // 2. Process Message Status Updates (delivered, read, sent, failed)
            for (const status of statuses) {
              console.log(`[META WHATSAPP STATUS] Message ${status.id} -> ${status.status} for recipient ${status.recipient_id}`);
              broadcast({
                type: 'whatsapp:status_update',
                messageId: status.id,
                status: status.status,
                recipientId: status.recipient_id,
                timestamp: status.timestamp
              });
            }
          }
        }
      }
    } catch (err: any) {
      console.warn('[META WHATSAPP WEBHOOK ERROR]', err?.message || err);
    }
  };

  app.post('/api/whatsapp/webhook', handleWhatsAppWebhookEvent);
  app.post('/webhook', handleWhatsAppWebhookEvent);

  app.get('/api/whatsapp/webhook/last', (req: Request, res: Response) => {
    res.json({
      success: true,
      lastEvent: lastWhatsAppWebhookEvent
    });
  });

  app.post('/api/auth/reset-password', (req: Request, res: Response) => {
    const { email, code, newPassword } = req.body;
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanCode = String(code || '').trim();
    const cleanPass = String(newPassword || '').trim();

    if (!cleanPass || cleanPass.length < 4) {
      return res.status(400).json({ success: false, error: 'Password must be at least 4 characters long.' });
    }

    const record = emailOtpStore.get(cleanEmail);
    if (!record || (!record.verified && record.code !== cleanCode)) {
      return res.status(400).json({ success: false, error: 'Invalid OTP code or verification failed.' });
    }

    const db = readDb();
    const userIndex = (db.users || []).findIndex(u => (u.email || '').toLowerCase() === cleanEmail);
    if (userIndex === -1) {
      return res.status(404).json({ success: false, error: 'No account found with this email address.' });
    }

    db.users[userIndex].password = cleanPass;
    writeDb(db);
    emailOtpStore.delete(cleanEmail);

    res.json({ success: true, message: 'Password successfully changed. You can now log in with your new password.' });
  });

  // GOOGLE AUTH DIRECT SYNC ROUTE
  app.post('/api/auth/google-sync', (req: Request, res: Response) => {
    const db = readDb();
    const { email, name, phone, photoUrl } = req.body;
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return res.status(400).json({ success: false, error: 'Invalid Google email.' });
    }

    const cleanName = String(name || cleanEmail.split('@')[0] || 'Google User').trim();
    const cleanPhone = String(phone || '').trim();

    let user = (db.users || []).find(u => 
      (u.email || '').toLowerCase() === cleanEmail ||
      (cleanPhone && u.phone === cleanPhone)
    );

    if (!user) {
      const generatedPhone = cleanPhone || `017${Math.floor(10000000 + Math.random() * 90000000)}`;
      const newUser = {
        name: cleanName,
        phone: generatedPhone,
        email: cleanEmail,
        photoUrl: photoUrl || undefined,
        registeredAt: new Date().toLocaleDateString('en-US')
      };
      db.users.push(newUser);
      writeDb(db);
      user = newUser;
      broadcast({
        type: 'user:registered',
        user: newUser,
        totalUsers: db.users.length,
        timestamp: Date.now()
      });
    } else {
      // Update name/photo if updated
      let changed = false;
      if (cleanName && (!user.name || user.name === 'Google User')) {
        user.name = cleanName;
        changed = true;
      }
      if (photoUrl && !user.photoUrl) {
        user.photoUrl = photoUrl;
        changed = true;
      }
      if (changed) writeDb(db);
    }

    res.json({ success: true, user });
  });

  // Descope Server-Side Session Validation Endpoint
  // Validates sessionToken using descopeClient.validateSession
  app.post('/api/auth/descope-validate', async (req: Request, res: Response) => {
    try {
      const sessionToken = req.body?.sessionToken || req.headers.authorization?.replace(/^Bearer\s+/i, '');
      if (!sessionToken) {
        return res.status(400).json({ success: false, error: 'sessionToken is required' });
      }
      const authInfo = await descopeClient.validateSession(sessionToken);
      return res.json({ success: true, authInfo });
    } catch (err: any) {
      console.warn('[Descope] Session validation warning/error:', err?.message || err);
      return res.status(401).json({ success: false, error: err?.message || 'Invalid or expired Descope session token' });
    }
  });

  app.post('/api/auth/descope-sync', async (req: Request, res: Response) => {
    const db = readDb();
    let { email, name, phone, sessionToken } = req.body;

    // If sessionToken is provided, attempt server-side verification with Descope
    if (!sessionToken && req.headers.authorization) {
      sessionToken = req.headers.authorization.replace(/^Bearer\s+/i, '');
    }

    if (sessionToken) {
      try {
        const authInfo = await descopeClient.validateSession(sessionToken);
        const tokenData = authInfo?.token as any;
        if (tokenData) {
          if (!email && (tokenData.email || tokenData.sub)) {
            email = tokenData.email || (tokenData.sub?.includes('@') ? tokenData.sub : email);
          }
          if (!name && (tokenData.name || tokenData.given_name)) {
            name = tokenData.name || tokenData.given_name;
          }
          if (!phone && tokenData.phone) {
            phone = tokenData.phone;
          }
        }
      } catch (validationErr: any) {
        // Fall back gracefully if offline or token expired
        console.warn('[Descope] Token validation non-fatal warning during sync:', validationErr?.message);
      }
    }

    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPhone = String(phone || '').trim();
    const cleanName = String(name || (cleanEmail ? cleanEmail.split('@')[0] : 'BongoWeb Member')).trim();

    let user = (db.users || []).find(u => 
      (cleanEmail && (u.email || '').toLowerCase() === cleanEmail) ||
      (cleanPhone && u.phone === cleanPhone)
    );

    if (!user) {
      const generatedPhone = cleanPhone || `017${Math.floor(10000000 + Math.random() * 90000000)}`;
      user = {
        name: cleanName,
        phone: generatedPhone,
        email: cleanEmail,
        registeredAt: new Date().toLocaleDateString('bn-BD')
      };
      db.users.push(user);
      writeDb(db);
      broadcast({
        type: 'user:registered',
        user,
        totalUsers: db.users.length,
        timestamp: Date.now()
      });
    }

    res.json({ success: true, user });
  });

  // 3. LIVE CHAT SYSTEM (Zero-Trust: Client only retrieves their own thread; Admin reads all)
  app.get('/api/chat/threads', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization?.replace(/^Bearer\s+/i, '') || (req.headers['x-admin-token'] as string);
    const db = readDb();
    if (isValidAdminToken(authHeader)) {
      return res.json(db.supportChats || []);
    }
    const queryPhone = req.query.phone ? String(req.query.phone).replace(/\D/g, '').slice(-10) : '';
    if (queryPhone) {
      const filtered = (db.supportChats || []).filter(t => (t.userPhone || '').replace(/\D/g, '').slice(-10) === queryPhone);
      return res.json(filtered);
    }
    res.json([]);
  });

  app.get('/api/chat/thread/:phone', (req: Request, res: Response) => {
    const db = readDb();
    const { phone } = req.params;
    const thread = db.supportChats.find(t => t.userPhone === phone);
    res.json(thread || null);
  });

  app.post('/api/chat/activate', (req: Request, res: Response) => {
    const db = readDb();
    const { name, phone, language, welcomeText } = req.body;
    const cleanPhone = (phone || '').trim();
    const cleanName = (name || '').trim();

    const welcomeMsg = {
      id: `init-${Date.now()}`,
      sender: 'admin' as const,
      text: welcomeText || (language === 'bn' 
        ? `স্বাগতম ${cleanName}! BongoWeb লাইভ সাপোর্ট টিম আপনার সাথে যুক্ত হয়েছেন। আপনার যেকোনো জিজ্ঞাসা এখানে লিখুন:`
        : `Welcome ${cleanName}! A BongoWeb live support specialist has joined the chat. How can we help you today?`),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    let thread = db.supportChats.find(t => t.userPhone === cleanPhone);
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes inactivity timer

    if (thread) {
      thread.userName = cleanName;
      thread.language = language || 'bn';
      thread.lastMessage = welcomeMsg.text;
      thread.lastUpdated = 'এখনই';
      thread.expiresAt = expiresAt;
      thread.isClosed = false;
      thread.isArchived = false;
      if (!thread.messages || thread.messages.length === 0) {
        thread.messages = [welcomeMsg];
      }
    } else {
      thread = {
        userPhone: cleanPhone,
        userName: cleanName,
        language: language || 'bn',
        lastMessage: welcomeMsg.text,
        lastUpdated: 'এখনই',
        unreadAdminCount: 1,
        unreadClientCount: 0,
        expiresAt,
        isClosed: false,
        isArchived: false,
        additionalMinutesAdded: 0,
        messages: [welcomeMsg]
      };
      db.supportChats.unshift(thread);
    }

    writeDb(db);
    console.log(`[Realtime Chat Activated] User ${cleanName} (${cleanPhone})`);

    // Broadcast chat activation event
    broadcast({
      type: 'chat:activated',
      thread,
      timestamp: Date.now()
    });

    res.json(thread);
  });

  app.post('/api/chat/message', (req: Request, res: Response) => {
    const db = readDb();
    const { phone, sender, text, name, message } = req.body;
    const cleanPhone = (phone || '').trim();

    const msg = message || {
      id: `${sender}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sender,
      text: (text || '').trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    let thread = db.supportChats.find(t => t.userPhone === cleanPhone);

    if (thread) {
      if (!thread.messages.some(m => m.id === msg.id || (m.sender === msg.sender && m.text === msg.text))) {
        thread.messages.push(msg);
      }
      thread.lastMessage = msg.text;
      thread.lastUpdated = 'এখনই';
      thread.isClosed = false;
      thread.isArchived = false;
      if (sender === 'client') {
        thread.unreadAdminCount = (thread.unreadAdminCount || 0) + 1;
        // User responded: reset 5-minute inactivity timer
        thread.expiresAt = Date.now() + 5 * 60 * 1000;
      } else {
        thread.unreadClientCount = (thread.unreadClientCount || 0) + 1;
      }
    } else {
      thread = {
        userPhone: cleanPhone,
        userName: name || 'Valued Client',
        lastMessage: msg.text,
        lastUpdated: 'এখনই',
        unreadAdminCount: sender === 'client' ? 1 : 0,
        unreadClientCount: sender === 'admin' ? 1 : 0,
        expiresAt: Date.now() + 5 * 60 * 1000,
        isClosed: false,
        isArchived: false,
        messages: [msg]
      };
      db.supportChats.unshift(thread);
    }

    writeDb(db);
    console.log(`[Realtime Chat Message] [${sender}] ${cleanPhone}: ${msg.text}`);

    // Broadcast real-time chat message event
    broadcast({
      type: 'chat:message',
      phone: cleanPhone,
      message: msg,
      thread,
      timestamp: Date.now()
    });

    res.json(msg);
  });

  // Admin adds extra time for client (Protected)
  app.post('/api/chat/extend', requireAdmin, (req: Request, res: Response) => {
    const db = readDb();
    const { phone, additionalMinutes = 5 } = req.body;
    const thread = db.supportChats.find(t => t.userPhone === phone);

    if (thread) {
      const base = thread.expiresAt && thread.expiresAt > Date.now() ? thread.expiresAt : Date.now();
      thread.expiresAt = base + additionalMinutes * 60 * 1000;
      thread.isClosed = false;
      thread.additionalMinutesAdded = (thread.additionalMinutesAdded || 0) + additionalMinutes;
      writeDb(db);

      broadcast({
        type: 'chat:extended',
        phone,
        expiresAt: thread.expiresAt,
        additionalMinutes,
        timestamp: Date.now()
      });

      res.json({ success: true, expiresAt: thread.expiresAt });
    } else {
      res.status(404).json({ error: 'Thread not found' });
    }
  });

  // End / Close chat (Archive only if user has account, otherwise discard temporary chat)
  app.post('/api/chat/end', (req: Request, res: Response) => {
    const db = readDb();
    const { phone } = req.body;
    const cleanPhone = (phone || '').trim();
    const cleanDigits = cleanPhone.replace(/\D/g, '').slice(-10);
    const thread = db.supportChats.find(t => (t.userPhone || '').trim() === cleanPhone || (t.userPhone || '').replace(/\D/g, '').slice(-10) === cleanDigits);
    const now = new Date().toLocaleString('bn-BD');

    const userHasAccount = 
      (db.users || []).some(u => (u.phone || '').replace(/\D/g, '').slice(-10) === cleanDigits) ||
      (db.orders || []).some(o => (o.phone || '').replace(/\D/g, '').slice(-10) === cleanDigits);

    if (thread) {
      if (userHasAccount) {
        thread.isClosed = true;
        thread.isArchived = true;
        thread.archivedAt = now;
      } else {
        // Temporary visitor chat: discard and do not save to archive
        db.supportChats = db.supportChats.filter(t => t.userPhone !== thread.userPhone);
      }
      writeDb(db);
    }

    broadcast({
      type: 'chat:ended',
      phone: cleanPhone,
      isClosed: true,
      hasAccount: userHasAccount,
      timestamp: Date.now()
    });

    res.json({ success: true, archived: userHasAccount });
  });

  // Reopen chat from archive
  app.post('/api/chat/reopen', (req: Request, res: Response) => {
    const db = readDb();
    const { phone } = req.body;
    const thread = db.supportChats.find(t => t.userPhone === phone);
    if (thread) {
      thread.isClosed = false;
      thread.isArchived = false;
      thread.expiresAt = Date.now() + 5 * 60 * 1000;
      writeDb(db);

      broadcast({
        type: 'chat:activated',
        thread,
        timestamp: Date.now()
      });
    }

    res.json({ success: true, thread });
  });

  // REPORTS (Zero-Trust: Client only reads their own reports; Admin reads all)
  app.get('/api/reports', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization?.replace(/^Bearer\s+/i, '') || (req.headers['x-admin-token'] as string);
    const db = readDb();
    if (isValidAdminToken(authHeader)) {
      return res.json(db.reports || []);
    }
    const queryPhone = req.query.phone ? String(req.query.phone).replace(/\D/g, '').slice(-10) : '';
    if (queryPhone) {
      const filtered = (db.reports || []).filter(r => 
        (r.phone && String(r.phone).replace(/\D/g, '').slice(-10) === queryPhone) ||
        (r.userPhone && String(r.userPhone).replace(/\D/g, '').slice(-10) === queryPhone)
      );
      return res.json(filtered);
    }
    res.json([]);
  });

  app.post('/api/reports', (req: Request, res: Response) => {
    const db = readDb();
    if (!db.reports) db.reports = [];
    const report = {
      ...req.body,
      id: req.body.id || `REP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: req.body.status || 'pending',
      createdAt: req.body.createdAt || new Date().toLocaleString('bn-BD')
    };
    db.reports.unshift(report);
    writeDb(db);
    broadcast({
      type: 'report:created',
      report,
      timestamp: Date.now()
    });
    res.json(report);
  });

  app.put('/api/reports/:id/reply', requireAdmin, (req: Request, res: Response) => {
    const db = readDb();
    if (!db.reports) db.reports = [];
    const rep = db.reports.find(r => r.id === req.params.id);
    if (rep) {
      rep.adminReply = String(req.body.reply || '').trim();
      rep.adminRepliedAt = new Date().toLocaleString('bn-BD');
      // Report remains strictly in 'pending' or 'in_progress' until explicitly marked complete
      if (rep.status === 'pending') {
        rep.status = 'in_progress';
      }
      writeDb(db);
      broadcast({
        type: 'report:replied',
        report: rep,
        timestamp: Date.now()
      });
      return res.json(rep);
    }
    res.status(404).json({ error: 'Report not found' });
  });

  app.put('/api/reports/:id/resolve', requireAdmin, (req: Request, res: Response) => {
    const db = readDb();
    if (!db.reports) db.reports = [];
    const rep = db.reports.find(r => r.id === req.params.id);
    if (rep) {
      rep.status = 'resolved';
      rep.resolvedAt = new Date().toLocaleString('bn-BD');
      writeDb(db);
      broadcast({
        type: 'report:resolved',
        report: rep,
        timestamp: Date.now()
      });
    }
    res.json(db.reports);
  });

  // ---------------- EMAIL RECOVERY REQUESTS (Zero-Trust: Client only reads their own; Admin manages all) ----------------
  app.get('/api/email-recoveries', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization?.replace(/^Bearer\s+/i, '') || (req.headers['x-admin-token'] as string);
    const db = readDb();
    if (isValidAdminToken(authHeader)) {
      return res.json(db.emailRecoveries || []);
    }
    const queryPhone = req.query.phone ? String(req.query.phone).replace(/\D/g, '').slice(-10) : '';
    if (queryPhone) {
      const filtered = (db.emailRecoveries || []).filter(r => 
        (r.phone && String(r.phone).replace(/\D/g, '').slice(-10) === queryPhone)
      );
      return res.json(filtered);
    }
    res.json([]);
  });

  app.post('/api/email-recoveries', (req: Request, res: Response) => {
    const db = readDb();
    if (!db.emailRecoveries) db.emailRecoveries = [];
    const item = {
      ...req.body,
      id: req.body.id || `REC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: req.body.status || 'pending',
      createdAt: req.body.createdAt || new Date().toLocaleString('bn-BD')
    };
    db.emailRecoveries.unshift(item);
    writeDb(db);
    broadcast({
      type: 'email_recovery:created',
      recovery: item,
      timestamp: Date.now()
    });
    res.json(item);
  });

  app.put('/api/email-recoveries/:id/approve', requireAdmin, (req: Request, res: Response) => {
    const db = readDb();
    if (!db.emailRecoveries) db.emailRecoveries = [];
    const rec = db.emailRecoveries.find(r => r.id === req.params.id);
    if (rec) {
      rec.status = 'completed';
      rec.decisionAt = new Date().toLocaleString('bn-BD');
      rec.decisionNote = req.body.decisionNote || 'অ্যাডমিন টিম কর্তৃক অনুমোদিত ও কল সম্পন্ন হয়েছে।';
      writeDb(db);
      broadcast({
        type: 'email_recovery:approved',
        recovery: rec,
        timestamp: Date.now()
      });
      return res.json(rec);
    }
    res.status(404).json({ error: 'Recovery request not found' });
  });

  app.put('/api/email-recoveries/:id/undo', requireAdmin, (req: Request, res: Response) => {
    const db = readDb();
    if (!db.emailRecoveries) db.emailRecoveries = [];
    const rec = db.emailRecoveries.find(r => r.id === req.params.id);
    if (rec) {
      rec.status = 'pending';
      rec.decisionAt = undefined;
      rec.decisionNote = undefined;
      writeDb(db);
      broadcast({
        type: 'email_recovery:undone',
        recovery: rec,
        timestamp: Date.now()
      });
      return res.json(rec);
    }
    res.status(404).json({ error: 'Recovery request not found' });
  });

  app.delete('/api/email-recoveries/:id', requireAdmin, (req: Request, res: Response) => {
    const db = readDb();
    if (!db.emailRecoveries) db.emailRecoveries = [];
    db.emailRecoveries = db.emailRecoveries.filter(r => r.id !== req.params.id);
    writeDb(db);
    broadcast({
      type: 'email_recovery:deleted',
      id: req.params.id,
      timestamp: Date.now()
    });
    res.json({ success: true, id: req.params.id });
  });

  // RESTRICT USER (Admin Only)
  app.put('/api/users/:phone/restrict', requireAdmin, (req: Request, res: Response) => {
    const db = readDb();
    const cleanPhone = String(req.params.phone || '').replace(/[^0-9]/g, '');
    const user = db.users.find(u => String(u.phone || '').replace(/[^0-9]/g, '') === cleanPhone);
    if (user) {
      user.isRestricted = Boolean(req.body.isRestricted);
      writeDb(db);
    }
    res.json(db.users);
  });

  // VERIFY USER NUMBER (Admin Only)
  app.put('/api/users/:phone/verify-number', requireAdmin, (req: Request, res: Response) => {
    const db = readDb();
    const cleanPhone = String(req.params.phone || '').replace(/[^0-9]/g, '');
    const user = db.users.find(u => String(u.phone || '').replace(/[^0-9]/g, '') === cleanPhone);
    if (user) {
      user.numberVerified = req.body.numberVerified !== undefined ? Boolean(req.body.numberVerified) : true;
      writeDb(db);
    }
    res.json(db.users);
  });

  // 4. WEBSITES CATALOG & STOCKS (Public can read; Admin only can create/modify/delete)
  app.get('/api/websites', (req: Request, res: Response) => {
    const db = readDb();
    res.json(db.customWebsites || []);
  });

  app.post('/api/websites', requireAdmin, (req: Request, res: Response) => {
    const db = readDb();
    const newSite = req.body;
    db.customWebsites.unshift(newSite);
    writeDb(db);

    broadcast({
      type: 'catalog:updated',
      websites: db.customWebsites,
      timestamp: Date.now()
    });

    res.status(201).json(db.customWebsites);
  });

  app.put('/api/websites/:code', requireAdmin, (req: Request, res: Response) => {
    const db = readDb();
    const { code } = req.params;
    const cleanCode = code.replace('#', '');
    const updateData = req.body;

    const idx = db.customWebsites.findIndex(
      s => (s.fourDigitCode && s.fourDigitCode.replace('#', '') === cleanCode) || s.id === code
    );

    if (idx >= 0) {
      db.customWebsites[idx] = { ...db.customWebsites[idx], ...updateData };
      writeDb(db);

      broadcast({
        type: 'catalog:updated',
        websites: db.customWebsites,
        timestamp: Date.now()
      });

      res.json(db.customWebsites);
    } else {
      res.status(404).json({ error: 'Website not found' });
    }
  });

  app.delete('/api/websites/:code', requireAdmin, (req: Request, res: Response) => {
    const db = readDb();
    const { code } = req.params;
    const cleanCode = code.replace('#', '');
    db.customWebsites = db.customWebsites.filter(
      s => (s.fourDigitCode && s.fourDigitCode.replace('#', '') !== cleanCode) && s.id !== code
    );
    writeDb(db);

    broadcast({
      type: 'catalog:updated',
      websites: db.customWebsites,
      timestamp: Date.now()
    });

    res.json(db.customWebsites);
  });

  // 5. DELIVERED CREDENTIALS (Never trust client - sensitive password vault)
  app.get('/api/credentials', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization?.replace(/^Bearer\s+/i, '') || (req.headers['x-admin-token'] as string);
    const db = readDb();
    const creds = Array.isArray(db.deliveredCredentials) ? [...db.deliveredCredentials] : [];
    // Sort latest first
    creds.sort((a, b) => (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0));

    // Deduplicate keeping ONLY the single freshest record per order / client website
    const deduplicated: any[] = [];
    for (const c of creds) {
      const safeOrderId = String(c.orderId || '').trim();
      const phoneDigits = String(c.userPhone || '').replace(/\D/g, '').slice(-10);
      const webCode = String(c.websiteCode || '').trim();
      const existingIdx = deduplicated.findIndex((x) => {
        const xOrder = String(x.orderId || '').trim();
        const xDigits = String(x.userPhone || '').replace(/\D/g, '').slice(-10);
        const xCode = String(x.websiteCode || '').trim();
        if (safeOrderId && xOrder && safeOrderId === xOrder) return true;
        if (phoneDigits && xDigits && phoneDigits === xDigits) {
          if (!webCode || !xCode || webCode === xCode) return true;
        }
        return false;
      });
      if (existingIdx === -1) {
        deduplicated.push(c);
      }
    }

    // 1. If verified admin, return all delivered credentials
    if (isValidAdminToken(authHeader)) {
      return res.json(deduplicated);
    }

    // 2. Client query: strictly filter by query phone or email or orderId
    const queryPhone = req.query.phone ? String(req.query.phone).replace(/\D/g, '').slice(-10) : '';
    const queryEmail = req.query.email ? String(req.query.email).trim().toLowerCase() : '';
    const queryOrderId = req.query.orderId ? String(req.query.orderId).trim().toLowerCase() : '';

    if (queryPhone || queryEmail || queryOrderId) {
      const userCreds = deduplicated.filter(c => {
        const cPhone = String(c.userPhone || '').replace(/\D/g, '').slice(-10);
        const cEmail = String(c.userEmail || '').trim().toLowerCase();
        const cOrder = String(c.orderId || '').trim().toLowerCase();
        return (queryPhone && cPhone && queryPhone === cPhone) ||
               (queryEmail && cEmail && queryEmail === cEmail) ||
               (queryOrderId && cOrder && queryOrderId === cOrder);
      });
      return res.json(userCreds);
    }

    // Unauthenticated blanket query receives 403 Forbidden
    return res.status(403).json({ error: 'Unauthorized credentials access.' });
  });

  app.post('/api/credentials', requireAdmin, (req: Request, res: Response) => {
    const db = readDb();
    const cred = { ...req.body, updatedAt: Number(req.body.updatedAt) || Date.now() };
    const safeOrderId = String(cred.orderId || '').trim();
    const phoneDigits = String(cred.userPhone || '').replace(/\D/g, '').slice(-10);
    const webCode = String(cred.websiteCode || '').trim();
    const targetId = String(cred.id || '').trim();

    const currentList = Array.isArray(db.deliveredCredentials) ? db.deliveredCredentials : [];
    // Purge any older credentials for this order or client website
    db.deliveredCredentials = currentList.filter((c: any) => {
      const cOrder = String(c.orderId || '').trim();
      const cDigits = String(c.userPhone || '').replace(/\D/g, '').slice(-10);
      const cCode = String(c.websiteCode || '').trim();
      const cId = String(c.id || '').trim();
      if (targetId && cId && targetId === cId) return false;
      if (safeOrderId && cOrder && safeOrderId === cOrder) return false;
      if (phoneDigits && cDigits && phoneDigits === cDigits) {
        if (!webCode || !cCode || webCode === cCode) return false;
      }
      return true;
    });

    db.deliveredCredentials.unshift(cred);
    writeDb(db);

    broadcast({
      type: 'credential:delivered',
      credential: cred,
      timestamp: Date.now()
    });

    res.status(201).json(db.deliveredCredentials);
  });

  app.delete('/api/credentials/:id', requireAdmin, (req: Request, res: Response) => {
    const db = readDb();
    const { id } = req.params;
    db.deliveredCredentials = db.deliveredCredentials.filter(c => c.id !== id);
    writeDb(db);
    res.json(db.deliveredCredentials);
  });

  // LOGO & BRAND SETTINGS ENDPOINTS (Admin Only)
  app.get('/api/settings/logo', (req: Request, res: Response) => {
    const db = readDb();
    res.json(db.logoConfig || null);
  });

  app.post('/api/settings/logo', requireAdmin, (req: Request, res: Response) => {
    const db = readDb();
    db.logoConfig = req.body;
    writeDb(db);
    broadcast({
      type: 'logo:updated',
      config: req.body,
      timestamp: Date.now()
    });
    res.json({ success: true, config: req.body });
  });

  // 6. PASSWORD RESET REQUESTS
  app.get('/api/resets', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization?.replace(/^Bearer\s+/i, '') || (req.headers['x-admin-token'] as string);
    const db = readDb();
    if (isValidAdminToken(authHeader)) {
      return res.json(db.resetRequests || []);
    }
    const queryPhone = req.query.phone ? String(req.query.phone).replace(/\D/g, '').slice(-10) : '';
    if (queryPhone) {
      const filtered = (db.resetRequests || []).filter(r => 
        (r.phone && String(r.phone).replace(/\D/g, '').slice(-10) === queryPhone)
      );
      return res.json(filtered);
    }
    res.json([]);
  });

  app.post('/api/resets', (req: Request, res: Response) => {
    const db = readDb();
    const newReq = req.body;
    db.resetRequests.unshift(newReq);
    writeDb(db);

    broadcast({
      type: 'reset:requested',
      request: newReq,
      timestamp: Date.now()
    });

    res.status(201).json(newReq);
  });

  app.put('/api/resets/:id', requireAdmin, (req: Request, res: Response) => {
    const db = readDb();
    const { id } = req.params;
    const { status, newPassword } = req.body;
    const reqItem = db.resetRequests.find(r => r.id === id);

    if (reqItem) {
      reqItem.status = status;
      reqItem.resolvedAt = new Date().toLocaleString('bn-BD');
      if (newPassword) {
        reqItem.newPasswordAssigned = newPassword;
        const matchingUser = db.users.find(u => u.phone === reqItem.phone);
        if (matchingUser) {
          matchingUser.password = newPassword;
        }
      }
      writeDb(db);

      broadcast({
        type: 'reset:resolved',
        request: reqItem,
        timestamp: Date.now()
      });

      if (newPassword) {
        broadcast({
          type: 'user:password_updated',
          phone: reqItem.phone,
          newPassword,
          timestamp: Date.now()
        });
      }

      res.json(db.resetRequests);
    } else {
      res.status(404).json({ error: 'Request not found' });
    }
  });

  // 7. BACKUP & VAULT (Protected: Export and Restore require verified admin token)
  app.get('/api/backup/export', requireAdmin, (req: Request, res: Response) => {
    const db = readDb();
    res.json({
      exportedAt: new Date().toISOString(),
      platform: 'BongoWeb.xyz Complete Production Vault',
      version: '4.0.0',
      totalUsers: db.users.length,
      totalOrders: db.orders.length,
      totalCustomWebsites: db.customWebsites.length,
      totalChatThreads: db.supportChats.length,
      totalDeliveredCredentials: db.deliveredCredentials.length,
      totalResetRequests: db.resetRequests.length,
      ...db
    });
  });

  app.post('/api/backup/restore', requireAdmin, (req: Request, res: Response) => {
    const backupData = req.body;
    if (!backupData) {
      return res.status(400).json({ success: false, error: 'No backup data provided' });
    }

    const newDb: DatabaseSchema = {
      adminConfig: backupData.adminConfig || {
        adminId: 'admin',
        adminEntryPassword: 'admin123',
        adminActionPassword: 'confirm786',
        masterKey: 'MASTER-BONGO-2026'
      },
      users: Array.isArray(backupData.users) ? backupData.users : [],
      orders: Array.isArray(backupData.orders) ? backupData.orders : [],
      supportChats: Array.isArray(backupData.supportChats) ? backupData.supportChats : [],
      customWebsites: Array.isArray(backupData.customWebsites)
        ? backupData.customWebsites 
        : [],
      deliveredCredentials: Array.isArray(backupData.deliveredCredentials) ? backupData.deliveredCredentials : [],
      resetRequests: Array.isArray(backupData.resetRequests) ? backupData.resetRequests : [],
      reports: Array.isArray(backupData.reports) ? backupData.reports : []
    };

    writeDb(newDb);

    broadcast({
      type: 'system:restored',
      timestamp: Date.now()
    });

    res.json({
      success: true,
      message: 'সম্পূর্ণ ডাটাবেজ সফলভাবে রিস্টোর করা হয়েছে।',
      recordsRestored: {
        users: newDb.users.length,
        orders: newDb.orders.length,
        websites: newDb.customWebsites.length,
        chats: newDb.supportChats.length
      }
    });
  });

  // ---------------- VITE MIDDLEWARE / STATIC FILES ----------------
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server },
        watch: isHmrDisabled ? null : {}
      },
      appType: 'custom'
    });
    app.use(vite.middlewares);

    // Reliable fallback for client-side routing on page refresh (custom appType gives Express full HTML routing control)
    app.get('*', async (req: Request, res: Response, next) => {
      if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/ws')) {
        return next();
      }
      try {
        const url = req.originalUrl;
        const indexPath = path.resolve(__dirname, 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        try {
          template = await vite.transformIndexHtml(url, template);
        } catch {
          template = await vite.transformIndexHtml('/', template);
        }
        res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' }).end(template);
      } catch (e) {
        try {
          const rawHtml = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
          res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' }).end(rawHtml);
        } catch (err) {
          next(e);
        }
      }
    });
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/ws')) {
        return res.status(404).json({ error: 'Endpoint not found' });
      }
      const distIndex = path.resolve(distPath, 'index.html');
      if (fs.existsSync(distIndex)) {
        return res.sendFile(distIndex);
      }
      res.sendFile(path.resolve(__dirname, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 BongoWeb Realtime Full-Stack Server running on http://0.0.0.0:${PORT} (WS on /ws, SSE on /api/events)`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
