const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');
const REQUESTS_FILE = path.join(DATA_DIR, 'consult-requests.json');
const NEWS_FILE = path.join(DATA_DIR, 'news.json');

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
  if (!fs.existsSync(REQUESTS_FILE)) fs.writeFileSync(REQUESTS_FILE, '[]', 'utf8');
  if (!fs.existsSync(NEWS_FILE)) {
    const fallback = path.join(ROOT, 'data', 'news.json');
    if (fallback !== NEWS_FILE && fs.existsSync(fallback)) {
      fs.copyFileSync(fallback, NEWS_FILE);
    } else {
      fs.writeFileSync(NEWS_FILE, '[]', 'utf8');
    }
  }
}
ensureDataFiles();

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
  res.end(body);
}

function serveFile(res, filePath, status = 200) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    const notFound = path.join(ROOT, '404.html');
    if (filePath !== notFound && fs.existsSync(notFound)) return serveFile(res, notFound, 404);
    return send(res, 404, 'Not found', 'text/plain; charset=utf-8');
  }
  const ext = path.extname(filePath).toLowerCase();
  send(res, status, fs.readFileSync(filePath), MIME[ext] || 'application/octet-stream');
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 1_000_000) reject(new Error('Request too large'));
    });
    req.on('end', () => {
      try { resolve(JSON.parse(raw || '{}')); }
      catch (error) { reject(error); }
    });
    req.on('error', reject);
  });
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
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text })
  });
  return response.ok;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    if (url.pathname === '/health') {
      return send(res, 200, JSON.stringify({ ok: true, service: 'allfinanceuz' }));
    }

    if (url.pathname === '/api/news' && req.method === 'GET') {
      try { return send(res, 200, fs.readFileSync(NEWS_FILE, 'utf8')); }
      catch { return send(res, 200, '[]'); }
    }

    if (url.pathname === '/api/consult' && req.method === 'POST') {
      const data = await readJsonBody(req);
      data.createdAt = new Date().toISOString();
      let requests = [];
      try { requests = JSON.parse(fs.readFileSync(REQUESTS_FILE, 'utf8')); } catch {}
      requests.push(data);
      fs.writeFileSync(REQUESTS_FILE, JSON.stringify(requests, null, 2), 'utf8');
      const sent = await sendTelegram(data);
      if (!sent) return send(res, 502, JSON.stringify({ message: 'Telegramga yuborilmadi' }));
      return send(res, 200, JSON.stringify({ ok: true }));
    }

    if (url.pathname.startsWith('/api/')) {
      return send(res, 404, JSON.stringify({ message: 'API endpoint topilmadi' }));
    }

    const requested = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
    const target = path.normalize(path.join(ROOT, requested));
    if (!target.startsWith(ROOT)) return send(res, 403, 'Forbidden', 'text/plain; charset=utf-8');
    return serveFile(res, target);
  } catch (error) {
    console.error(error);
    return send(res, 500, JSON.stringify({ message: 'Server xatosi' }));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`ALL FINANCE running on port ${PORT}`);
});
