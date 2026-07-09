const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');
const REQUESTS_FILE = path.join(DATA_DIR, 'consult-requests.json');
const NEWS_FILE = path.join(DATA_DIR, 'news.json');
const MEDIA_DIR = path.join(DATA_DIR, 'media');
const ADMIN_PASSWORD = String(process.env.ADMIN_PASSWORD || '');
const ADMIN_SESSION_SECRET = String(process.env.ADMIN_SESSION_SECRET || '');
const SESSION_COOKIE = 'af_admin_session';
const SESSION_TTL_SECONDS = 8 * 60 * 60;
const loginAttempts = new Map();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8'
};

function ensureDataFiles() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
  if (!fs.existsSync(REQUESTS_FILE)) fs.writeFileSync(REQUESTS_FILE, '[]', 'utf8');
  if (!fs.existsSync(NEWS_FILE)) {
    const fallback = path.join(ROOT, 'data', 'news.json');
    if (fallback !== NEWS_FILE && fs.existsSync(fallback)) fs.copyFileSync(fallback, NEWS_FILE);
    else fs.writeFileSync(NEWS_FILE, '[]', 'utf8');
  }
}
ensureDataFiles();

function send(res, status, body, type = 'application/json; charset=utf-8', extraHeaders = {}) {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', ...extraHeaders });
  res.end(body);
}

function sendJson(res, status, value, extraHeaders = {}) {
  send(res, status, JSON.stringify(value), 'application/json; charset=utf-8', extraHeaders);
}

function serveFile(res, filePath, status = 200) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    const notFound = path.join(ROOT, '404.html');
    if (filePath !== notFound && fs.existsSync(notFound)) return serveFile(res, notFound, 404);
    return send(res, 404, 'Not found', 'text/plain; charset=utf-8');
  }
  const ext = path.extname(filePath).toLowerCase();
  const cache = ['.css', '.js', '.png', '.jpg', '.jpeg', '.webp', '.svg'].includes(ext)
    ? 'public, max-age=3600'
    : 'no-cache';
  res.writeHead(status, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': cache });
  fs.createReadStream(filePath).pipe(res);
}

function readJsonBody(req, maxBytes = 6_000_000) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (Buffer.byteLength(raw, 'utf8') > maxBytes) {
        reject(new Error('REQUEST_TOO_LARGE'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try { resolve(JSON.parse(raw || '{}')); }
      catch { reject(new Error('INVALID_JSON')); }
    });
    req.on('error', reject);
  });
}

function readNews() {
  try {
    const value = JSON.parse(fs.readFileSync(NEWS_FILE, 'utf8'));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeNews(items) {
  const temp = `${NEWS_FILE}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(items, null, 2), 'utf8');
  fs.renameSync(temp, NEWS_FILE);
}

function safeEqual(a, b) {
  const aa = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

function getCookies(req) {
  const out = {};
  const raw = req.headers.cookie || '';
  raw.split(';').forEach(part => {
    const idx = part.indexOf('=');
    if (idx > 0) out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  });
  return out;
}

function sign(value) {
  return crypto.createHmac('sha256', ADMIN_SESSION_SECRET).update(value).digest('base64url');
}

function createSessionToken() {
  const expires = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const nonce = crypto.randomBytes(18).toString('base64url');
  const payload = `${expires}.${nonce}`;
  return `${payload}.${sign(payload)}`;
}

function verifySessionToken(token) {
  if (!token || !ADMIN_SESSION_SECRET) return false;
  const parts = String(token).split('.');
  if (parts.length !== 3) return false;
  const payload = `${parts[0]}.${parts[1]}`;
  if (!safeEqual(parts[2], sign(payload))) return false;
  const expires = Number(parts[0]);
  return Number.isFinite(expires) && expires > Math.floor(Date.now() / 1000);
}

function isAdmin(req) {
  return verifySessionToken(getCookies(req)[SESSION_COOKIE]);
}

function sessionCookie(req, token, maxAge = SESSION_TTL_SECONDS) {
  const forwarded = String(req.headers['x-forwarded-proto'] || '').toLowerCase();
  const secure = forwarded === 'https' ? '; Secure' : '';
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

function requireAdmin(req, res) {
  if (!isAdmin(req)) {
    sendJson(res, 401, { message: 'Avtorizatsiya talab qilinadi' });
    return false;
  }
  return true;
}

function slugify(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[’‘ʻʼ']/g, '')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 90) || `yangilik-${Date.now()}`;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function textToHtml(value) {
  const lines = String(value || '').replace(/\r/g, '').split('\n');
  let html = '';
  let listOpen = false;
  const closeList = () => { if (listOpen) { html += '</ul>'; listOpen = false; } };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { closeList(); continue; }
    if (line.startsWith('## ')) {
      closeList(); html += `<h3>${escapeHtml(line.slice(3))}</h3>`;
    } else if (line.startsWith('- ')) {
      if (!listOpen) { html += '<ul>'; listOpen = true; }
      html += `<li>${escapeHtml(line.slice(2))}</li>`;
    } else {
      closeList(); html += `<p>${escapeHtml(line)}</p>`;
    }
  }
  closeList();
  return html;
}

function validateNewsInput(data, existingId = '') {
  const title = String(data.title || '').trim();
  const category = String(data.category || '').trim();
  const excerpt = String(data.excerpt || '').trim();
  const date = String(data.date || '').trim();
  const contentText = String(data.contentText || '').trim();
  const status = data.status === 'draft' ? 'draft' : 'published';
  if (title.length < 5 || title.length > 180) throw new Error('Sarlavha 5–180 belgi bo‘lishi kerak');
  if (category.length < 2 || category.length > 60) throw new Error('Kategoriya noto‘g‘ri');
  if (excerpt.length < 15 || excerpt.length > 500) throw new Error('Qisqa tavsif 15–500 belgi bo‘lishi kerak');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Sana noto‘g‘ri');
  if (contentText.length < 30 || contentText.length > 30000) throw new Error('Maqola matni 30–30000 belgi bo‘lishi kerak');
  return {
    id: existingId || slugify(data.id || title),
    title, category, excerpt, date, status,
    content: textToHtml(contentText),
    updatedAt: new Date().toISOString()
  };
}

function saveImage(dataUrl, originalName = '') {
  if (!dataUrl) return '';
  const match = String(dataUrl).match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw new Error('Rasm formati PNG, JPG yoki WEBP bo‘lishi kerak');
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length > 3_000_000) throw new Error('Rasm hajmi 3 MB dan oshmasligi kerak');
  const extMap = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp' };
  const ext = extMap[match[1]];
  const base = slugify(path.basename(originalName, path.extname(originalName))) || 'news';
  const filename = `${Date.now()}-${crypto.randomBytes(5).toString('hex')}-${base.slice(0, 35)}${ext}`;
  fs.writeFileSync(path.join(MEDIA_DIR, filename), buffer);
  return `/media/${filename}`;
}

function deleteManagedImage(imagePath) {
  if (!String(imagePath || '').startsWith('/media/')) return;
  const filename = path.basename(imagePath);
  const full = path.join(MEDIA_DIR, filename);
  if (full.startsWith(MEDIA_DIR) && fs.existsSync(full)) {
    try { fs.unlinkSync(full); } catch {}
  }
}

async function sendTelegram(data) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return true;
  const text = [
    '📩 Yangi murojaat', '',
    `👤 Ism: ${data.name || '-'}`,
    `📞 Telefon: ${data.phone || '-'}`,
    `🏢 Korxona: ${data.company || '-'}`,
    `🧾 Xizmat: ${data.service || '-'}`,
    `💬 Izoh: ${data.comment || '-'}`
  ].join('\n');
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text })
  });
  return response.ok;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = decodeURIComponent(url.pathname);

    if (pathname === '/health') return sendJson(res, 200, { ok: true, service: 'allfinanceuz' });

    if (pathname === '/api/news' && req.method === 'GET') {
      const news = readNews()
        .filter(item => item.status !== 'draft')
        .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
      return sendJson(res, 200, news);
    }

    if (pathname === '/api/consult' && req.method === 'POST') {
      const data = await readJsonBody(req, 1_000_000);
      data.createdAt = new Date().toISOString();
      let requests = [];
      try { requests = JSON.parse(fs.readFileSync(REQUESTS_FILE, 'utf8')); } catch {}
      requests.push(data);
      fs.writeFileSync(REQUESTS_FILE, JSON.stringify(requests, null, 2), 'utf8');
      const sent = await sendTelegram(data);
      if (!sent) return sendJson(res, 502, { message: 'Telegramga yuborilmadi' });
      return sendJson(res, 200, { ok: true });
    }

    if (pathname === '/api/admin/login' && req.method === 'POST') {
      if (!ADMIN_PASSWORD || !ADMIN_SESSION_SECRET) {
        return sendJson(res, 503, { message: 'Render Environment’da ADMIN_PASSWORD va ADMIN_SESSION_SECRET sozlanmagan' });
      }
      const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
      const state = loginAttempts.get(ip) || { count: 0, until: 0 };
      if (state.until > Date.now()) return sendJson(res, 429, { message: 'Ko‘p urinish. 15 daqiqadan keyin qayta urinib ko‘ring' });
      const data = await readJsonBody(req, 50_000);
      if (!safeEqual(String(data.password || ''), ADMIN_PASSWORD)) {
        state.count += 1;
        if (state.count >= 5) { state.until = Date.now() + 15 * 60 * 1000; state.count = 0; }
        loginAttempts.set(ip, state);
        return sendJson(res, 401, { message: 'Parol noto‘g‘ri' });
      }
      loginAttempts.delete(ip);
      const token = createSessionToken();
      return sendJson(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie(req, token) });
    }

    if (pathname === '/api/admin/logout' && req.method === 'POST') {
      return sendJson(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie(req, '', 0) });
    }

    if (pathname === '/api/admin/session' && req.method === 'GET') {
      return sendJson(res, isAdmin(req) ? 200 : 401, { authenticated: isAdmin(req) });
    }

    if (pathname === '/api/admin/news' && req.method === 'GET') {
      if (!requireAdmin(req, res)) return;
      const news = readNews().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
      return sendJson(res, 200, news);
    }

    if (pathname === '/api/admin/news/export' && req.method === 'GET') {
      if (!requireAdmin(req, res)) return;
      return send(res, 200, fs.readFileSync(NEWS_FILE), 'application/json; charset=utf-8', {
        'Content-Disposition': `attachment; filename="allfinance-news-${new Date().toISOString().slice(0, 10)}.json"`
      });
    }

    if (pathname === '/api/admin/news' && req.method === 'POST') {
      if (!requireAdmin(req, res)) return;
      const data = await readJsonBody(req);
      const news = readNews();
      const item = validateNewsInput(data);
      let id = item.id;
      let suffix = 2;
      while (news.some(x => x.id === id)) id = `${item.id}-${suffix++}`;
      item.id = id;
      item.createdAt = new Date().toISOString();
      item.image = data.imageData ? saveImage(data.imageData, data.imageName) : '';
      news.unshift(item);
      writeNews(news);
      return sendJson(res, 201, item);
    }

    const adminNewsMatch = pathname.match(/^\/api\/admin\/news\/([^/]+)$/);
    if (adminNewsMatch && req.method === 'PUT') {
      if (!requireAdmin(req, res)) return;
      const id = adminNewsMatch[1];
      const data = await readJsonBody(req);
      const news = readNews();
      const index = news.findIndex(x => x.id === id);
      if (index < 0) return sendJson(res, 404, { message: 'Yangilik topilmadi' });
      const old = news[index];
      const item = validateNewsInput(data, id);
      item.createdAt = old.createdAt || new Date().toISOString();
      item.image = old.image || '';
      if (data.removeImage) {
        deleteManagedImage(item.image);
        item.image = '';
      }
      if (data.imageData) {
        deleteManagedImage(item.image);
        item.image = saveImage(data.imageData, data.imageName);
      }
      news[index] = item;
      writeNews(news);
      return sendJson(res, 200, item);
    }

    if (adminNewsMatch && req.method === 'DELETE') {
      if (!requireAdmin(req, res)) return;
      const id = adminNewsMatch[1];
      const news = readNews();
      const index = news.findIndex(x => x.id === id);
      if (index < 0) return sendJson(res, 404, { message: 'Yangilik topilmadi' });
      const [removed] = news.splice(index, 1);
      deleteManagedImage(removed.image);
      writeNews(news);
      return sendJson(res, 200, { ok: true });
    }

    if (pathname.startsWith('/api/')) return sendJson(res, 404, { message: 'API endpoint topilmadi' });

    if (pathname.startsWith('/media/')) {
      const filename = path.basename(pathname);
      return serveFile(res, path.join(MEDIA_DIR, filename));
    }

    const requested = pathname === '/' ? '/index.html' : pathname;
    const target = path.normalize(path.join(ROOT, requested));
    if (!target.startsWith(ROOT)) return send(res, 403, 'Forbidden', 'text/plain; charset=utf-8');
    return serveFile(res, target);
  } catch (error) {
    console.error(error);
    const message = error.message === 'REQUEST_TOO_LARGE' ? 'Fayl yoki so‘rov hajmi juda katta' :
      error.message === 'INVALID_JSON' ? 'Noto‘g‘ri so‘rov formati' : error.message || 'Server xatosi';
    return sendJson(res, error.message === 'REQUEST_TOO_LARGE' ? 413 : 500, { message });
  }
});

server.listen(PORT, '0.0.0.0', () => console.log(`ALL FINANCE running on port ${PORT}`));
