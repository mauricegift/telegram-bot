const moment = require('moment-timezone'),
      { totalmem: totalMemoryBytes, 
       freemem: freeMemoryBytes } = require('os');
const { validateParseMode, safeMonospace, sanitizeForTelegram } = require('../../gift/textSanitizer');

const byteToKB = 1 / 1024;
const byteToMB = byteToKB / 1024;
const byteToGB = byteToMB / 1024;

function formatBytes(bytes) {
  if (bytes >= Math.pow(1024, 3)) {
    return (bytes * byteToGB).toFixed(2) + ' GB';
  } else if (bytes >= Math.pow(1024, 2)) {
    return (bytes * byteToMB).toFixed(2) + ' MB';
  } else if (bytes >= 1024) {
    return (bytes * byteToKB).toFixed(2) + ' KB';
  } else {
    return bytes.toFixed(2) + ' bytes';
  }
}

const ram = `${formatBytes(freeMemoryBytes)}/${formatBytes(totalMemoryBytes)}`;

let Giftedd = async (m, { Gifted, plugins, monospace }) => {
  const groupedPlugins = plugins.reduce((groups, plugin) => {
    if (plugin.command && Array.isArray(plugin.command)) {
      const categories = Array.isArray(plugin.category) ? plugin.category : [plugin.category || 'other'];
      categories.forEach(category => {
        if (!groups[category]) groups[category] = [];
        groups[category].push(plugin);
      });
    }
    return groups;
  }, {});

  function formatUptime(seconds) {
    const days = Math.floor(seconds / (24 * 60 * 60));
    seconds %= 24 * 60 * 60;
    const hours = Math.floor(seconds / (60 * 60));
    seconds %= 60 * 60;
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }

  const now = new Date();
  const date = new Intl.DateTimeFormat('en-GB', {
    timeZone: `${global.timeZone}`,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(now);

  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: `${global.timeZone}`,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(now);

  const uptime = formatUptime(process.uptime());

  let totalCommands = 0;
  for (const items of Object.values(groupedPlugins)) {
    totalCommands += items.length;
  }

  // Create menu message with safe formatting
  let giftedMess = `+== *${sanitizeForTelegram(botName)}* ==+\n`;
  giftedMess += `| *PREFIX:*  [ ${safeMonospace(prefix)} ]\n`;
  giftedMess += `| *OWNER:*  @${sanitizeForTelegram(ownerUsername)}\n`;
  giftedMess += `| *PLUGINS:*  ${safeMonospace(totalCommands.toString())}\n`;
  giftedMess += `| *VERSION:*  ${safeMonospace(botVersion)}\n`;
  giftedMess += `| *UPTIME:*  ${safeMonospace(uptime)}\n`;
  giftedMess += `| *TIME NOW:*  ${safeMonospace(time)}\n`;
  giftedMess += `| *DATE TODAY:*  ${safeMonospace(date)}\n`;
  giftedMess += `| *TIME ZONE:*  ${safeMonospace(timeZone)}\n`;
  giftedMess += `| *SERVER RAM:*  ${safeMonospace(ram)}\n`;
  giftedMess += `+===================+\n\n`;
  giftedMess += `*${sanitizeForTelegram(botName)} COMMANDS LIST:*\n\n`;

  for (const [category, items] of Object.entries(groupedPlugins)) {
    items.sort((a, b) => (a.command ? a.command[0].localeCompare(b.command[0]) : a.localeCompare(b)));
    giftedMess += `+--- [ *${category.toUpperCase()}* ]\n`;
    items.forEach(item => {
      const command = item.command ? `• *${global.prefix}${item.command[0]}*` : `• *${global.prefix}${item}*`;
      giftedMess += `${command}\n`;
    });
    giftedMess += `+----------------+\n\n`;
  }

  let giftedButtons = [
    [
      { text: 'Owner', url: `https://t.me/${global.ownerUsername}` },
      { text: 'Help', callback_data: JSON.stringify({ feature: 'help' }) },
    ],
    [
      { text: 'WaChannel', url: global.giftedWaChannel },
    ],
  ];

  // Validate the final message for safe Telegram transmission
  const safeMessage = validateParseMode(giftedMess, 'Markdown');
  
  await Gifted.reply({ 
    image: { url: global.botPic }, 
    caption: safeMessage.text, 
    parse_mode: safeMessage.parse_mode 
  }, giftedButtons, m);
};

Giftedd.command = ['menu', 'start', 'menus', 'allmenu'];
Giftedd.desc = 'Displays the Bot Menu';
Giftedd.category = ['general'];

module.exports = Giftedd;
