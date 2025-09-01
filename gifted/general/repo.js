const axios = require('axios');

let Giftedd = async (m, { Gifted, sender }) => {
  const repoUrl = global.giftedApiRepo;
  const response = await axios.get(repoUrl);
  const repoData = response.data;
  const { name, forks_count, stargazers_count, html_url, created_at, updated_at, owner } = repoData;

  let giftedMess = `Hello *@${sender},*\nThis is *${global.botName},* A Powerful Telegram AI Bot Created and Developed by *Cool Shot Systems* with Advanced Features for Enhanced Communication and AI Interaction\n\n*ʀᴇᴘᴏ ʟɪɴᴋ:* ${global.giftedRepo}\n\n*❲❒❳ ɴᴀᴍᴇ:* ${name}\n*❲❒❳ sᴛᴀʀs:* ${stargazers_count}\n*❲❒❳ ғᴏʀᴋs:* ${forks_count}\n*❲❒❳ ᴄʀᴇᴀᴛᴇᴅ ᴏɴ:* ${new Date(created_at).toLocaleDateString()}\n*❲❒❳ ʟᴀsᴛ ᴜᴘᴅᴀᴛᴇᴅ:* ${new Date(updated_at).toLocaleDateString()}\n*❲❒❳ ᴅᴇᴠᴇʟᴏᴘᴇʀ:* Cool Shot Systems`;

  let giftedButtons = [
    [
      { text: 'Owner', url: `https://t.me/${global.ownerUsername}` },
    ],
    [
      { text: 'Open Repo', url: global.giftedRepo }, 
      { text: 'WaChannel', url: global.giftedWaChannel }
    ]
  ];

  Gifted.reply({ image: { url: global.botPic }, caption: giftedMess, parse_mode: 'Markdown' }, giftedButtons, m);
};

Giftedd.command = ['repo', 'sc', 'script'];
Giftedd.desc = 'Show Bot Repo';
Giftedd.category = ['general'];

module.exports = Giftedd;
