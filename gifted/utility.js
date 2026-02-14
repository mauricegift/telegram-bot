const { gmd } = require('../gift');

gmd({
    pattern: "chatid",
    aliases: ["gid", "groupid"],
    react: "🤓",
    category: "utility",
    description: "Get chat ID",
    cooldown: 5
},

async (msg, Gifted, conText) => {
    const { reply, isGroup, isChannel, isPrivate } = conText;

    const chatType = isPrivate ? 'Private Chat' :
                    isGroup ? 'Group' :
                    isChannel ? 'Channel' : 'Unknown';

    await reply(`💬 *Chat Info:*\n\n🆔 *Chat ID:* \`${conText.chatId}\`\n📋 *Type:* ${chatType}\n📛 *Name:* ${msg.chat.title || 'Private Chat'}`);
});

gmd({
    pattern: "id",
    aliases: ["userid", "getid"],
    react: "😎",
    category: "utility",
    description: "Get user ID",
    cooldown: 5
},

async (msg, Gifted, conText) => {
    const { reply, messageReply } = conText;

    if (messageReply) {
        const user = messageReply.from;
        const userName = user.first_name + (user.last_name ? ' ' + user.last_name : '');
        const username = user.username ? `(@${user.username})` : '';

        await reply(`👤 *User Info:*\n\n🆔 *User ID:* \`${user.id}\`\n📛 *Name:* ${userName}\n🔖 *Username:* ${username || 'None'}`);
    } else {
        const user = msg.from;
        const userName = user.first_name + (user.last_name ? ' ' + user.last_name : '');
        const username = user.username ? `(@${user.username})` : '';

        await reply(`👤 *Your Info:*\n\n🆔 *User ID:* \`${user.id}\`\n📛 *Name:* ${userName}\n🔖 *Username:* ${username || 'None'}\n💬 *Chat ID:* \`${conText.chatId}\``);
    }
});

gmd({
  pattern: "chunk",
  aliases: ["details", "det", "ret"],
  react: "🤔",
  category: "utility",
  description: "Displays raw quoted message in JSON format",
  owneronly: true,
  cooldown: 10
},

async (msg, Gifted, conText) => {
  const { reply, messageReply } = conText;

  if (!messageReply) {
    return await reply("❌ Please reply to a message to inspect it.");
  }

  try {
    const json = JSON.stringify(messageReply, null, 2);
    const chunks = json.match(/[\s\S]{1,4000}/g) || [];

    for (const chunk of chunks) {
      const formatted = "```json\n" + chunk + "\n```";
      await reply(formatted, { parse_mode: 'Markdown' });
    }
  } catch (err) {
    await reply("❌ Error inspecting message.");
  }
});
