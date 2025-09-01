let Giftedd = async (m, { Gifted, text, fetchJson }) => {
    if (!text) {
        Gifted.reply({ text: `Provide Some Text ie ${global.prefix}flux A Cute Cat` }, m);
        return;
    }
  
  Gifted.reply({ text: giftechMess.wait }, m);

    let giftedButtons = [
        [
            { text: 'WaChannel', url: global.giftedWaChannel }
        ]
    ];

    try {
        const giftedRes = await fetchJson(`${global.giftedApi}/ai/fluximg?apikey=${global.giftedKey}&prompt=${text}`);
        
        // Validate API response
        if (!giftedRes || !giftedRes.result) {
            throw new Error('API returned invalid response: missing result URL');
        }
        
        Gifted.downloadAndSend({ image: giftedRes.result, caption: giftechMess.done}, giftedButtons, m);
    } catch (error) {
        console.error('Error occurred while fetching AI data:', error);
        if (error.message.includes('Invalid') || error.message.includes('API returned')) {
            Gifted.reply({ text: 'Failed to generate image. The API returned an invalid response. Please try again.'}, giftedButtons, m);
        } else {
            Gifted.reply({ text: 'Flux is Unavailable Right Now.'}, giftedButtons, m);
        }
    }
};

Giftedd.command = ['flux', 'fluximg'];
Giftedd.desc = 'Flux Image Generator';
Giftedd.category = ['ai'];

module.exports = Giftedd;
