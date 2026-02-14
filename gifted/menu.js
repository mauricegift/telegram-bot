const { gmd, commands } = require('../gift');
const { getCategoryIcon, formatUptime, buildButtons, urlButton } = require('../gift/gmdUtils');
const { monospace, formatBytes } = require('../gift/gmdHelpers');
const config = require('../config');
const os = require('os');

const ram = `${formatBytes(os.freemem())}/${formatBytes(os.totalmem())}`;

gmd({
    pattern: "menu",
    aliases: ["help", "cmd", "allmenu"],
    react: "👀",
    category: "general",
    description: "Show all commands",
    cooldown: 5
},

async (msg, Gifted, conText) => {
    const { pushName, botName, prefix } = conText;
    const tz = config.timezone || 'Africa/Nairobi';

    const now = new Date();
    const date = new Intl.DateTimeFormat('en-GB', {
        timeZone: tz,
        day: '2-digit', month: '2-digit', year: 'numeric'
    }).format(now);

    const time = new Intl.DateTimeFormat('en-GB', {
        timeZone: tz,
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    }).format(now);

    const uptime = formatUptime(process.uptime());

    const categorized = {};
    commands.forEach(cmd => {
        if (cmd.pattern && !cmd.dontAddCommandList) {
            const cat = (cmd.category || 'misc');
            if (!categorized[cat]) categorized[cat] = [];
            categorized[cat].push(cmd.pattern);
        }
    });

    const sortedCategories = Object.keys(categorized).sort((a, b) => a.localeCompare(b));
    for (const cat of sortedCategories) {
        categorized[cat].sort((a, b) => a.localeCompare(b));
    }

    const totalCommands = commands.filter(c => c.pattern && !c.dontAddCommandList).length;

    let header = `╭══〘 *${monospace(botName)}* 〙═⊷\n`;
    header += `┃❍ *Pʀᴇғɪx:*  [ ${monospace(prefix)} ]\n`;
    header += `┃❍ *Usᴇʀ:*  @${msg.from.username || pushName || 'User'}\n`;
    header += `┃❍ *Oᴡɴᴇʀ:*  @${config.ownerUsername}\n`;
    header += `┃❍ *Pʟᴜɢɪɴs:*  ${monospace(String(totalCommands))}\n`;
    header += `┃❍ *Uᴘᴛɪᴍᴇ:*  ${monospace(uptime)}\n`;
    header += `┃❍ *Tɪᴍᴇ Nᴏᴡ:*  ${monospace(time)}\n`;
    header += `┃❍ *Dᴀᴛᴇ Tᴏᴅᴀʏ:*  ${monospace(date)}\n`;
    header += `┃❍ *Tɪᴍᴇ Zᴏɴᴇ:*  ${monospace(tz)}\n`;
    header += `┃❍ *Sᴇʀᴠᴇʀ Rᴀᴍ:*  ${monospace(ram)}\n`;
    header += `╰═════════════════⊷`;

    let categoryList = '';
    for (const category of sortedCategories) {
        const icon = getCategoryIcon(category.toUpperCase());
        categoryList += `╭━━━━❮ *${icon} ${monospace(category.toUpperCase())}* ❯━⊷\n`;
        categorized[category].forEach(cmd => {
            categoryList += `┃◇ ${prefix}${cmd}\n`;
        });
        categoryList += `╰━━━━━━━━━━━━━━━━━⊷\n\n`;
    }

    const menuButtons = buildButtons([
        [
            urlButton('🌐 Bot Site', 'https://giftedsite.vercel.app'),
            urlButton('👑 Owner', 'https://t.me/mauricegift')
        ],
        [
            urlButton('💬 Support Group', 'https://t.me/giftedmd')
        ]
    ]);

    try {
        await Gifted.sendPhoto(conText.chatId, config.url, {
            caption: header,
            parse_mode: 'Markdown',
            reply_to_message_id: msg.message_id
        });

        await Gifted.sendMessage(conText.chatId, categoryList.trim(), {
            parse_mode: 'Markdown',
            reply_markup: menuButtons
        });
    } catch (err) {
        await Gifted.sendMessage(conText.chatId, header + '\n\n' + categoryList.trim(), {
            parse_mode: 'Markdown',
            reply_to_message_id: msg.message_id,
            reply_markup: menuButtons
        });
    }
});

gmd({
    pattern: "list",
    aliases: ["listmenu"],
    react: "👀",
    category: "general",
    description: "Show all commands with descriptions",
    cooldown: 5
},

async (msg, Gifted, conText) => {
    const { pushName, botName, prefix } = conText;
    const tz = config.timezone || 'Africa/Nairobi';

    const now = new Date();
    const date = new Intl.DateTimeFormat('en-GB', {
        timeZone: tz,
        day: '2-digit', month: '2-digit', year: 'numeric'
    }).format(now);

    const time = new Intl.DateTimeFormat('en-GB', {
        timeZone: tz,
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    }).format(now);

    const uptime = formatUptime(process.uptime());
    const totalCommands = commands.filter(c => c.pattern && !c.dontAddCommandList).length;

    let header = `╭━━〔 *${monospace(botName)}* 〕━━╮\n`;
    header += `│ ✦ *Pʀᴇғɪx* : [ ${monospace(prefix)} ]\n`;
    header += `│ ✦ *Usᴇʀ* : @${msg.from.username || pushName || 'User'}\n`;
    header += `│ ✦ *Oᴡɴᴇʀ* : @${config.ownerUsername}\n`;
    header += `│ ✦ *Pʟᴜɢɪɴs* : ${monospace(String(totalCommands))}\n`;
    header += `│ ✦ *Uᴘᴛɪᴍᴇ* : ${monospace(uptime)}\n`;
    header += `│ ✦ *Tɪᴍᴇ Nᴏᴡ* : ${monospace(time)}\n`;
    header += `│ ✦ *Dᴀᴛᴇ Tᴏᴅᴀʏ* : ${monospace(date)}\n`;
    header += `│ ✦ *Sᴇʀᴠᴇʀ Rᴀᴍ* : ${monospace(ram)}\n`;
    header += `╰─────────────╯`;

    let listBody = '\n';
    let count = 1;
    commands.forEach(cmd => {
        if (cmd.pattern && cmd.description && !cmd.dontAddCommandList) {
            listBody += `*${count}. ${monospace(cmd.pattern)}*\n  ${cmd.description}\n\n`;
            count++;
        }
    });

    const menuButtons = buildButtons([
        [
            urlButton('🌐 Bot Site', 'https://giftedsite.vercel.app'),
            urlButton('👑 Owner', 'https://t.me/mauricegift')
        ],
        [
            urlButton('💬 Support Group', 'https://t.me/giftedmd')
        ]
    ]);

    try {
        await Gifted.sendPhoto(conText.chatId, config.url, {
            caption: header,
            parse_mode: 'Markdown',
            reply_to_message_id: msg.message_id
        });

        await Gifted.sendMessage(conText.chatId, listBody.trim(), {
            parse_mode: 'Markdown',
            reply_markup: menuButtons
        });
    } catch (err) {
        await Gifted.sendMessage(conText.chatId, header + '\n\n' + listBody.trim(), {
            parse_mode: 'Markdown',
            reply_to_message_id: msg.message_id,
            reply_markup: menuButtons
        });
    }
});
