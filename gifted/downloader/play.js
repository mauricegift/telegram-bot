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

            try {
                const apiResponse = await axios.get(`${global.giftedYtdlpApi}/api/audio.php?url=${videoUrl}`);
                const downloadUrl = apiResponse.data.result.download_url;
                const fileName = apiResponse.data.result.title;
                const format = apiResponse.data.result.format;

                if (!downloadUrl) {
                    return Gifted.reply({ text: 'Failed to retrieve download link.' }, m);
                }

                let giftedButtons = [
                [
                    { text: 'Audio Url', url: `${apiResponse.data.result.stream_url}` },
                    { text: 'WaChannel', url: global.giftedWaChannel }
                ]
            ]

                let giftedMess = `
${global.botName} SONG DOWNLOADER 
╭───────────────◆  
│⿻ *Title:* ${video.title}
│⿻ *Quality:* ${format}
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
                console.error('API Error:', e);
                return Gifted.reply({ text: 'Failed to fetch download link from API.' }, giftedButtons, m);
            }
        } catch (e) {
            console.error('Error:', e);
            return Gifted.reply({ text: giftechMess.error }, giftedButtons, m);
        }
    }
};




