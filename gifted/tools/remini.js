const axios = require("axios"),

module.exports = {
    command: ['remini', 'enhance', 'tohd', 'hd'],
    desc: 'Enhance image quality',
    category: ['tools'],
    async run(m, { Gifted, text }) {

        if (!text) return Gifted.reply({ text: `Usage: Quote/Reply to an image with ${global.prefix}remini` }, m);

      if (!m.reply_to_message || m.reply_to_message.photo)) {
            return Gifted.reply({ text: 'Please reply to an image/photo message to enhance it.'}, m);
      }
        Gifted.reply({ text: giftechMess.wait }, m);
        let giftedButtons;

        try {

            try {
              const fileId = m.reply_to_message.photo[m.reply_to_message.photo.length - 1].file_id;

            const fileDetails = await Gifted.getFile(fileId);
            const fileLink = `http://77.237.235.216:1500/file/bot${global.botToken}/${fileDetails.file_path}`;
            const apiResponse = await axios.get(`${global.giftedApi}/tools/remini?apikey=${global.giftedKey}&url=${fileLink}`);
            const resultUrl = apiResponse.data.result.image_url;
                if (!resultUrl) {
                    return Gifted.reply({ text: 'Failed to retrieve enhanced image link.' }, m);
                }

              giftedButtons = [
                [
                    { text: 'Image Url', url: `${apiResponse.data.result.image_url}` },
                    { text: 'WaChannel', url: global.giftedWaChannel }
                ]
            ]

                
              Gifted.downloadAndSend({ image: resultUrl, caption: 'Here is your enhanced image' }, giftedButtons, m);
            } catch (e) {
                console.error('API Error:', e);
                return Gifted.reply({ text: 'Failed to Enhance image from API.' }, giftedButtons, m);
            }
        } catch (e) {
            console.error('Error:', e);
            return Gifted.reply({ text: giftechMess.error }, giftedButtons, m);
        }
    }
};






