const axios = require("axios"),
      yts = require("yt-search");

module.exports = {
    command: ['play', 'song', 'audio'],
    desc: 'Download Audio from Youtube',
    category: ['downloader'],
    async run(m, { Gifted, text }) {

        if (!text) return Gifted.reply({ text: `Usage: ${global.prefix}play Faded` }, m);

        Gifted.reply({ text: giftechMess.wait }, m);

        try {
            const searchTerm = Array.isArray(text) ? text.join(" ") : text;
            const searchResults = await yts(searchTerm);

            if (!searchResults.videos.length) {
                return Gifted.reply({ text: 'No video found for your query.' }, m);
            }

            const video = searchResults.videos[0];
            const videoUrl = video.url;

            let giftedButtons = [
                [
                    { text: 'Ytdl Web', url: `${global.ytdlWeb}` },
                    { text: 'WaChannel', url: global.giftedWaChannel }
                ]
            ];

            try {
                const apiResponse = await axios.get(`${global.giftedApi}/api/download/ytmp3?apikey=${global.giftedKey}&url=${videoUrl}`);
                const downloadUrl = apiResponse.data.result.download_url;
                const fileName = apiResponse.data.result.title;

                if (!downloadUrl) {
                    return Gifted.reply({ text: '❌ Failed to retrieve download link. Please try again later or use a different song.' }, giftedButtons, m);
                }

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
                console.error('API Error in play command:', e);
                // Always reply to user with helpful error message
                const errorMsg = e.code === 'ENOTFOUND' || e.code === 'ECONNREFUSED' 
                    ? '🌐 Network error: Unable to connect to download service. Please try again later.'
                    : '❌ Download service temporarily unavailable. Please try again in a few minutes.';
                return Gifted.reply({ text: errorMsg }, giftedButtons, m);
            }
        } catch (e) {
            console.error('Search Error in play command:', e);
            // Provide helpful error message for search failures
            const errorMsg = e.code === 'ENOTFOUND' 
                ? '🌐 Unable to search for songs. Please check your internet connection and try again.'
                : '🔍 Song search failed. Please try with a different search term.';
            return Gifted.reply({ text: errorMsg }, m);
        }
    }
};
