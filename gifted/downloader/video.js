const axios = require("axios"),
      yts = require("yt-search");

module.exports = {
    command: ['video'],
    desc: 'Download Video from Youtube',
    category: ['downloader'],
    async run(m, { Gifted, text }) {

        if (!text) return Gifted.reply({ text: `Usage: ${global.prefix}video Faded` }, m);

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
                const apiResponse = await axios.get(`${global.giftedApi}/api/download/ytmp4?apikey=${global.giftedKey}&url=${videoUrl}`);
                const downloadUrl = apiResponse.data.result.download_url;
                const fileName = apiResponse.data.result.title;

                if (!downloadUrl) {
                    return Gifted.reply({ text: '❌ Failed to retrieve download link. Please try again later or use a different video.' }, giftedButtons, m);
                }

                let giftedMess = `
${global.botName} VIDEO DOWNLOADER 
╭───────────────◆  
│⿻ *Title:* ${video.title}
│⿻ *Quality:* 720p
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

                Gifted.downloadAndSend({ video: downloadUrl, fileName: fileName, caption: giftechMess.done }, giftedButtons, m);
            } catch (e) {
                console.error('API Error in video command:', e);
                // Always reply to user with helpful error message
                const errorMsg = e.code === 'ENOTFOUND' || e.code === 'ECONNREFUSED' 
                    ? '🌐 Network error: Unable to connect to download service. Please try again later.'
                    : '❌ Video download service temporarily unavailable. Please try again in a few minutes.';
                return Gifted.reply({ text: errorMsg }, giftedButtons, m);
            }
        } catch (e) {
            console.error('Search Error in video command:', e);
            // Provide helpful error message for search failures
            const errorMsg = e.code === 'ENOTFOUND' 
                ? '🌐 Unable to search for videos. Please check your internet connection and try again.'
                : '🔍 Video search failed. Please try with a different search term.';
            return Gifted.reply({ text: errorMsg }, m);
        }
    }
};
