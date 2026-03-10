const { gmd } = require('../gift');
const config = require('../config');
const { AUDIO_APIS, VIDEO_APIS, tryDownloadWithFallback, formatDuration, formatViews, cleanupFile, fs, searchGiftedTechYts } = require('../gift/gmdHelpers');
const axios = require('axios');


gmd({
    pattern: "play",
    aliases: ["song", "music"],
    react: "🎉",
    category: "download",
    description: "Download audio from YouTube",
    cooldown: 10
},

async (msg, Gifted, conText) => {
    const { reply, q, prefix } = conText;

    if (!q) {
        return await reply(`Please provide a song name or youtube url!\nExample: ${prefix}play spectre`);
    }

    let tempFilePath = null;

    try {
        await Gifted.sendChatAction(conText.chatId, 'typing');

        const videos = await searchGiftedTechYts(q);

        if (!videos || videos.length === 0) {
            return await reply('No video found for your query.');
        }

        const video = videos[0];
        const videoUrl = video.url;

        await reply(`Downloading: ${video.name}\nDuration: ${video.duration || 'Unknown'}`);
        await Gifted.sendChatAction(conText.chatId, 'upload_audio');

        const result = await tryDownloadWithFallback(AUDIO_APIS, videoUrl, 'audio');

        if (!result) {
            return await reply('All download sources failed. Please try again later.');
        }

        tempFilePath = result.filePath;
        const downloadData = result.data;
        const fileName = downloadData.result.title || video.name;
        const duration = downloadData.result.duration || video.duration || '0:00';
        const views = video.views || 0;
        const caption = `🎵 *${fileName.replace('.mp3', '')}*\n⏱️ Duration: ${formatDuration(duration)}\n👁️ Views: ${formatViews(views)}`;

        const stream = fs.createReadStream(tempFilePath);
        await Gifted.sendAudio(conText.chatId, stream, {
            title: fileName.replace('.mp3', ''),
            performer: config.artistName,
            caption: caption,
            parse_mode: 'Markdown'
        }, {
            filename: `${fileName.replace('.mp3', '')}.mp3`,
            contentType: 'audio/mpeg'
        });

    } catch (error) {
        console.error('Error downloading audio:', error.message);
        await reply('Error downloading audio. Try again later.');
    } finally {
        cleanupFile(tempFilePath);
    }
});

gmd({
    pattern: "video",
    react: "🔥",
    category: "download",
    description: "Download video from YouTube",
    cooldown: 10
},

async (msg, Gifted, conText) => {
    const { reply, q, prefix } = conText;

    if (!q) {
        return await reply(`Please provide a video name or youtube url!\nExample: ${prefix}video spectre`);
    }

    let tempFilePath = null;

    try {
        await Gifted.sendChatAction(conText.chatId, 'typing');

        const videos = await searchGiftedTechYts(q);

        if (!videos || videos.length === 0) {
            return await reply('No video found for your query.');
        }

        const video = videos[0];
        const videoUrl = video.url;

        await reply(`Downloading: ${video.name}\nDuration: ${video.duration || 'Unknown'}`);
        await Gifted.sendChatAction(conText.chatId, 'upload_video');

        const result = await tryDownloadWithFallback(VIDEO_APIS, videoUrl, 'video');

        if (!result) {
            return await reply('All download sources failed. Please try again later.');
        }

        tempFilePath = result.filePath;
        const downloadData = result.data;
        const fileName = downloadData.result.title || video.name;
        const duration = downloadData.result.duration || video.duration || '0:00';
        const views = video.views || 0;
        const caption = `🎥 *${fileName.replace('.mp4', '')}*\n⏱️ Duration: ${formatDuration(duration)}\n👁️ Views: ${formatViews(views)}`;

        const stream = fs.createReadStream(tempFilePath);
        await Gifted.sendVideo(conText.chatId, stream, {
            title: fileName.replace('.mp4', ''),
            caption: caption,
            parse_mode: 'Markdown'
        }, {
            filename: `${fileName.replace('.mp4', '')}.mp4`,
            contentType: 'video/mp4'
        });

    } catch (error) {
        console.error('Error downloading video:', error.message);
        await reply('Error downloading video. Try again later.');
    } finally {
        cleanupFile(tempFilePath);
    }
});


gmd({
    pattern: "yts",
    react: "🔍",
    category: "search",
    description: "Search YouTube videos",
    cooldown: 5
},

async (msg, Gifted, conText) => {
    const { reply, q, prefix } = conText;

    if (!q) {
        return await reply(`Please provide a search query!\nExample: ${prefix}ytsearch spectre`);
    }

    try {
        await Gifted.sendChatAction(conText.chatId, 'typing');
        
        const videos = await searchGiftedTechYts(q);
        
        if (!videos || videos.length === 0) {
            return await reply('No results found.');
        }

        let searchResult = `🔍 Search Results for: ${q}\n\n`;
        
        videos.slice(0, 5).forEach((video, index) => {
            searchResult += `${index + 1}. ${video.name}\n`;
            searchResult += `⏱️ Duration: ${video.duration || 'Unknown'}\n`;
            searchResult += `👁️ Views: ${formatViews(video.views || 0)}\n`;
            searchResult += `📺 Channel: ${video.author || 'Unknown'}\n`;
            searchResult += `🔗 ID: ${video.id}\n\n`;
        });
        
        searchResult += `_Use ${prefix}play <song name> or ${prefix}video <video name> to download_`;
        
        await reply(searchResult);

    } catch (error) {
        console.error('Search error:', error.message);
        await reply('Error performing search. Try again later.');
    }
});
