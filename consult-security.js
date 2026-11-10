'use strict';

const net = require('node:net');

// Emergency anti-spam guard for the public consultation endpoint.
// No third-party packages or environment variables are required.
const IP_WINDOW_MS = 10 * 60 * 1000;
const IP_LIMIT = 3;
const MAX_TRACKED_IPS = 5000;
const PRUNE_INTERVAL_MS = 60 * 1000;
const PHONE_COOLDOWN_MS = 10 * 60 * 1000;
const EXACT_DUPLICATE_MS = 24 * 60 * 60 * 1000;
const attempts = new Map();
let nextPrune = Date.now() + PRUNE_INTERVAL_MS;

function clientIp(req) {
  // Render forwards the real client IP as the first X-Forwarded-For entry.
  // Trust this only when traffic always arrives through Render's proxy.
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  if (net.isIP(forwarded)) return forwarded;
  const direct = String(req.socket.remoteAddress || '').trim();
  return net.isIP(direct) ? direct : 'unknown';
}

function reject(reason, seconds) {
  return { ok: false, reason, retryAfter: Math.max(1, Math.ceil(seconds)) };
}

function preflight(req) {
  const now = Date.now();
  const contentType = String(req.headers['content-type'] || '').toLowerCase();
  if (!contentType.startsWith('application/json')) {
    return { ok: false, reason: 'content-type', status: 415 };
  }
  const ip = clientIp(req);
  let hits = (attempts.get(ip) || []).filter(time => now - time < IP_WINDOW_MS);
  if (hits.length >= IP_LIMIT) {
    return reject('ip-limit', (IP_WINDOW_MS - (now - hits[0])) / 1000);
  }
  hits.push(now);
  attempts.set(ip, hits);
  // Prune no more than once per minute, rather than scanning the whole map
  // on every request once traffic comes from many different addresses.
  if (now >= nextPrune) {
    for (const [key, times] of attempts) {
      const fresh = times.filter(time => now - time < IP_WINDOW_MS);
      if (fresh.length) attempts.set(key, fresh);
      else attempts.delete(key);
    }
    nextPrune = now + PRUNE_INTERVAL_MS;
  }
  while (attempts.size > MAX_TRACKED_IPS) {
    attempts.delete(attempts.keys().next().value);
  }
  return { ok: true };
}

function normalizeText(value, max) {
  if (value == null) return '';
  if (typeof value !== 'string') throw new Error('INVALID_FIELDS');
  const text = value.trim().replace(/\s+/g, ' ');
  if (text.length > max) throw new Error('INVALID_FIELDS');
  return text;
}

function validate(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('INVALID_FIELDS');
  }
  const name = normalizeText(payload.name, 100);
  const phone = normalizeText(payload.phone, 36);
  const company = normalizeText(payload.company, 160);
  const service = normalizeText(payload.service, 140);
  const comment = normalizeText(payload.comment, 2000);
  const phoneDigits = phone.replace(/\D/g, '');
  if (name.length < 2 || phoneDigits.length < 7 || phoneDigits.length > 15) {
    throw new Error('INVALID_FIELDS');
  }
  if (payload.website || payload.faxNumber) throw new Error('INVALID_FIELDS');
  return { name, phone, company, service, comment };
}

function normalized(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function isDuplicate(data, saved, now = Date.now()) {
  if (!Array.isArray(saved)) return false;
  const phone = data.phone.replace(/\D/g, '');
  const fields = ['name', 'company', 'service', 'comment'];
  for (let i = saved.length - 1, examined = 0; i >= 0 && examined < 3000; i--, examined++) {
    const old = saved[i];
    if (!old || typeof old !== 'object') continue;
    const timestamp = Date.parse(old.createdAt || '');
    const age = now - timestamp;
    if (!Number.isFinite(age) || age < 0 || age > EXACT_DUPLICATE_MS) continue;
    if (String(old.phone || '').replace(/\D/g, '') !== phone) continue;
    if (age <= PHONE_COOLDOWN_MS) return true;
    if (fields.every(field => normalized(old[field]) === normalized(data[field]))) return true;
  }
  return false;
}

module.exports = { preflight, validate, isDuplicate };
