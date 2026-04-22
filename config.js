const fs = require("fs-extra");
const path = require("path");

require('dotenv').config({
  path: path.join(__dirname, '.env'),
  quiet: true,
  override: false,
});

const config = {
  token: process.env.BOT_TOKEN || "", // Your bot token
  owner_id: process.env.OWNER_ID || "", // Your telegram chat id
  prefix: process.env.PREFIX || "/", // Your preferred prefix
  apiKey: process.env.API_KEY || "gifted", //Replace with your unlimited/paid apikey
  botName: process.env.BOT_NAME || "GIFTED-MD",
  timezone: process.env.TIMEZONE || "Africa/Nairobi",
  ownerName: process.env.OWNER_NAME || "Maurice Gift",
  ownerUsername: process.env.OWNER_USERNAME || "mauricegift",
  apiUrl: process.env.API_URL || "https://api.giftedtech.co.ke", // Can replce with yours
  artistName: process.env.ARTIST_NAME || "Powered by Gifted Apis",
  url: process.env.URL || "https://gitcdn.giftedtech.co.ke/image/AZO_image.jpg",
  sourceUrl: process.env.SOURCE_URL || "https://github.com/mauricegift/telegram-bot",

  greetNewMembers: {
    enabled: process.env.GREET_ENABLED !== "false",
    gifUrl: process.env.GIF_URL || "https://files.catbox.moe/pm9x7c.gif",
  },

  antiLink: {
    enabled: process.env.ANTILINK !== "false",
  },
};

const currentFile = require.resolve(__filename);
fs.watchFile(currentFile, () => {
  fs.unwatchFile(currentFile);
  console.log(`Updating ${path.basename(__filename)}`);
  delete require.cache[currentFile];
  require(currentFile);
});

module.exports = config;
