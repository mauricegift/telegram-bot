const { gmd } = require('../gift');
const config = require('../config');
const { AUDIO_APIS, VIDEO_APIS, tryDownloadWithFallback, formatDuration, formatViews, cleanupFile, fs } = require('../gift/gmdHelpers');
const yts = require("yt-search");

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
        return await reply(`Please provide a song name!\nExample: ${prefix}play spectre`);
    }

    let tempFilePath = null;

    try {
        await Gifted.sendChatAction(conText.chatId, 'typing');

        const searchResults = await yts(q);

        if (!searchResults.videos.length) {
            return await reply('No video found for your query.');
        }

        const video = searchResults.videos[0];
        const videoUrl = video.url;

        await reply(`Downloading: ${video.title}`);
        await Gifted.sendChatAction(conText.chatId, 'upload_audio');

        const result = await tryDownloadWithFallback(AUDIO_APIS, videoUrl, 'audio');

        if (!result) {
            return await reply('All download sources failed. Please try again later.');
        }

        tempFilePath = result.filePath;
        const downloadData = result.data;
        const fileName = downloadData.result.title || video.title;
        const duration = downloadData.result.duration || video.timestamp || video.duration;
        const views = video.views;
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
        return await reply(`Please provide a video name!\nExample: ${prefix}video spectre`);
    }

    let tempFilePath = null;

    try {
        await Gifted.sendChatAction(conText.chatId, 'typing');

        const searchResults = await yts(q);

        if (!searchResults.videos.length) {
            return await reply('No video found for your query.');
        }

        const video = searchResults.videos[0];
        const videoUrl = video.url;

        await reply(`Downloading: ${video.title}`);
        await Gifted.sendChatAction(conText.chatId, 'upload_video');

        const result = await tryDownloadWithFallback(VIDEO_APIS, videoUrl, 'video');

        if (!result) {
            return await reply('All download sources failed. Please try again later.');
        }

        tempFilePath = result.filePath;
        const downloadData = result.data;
        const fileName = downloadData.result.title || video.title;
        const duration = downloadData.result.duration || video.timestamp || video.duration;
        const views = video.views;
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
