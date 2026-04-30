import http from 'node:http';
import crypto from 'node:crypto';
import { createDatabase } from './database.js';

const PORT = Number(process.env.PORT || 8787);
const TOKEN_SECRET = process.env.HOMETASK_TOKEN_SECRET || 'hometask-local-dev-secret';

const defaultChecklist = [
  'Check-in đúng địa điểm',
  'Vệ sinh khu vực chính',
  'Vệ sinh bếp và toilet',
  'Thu gom rác và sắp xếp lại đồ dùng',
  'Chụp ảnh xác nhận kết quả',
];

function emptyDb() {
  return {
    users: [],
    helperProfiles: [],
    customerProfiles: [],
    bookings: [],
    bookingProgress: {},
    reviews: [],
    notifications: [],
    messages: [],
    assets: [],
    payments: [],
    auditLogs: [],
  };
}

function now() {
  return new Date().toISOString();
}

function id(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function base64url(input) {
  return Buffer.from(input).toString('base64url');
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, expected] = String(storedHash || '').split(':');
  if (!salt || !expected) {
    return false;
  }

  const actual = crypto.pbkdf2Sync(password, salt, 120000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'));
}

function signToken(user) {
  const payload = base64url(JSON.stringify({
    sub: user.id,
    role: user.userType,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  }));
  const signature = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  return `hometask.${payload}.${signature}`;
}

function verifyToken(token) {
  const [, payload, signature] = String(token || '').split('.');
  if (!payload || !signature) {
    return null;
  }

  const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  if (expected !== signature) {
    return null;
  }

  const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  return parsed.exp > Date.now() ? parsed : null;
}

function sanitizeUser(user, db) {
  if (!user) {
    return null;
  }

  const publicUser = stripPrivate(user);
  if (user.userType === 'helper') {
    const profile = db.helperProfiles.find((item) => item.id === user.id);
    return stripPrivate({ ...profile, ...publicUser });
  }
  if (user.userType === 'customer') {
    const profile = db.customerProfiles.find((item) => item.id === user.id);
    return stripPrivate({ ...profile, ...publicUser });
  }
  return publicUser;
}

function stripPrivate(record) {
  if (!record) {
    return record;
  }

  const { passwordHash, ...publicRecord } = record;
  return publicRecord;
}

async function readDb() {
  return database.read();
}

async function writeDb(db) {
  await database.write(db);
}

async function seedDb(db) {
  const createdAt = now();
  const admin = {
    id: 'admin_demo',
    name: 'Quản trị HomeTask',
    email: 'admin@hometask.vn',
    userType: 'admin',
    role: 'operations',
    passwordHash: hashPassword('admin123'),
    createdAt,
  };
  const helper = {
    id: '3',
    name: 'Chị Thu Hà',
    email: 'helper.demo@hometask.vn',
    userType: 'helper',
    phone: '0903456789',
    address: 'Quận Hải Châu, Đà Nẵng',
    passwordHash: hashPassword('helper123'),
    createdAt,
  };

  db.users.push(admin, helper);
  db.helperProfiles.push({
    ...helper,
    service: 'Dọn dẹp nhà',
    applicationStatus: 'approved',
    rating: 4.8,
    reviewsCount: 156,
    experience: '2 năm',
    location: helper.address,
    verified: true,
    imageUrl: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400',
    bio: 'Chuyên vệ sinh nhà cửa, làm việc nhanh gọn, sạch sẽ và tỉ mỉ.',
    skills: ['Vệ sinh tổng thể', 'Giặt ủi', 'Lau kính'],
    certifications: ['Chứng chỉ vệ sinh công nghiệp'],
    hourlyRate: 80000,
    availability: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'],
    completedJobs: 312,
    serviceAreas: ['Quận Hải Châu', 'Quận Thanh Khê'],
  });
  return db;
}

const database = await createDatabase({ emptyDb, seedDb });

async function parseBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function send(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

function getAuthUser(req, db) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const payload = verifyToken(token);
  return payload ? db.users.find((user) => user.id === payload.sub) : null;
}

function getProgress(db, bookingId) {
  if (!db.bookingProgress[bookingId]) {
    db.bookingProgress[bookingId] = {
      bookingId,
      checklist: defaultChecklist.map((label, index) => ({
        id: `task_${index + 1}`,
        label,
        completed: false,
      })),
      updatedAt: now(),
    };
  }
  return db.bookingProgress[bookingId];
}

function requireRole(user, roles) {
  return user && roles.includes(user.userType);
}

function aggregateReviews(db, helperId) {
  const reviews = db.reviews.filter((review) => review.helperId === helperId);
  if (reviews.length === 0) {
    const profile = db.helperProfiles.find((item) => item.id === helperId);
    return { rating: profile?.rating || 0, reviewsCount: profile?.reviewsCount || 0 };
  }
  return {
    rating: Number((reviews.reduce((total, review) => total + review.rating, 0) / reviews.length).toFixed(1)),
    reviewsCount: reviews.length,
  };
}

const BOOKING_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];
const PAYMENT_STATUSES = ['unpaid', 'paid'];
const USER_TYPES = ['customer', 'helper', 'admin'];
const APPLICATION_STATUSES = ['pending', 'approved', 'rejected'];
const rateLimitBuckets = new Map();
const RATE_LIMIT_RULES = [
  { name: 'auth-login', method: 'POST', pattern: /^\/auth\/login$/, limit: 30, windowMs: 60_000 },
  { name: 'auth-register', method: 'POST', pattern: /^\/auth\/register$/, limit: 20, windowMs: 60_000 },
  { name: 'chat', method: 'POST', pattern: /^\/bookings\/[^/]+\/messages$/, limit: 60, windowMs: 60_000 },
  { name: 'upload', method: 'POST', pattern: /^\/uploads\/presign$/, limit: 30, windowMs: 60_000 },
  { name: 'payment', method: 'POST', pattern: /^\/payments\/checkout$/, limit: 20, windowMs: 60_000 },
];

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00`));
}

function isValidTime(value) {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function validationError(res, errors) {
  return send(res, 400, { error: 'validation_error', errors });
}

function getClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

function checkRateLimit(req, url) {
  const rule = RATE_LIMIT_RULES.find((item) => item.method === req.method && item.pattern.test(url.pathname));
  if (!rule) {
    return null;
  }

  const nowTime = Date.now();
  const key = `${rule.name}:${getClientIp(req)}`;
  const current = rateLimitBuckets.get(key);
  if (!current || current.resetAt <= nowTime) {
    const bucket = { count: 1, resetAt: nowTime + rule.windowMs };
    rateLimitBuckets.set(key, bucket);
    return null;
  }

  current.count += 1;
  if (current.count > rule.limit) {
    return {
      error: 'rate_limited',
      retryAfterSeconds: Math.ceil((current.resetAt - nowTime) / 1000),
    };
  }

  return null;
}

function addAuditLog(db, { actor, action, targetType, targetId, metadata = {} }) {
  const auditLog = {
    id: id('audit'),
    actorId: actor?.id || 'system',
    actorType: actor?.userType || 'system',
    actorName: actor?.name || 'System',
    action,
    targetType,
    targetId,
    metadata,
    createdAt: now(),
  };
  db.auditLogs.unshift(auditLog);
  db.auditLogs = db.auditLogs.slice(0, 1000);
  return auditLog;
}

function findBooking(db, bookingId) {
  return db.bookings.find((booking) => booking.id === bookingId);
}

function canAccessBooking(user, booking) {
  return Boolean(
    user &&
    booking &&
    (
      user.userType === 'admin' ||
      booking.customerId === user.id ||
      booking.helperId === user.id
    )
  );
}

function canUpdateBookingStatus(user, booking, status) {
  if (!canAccessBooking(user, booking)) {
    return false;
  }

  if (user.userType === 'admin') {
    return true;
  }

  if (booking.customerId === user.id) {
    return status === 'cancelled';
  }

  if (booking.helperId === user.id) {
    return ['confirmed', 'completed', 'cancelled'].includes(status);
  }

  return false;
}

function validateLogin(input) {
  const errors = [];
  if (!isValidEmail(input.email)) errors.push('email must be valid');
  if (!isNonEmptyString(input.password)) errors.push('password is required');
  return errors;
}

function validateRegister(input) {
  const errors = [];
  if (!isNonEmptyString(input.name)) errors.push('name is required');
  if (!isValidEmail(input.email)) errors.push('email must be valid');
  if (!USER_TYPES.includes(input.userType)) errors.push('userType must be customer, helper, or admin');
  if (!isNonEmptyString(input.password) || input.password.length < 8) errors.push('password must be at least 8 characters');
  if (input.userType === 'helper') {
    if (!isNonEmptyString(input.service)) errors.push('service is required for helper applications');
    if (!isNonEmptyString(input.experience)) errors.push('experience is required for helper applications');
    if (!isNonEmptyString(input.location)) errors.push('location is required for helper applications');
  }
  return errors;
}

function validateProfileUpdate(input) {
  const errors = [];
  const stringFields = ['name', 'avatar', 'phone', 'address', 'bio', 'bankName', 'bankAccount', 'location', 'experience'];
  const arrayFields = ['skills', 'availability', 'serviceAreas', 'certifications', 'preferences', 'favoriteHelpers'];
  for (const field of stringFields) {
    if (input[field] !== undefined && typeof input[field] !== 'string') errors.push(`${field} must be a string`);
  }
  for (const field of arrayFields) {
    if (input[field] !== undefined && (!Array.isArray(input[field]) || input[field].some((item) => typeof item !== 'string'))) {
      errors.push(`${field} must be an array of strings`);
    }
  }
  if (input.hourlyRate !== undefined && (!Number.isFinite(Number(input.hourlyRate)) || Number(input.hourlyRate) <= 0)) {
    errors.push('hourlyRate must be a positive number');
  }
  return errors;
}

function validateBookingInput(input) {
  const errors = [];
  if (input.helperId !== undefined && input.helperId !== '' && typeof input.helperId !== 'string') errors.push('helperId must be a string');
  if (input.helperName !== undefined && typeof input.helperName !== 'string') errors.push('helperName must be a string');
  if (!isNonEmptyString(input.service)) errors.push('service is required');
  if (!isValidDate(input.date)) errors.push('date must use YYYY-MM-DD');
  if (!isValidTime(input.time)) errors.push('time must use HH:mm');
  if (!Number.isFinite(Number(input.hours)) || Number(input.hours) <= 0 || Number(input.hours) > 12) errors.push('hours must be between 0 and 12');
  if (!isNonEmptyString(input.address)) errors.push('address is required');
  if (!Number.isFinite(Number(input.totalPrice)) || Number(input.totalPrice) <= 0) errors.push('totalPrice must be a positive number');
  if (input.notes !== undefined && typeof input.notes !== 'string') errors.push('notes must be a string');
  return errors;
}

function validateStatusInput(input) {
  return BOOKING_STATUSES.includes(input.status) ? [] : ['status is invalid'];
}

function validatePaymentInput(input) {
  return PAYMENT_STATUSES.includes(input.paymentStatus) ? [] : ['paymentStatus is invalid'];
}

function validateProgressInput(input) {
  const errors = [];
  if (input.checklist !== undefined) {
    if (!Array.isArray(input.checklist)) {
      errors.push('checklist must be an array');
    } else if (input.checklist.some((item) => !isNonEmptyString(item.id) || typeof item.completed !== 'boolean')) {
      errors.push('checklist items must include id and completed');
    }
  }
  for (const field of ['checkIn', 'checkOut']) {
    if (input[field] !== undefined) {
      const point = input[field];
      if (
        typeof point !== 'object' ||
        !Number.isFinite(Number(point.latitude)) ||
        !Number.isFinite(Number(point.longitude)) ||
        Math.abs(Number(point.latitude)) > 90 ||
        Math.abs(Number(point.longitude)) > 180
      ) {
        errors.push(`${field} must include valid latitude and longitude`);
      }
    }
  }
  if (input.photoConfirmation !== undefined && (typeof input.photoConfirmation !== 'object' || !isNonEmptyString(input.photoConfirmation.url))) {
    errors.push('photoConfirmation must include url');
  }
  return errors;
}

function validateReviewInput(input) {
  const errors = [];
  if (!isNonEmptyString(input.bookingId)) errors.push('bookingId is required');
  if (!isNonEmptyString(input.helperId)) errors.push('helperId is required');
  if (!Number.isFinite(Number(input.rating)) || Number(input.rating) < 1 || Number(input.rating) > 5) errors.push('rating must be between 1 and 5');
  if (!isNonEmptyString(input.comment)) errors.push('comment is required');
  if (!isNonEmptyString(input.service)) errors.push('service is required');
  if (input.images !== undefined && (!Array.isArray(input.images) || input.images.some((item) => typeof item !== 'string'))) {
    errors.push('images must be an array of strings');
  }
  return errors;
}

function validateMessageInput(input) {
  if (!isNonEmptyString(input.message) || input.message.length > 1000) {
    return ['message is required and must be under 1000 characters'];
  }
  return [];
}

async function route(req, res) {
  if (req.method === 'OPTIONS') {
    return send(res, 204, {});
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const rateLimit = checkRateLimit(req, url);
  if (rateLimit) {
    return send(res, 429, rateLimit);
  }

  const db = await readDb();
  const user = getAuthUser(req, db);

  try {
    if (req.method === 'GET' && url.pathname === '/health') {
      return send(res, 200, { ok: true, mode: 'local-api', database: database.driver, time: now() });
    }

    if (req.method === 'POST' && url.pathname === '/auth/register') {
      const input = await parseBody(req);
      const errors = validateRegister(input);
      if (errors.length) return validationError(res, errors);
      if (input.userType === 'admin') return send(res, 403, { error: 'admin registration is disabled' });
      if (db.users.some((item) => item.email.toLowerCase() === input.email.trim().toLowerCase())) {
        return send(res, 409, { error: 'email already exists' });
      }

      const nextUser = {
        id: id('user'),
        name: input.name.trim(),
        email: input.email.trim(),
        avatar: input.avatar,
        userType: input.userType,
        phone: input.phone,
        address: input.address,
        passwordHash: hashPassword(input.password || 'password123'),
        createdAt: now(),
      };

      db.users.push(nextUser);
      if (nextUser.userType === 'helper') {
        db.helperProfiles.push({
          ...input,
          ...nextUser,
          applicationStatus: input.applicationStatus || 'pending',
          verified: false,
          rating: input.rating || 0,
          reviewsCount: input.reviewsCount || 0,
          completedJobs: input.completedJobs || 0,
        });
      }
      if (nextUser.userType === 'customer') {
        db.customerProfiles.push({
          id: nextUser.id,
          preferences: input.preferences || [],
          favoriteHelpers: input.favoriteHelpers || [],
        });
      }

      addAuditLog(db, {
        actor: nextUser,
        action: 'auth.register',
        targetType: 'user',
        targetId: nextUser.id,
        metadata: { userType: nextUser.userType },
      });
      await writeDb(db);
      return send(res, 201, { user: sanitizeUser(nextUser, db), accessToken: signToken(nextUser) });
    }

    if (req.method === 'POST' && url.pathname === '/auth/login') {
      const input = await parseBody(req);
      const errors = validateLogin(input);
      if (errors.length) return validationError(res, errors);
      const foundUser = db.users.find((item) => item.email.toLowerCase() === String(input.email || '').trim().toLowerCase());
      if (!foundUser || !verifyPassword(input.password || '', foundUser.passwordHash)) {
        return send(res, 401, { error: 'invalid credentials' });
      }
      addAuditLog(db, {
        actor: foundUser,
        action: 'auth.login',
        targetType: 'user',
        targetId: foundUser.id,
        metadata: { userType: foundUser.userType },
      });
      await writeDb(db);
      return send(res, 200, { user: sanitizeUser(foundUser, db), accessToken: signToken(foundUser) });
    }

    if (req.method === 'GET' && url.pathname === '/helpers') {
      const helpers = db.helperProfiles
        .filter((profile) => profile.applicationStatus === 'approved' && profile.verified)
        .map((profile) => stripPrivate({ ...profile, ...aggregateReviews(db, profile.id) }));
      return send(res, 200, helpers);
    }

    if (req.method === 'PATCH' && url.pathname === '/me') {
      if (!user) return send(res, 401, { error: 'unauthorized' });
      const input = await parseBody(req);
      const errors = validateProfileUpdate(input);
      if (errors.length) return validationError(res, errors);
      const allowedUserFields = ['name', 'avatar', 'phone', 'address'];
      db.users = db.users.map((item) => (
        item.id === user.id
          ? {
              ...item,
              ...Object.fromEntries(Object.entries(input).filter(([key]) => allowedUserFields.includes(key))),
              updatedAt: now(),
            }
          : item
      ));

      if (user.userType === 'helper') {
        const allowedHelperFields = [
          'bio',
          'skills',
          'availability',
          'serviceAreas',
          'bankName',
          'bankAccount',
          'location',
          'hourlyRate',
          'experience',
          'certifications',
        ];
        db.helperProfiles = db.helperProfiles.map((profile) => (
          profile.id === user.id
            ? {
                ...profile,
                ...Object.fromEntries(Object.entries(input).filter(([key]) => allowedHelperFields.includes(key))),
                updatedAt: now(),
              }
            : profile
        ));
      }

      if (user.userType === 'customer') {
        const allowedCustomerFields = ['preferences', 'favoriteHelpers'];
        db.customerProfiles = db.customerProfiles.map((profile) => (
          profile.id === user.id
            ? {
                ...profile,
                ...Object.fromEntries(Object.entries(input).filter(([key]) => allowedCustomerFields.includes(key))),
                updatedAt: now(),
              }
            : profile
        ));
      }

      await writeDb(db);
      const updatedUser = db.users.find((item) => item.id === user.id);
      addAuditLog(db, {
        actor: user,
        action: 'user.profile_updated',
        targetType: 'user',
        targetId: user.id,
        metadata: { fields: Object.keys(input) },
      });
      await writeDb(db);
      return send(res, 200, sanitizeUser(updatedUser, db));
    }

    if (req.method === 'POST' && url.pathname === '/bookings') {
      if (!user) return send(res, 401, { error: 'unauthorized' });
      if (!requireRole(user, ['customer', 'admin'])) return send(res, 403, { error: 'only customers can create bookings' });
      const input = await parseBody(req);
      const errors = validateBookingInput(input);
      if (errors.length) return validationError(res, errors);
      if (input.customerId && input.customerId !== user.id && user.userType !== 'admin') {
        return send(res, 403, { error: 'cannot create a booking for another customer' });
      }
      if (input.helperId) {
        const helper = db.helperProfiles.find((profile) => profile.id === input.helperId && profile.applicationStatus === 'approved' && profile.verified);
        if (!helper) return send(res, 400, { error: 'helper is not available for booking' });
      }

      const booking = {
        id: id('booking'),
        customerId: input.customerId || user.id,
        helperId: input.helperId || '',
        helperName: input.helperName || '',
        service: input.service,
        date: input.date,
        time: input.time,
        hours: Number(input.hours),
        address: input.address,
        notes: input.notes,
        totalPrice: Number(input.totalPrice),
        status: 'pending',
        paymentStatus: 'unpaid',
        createdAt: now(),
      };
      db.bookings.unshift(booking);
      getProgress(db, booking.id);
      addAuditLog(db, {
        actor: user,
        action: 'booking.created',
        targetType: 'booking',
        targetId: booking.id,
        metadata: { helperId: booking.helperId, totalPrice: booking.totalPrice },
      });
      await writeDb(db);
      return send(res, 201, booking);
    }

    if (req.method === 'GET' && url.pathname === '/bookings') {
      if (!user) return send(res, 401, { error: 'unauthorized' });
      const customerId = url.searchParams.get('customerId');
      const helperId = url.searchParams.get('helperId');
      let bookings = db.bookings;
      if (user.userType === 'customer') {
        bookings = bookings.filter((booking) => booking.customerId === user.id);
      } else if (user.userType === 'helper') {
        bookings = bookings.filter((booking) => booking.helperId === user.id);
      } else {
        if (customerId) bookings = bookings.filter((booking) => booking.customerId === customerId);
        if (helperId) bookings = bookings.filter((booking) => booking.helperId === helperId);
      }
      return send(res, 200, bookings);
    }

    if (req.method === 'GET' && url.pathname === '/admin/bookings') {
      if (!requireRole(user, ['admin'])) return send(res, 403, { error: 'forbidden' });
      return send(res, 200, db.bookings);
    }

    if (req.method === 'GET' && url.pathname === '/admin/audit-logs') {
      if (!requireRole(user, ['admin'])) return send(res, 403, { error: 'forbidden' });
      const action = url.searchParams.get('action');
      const limit = Math.min(Number(url.searchParams.get('limit') || 100), 500);
      let auditLogs = db.auditLogs;
      if (action) auditLogs = auditLogs.filter((log) => log.action === action);
      return send(res, 200, auditLogs.slice(0, limit));
    }

    const statusMatch = url.pathname.match(/^\/bookings\/([^/]+)\/status$/);
    if (req.method === 'PATCH' && statusMatch) {
      if (!user) return send(res, 401, { error: 'unauthorized' });
      const input = await parseBody(req);
      const errors = validateStatusInput(input);
      if (errors.length) return validationError(res, errors);
      const booking = findBooking(db, statusMatch[1]);
      if (!booking) return send(res, 404, { error: 'booking not found' });
      if (!canUpdateBookingStatus(user, booking, input.status)) return send(res, 403, { error: 'forbidden' });
      db.bookings = db.bookings.map((booking) => (
        booking.id === statusMatch[1] ? { ...booking, status: input.status, updatedAt: now() } : booking
      ));
      addAuditLog(db, {
        actor: user,
        action: 'booking.status_updated',
        targetType: 'booking',
        targetId: statusMatch[1],
        metadata: { from: booking.status, to: input.status },
      });
      await writeDb(db);
      return send(res, 200, db.bookings.find((booking) => booking.id === statusMatch[1]));
    }

    const paymentMatch = url.pathname.match(/^\/bookings\/([^/]+)\/payment$/);
    if (req.method === 'PATCH' && paymentMatch) {
      if (!user) return send(res, 401, { error: 'unauthorized' });
      const input = await parseBody(req);
      const errors = validatePaymentInput(input);
      if (errors.length) return validationError(res, errors);
      const booking = findBooking(db, paymentMatch[1]);
      if (!booking) return send(res, 404, { error: 'booking not found' });
      if (!(user.userType === 'admin' || booking.customerId === user.id)) return send(res, 403, { error: 'forbidden' });
      db.bookings = db.bookings.map((booking) => (
        booking.id === paymentMatch[1] ? { ...booking, paymentStatus: input.paymentStatus, updatedAt: now() } : booking
      ));
      addAuditLog(db, {
        actor: user,
        action: 'booking.payment_updated',
        targetType: 'booking',
        targetId: paymentMatch[1],
        metadata: { from: booking.paymentStatus || 'unpaid', to: input.paymentStatus },
      });
      await writeDb(db);
      return send(res, 200, db.bookings.find((booking) => booking.id === paymentMatch[1]));
    }

    const progressMatch = url.pathname.match(/^\/bookings\/([^/]+)\/progress$/);
    if (progressMatch) {
      if (!user) return send(res, 401, { error: 'unauthorized' });
      const booking = findBooking(db, progressMatch[1]);
      if (!booking) return send(res, 404, { error: 'booking not found' });
      if (!canAccessBooking(user, booking)) return send(res, 403, { error: 'forbidden' });
      if (req.method === 'GET') return send(res, 200, getProgress(db, progressMatch[1]));
      if (req.method === 'PATCH') {
        if (!(user.userType === 'admin' || booking.helperId === user.id)) return send(res, 403, { error: 'forbidden' });
        const input = await parseBody(req);
        const errors = validateProgressInput(input);
        if (errors.length) return validationError(res, errors);
        db.bookingProgress[progressMatch[1]] = { ...getProgress(db, progressMatch[1]), ...input, updatedAt: now() };
        addAuditLog(db, {
          actor: user,
          action: 'booking.progress_updated',
          targetType: 'booking',
          targetId: progressMatch[1],
          metadata: { fields: Object.keys(input) },
        });
        await writeDb(db);
        return send(res, 200, db.bookingProgress[progressMatch[1]]);
      }
    }

    if (req.method === 'GET' && url.pathname === '/admin/helper-applications') {
      if (!requireRole(user, ['admin'])) return send(res, 403, { error: 'forbidden' });
      return send(res, 200, db.helperProfiles
        .filter((profile) => profile.applicationStatus !== 'approved')
        .map((profile) => stripPrivate(profile)));
    }

    const applicationMatch = url.pathname.match(/^\/admin\/helper-applications\/([^/]+)\/status$/);
    if (req.method === 'PATCH' && applicationMatch) {
      if (!requireRole(user, ['admin'])) return send(res, 403, { error: 'forbidden' });
      const input = await parseBody(req);
      if (!APPLICATION_STATUSES.includes(input.applicationStatus)) {
        return validationError(res, ['applicationStatus is invalid']);
      }
      db.helperProfiles = db.helperProfiles.map((profile) => (
        profile.id === applicationMatch[1]
          ? { ...profile, applicationStatus: input.applicationStatus, verified: input.applicationStatus === 'approved', reviewedAt: now(), reviewedBy: user.id }
          : profile
      ));
      addAuditLog(db, {
        actor: user,
        action: 'helper_application.status_updated',
        targetType: 'helper',
        targetId: applicationMatch[1],
        metadata: { applicationStatus: input.applicationStatus },
      });
      await writeDb(db);
      return send(res, 200, stripPrivate(db.helperProfiles.find((profile) => profile.id === applicationMatch[1])));
    }

    if (req.method === 'POST' && url.pathname === '/reviews') {
      if (!user) return send(res, 401, { error: 'unauthorized' });
      if (!requireRole(user, ['customer'])) return send(res, 403, { error: 'only customers can create reviews' });
      const input = await parseBody(req);
      const errors = validateReviewInput(input);
      if (errors.length) return validationError(res, errors);
      const booking = findBooking(db, input.bookingId);
      if (!booking) return send(res, 404, { error: 'booking not found' });
      if (booking.customerId !== user.id) return send(res, 403, { error: 'forbidden' });
      if (booking.status !== 'completed') return send(res, 409, { error: 'booking must be completed before review' });
      if (booking.helperId !== input.helperId) return validationError(res, ['helperId must match the booking']);
      if (db.reviews.some((review) => review.bookingId === input.bookingId && review.customerId === user.id)) {
        return send(res, 409, { error: 'booking already reviewed' });
      }
      const review = { ...input, id: id('review'), customerId: user.id, customerName: input.customerName || user.name, date: now(), createdAt: now() };
      db.reviews.push(review);
      const stats = aggregateReviews(db, review.helperId);
      db.helperProfiles = db.helperProfiles.map((profile) => (
        profile.id === review.helperId ? { ...profile, ...stats } : profile
      ));
      addAuditLog(db, {
        actor: user,
        action: 'review.created',
        targetType: 'booking',
        targetId: review.bookingId,
        metadata: { helperId: review.helperId, rating: review.rating },
      });
      await writeDb(db);
      return send(res, 201, review);
    }

    if (req.method === 'GET' && url.pathname === '/reviews') {
      if (!user) return send(res, 401, { error: 'unauthorized' });
      const bookingId = url.searchParams.get('bookingId');
      if (bookingId) {
        return send(res, 200, {
          reviewed: db.reviews.some((review) => review.bookingId === bookingId && review.customerId === user.id),
        });
      }
      return send(res, 200, db.reviews);
    }

    const reviewsMatch = url.pathname.match(/^\/helpers\/([^/]+)\/reviews$/);
    if (req.method === 'GET' && reviewsMatch) {
      const reviews = db.reviews.filter((review) => review.helperId === reviewsMatch[1]);
      return send(res, 200, { reviews, stats: aggregateReviews(db, reviewsMatch[1]) });
    }

    const messagesMatch = url.pathname.match(/^\/bookings\/([^/]+)\/messages$/);
    if (messagesMatch) {
      if (!user) return send(res, 401, { error: 'unauthorized' });
      const booking = findBooking(db, messagesMatch[1]);
      if (!booking) return send(res, 404, { error: 'booking not found' });
      if (!canAccessBooking(user, booking)) return send(res, 403, { error: 'forbidden' });
      if (req.method === 'GET') {
        return send(res, 200, db.messages.filter((message) => message.bookingId === messagesMatch[1]));
      }
      if (req.method === 'POST') {
        const input = await parseBody(req);
        const errors = validateMessageInput(input);
        if (errors.length) return validationError(res, errors);
        const message = { id: id('message'), bookingId: messagesMatch[1], senderId: user.id, senderName: user.name, message: input.message, createdAt: now() };
        db.messages.push(message);
        addAuditLog(db, {
          actor: user,
          action: 'chat.message_sent',
          targetType: 'booking',
          targetId: messagesMatch[1],
          metadata: { messageId: message.id },
        });
        await writeDb(db);
        return send(res, 201, message);
      }
    }

    if (req.method === 'GET' && url.pathname === '/notifications') {
      if (!user) return send(res, 401, { error: 'unauthorized' });
      return send(res, 200, db.notifications.filter((item) => item.userId === user.id));
    }

    if (req.method === 'POST' && url.pathname === '/notifications') {
      if (!user) return send(res, 401, { error: 'unauthorized' });
      const input = await parseBody(req);
      const errors = [];
      if (!isNonEmptyString(input.userId)) errors.push('userId is required');
      if (!isNonEmptyString(input.title)) errors.push('title is required');
      if (!isNonEmptyString(input.message)) errors.push('message is required');
      if (errors.length) return validationError(res, errors);
      const notification = { ...input, id: id('notification'), read: false, createdAt: now() };
      db.notifications.unshift(notification);
      addAuditLog(db, {
        actor: user,
        action: 'notification.created',
        targetType: 'user',
        targetId: input.userId,
        metadata: { title: input.title },
      });
      await writeDb(db);
      return send(res, 201, notification);
    }

    if (req.method === 'PATCH' && url.pathname === '/notifications/read') {
      if (!user) return send(res, 401, { error: 'unauthorized' });
      db.notifications = db.notifications.map((item) => item.userId === user.id ? { ...item, read: true } : item);
      await writeDb(db);
      return send(res, 200, { ok: true });
    }

    if (req.method === 'POST' && url.pathname === '/uploads/presign') {
      if (!user) return send(res, 401, { error: 'unauthorized' });
      const input = await parseBody(req);
      const errors = [];
      if (!isNonEmptyString(input.filename)) errors.push('filename is required');
      if (!isNonEmptyString(input.contentType)) errors.push('contentType is required');
      if (input.purpose !== undefined && typeof input.purpose !== 'string') errors.push('purpose must be a string');
      if (errors.length) return validationError(res, errors);
      const asset = {
        id: id('asset'),
        ownerId: user.id,
        filename: input.filename,
        contentType: input.contentType,
        purpose: input.purpose,
        storageKey: `local/${crypto.randomUUID()}-${input.filename}`,
        publicUrl: `/local-assets/${input.filename}`,
        createdAt: now(),
      };
      db.assets.push(asset);
      addAuditLog(db, {
        actor: user,
        action: 'upload.presigned',
        targetType: 'asset',
        targetId: asset.id,
        metadata: { filename: asset.filename, purpose: asset.purpose },
      });
      await writeDb(db);
      return send(res, 201, {
        assetId: asset.id,
        uploadUrl: `http://localhost:${PORT}/uploads/local/${asset.id}`,
        publicUrl: asset.publicUrl,
      });
    }

    if (req.method === 'POST' && url.pathname === '/payments/checkout') {
      if (!user) return send(res, 401, { error: 'unauthorized' });
      const input = await parseBody(req);
      if (!isNonEmptyString(input.bookingId)) return validationError(res, ['bookingId is required']);
      const booking = db.bookings.find((item) => item.id === input.bookingId);
      if (!booking) return send(res, 404, { error: 'booking not found' });
      if (!(user.userType === 'admin' || booking.customerId === user.id)) return send(res, 403, { error: 'forbidden' });
      const payment = {
        id: id('payment'),
        bookingId: booking.id,
        provider: input.provider || 'local',
        amount: booking.totalPrice,
        currency: 'VND',
        status: 'pending',
        createdAt: now(),
      };
      db.payments.push(payment);
      addAuditLog(db, {
        actor: user,
        action: 'payment.checkout_created',
        targetType: 'booking',
        targetId: booking.id,
        metadata: { paymentId: payment.id, provider: payment.provider, amount: payment.amount },
      });
      await writeDb(db);
      return send(res, 201, { checkoutUrl: `http://localhost:${PORT}/payments/local/${payment.id}`, payment });
    }

    return send(res, 404, { error: 'not found' });
  } catch (error) {
    console.error(error);
    if (error instanceof SyntaxError) {
      return send(res, 400, { error: 'invalid_json' });
    }
    return send(res, 500, { error: 'internal server error', detail: error.message });
  }
}

http.createServer(route).listen(PORT, () => {
  console.log(`HomeTask API listening on http://localhost:${PORT}`);
  console.log(`Database driver: ${database.driver} (${database.location})`);
  console.log('Seed users: admin@hometask.vn/admin123, helper.demo@hometask.vn/helper123');
});
