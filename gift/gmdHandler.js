const config = require('../config');
const { commands } = require('./gmdCmds');
const { gmdLogger, isUserAdmin } = require('./gmdFunctions');
const { react } = require('./gmdUtils');

let adminOnlyMode = false;
const cooldowns = new Map();

async function executeCommand(Gifted, command, msg, match) {
    try {
        const chatId = msg.chat.id;
        const userId = msg.from.id;
        const args = match[1] ? match[1].trim().split(/\s+/) : [];
        const messageReply = msg.reply_to_message;

        const isAdmin = await isUserAdmin(Gifted, chatId, userId);
        const isBotAdmin = userId.toString() === config.owner_id.toString();
        const chatType = msg.chat.type;
        const isGroup = chatType === 'group' || chatType === 'supergroup';
        const isChannel = chatType === 'channel';
        const isPrivate = chatType === 'private';

        if (adminOnlyMode && !isBotAdmin) {
            return Gifted.sendMessage(chatId, "Sorry, only the bot admin can use commands right now.");
        }

        if ((command.role === 2 || command.owneronly) && !isBotAdmin) {
            return Gifted.sendMessage(chatId, "Sorry, only the bot owner can use this command.");
        }

        if ((command.role === 1 || command.adminonly) && !isBotAdmin && !isAdmin) {
            return Gifted.sendMessage(chatId, "This command is only available to group admins.");
        }

        if (command.grouponly && !isGroup) {
            return Gifted.sendMessage(chatId, "This command can only be used in groups.");
        }

        if (command.channelonly && !isChannel) {
            return Gifted.sendMessage(chatId, "This command can only be used in channels.");
        }

        const cooldownKey = `${command.pattern}-${userId}`;
        const now = Date.now();
        if (cooldowns.has(cooldownKey)) {
            const lastUsed = cooldowns.get(cooldownKey);
            const cooldownAmount = (command.cooldown || 0) * 1000;
            if (now < lastUsed + cooldownAmount) {
                const timeLeft = Math.ceil((lastUsed + cooldownAmount - now) / 1000);
                return Gifted.sendMessage(chatId, `Please wait ${timeLeft} more seconds before using the ${command.pattern} command again.`);
            }
        }
        cooldowns.set(cooldownKey, now);

        if (command.react) {
            await react(Gifted, chatId, msg.message_id, command.react);
        }

        const conText = {
            reply: (text, options = {}) => {
                return Gifted.sendMessage(chatId, text, {
                    reply_to_message_id: msg.message_id,
                    ...options
                });
            },
            sendMessage: (text, options = {}) => {
                return Gifted.sendMessage(chatId, text, options);
            },
            react: (emoji) => react(Gifted, chatId, msg.message_id, emoji),
            pushName: `${msg.from.first_name}${msg.from.last_name ? ' ' + msg.from.last_name : ''}`,
            sender: msg.from.id,
            owner: config.owner_id,
            isSuperUser: isBotAdmin,
            isAdmin: isAdmin,
            isGroup: isGroup,
            isChannel: isChannel,
            isPrivate: isPrivate,
            userId: userId,
            chatId: chatId,
            q: args.join(' '),
            args: args,
            messageReply: messageReply,
            bot: Gifted,
            prefix: config.prefix,
            botName: config.botName,
            ownerName: config.ownerName,
            timezone: config.timezone,
            sourceUrl: config.sourceUrl
        };

        await command.function(msg, Gifted, conText);

    } catch (error) {
        gmdLogger.error(`Error executing command ${command.pattern}: ${error}`);
        try {
            await react(Gifted, msg.chat.id, msg.message_id, '👎');
        } catch (e) {}
        Gifted.sendMessage(msg.chat.id, 'An error occurred while executing the command.');
    }
}

function registerCommands(Gifted) {
    commands.forEach(command => {
        const patterns = [command.pattern, ...(command.aliases || [])];

        patterns.forEach(pattern => {
            const prefixPattern = `^${config.prefix}${pattern}\\b(.*)$`;

            Gifted.onText(new RegExp(prefixPattern, 'i'), (msg, match) => {
                executeCommand(Gifted, command, msg, match);
            });
        });
    });
    gmdLogger.success(`Successfully registered ${commands.length} commands`);
}

function setupHandlers(Gifted) {
    const { handleAntiLink, handleNewMemberWelcome } = require('./gmdFunctions');

    Gifted.on('message', async (msg) => {
        gmdLogger.logMessage(msg);

        if (config.antiLink && config.antiLink.enabled) {
            await handleAntiLink(Gifted, msg);
        }
    });

    Gifted.on('new_chat_members', (msg) => {
        gmdLogger.logEvent('new_member', `New member joined ${msg.chat.title}`);
        handleNewMemberWelcome(Gifted, msg);
    });

    Gifted.on('left_chat_member', (msg) => {
        gmdLogger.logEvent('member_left', `Member left ${msg.chat.title}`);
    });

    Gifted.on('callback_query', async (callbackQuery) => {
        const chatId = callbackQuery.message.chat.id;
        const userId = callbackQuery.from.id;
        try {
            const data = JSON.parse(callbackQuery.data);
            const commandName = data.command;
            const command = commands.find(cmd => cmd.pattern === commandName);
            if (command && command.onReply) {
                command.onReply(Gifted, chatId, userId, data);
            }
        } catch (error) {
            gmdLogger.error('Error handling callback query:', error);
        }
    });

    Gifted.on('polling_error', (error) => {
        const code = error.code || '';
        const msg = error.message || '';

        if (code === 'ETELEGRAM' && msg.includes('409')) {
            gmdLogger.error('Polling conflict: another instance is running. Restarting polling...');
            Gifted.stopPolling().then(() => {
                setTimeout(() => Gifted.startPolling(), 5000);
            });
            return;
        }

        if (code === 'EFATAL') {
            gmdLogger.error(`Fatal polling error: ${msg}. Restarting in 10s...`);
            Gifted.stopPolling().then(() => {
                setTimeout(() => Gifted.startPolling(), 10000);
            }).catch(() => {
                setTimeout(() => Gifted.startPolling(), 10000);
            });
            return;
        }

        if (code === 'ETELEGRAM') {
            gmdLogger.error(`Telegram error: ${msg}`);
            return;
        }

        if (msg.includes('ECONNRESET') || msg.includes('ECONNREFUSED') || msg.includes('ETIMEDOUT') || msg.includes('EAI_AGAIN')) {
            gmdLogger.warning(`Network issue: ${msg}. Retrying...`);
            return;
        }

        gmdLogger.error(`Polling error: ${msg}`);
    });

    Gifted.on('polling_started', () => {
        gmdLogger.event('Bot polling started');
    });
}

function setAdminOnly(value) {
    adminOnlyMode = value;
}

function getAdminOnly() {
    return adminOnlyMode;
}

module.exports = {
    executeCommand,
    registerCommands,
    setupHandlers,
    setAdminOnly,
    getAdminOnly
};
