const { gmd } = require('../gift');
const { axios } = require('../gift/gmdHelpers');

let callbackSetup = false;

function setupCallbackHandler(Gifted) {
    Gifted.on('callback_query', async (callbackQuery) => {
        try {
            const data = JSON.parse(callbackQuery.data);
            if (data.command === 'quote') {
                await handleQuoteCallback(callbackQuery, Gifted);
            }
        } catch (error) {
            console.error('Quote callback error:', error);
        }
    });
}

async function handleQuoteCallback(callbackQuery, Gifted) {
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;

    try {
        await Gifted.answerCallbackQuery(callbackQuery.id, { text: '🔄 Loading new quote...' });
        await Gifted.sendChatAction(chatId, 'upload_audio');

        const response = await axios.get('https://apiskeith.top/quote/audio');
        const quoteData = response.data;

        if (quoteData.status && quoteData.result && quoteData.result.mp3) {
            const audioUrl = quoteData.result.mp3;
            const quotes = quoteData.result.data.filter(item => item.type === 'quote');
            const quoteText = quotes.map(q => q.text).join('\n\n');
            const buttons = { inline_keyboard: [[{ text: '🔁 More', callback_data: JSON.stringify({ command: 'quote', action: 'more' }) }]] };

            await Gifted.sendAudio(chatId, audioUrl, {
                caption: `💭 Random Quote Audio\n\n${quoteText}`,
                reply_markup: buttons
            }, { contentType: 'audio/mpeg' });

            await Gifted.deleteMessage(chatId, messageId);
        } else {
            await Gifted.answerCallbackQuery(callbackQuery.id, { text: '❌ Failed to load quote' });
        }
    } catch (error) {
        console.error('Quote callback error:', error);
        await Gifted.answerCallbackQuery(callbackQuery.id, { text: '❌ Failed to load more' });
    }
}

gmd({
    pattern: "quote",
    aliases: ["qaudio", "inspireaudio"],
    react: "❤️‍🔥",
    category: "fun",
    description: "Random quote audio",
    cooldown: 10
},

async (msg, Gifted, conText) => {
    const { reply } = conText;

    if (!callbackSetup) {
        setupCallbackHandler(Gifted);
        callbackSetup = true;
    }

    try {
        await Gifted.sendChatAction(conText.chatId, 'upload_audio');

        const response = await axios.get('https://apiskeith.top/quote/audio');
        const quoteData = response.data;

        if (quoteData.status && quoteData.result && quoteData.result.mp3) {
            const audioUrl = quoteData.result.mp3;
            const quotes = quoteData.result.data.filter(item => item.type === 'quote');
            const quoteText = quotes.map(q => q.text).join('\n\n');
            const buttons = [[{ text: '🔁 More', callback_data: JSON.stringify({ command: 'quote', action: 'more' }) }]];

            await Gifted.sendAudio(conText.chatId, audioUrl, {
                caption: `💭 Random Quote Audio\n\n${quoteText}`,
                reply_markup: { inline_keyboard: buttons }
            }, { contentType: 'audio/mpeg' });
        } else {
            await reply('❌ Failed to fetch quote audio.');
        }
    } catch (error) {
        console.error('Quote error:', error);
        await reply('❌ Failed to fetch quote audio.');
    }
});
