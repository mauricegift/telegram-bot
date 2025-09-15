const axios = require("axios");

module.exports = {
    command: ['ytmp4'],
    desc: 'Download Video from Youtube',
    category: ['downloader'],
    async run(m, { Gifted, text }) {

        if (!text) return Gifted.reply({ text: `Usage: ${global.prefix}ytmp4 https://youtu.be/60ItHLz5WEA?feature=shared` }, m);
        
        Gifted.reply({ text: giftechMess.wait }, m);

        try {
            const videoUrl = Array.isArray(text) ? text.join(" ") : text;
            if (!videoUrl.startsWith("https://youtu")) return Gifted.reply({ text: 'Please Provide a Valid YouTube Link' }, m);

            try {
                const apiResponse = await axios.get(`${global.giftedYtdlpApi}/api/video.php?url=${videoUrl}`);
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
            ];

                const searchResponse = await axios.get(`${global.giftedApi}/search/yts?apikey=${global.giftedKey}&query=${videoUrl}`);
                const video = searchResponse.data.results[0];

                let giftedMess = `
${global.botName} VIDEO DOWNLOADER 
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


