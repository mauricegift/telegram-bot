const fs = require("fs-extra");
const path = require("path");

if (fs.existsSync(".env")) {
  require("dotenv").config({ path: path.join(__dirname, ".env") });
}

const config = {
  token:
    process.env.BOT_TOKEN || "7517934475:AAEUcpC0gUUDmtCttrsvUUZhROF4SJ9sGI4",
  owner_id: process.env.OWNER_ID || "5153324742",
  prefix: process.env.PREFIX || "/",
  timezone: process.env.TIMEZONE || "Africa/Nairobi",
  botName: process.env.BOT_NAME || "GIFTED-MD",
  ownerName: process.env.OWNER_NAME || "Maurice Gift",
  ownerUsername: process.env.OWNER_USERNAME || "mauricegift",
  artistName: process.env.ARTIST_NAME || "Powered by Gifted Apis",

  url: process.env.URL || "https://gitcdn.giftedtech.co.ke/image/AZO_image.jpg",
  sourceUrl:
    process.env.SOURCE_URL || "https://github.com/mauricegift/telegram-bot",

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
