const axios = require("axios");

module.exports = {
    command: ['remini', 'enhance', 'tohd', 'hd'],
    desc: 'Enhance image quality',
    category: ['tools'],
    async run(m, { Gifted, text }) {

        if (!m.reply_to_message || !m.reply_to_message.photo) {
            return Gifted.reply({ 
                text: `Usage: Reply to an image message with ${global.prefix}remini` 
            }, m);
        }

        await Gifted.reply({ text: giftechMess.wait }, m);
        let giftedButtons;

        try {
            const fileId = m.reply_to_message.photo[m.reply_to_message.photo.length - 1].file_id;
            const fileDetails = await Gifted.getFile(fileId);
            console.log(fileDetails);
            const fileLink = `https://api.telegram.org/file/bot${global.botToken}/${fileDetails.file_path}`;
            const encodedFileLink = encodeURIComponent(fileLink);
            console.log(encodedFileLink);
            const apiResponse = await axios.get(
                `${global.giftedApi}/tools/remini?apikey=${global.giftedKey}&url=${encodedFileLink}`,
                { timeout: 30000 }
            );
            
            if (!apiResponse.data || !apiResponse.data.result || !apiResponse.data.result.image_url) {
                return Gifted.reply({ text: 'Failed to retrieve enhanced image link from API response.' }, m);
            }
            
            const resultUrl = apiResponse.data.result.image_url;

            giftedButtons = [
                [
                    { text: 'Image Url', url: resultUrl },
                    { text: 'WaChannel', url: global.giftedWaChannel }
                ]
            ];

            await Gifted.downloadAndSend({ 
                image: resultUrl, 
                caption: 'Here is your enhanced image' 
            }, giftedButtons, m);
            
        } catch (e) {
            console.error('Error in remini command:', e);
            
            let errorMessage = 'Failed to enhance image. Please try again later.';
            if (e.response) {
                errorMessage = `API Error: ${e.response.status}`;
            } else if (e.request) {
                errorMessage = 'Network error: Could not connect to the enhancement service.';
            } else if (e.code === 'ECONNABORTED') {
                errorMessage = 'Request timeout: The enhancement process took too long.';
            }
            
            return Gifted.reply({ text: errorMessage }, m);
        }
    }
};
