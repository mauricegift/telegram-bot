const axios = require("axios");

module.exports = {
    command: ['ytmp3'],
    desc: 'Download Audio from Youtube',
    category: ['downloader'],
    async run(m, { Gifted, text }) {

        if (!text) return Gifted.reply({ text: `Usage: ${global.prefix}ytmp3 https://youtu.be/60ItHLz5WEA?feature=shared` }, m);

        Gifted.reply({ text: giftechMess.wait }, m);

        try {
            const videoUrl = Array.isArray(text) ? text.join(" ") : text;
            if (!videoUrl.startsWith("https://youtu")) return Gifted.reply({ text: 'Please Provide a Valid YouTube Link' }, m);

            try {
                const apiResponse = await axios.get(`${global.giftedApi}/api/download/ytmp3?apikey=${global.giftedKey}&url=${videoUrl}`);
                const downloadUrl = apiResponse.data.result.download_url;
                const fileName = apiResponse.data.result.title;

                if (!downloadUrl) {
                    return Gifted.reply({ text: '❌ Failed to retrieve download link. Please try again later or use a different YouTube URL.' }, m);
                }

                 let giftedButtons = [
                [
                    { text: 'Ytdl Web', url: `${global.ytdlWeb}` },
                    { text: 'WaChannel', url: global.giftedWaChannel }
                ]
            ];

                const searchResponse = await axios.get(`${global.giftedApi}/search/yts?apikey=${global.giftedKey}&query=${videoUrl}`);
                const video = searchResponse.data.results[0];

                let giftedMess = `
${global.botName} SONG DOWNLOADER 
╭───────────────◆  
│⿻ *Title:* ${video.title}
│⿻ *Quality:* 128Kbps
│⿻ *Duration:* ${video.timestamp}
│⿻ *Viewers:* ${video.views}
│⿻ *Uploaded:* ${video.ago}
│⿻ *Artist:* ${video.author.name}
╰────────────────◆  
⦿ *Direct Yt Link:* ${video.url}
⦿ *Download More At:* ${global.ytdlWeb}

╭────────────────◆  
│ ${global.footer}
╰─────────────────◆`;

                await Gifted.reply({ image: { url: video.thumbnail }, caption: giftedMess, parse_mode: 'Markdown' }, giftedButtons, m);

                Gifted.downloadAndSend({ audio: downloadUrl, fileName: fileName, caption: giftechMess.done }, giftedButtons, m);
            } catch (e) {
                console.error('API Error in ytmp3 command:', e);
                // Always reply to user with helpful error message
                const errorMsg = e.code === 'ENOTFOUND' || e.code === 'ECONNREFUSED' 
                    ? '🌐 Network error: Unable to connect to download service. Please try again later.'
                    : '❌ Audio download service temporarily unavailable. Please try again in a few minutes.';
                return Gifted.reply({ text: errorMsg }, giftedButtons, m);
            }
        } catch (e) {
            console.error('URL validation error in ytmp3 command:', e);
            // Provide helpful error message for URL validation failures
            return Gifted.reply({ text: '🔗 Please provide a valid YouTube URL. Example: https://youtu.be/VIDEO_ID' }, m);
        }
    }
};
