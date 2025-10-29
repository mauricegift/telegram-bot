const axios = require("axios");

module.exports = {
    command: ['ytmp3'],
    desc: 'Download Audio from Youtube',
    category: ['downloader'],
    async run(m, { Gifted, text }) {

        if (!text) return Gifted.reply({ text: `Usage: ${global.prefix}ytmp3 https://youtu.be/60ItHLz5WEA?feature=shared` }, m);

        Gifted.reply({ text: giftechMess.wait }, m);
        let giftedButtons;

        try {
            const videoUrl = Array.isArray(text) ? text.join(" ") : text;
            if (!videoUrl.startsWith("https://youtu")) return Gifted.reply({ text: 'Please Provide a Valid YouTube Link' }, m);

            const searchResponse = await axios.get(`${global.giftedApi}/search/yts?apikey=${global.giftedKey}&query=${videoUrl}`);
            const video = searchResponse.data.results[0];

            try {
              const apiResponse = await axios.get(`${global.giftedYtdlpApi}/api/ytdla.php?url=${videoUrl}`);
              const downloadUrl = apiResponse.data.result.download_url;
              const fileName = apiResponse.data.result.title || video.title;
              const format = apiResponse.data.result.quality || '128kbps';

                if (!downloadUrl) {
                    return Gifted.reply({ text: 'Failed to retrieve download link.' }, m);
                }

              giftedButtons = [
                [
                    { text: 'Audio Url', url: `${apiResponse.data.result.download_url}` },
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
            return Gifted.reply({ text: giftechMess.error }, m);
        }
    }
};




