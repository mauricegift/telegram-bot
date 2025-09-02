process.on('uncaughtException', console.error);
process.on('unhandledRejection', console.error);
require('../set');
const { handleCases } = require('../gifted/case');

const TelegramBot = require('node-telegram-bot-api');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const chalk = require('chalk');
const util = require('util');

const { fetchJson, clockString, pickRandom, runtime, formatp, executeCommand, loadDatabase, plugins, pluginFileCount, GiftedApkDl, monospace } = require('./index');
const { geminiAPI } = require('./geminiAPI');
const { validateParseMode } = require('./textSanitizer');

module.exports = async (Gifted) => {
    
    Gifted.on('message', async (m) => {
        try {
            console.log(chalk.cyan('📥 Message received by second handler (gifted.js)'));
            await loadDatabase(Gifted, m);
        
        
        const chatId = m.chat.id;
        const userId = m.from.id;
        const chatType = m.chat.type;
        
        if (m.text && m.text.startsWith('=>')) {
            if (!m.isOwner) return;
            function Return(result) {
                GiftedDevs = JSON.stringify(result, null, 2);
                GiftedDevs = util.format(GiftedDevs);
                if (GiftedDevs == undefined) {
                    GiftedDevs = util.format(result);
                }
                return Gifted.reply({ text: `\`\`\`\n${GiftedDevs}\n\`\`\``, parse_mode: 'Markdown' }, m);
            }
            try {
                await Gifted.reply({ text: `\`\`\`\n${util.format(eval(`(async () => { return ${m.text.slice(3).trim()} })()`))}\n\`\`\``, parse_mode: 'Markdown' }, m);
            } catch (e) {
                await Gifted.reply({ text: `\`\`\`\n${String(e)}\n\`\`\``, parse_mode: 'Markdown' }, m);
            }
        }
        if (m.text && m.text.startsWith('$')) {
            if (!m.isOwner) return;
            const codeToEval = m.text.slice(1).trim();
            try {
                const result = await executeCommand(codeToEval);
                await Gifted.reply({ text: `\`\`\`\n${result}\n\`\`\``, parse_mode: 'Markdown' }, m);
            } catch (error) {
                await Gifted.reply({ text: `\`${error.message}\``, parse_mode: 'Markdown' }, m);
            }
        }
        if (m.text && m.text.startsWith('>')) {
            if (!m.isOwner) return;
            try {
                const codeToEval = m.text.slice(1).trim();
                const result = await eval(`(async () => { ${codeToEval} })()`);
                let message = result;
                if (typeof result === 'object') {
                    message = JSON.stringify(result, null, 2);
                }
                await Gifted.reply({ text: `\`\`\`\n${message}\n\`\`\``, parse_mode: 'Markdown' }, m);
            } catch (error) {
                await Gifted.reply({ text: `\`${error.message}\``, parse_mode: 'Markdown' }, m);
            }
        }
        
        // Handle regular text messages (non-commands) with AI
        if (m.text && !m.text.startsWith(global.prefix) && !m.text.startsWith('=>') && !m.text.startsWith('$') && !m.text.startsWith('>')) {
            console.log(chalk.yellow(`🔍 Direct text detected: "${m.text.substring(0, 50)}${m.text.length > 50 ? '...' : ''}"`));
            
            // Skip if user is blocked
            if (global.db.users[userId]?.blocked && !m.isOwner) {
                console.log(chalk.red(`⚠️  User ${userId} is blocked`));
                return;
            }
            
            // Skip if bot is disabled in this group
            if ((chatType === 'group' || chatType === 'supergroup') && global.db.groups[chatId]?.disabled) {
                console.log(chalk.red(`⚠️  Bot disabled in group ${chatId}`));
                return;
            }
            
            // Skip if message is from the bot itself
            if (m.from.is_bot) {
                console.log(chalk.red(`⚠️  Ignoring bot message`));
                return;
            }
            
            // Only respond to text messages with actual content
            if (m.text.trim().length > 0) {
                console.log(chalk.green(`✅ Processing direct text message`));
                await handleDirectTextMessage(Gifted, m);
            }
        }
        
        if (m.text) {
            console.log('\x1b[30m--------------------\x1b[0m');
            console.log(chalk.bgHex("#e74c3c").bold(` ${global.botName} NEW MESSAGE! `));
            console.log(
                `   - Date: ${new Date().toLocaleString('id-ID')} WIB \n` +
                `   - Message: ${m.text} \n` +
                `   - Sender Name: ${m.from.first_name} \n` +
                `   - Sender UserName: ${m.from.username} \n` +
                `   - ID: ${m.from.id}`
            );
            if (chatType === 'group' || chatType === 'supergroup') {
                console.log(
                    `   - Group: ${m.chat.title} \n` +
                    `   - GroupID: ${m.chat.id}`
                );
            }
            console.log();
        }
        console.log(chalk.cyan('✅ Second handler completed successfully'));
        } catch (error) {
            console.error(chalk.red('❌ Error in second message handler (gifted.js):'), error);
        }
    });
    
    Gifted.onText(`^(?:${global.prefix})(\\w+)`, async (m, match) => {
        try {
            const chatId = m.chat.id;
            const userId = m.from.id;
            const chatType = m.chat.type;
            let command = match[1];
            const text = m.text.trim().slice(command.length + 2).trim();
            const userName = m.from.username || m.from.first_name || 'Unknown';
            const userTag = userName.startsWith('@') ? userName : `@${userName}`;
            
            // Check if user is blocked (admin check is in giftedCustomMessage)
            if (global.db.users[userId]?.blocked && !m.isOwner) {
                return; // Silently ignore blocked users
            }
            
            // Check if bot is disabled in this group
            if ((chatType === 'group' || chatType === 'supergroup') && global.db.groups[chatId]?.disabled) {
                return; // Silently ignore if disabled in group
            }
            
            // Track command usage (import trackCommand function)
            const { trackCommand } = require('../gifted/general/admin');
            trackCommand(command, userId);
            
            if (command) {
                await Gifted.sendChatAction(chatId, 'typing');
            }

            if (text) {
                await Gifted.sendChatAction(chatId, 'typing');
            }
            
            const GiftedTech = {
                Gifted,
                text,
                monospace,
                GiftedApkDl,
                command,
                fetchJson,
                chatId,
                userId,
                sender: m.from.username,
                chatType,
                pickRandom,
                plugins,
            };
            for (const plugin of plugins) {
                try {
                    if (typeof plugin.before === "function") {
                        if (plugin.before(m, GiftedTech)) continue;
                    }
                    if (plugin.command.includes(command)) {
                        await Gifted.sendChatAction(chatId, 'typing');
                        if (plugin?.settings?.owner && !m.isOwner) {
                            return Gifted.reply(giftechMess.owner, m);
                        }
                        if (plugin?.settings?.group && !m.isGroup) {
                            return Gifted.reply(giftechMess.group, m);
                        }
                        if (plugin?.settings?.private && !m.isPrivate) {
                            return Gifted.reply(giftechMess.private, m);
                        }
                        if (typeof plugin === "function") {
                            await plugin(m, GiftedTech);
                        } else if (plugin.run) {
                            await plugin.run(m, GiftedTech);
                        }
                        handled = true;
                        break;
                    }
                } catch (error) {
                  //  console.error(`Error executing plugin ${plugin.filePath}:`, error);
                }
            }
            handleCases(m, GiftedTech);
        } catch (err) {
            console.log(err);
            Gifted.reply({ text: `${err}`, parse_mode: 'Markdown' }, m);
        }
    });
    
    Gifted.on('callback_query', async (callbackQuery) => {
        const { data, message: m } = callbackQuery;
        try {
            const parsedData = JSON.parse(data);
            
            let GiftedDevs = {
                Gifted,
                monospace,
                GiftedApkDl,
                text: parsedData.data || '',
                command: parsedData.feature,
                fetchJson,
                pickRandom,
                chatId: m.chat.id,
                userId: m.from.id,
                sender: m.from.username,
                plugins,
            };
            
            // Handle callback queries for new features
            if (parsedData.feature === 'setrole') {
                const { getUserRole, setUserRole, getLocalizedText } = require('../gifted/ai/roles');
                const roleKey = parsedData.data;
                const userId = m.from.id;
                
                const success = setUserRole(userId, roleKey);
                if (success) {
                    const newRole = getUserRole(userId);
                    const message = `✅ ${getLocalizedText(userId, 'role_changed')}\n\n` +
                                   `New Role: *${newRole.name}*\n` +
                                   `Description: ${newRole.description}\n\n` +
                                   `*Capabilities:*\n• ${newRole.capabilities.join('\n• ')}`;
                    
                    await Gifted.editMessageText(message, {
                        chat_id: m.chat.id,
                        message_id: m.message_id,
                        parse_mode: 'Markdown'
                    });
                }
                await Gifted.answerCallbackQuery(callbackQuery.id);
                return;
            }
            
            if (parsedData.feature === 'setlang') {
                const { getUserLanguage, setUserLanguage, getLocalizedText } = require('../gifted/ai/roles');
                const langCode = parsedData.data;
                const userId = m.from.id;
                
                const success = setUserLanguage(userId, langCode);
                if (success) {
                    const newLang = getUserLanguage(userId);
                    const message = `✅ ${getLocalizedText(userId, 'language_changed')}\n\n` +
                                   `New Language: *${newLang.flag} ${newLang.name}*\n\n` +
                                   `🤖 Bot interface updated to ${newLang.name}!`;
                    
                    await Gifted.editMessageText(message, {
                        chat_id: m.chat.id,
                        message_id: m.message_id,
                        parse_mode: 'Markdown'
                    });
                }
                await Gifted.answerCallbackQuery(callbackQuery.id);
                return;
            }
            
            if (parsedData.feature) {
                for (const plugin of plugins) {
                    try {
                        if (plugin?.command?.includes(parsedData.feature)) {
                            if (typeof plugin === "function") {
                                await plugin(m, GiftedDevs);
                            } else if (plugin.run) {
                                await plugin.run(m, GiftedDevs);
                            }
                            await Gifted.answerCallbackQuery(callbackQuery.id);
                            handled = true;
                            break;
                        }
                    } catch (error) {
                        console.error(`Error executing plugin ${plugin.filePath}:`, error);
                    }
                }
                handleCases(m, GiftedDevs);
                await Gifted.answerCallbackQuery(callbackQuery.id);
            }
        } catch (err) {
            console.log(err);
            Gifted.reply({ text: `${err}`, parse_mode: 'Markdown' }, m);
        }
    });
};

// Function to handle direct text messages (without command prefix)
async function handleDirectTextMessage(Gifted, m) {
    try {
        const text = m.text.trim();
        const userId = m.from.id;
        const chatId = m.chat.id;
        
        console.log(chalk.cyan(`🤖 Processing AI request: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`));
        
        // Show typing indicator
        await Gifted.sendChatAction(chatId, 'typing');
        
        let giftedButtons = [
            [
                { text: 'Ai Web', url: `${global.giftedApi}/aichat` },
                { text: 'WaChannel', url: global.giftedWaChannel }
            ]
        ];

        let giftedResponse = null;
        let apiUsed = 'Unknown';

        // Try Google Gemini API first if configured
        if (geminiAPI.isEnabled()) {
            console.log('🔮 Trying Google Gemini API...');
            const geminiResult = await geminiAPI.chat(text);
            
            if (geminiResult.success) {
                giftedResponse = geminiResult.result;
                apiUsed = 'Google Gemini API';
                console.log(chalk.green('✅ Google Gemini API responded'));
            } else {
                console.log('⚠️  Google Gemini failed, trying fallback API');
            }
        } else {
            console.log('⚠️  Google Gemini not configured, using fallback API');
        }

        // Fallback to alternative API if Google Gemini failed or not configured
        if (!giftedResponse) {
            console.log('🔄 Using alternative API...');
            try {
                const aiResponse = await fetchJson(`${global.giftedApi}/ai/geminiai?apikey=${global.giftedKey}&q=${encodeURIComponent(text)}`);
                if (aiResponse && aiResponse.result) {
                    giftedResponse = aiResponse.result;
                    apiUsed = 'Alternative API';
                    console.log(chalk.green('✅ Alternative API responded'));
                } else {
                    throw new Error('Invalid response from alternative API');
                }
            } catch (fallbackError) {
                console.error('❌ Alternative API failed:', fallbackError.message);
                throw fallbackError;
            }
        }

        if (!giftedResponse) {
            throw new Error('No response from any API');
        }

        // Format response safely for Telegram
        const formattedResponse = geminiAPI.formatForTelegram(giftedResponse, true);

        await Gifted.reply(formattedResponse, giftedButtons, m);
        
        console.log(chalk.green(`✅ Response sent successfully via ${apiUsed}`));

    } catch (error) {
        console.error(chalk.red('❌ AI response error:'), error.message);
        
        try {
            // Provide helpful error message
            let errorMessage = '';
            const config = geminiAPI.getConfig();
            
            if (!config.enabled) {
                errorMessage = validateParseMode(`❌ *AI Service Temporarily Unavailable*

Sorry, I'm unable to respond right now. Please try again later or use commands with ${global.prefix}

${config.helpText}`, 'Markdown');
            } else {
                errorMessage = validateParseMode(`❌ *Temporary Issue*

I'm having trouble responding right now. Please try again in a moment, or use commands with ${global.prefix}`, 'Markdown');
            }
            
            await Gifted.reply(errorMessage, m);
            console.log(chalk.yellow('⚠️  Sent error message to user'));
        } catch (fallbackError) {
            console.error(chalk.red('❌ Failed to send error message:'), fallbackError.message);
        }
    }
}
