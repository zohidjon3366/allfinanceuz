const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname, { extensions: ['html'] }));

app.post('/api/lead', async (req, res) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || '';
  const chatId = process.env.TELEGRAM_CHAT_ID || '';
  const data = req.body || {};
  if (!botToken || !chatId) {
    return res.status(200).json({ ok: false, message: 'Telegram env vars not configured' });
  }
  const text = [
    '🔔 Yangi murojaat — ALL FINANCE',
    '',
    `Ism: ${data.name || '-'}`,
    `Telefon: ${data.phone || '-'}`,
    `Korxona: ${data.company || '-'}`,
    `Xizmat: ${data.service || '-'}`,
    `Izoh: ${data.comment || '-'}`,
    `Sana: ${new Date().toLocaleString('ru-RU')}`
  ].join('\n');
  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text })
    });
    const tgJson = await tgRes.json().catch(() => ({}));
    if (!tgRes.ok || !tgJson.ok) {
      return res.status(200).json({ ok: false, message: 'Telegram send failed', detail: tgJson });
    }
    return res.json({ ok: true });
  } catch (err) {
    return res.status(200).json({ ok: false, message: 'Server error' });
  }
});

app.get('*', (req, res) => {
  const requested = req.path === '/' ? 'index.html' : req.path.replace(/^\//, '');
  const filePath = path.join(__dirname, requested);
  res.sendFile(filePath, err => {
    if (err) res.sendFile(path.join(__dirname, '404.html'));
  });
});

app.listen(PORT, () => console.log(`ALL FINANCE site started on ${PORT}`));
