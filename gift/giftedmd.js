require('../set');
const fs = require('fs');
const axios = require('axios');
const fetch = require('node-fetch');
const chalk = require('chalk');
const path = require('path');

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
            
            if (typeof content === 'object') {
                if (content.image) {
                    return await Gifted.sendPhoto(m.chat.id, content.image.url || content.image, content);
                }
                if (content.video) {
                    return await Gifted.sendVideo(m.chat.id, content.video.url || content.video, content);
                }
                if (content.audio) {
                    return await Gifted.sendAudio(m.chat.id, content.audio.url || content.audio, content);
                }
                if (content.document) {
                    return await Gifted.sendDocument(m.chat.id, content.document.url || content.document, content);
                }
                if (content.text) {
                    return await Gifted.sendMessage(m.chat.id, content.text, content);
                }
                throw new Error('Unsupported content type.');
            }
            
            throw new Error('Invalid content type.');
        } catch (error) {
            console.error('Gifted.reply error:', error.message);
            await Gifted.sendMessage(m.chat.id, `Failed to send message: ${error.message}`, {});
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
