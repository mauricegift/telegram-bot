const { gmd } = require("../gift");
const config = require('../config');
const { axios } = require("../gift/gmdHelpers");

gmd(
    {
        pattern: "gpt",
        aliases: ["ai", "ask"],
        react: "🤔",
        category: "ai",
        description: "Ask questions to AI",
        cooldown: 5,
    },

    async (msg, Gifted, conText) => {
        const { reply, q, prefix } = conText;

        if (!q) {
            return await reply(
                `Please provide a question!\nExample: ${prefix}gpt What is JavaScript?`,
            );
        }

        try {
            await Gifted.sendChatAction(conText.chatId, "typing");

            const api = `${config.apiUrl}/api/ai/ai?apikey=${config.apiKey}&q=${encodeURIComponent(q)}`;
            console.log(api);
            const response = await axios.get(api, { timeout: 30000 });
            const data = response.data;

            if (data.status && data.result) {
                await reply(data.result);
            } else {
                await reply("Sorry, no response from AI service.");
            }
        } catch (error) {
            await reply("Error: Could not get AI response. Try again later.");
        }
    },
);
