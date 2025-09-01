require('../set');
const fs = require('fs');
const axios = require('axios');
const fetch = require('node-fetch');
const chalk = require('chalk');
const path = require('path');
const { validateParseMode, validateMessageLength } = require('./textSanitizer');

async function giftedLoadDatabase(Gifted, m) {
    const userId = m.from.id;
    const chatId = m.chat.id;
    const chatType = m.chat.type;
    
    // Initialize user data with enhanced fields
    if (!db.users[userId]) {
        db.users[userId] = {
            username: m.from.username,
            joinDate: Date.now(),
            lastSeen: Date.now(),
            commandsUsed: 0,
            aiRole: 'default',
            language: 'en',
            blocked: false,
            premium: false,
            roleHistory: []
        };
    } else {
        // Update existing user data
        db.users[userId].username = m.from.username;
        db.users[userId].lastSeen = Date.now();
        
        // Initialize missing fields for existing users
        if (!db.users[userId].joinDate) db.users[userId].joinDate = Date.now();
        if (!db.users[userId].commandsUsed) db.users[userId].commandsUsed = 0;
        if (!db.users[userId].aiRole) db.users[userId].aiRole = 'default';
        if (!db.users[userId].language) db.users[userId].language = 'en';
        if (db.users[userId].blocked === undefined) db.users[userId].blocked = false;
        if (db.users[userId].premium === undefined) db.users[userId].premium = false;
        if (!db.users[userId].roleHistory) db.users[userId].roleHistory = [];
    }
    
    // Initialize group data with enhanced fields
    if (chatType === 'group' || chatType === 'supergroup') {
        if (!db.groups[chatId]) {
            db.groups[chatId] = {
                groupName: m.chat.title,
                lastActivity: Date.now(),
                memberCount: 0,
                settings: {},
                disabled: false
            };
        } else {
            // Update existing group data
            db.groups[chatId].groupName = m.chat.title;
            db.groups[chatId].lastActivity = Date.now();
            
            // Initialize missing fields
            if (!db.groups[chatId].settings) db.groups[chatId].settings = {};
            if (db.groups[chatId].disabled === undefined) db.groups[chatId].disabled = false;
        }
    }
}

async function giftedCustomMessage(Gifted, m) {
    const userId = m.from.id;
    const chatId = m.chat.id;
    const chatType = m.chat.type;
    
    if (m) {
        m.isOwner = ownerId.includes(userId) || false
        m.isPrivate = (chatType !== 'group' && chatType !== 'supergroup' && chatType !== 'channel') || false
        m.isGroup = (chatType === 'group' || chatType === 'supergroup') || false
    }
    
    Gifted.reply = async (content, buttonsOrMsg, m) => {
        try {
            let buttons = [];
            
            if (typeof buttonsOrMsg === 'object') {
                if (Array.isArray(buttonsOrMsg)) {
                    buttons = buttonsOrMsg.map(row => {
                        if (Array.isArray(row)) {
                            return row.map(button => {
                                if (button.feature) {
                                    return { text: button.text, callback_data: JSON.stringify({ feature: button.feature, data: button.data || '' }) };
                                } else if (button.callback_data) {
                                    return { text: button.text, callback_data: button.callback_data };
                                } else if (button.url) {
                                    return { text: button.text, url: button.url };
                                } else {
                                    return button;
                                }
                            });
                        } else {
                            if (row.feature) {
                                return [{ text: row.text, callback_data: JSON.stringify({ feature: row.feature, data: row.data || '' }) }];
                            } else if (row.callback_data) {
                                return [{ text: row.text, callback_data: row.callback_data }];
                            } else if (row.url) {
                                return [{ text: row.text, url: row.url }];
                            } else {
                                return [row];
                            }
                        }
                    });
                } else if (buttonsOrMsg.chat && buttonsOrMsg.message_id) {
                    m = buttonsOrMsg;
                } else {
                    content = { ...content, ...buttonsOrMsg };
                }
            }
            
            if (m.message_id) {
                content.reply_to_message_id = m.message_id;
            } else {
                content.reply_to_message_id = null
            }
            
            if (buttons.length > 0) {
                content.reply_markup = { inline_keyboard: buttons };
            }
            
            // Validate and sanitize content with parse_mode and length limits
            if (typeof content === 'object' && content.parse_mode) {
                if (content.text) {
                    const validated = validateParseMode(content.text, content.parse_mode);
                    content.text = validated.text;
                    content.parse_mode = validated.parse_mode;
                } else if (content.caption) {
                    const validated = validateParseMode(content.caption, content.parse_mode);
                    content.caption = validated.text;
                    content.parse_mode = validated.parse_mode;
                }
            }
            
            if (typeof content === 'object') {
                if (content.image) {
                    // Handle caption length for images
                    if (content.caption) {
                        const lengthValidation = validateMessageLength(content.caption, true); // true for caption
                        if (lengthValidation.needsSplit) {
                            // Send first image with first chunk of caption
                            const firstContent = { ...content, caption: lengthValidation.chunks[0] };
                            const result = await Gifted.sendPhoto(m.chat.id, content.image.url || content.image, firstContent);
                            
                            // Send remaining chunks as text messages
                            for (let i = 1; i < lengthValidation.chunks.length; i++) {
                                await Gifted.sendMessage(m.chat.id, lengthValidation.chunks[i], {
                                    parse_mode: content.parse_mode,
                                    reply_to_message_id: content.reply_to_message_id,
                                    reply_markup: i === lengthValidation.chunks.length - 1 ? content.reply_markup : undefined
                                });
                            }
                            return result;
                        }
                    }
                    return await Gifted.sendPhoto(m.chat.id, content.image.url || content.image, content);
                }
                if (content.video) {
                    // Handle caption length for videos
                    if (content.caption) {
                        const lengthValidation = validateMessageLength(content.caption, true);
                        if (lengthValidation.needsSplit) {
                            const firstContent = { ...content, caption: lengthValidation.chunks[0] };
                            const result = await Gifted.sendVideo(m.chat.id, content.video.url || content.video, firstContent);
                            
                            for (let i = 1; i < lengthValidation.chunks.length; i++) {
                                await Gifted.sendMessage(m.chat.id, lengthValidation.chunks[i], {
                                    parse_mode: content.parse_mode,
                                    reply_to_message_id: content.reply_to_message_id,
                                    reply_markup: i === lengthValidation.chunks.length - 1 ? content.reply_markup : undefined
                                });
                            }
                            return result;
                        }
                    }
                    return await Gifted.sendVideo(m.chat.id, content.video.url || content.video, content);
                }
                if (content.audio) {
                    // Handle caption length for audio
                    if (content.caption) {
                        const lengthValidation = validateMessageLength(content.caption, true);
                        if (lengthValidation.needsSplit) {
                            const firstContent = { ...content, caption: lengthValidation.chunks[0] };
                            const result = await Gifted.sendAudio(m.chat.id, content.audio.url || content.audio, firstContent);
                            
                            for (let i = 1; i < lengthValidation.chunks.length; i++) {
                                await Gifted.sendMessage(m.chat.id, lengthValidation.chunks[i], {
                                    parse_mode: content.parse_mode,
                                    reply_to_message_id: content.reply_to_message_id,
                                    reply_markup: i === lengthValidation.chunks.length - 1 ? content.reply_markup : undefined
                                });
                            }
                            return result;
                        }
                    }
                    return await Gifted.sendAudio(m.chat.id, content.audio.url || content.audio, content);
                }
                if (content.document) {
                    // Handle caption length for documents
                    if (content.caption) {
                        const lengthValidation = validateMessageLength(content.caption, true);
                        if (lengthValidation.needsSplit) {
                            const firstContent = { ...content, caption: lengthValidation.chunks[0] };
                            const result = await Gifted.sendDocument(m.chat.id, content.document.url || content.document, firstContent);
                            
                            for (let i = 1; i < lengthValidation.chunks.length; i++) {
                                await Gifted.sendMessage(m.chat.id, lengthValidation.chunks[i], {
                                    parse_mode: content.parse_mode,
                                    reply_to_message_id: content.reply_to_message_id,
                                    reply_markup: i === lengthValidation.chunks.length - 1 ? content.reply_markup : undefined
                                });
                            }
                            return result;
                        }
                    }
                    return await Gifted.sendDocument(m.chat.id, content.document.url || content.document, content);
                }
                if (content.text) {
                    // Handle message length for text messages
                    const lengthValidation = validateMessageLength(content.text, false); // false for message
                    if (lengthValidation.needsSplit) {
                        let result;
                        for (let i = 0; i < lengthValidation.chunks.length; i++) {
                            const chunkContent = {
                                ...content,
                                text: lengthValidation.chunks[i],
                                reply_markup: i === lengthValidation.chunks.length - 1 ? content.reply_markup : undefined
                            };
                            
                            if (i === 0) {
                                result = await Gifted.sendMessage(m.chat.id, chunkContent.text, chunkContent);
                            } else {
                                await Gifted.sendMessage(m.chat.id, chunkContent.text, chunkContent);
                            }
                        }
                        return result;
                    }
                    return await Gifted.sendMessage(m.chat.id, content.text, content);
                }
                throw new Error('Unsupported content type.');
            }
            
            throw new Error('Invalid content type.');
        } catch (error) {
            console.error('Gifted.reply error:', error.message);
            
            // Fallback: try sending without parse_mode if parse error
            if (error.message.includes('parse') || error.message.includes('entities')) {
                try {
                    console.log('🔧 Parse error detected, retrying without parse_mode');
                    const fallbackContent = { ...content };
                    delete fallbackContent.parse_mode;
                    
                    if (fallbackContent.text) {
                        return await Gifted.sendMessage(m.chat.id, fallbackContent.text, fallbackContent);
                    } else if (fallbackContent.caption) {
                        if (fallbackContent.image) {
                            return await Gifted.sendPhoto(m.chat.id, fallbackContent.image.url || fallbackContent.image, fallbackContent);
                        }
                    }
                } catch (fallbackError) {
                    console.error('Fallback also failed:', fallbackError.message);
                }
            }
            
            // Last resort: send simple error message
            await Gifted.sendMessage(m.chat.id, `⚠️ Message could not be sent due to formatting issues.`, {});
        }
    };
    
    Gifted.downloadAndSend = async (data, buttonsOrMsg, m) => {
        try {
            let buttons = [];
            
            if (typeof buttonsOrMsg === 'object') {
                if (Array.isArray(buttonsOrMsg)) {
                    buttons = buttonsOrMsg.map(row => {
                        if (Array.isArray(row)) {
                            return row.map(button => {
                                if (button.feature) {
                                    return { text: button.text, callback_data: JSON.stringify({ feature: button.feature, data: button.data || '' }) };
                                } else if (button.callback_data) {
                                    return { text: button.text, callback_data: button.callback_data };
                                } else if (button.url) {
                                    return { text: button.text, url: button.url };
                                } else {
                                    return button;
                                }
                            });
                        } else {
                            if (row.feature) {
                                return [{ text: row.text, callback_data: JSON.stringify({ feature: row.feature, data: row.data || '' }) }];
                            } else if (row.callback_data) {
                                return [{ text: row.text, callback_data: row.callback_data }];
                            } else if (row.url) {
                                return [{ text: row.text, url: row.url }];
                            } else {
                                return [row];
                            }
                        }
                    });
                } else if (buttonsOrMsg.chat && buttonsOrMsg.message_id) {
                    m = buttonsOrMsg;
                } else {
                    data = { ...data, ...buttonsOrMsg };
                }
            }
            
            if (m.message_id) {
                data.reply_to_message_id = m.message_id;
            } else {
                data.reply_to_message_id = null
            }
            
            if (buttons.length > 0) {
                data.reply_markup = { inline_keyboard: buttons };
            }
            
            const type = Object.keys(data)[0];
            const url = data[type];
            
            // Validate URL before proceeding
            if (!url || typeof url !== 'string') {
                throw new Error(`Invalid ${type} URL: ${url}. The API may have returned an invalid response.`);
            }
            
            const customFileName = data.fileName || `${Date.now()}`;
    
            const ext = path.extname(url).split('?')[0] || '';
            const fileName = `${customFileName}${ext}`;
            const filePath = path.resolve(__dirname, '..', 'temp', fileName);

            const tempDir = path.resolve(__dirname, '..', 'temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
    
            const writer = fs.createWriteStream(filePath);
            const response = await axios({
                url,
                method: 'GET',
                responseType: 'stream',
            });
    
            response.data.pipe(writer);
    
            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
    
            if (typeof data === 'object') {
                if (data.image) {
                    return await Gifted.sendPhoto(m.chat.id, filePath, data);
                }
                if (data.video) {
                    return await Gifted.sendVideo(m.chat.id, filePath, data);
                }
                if (data.audio) {
                    return await Gifted.sendAudio(m.chat.id, filePath, data);
                }
                if (data.document) {
                    return await Gifted.sendDocument(m.chat.id, filePath, data);
                }
                throw new Error('Unsupported content type.');
            }
            
            fs.unlinkSync(filePath);
        } catch (error) {
            console.error(`Error in downloadAndSend: ${error.message}`);
            await Gifted.sendMessage(m.chat.id, `Failed to send message: ${error.message}`, {});
        } finally {
             const tempDir = path.resolve(__dirname, '..', 'temp');
             fs.readdirSync(tempDir).forEach(file => {
                 const fileToDelete = path.join(tempDir, file);
                 try {
                     fs.unlinkSync(fileToDelete);
                 } catch (err) {
                     console.error(`Failed to delete temp file: ${fileToDelete}`, err);
                 }
             });
        }
    };
}

module.exports = { loadDatabase: giftedLoadDatabase, customMessage: giftedCustomMessage };
