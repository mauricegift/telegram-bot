process.env.NTBA_FIX_319 = '1';
const GiftedMd = require('node-telegram-bot-api');
const config = require('./config');
const { gmdLogger, botBanner, loadCommands } = require('./gift');
const { registerCommands, setupHandlers } = require('./gift/gmdHandler');

const Gifted = new GiftedMd(config.token, {
  polling: {
    autoStart: true,
    params: { timeout: 30 }
  },
  baseApiUrl: "http://161.97.90.101:1500"
});

loadCommands();
registerCommands(Gifted);
setupHandlers(Gifted);

gmdLogger.banner(botBanner);
gmdLogger.banner('[ Made by GiftedTech ]');

module.exports = Gifted;
