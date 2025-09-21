require('../config');
const fs = require('fs');
const axios = require('axios');
const fetch = require('node-fetch');
const chalk = require('chalk');
const path = require('path');

async function giftedLoadDatabase(Gifted, m) {
    const userId = m.from.id;
    const chatId = m.chat.id;
    const chatType = m.chat.type;
    if (!db.users[userId]) {
        db.users[userId] = {
            username: m.from.username
        };
    }
    if (chatType === 'group' || chatType === 'supergroup') {
        if (!db.groups[chatId]) {
            db.groups[chatId] = {
                groupName: m.chat.title
            };
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
            
            if (m && m.message_id) {
                content.reply_to_message_id = m.message_id;
            } else {
                content.reply_to_message_id = null;
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
        let filePath = null;
        try {
            let buttons = [];
            let content = { ...data };
            
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
            
            if (m && m.message_id) {
                content.reply_to_message_id = m.message_id;
            } else {
                content.reply_to_message_id = null;
            }
            
            if (buttons.length > 0) {
                content.reply_markup = { inline_keyboard: buttons };
            }
            
            let downloadUrl, fileType, fileName;
            
            if (content.audio) {
                downloadUrl = content.audio;
                fileType = 'audio';
                fileName = content.fileName || `audio_${Date.now()}.mp3`;
            } else if (content.video) {
                downloadUrl = content.video;
                fileType = 'video';
                fileName = content.fileName || `video_${Date.now()}.mp4`;
            } else if (content.image) {
                downloadUrl = content.image;
                fileType = 'image';
                fileName = content.fileName || `image_${Date.now()}.jpg`;
            } else if (content.document) {
                downloadUrl = content.document;
                fileType = 'document';
                fileName = content.fileName || `document_${Date.now()}`;
            } else {
                throw new Error('No valid content type specified. Use audio, video, image, or document');
            }
            
            if (!path.extname(fileName)) {
                const ext = path.extname(downloadUrl.split('?')[0]) || 
                           (fileType === 'audio' ? '.mp3' : 
                            fileType === 'video' ? '.mp4' : 
                            fileType === 'image' ? '.jpg' : '');
                fileName += ext;
            }
            
            fileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
            
            const tempDir = path.resolve(__dirname, '..', 'temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            
            filePath = path.resolve(tempDir, fileName);
            
            // console.log(`Downloading ${fileType} from: ${downloadUrl}`);
            const response = await axios({
                url: downloadUrl,
                method: 'GET',
                responseType: 'stream',
                timeout: 720000, // 12 minutes timeout
                validateStatus: (status) => status >= 200 && status < 300
            });
            
            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);
            
            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
                response.data.on('error', reject);
            });
            
            if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
                throw new Error('Downloaded file is empty or does not exist');
            }
            
          //  console.log(`File downloaded successfully: ${filePath} (${fs.statSync(filePath).size} bytes)`);
            
            const sendOptions = {
                caption: content.caption,
                parse_mode: content.parse_mode,
                reply_markup: content.reply_markup,
                reply_to_message_id: content.reply_to_message_id
            };
            
            // Send the file based on type
            let result;
            switch (fileType) {
                case 'audio':
                    result = await Gifted.sendAudio(m.chat.id, filePath, sendOptions);
                    break;
                case 'video':
                    result = await Gifted.sendVideo(m.chat.id, filePath, sendOptions);
                    break;
                case 'image':
                    result = await Gifted.sendPhoto(m.chat.id, filePath, sendOptions);
                    break;
                case 'document':
                    result = await Gifted.sendDocument(m.chat.id, filePath, sendOptions);
                    break;
                default:
                    throw new Error('Unsupported content type');
            }
            
          //  console.log(`File sent successfully: ${fileType}`);
            return result;
            
        } catch (error) {
            console.error(`Error in downloadAndSend: ${error.message}`);
            console.error(error.stack);
            
            if (m && m.chat && m.chat.id) {
                try {
                    await Gifted.sendMessage(m.chat.id, `Failed to send ${fileType}: ${error.message}`, {});
                } catch (sendError) {
                    console.error('Failed to send error message:', sendError.message);
                }
            }
            
            throw error;
        } finally {
            // Clean up the downloaded file
            if (filePath && fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                  //  console.log(`Temp file cleaned up: ${filePath}`);
                } catch (err) {
                    console.error(`Failed to delete temp file: ${filePath}`, err);
                }
            }
        }
    };
}

module.exports = { loadDatabase: giftedLoadDatabase, customMessage: giftedCustomMessage };

