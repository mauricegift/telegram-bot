const fs = require('fs'),
      path = require('path'),
      gradient = require('gradient-string'),
      moment = require('moment');

const config = require('../config');

const logThemes = {
    info: ['#4facfe', '#00f2fe'],
    success: ['#00b09b', '#96c93d'],
    warning: ['#f83600', '#f9d423'],
    error: ['#ff416c', '#ff4b2b'],
    event: ['#8a2be2', '#da70d6'],
    message: ['#00c6ff', '#0072ff'],
    banner: ['#ff00cc', '#3333ff']
};

const gmdLogger = {
    info: (message) => console.log(gradient(logThemes.info[0], logThemes.info[1])(`ℹ ${message}`)),
    success: (message) => console.log(gradient(logThemes.success[0], logThemes.success[1])(`✓ ${message}`)),
    warning: (message) => console.log(gradient(logThemes.warning[0], logThemes.warning[1])(`⚠ ${message}`)),
    error: (message) => console.log(gradient(logThemes.error[0], logThemes.error[1])(`✗ ${message}`)),
    event: (message) => console.log(gradient(logThemes.event[0], logThemes.event[1])(`✨ ${message}`)),
    message: (message) => console.log(gradient(logThemes.message[0], logThemes.message[1])(`✉ ${message}`)),
    banner: (message) => console.log(gradient(logThemes.banner[0], logThemes.banner[1])(message)),

    logMessage: (msg) => {
        const chat = msg.chat;
        const from = msg.from;
        const text = msg.text || msg.caption || '[Media Message]';
        const messageType = msg.photo ? 'Photo' :
                          msg.video ? 'Video' :
                          msg.document ? 'Document' :
                          msg.audio ? 'Audio' :
                          msg.sticker ? 'Sticker' :
                          'Text';

        const logOutput = `
┌─────────────────────────────────
│ 📩 ${chat.type.toUpperCase()} ${messageType} Message
├─────────────────────────────────
│ 🏷 Chat: ${chat.title || 'Private'} (${chat.id})
│ 👤 User: ${from.first_name}${from.last_name ? ' ' + from.last_name : ''}
│ 📛 Username: @${from.username || 'No username'}
│ 🆔 User ID: ${from.id}
│ 💬 Content: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}
└─────────────────────────────────`.trim();

      console.log(gradient(logThemes.message[0], logThemes.message[1])(logOutput));
    },

    logEvent: (event, data) => {
        const logOutput = `
┌─────────────────────────────────
│ ✨ ${event.toUpperCase()} Event
├─────────────────────────────────
│ ${data}
└─────────────────────────────────`.trim();

      console.log(gradient(logThemes.event[0], logThemes.event[1])(logOutput));
    }
};


const botBanner = `
████████╗ ██████╗ ██████╗  ██████╗ ████████╗
╚══██╔══╝██╔════╝ ██╔══██╗██╔═══██╗╚══██╔══╝
   ██║   ██║  ███╗██████╔╝██║   ██║   ██║
   ██║   ██║   ██║██╔══██╗██║   ██║   ██║
   ██║   ╚██████╔╝██████╔╝╚██████╔╝   ██║
   ╚═╝    ╚═════╝ ╚═════╝  ╚═════╝    ╚═╝ `;


function loadCommands() {
    try {
        gmdLogger.info('Loading commands...');
        const pluginsPath = path.join(__dirname, "..", "gifted");

        if (!fs.existsSync(pluginsPath)) {
            fs.mkdirSync(pluginsPath, { recursive: true });
            gmdLogger.info('Commands folder created');
            return;
        }

        const commandFiles = fs.readdirSync(pluginsPath).filter(file =>
            path.extname(file).toLowerCase() === ".js"
        );

        let loadedCount = 0;
        let failedCount = 0;

        commandFiles.forEach((fileName) => {
            try {
                require(path.join(pluginsPath, fileName));
                loadedCount++;
            } catch (error) {
                failedCount++;
                gmdLogger.error(`Error loading ${fileName}: ${error.message}`);
            }
        });

        gmdLogger.success(`Successfully loaded ${loadedCount} commands`);
        if (failedCount > 0) {
            gmdLogger.warning(`Failed to load ${failedCount} commands`);
        }
        return loadedCount;
    } catch (error) {
        gmdLogger.error('Failed to load commands:', error.message);
        return 0;
    }
}

async function isUserAdmin(Gifted, chatId, userId) {
    try {
        const chatAdministrators = await Gifted.getChatAdministrators(chatId);
        return chatAdministrators.some(admin => admin.user.id === userId);
    } catch (error) {
        return false;
    }
}

async function getGroupMemberCount(Gifted, chatId) {
    try {
        const chat = await Gifted.getChat(chatId);
        return chat.members_count || 'N/A';
    } catch (error) {
        gmdLogger.error('Error getting member count:', error);
        return 'N/A';
    }
}

async function handleNewMemberWelcome(Gifted, msg) {
    if (!config.greetNewMembers || !config.greetNewMembers.enabled) return;
    const chatId = msg.chat.id;
    const newMembers = msg.new_chat_members;
    const gifUrl = config.greetNewMembers.gifUrl;
    const groupName = msg.chat.title;
    const joinTime = moment().format('MMMM Do YYYY, h:mm:ss a');

    try {
        const memberCount = await getGroupMemberCount(Gifted, chatId);

        for (const member of newMembers) {
            const fullName = `${member.first_name} ${member.last_name || ''}`.trim();
            const username = member.username ? `@${member.username}` : fullName;

            const welcomeMessage = `Welcome to ${groupName}!
Hello ${username}! We're excited to have you here.
Group Info:
- Name: ${groupName}
- Total Members: ${memberCount}
- You joined at: ${joinTime}
Please read the group description for rules and guidelines.
Enjoy your stay!`;
            try {
                const photos = await Gifted.getUserProfilePhotos(member.id, { limit: 1 });

                if (photos.total_count > 0) {
                    const photo = photos.photos[0].pop();
                    const fileId = photo.file_id;

                    await Gifted.sendPhoto(chatId, fileId, {
                        caption: welcomeMessage,
                        parse_mode: 'Markdown'
                    });
                } else {
                    await Gifted.sendMessage(chatId, welcomeMessage, {
                        parse_mode: 'Markdown'
                    });
                }

                if (gifUrl) {
                    try {
                        await Gifted.sendAnimation(chatId, gifUrl);
                    } catch (error) {
                        gmdLogger.error("Error sending welcome GIF:", error);
                    }
                }
            } catch (error) {
                gmdLogger.error('Error sending profile photo welcome:', error);
                await Gifted.sendMessage(chatId, `Welcome, ${fullName}!`);
                if (gifUrl) {
                    try {
                        await Gifted.sendAnimation(chatId, gifUrl);
                    } catch (gifError) {
                        gmdLogger.error("Error sending fallback GIF:", gifError);
                    }
                }
            }
        }
    } catch (error) {
        gmdLogger.error('Error in welcome handler:', error);
        newMembers.forEach(member => {
            const fullName = `${member.first_name} ${member.last_name || ''}`.trim();
            Gifted.sendMessage(chatId, `Welcome, ${fullName}!`);
        });
    }
}

async function handleAntiLink(Gifted, msg) {
    try {
        if (msg.chat.type !== 'group' && msg.chat.type !== 'supergroup') {
            return;
        }
        const chatId = msg.chat.id;
        const userId = msg.from.id;
        const text = msg.text || msg.caption || '';
        const linkRegex = /(https?:\/\/|www\.)[^\s]+/gi;

        if (linkRegex.test(text)) {
            const isAdmin = await isUserAdmin(Gifted, chatId, userId);

            if (!isAdmin && userId.toString() !== config.owner_id.toString()) {
                const warningMsg = await Gifted.sendMessage(chatId, "Anti-link message detected", {
                    reply_to_message_id: msg.message_id
                });

                setTimeout(async () => {
                    try {
                        await Gifted.deleteMessage(chatId, msg.message_id);

                        setTimeout(async () => {
                            try {
                                await Gifted.deleteMessage(chatId, warningMsg.message_id);
                            } catch (error) {
                                gmdLogger.error("Error deleting warning message:", error);
                            }
                        }, 5000);

                    } catch (error) {
                        gmdLogger.error("Error deleting anti-link message:", error);
                        Gifted.sendMessage(chatId, `@${msg.from.username || msg.from.first_name}, links are not allowed here!`);
                    }
                }, 2000);
            }
        }
    } catch (error) {
        gmdLogger.error('Error in anti-link handler:', error);
    }
}

module.exports = {
  botBanner,
  gmdLogger,
  isUserAdmin,
  loadCommands,
  handleAntiLink,
  handleNewMemberWelcome
}
