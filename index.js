process.env.NTBA_FIX_319 = '1';
const GiftedMd = require('node-telegram-bot-api');
const config = require('./config');
const { gmdLogger, botBanner, loadCommands } = require('./gift');
const { registerCommands, setupHandlers } = require('./gift/gmdHandler');
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 7860;

const Gifted = new GiftedMd(config.token, {
  polling: {
    autoStart: true,
    params: { timeout: 30 }
  },
  baseApiUrl: "https://debbiaji-tgbotapi.hf.space" // Bypassing 50Mb file size limit
});

loadCommands();
registerCommands(Gifted);
setupHandlers(Gifted);

gmdLogger.banner(botBanner);
gmdLogger.banner('[ Made by GiftedTech ]');

app.use('/static', express.static(path.join(__dirname, 'gift')));


app.get('/', (req, res) => {
  const htmlPath = path.join(__dirname, 'gift', 'gifted.html');
  
  if (fs.existsSync(htmlPath)) {
    res.sendFile(htmlPath);
  } else {
    // Fallback
    res.status(404).send(`
      <html>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>🤖 GiftedTech Telegram Bot</h1>
          <p>gifted.html file not found in ./gift/ directory</p>
          <p>Please ensure the file exists at: ${htmlPath}</p>
          <div style="margin-top: 20px; color: #666;">
            <p>Bot is still running! ✅</p>
            <p>📱 Find bot on Telegram: @${config.botUsername}</p>
          </div>
        </body>
      </html>
    `);
  }
});

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Bot is running',
    botUsername: config.botUsername,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Web server is running on port ${PORT}`);
});

module.exports = Gifted;
