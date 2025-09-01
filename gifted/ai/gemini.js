const { geminiAPI } = require('../../gift/geminiAPI');
const { validateParseMode } = require('../../gift/textSanitizer');

let Giftedd = async (m, { Gifted, text, fetchJson }) => {
    if (!text) {
        const helpMessage = validateParseMode(`Provide some text for Gemini AI!\n\n*Usage:* ${global.prefix}gemini <your message>\n*Example:* ${global.prefix}gemini Explain quantum physics`, 'Markdown');
        await Gifted.reply(helpMessage, m);
        return;
    }

    // Show typing indicator
    await Gifted.reply({ text: giftechMess.wait }, m);

    let giftedButtons = [
        [
            { text: 'Ai Web', url: `${global.giftedApi}/aichat` },
            { text: 'WaChannel', url: global.giftedWaChannel }
        ]
    ];

    try {
        let giftedResponse = null;
        let apiUsed = 'Unknown';

        // Try Google Gemini API first if configured
        if (geminiAPI.isEnabled()) {
            console.log('🔮 Using Google Gemini API');
            const geminiResult = await geminiAPI.chat(text);
            
            if (geminiResult.success) {
                giftedResponse = geminiResult.result;
                apiUsed = 'Google Gemini API';
            } else {
                console.log('⚠️  Google Gemini API failed, falling back to alternative API');
            }
        }

        // Fallback to alternative API if Google Gemini failed or not configured
        if (!giftedResponse) {
            console.log('🔄 Using alternative API fallback');
            try {
                const aiResponse = await fetchJson(`${global.giftedApi}/ai/geminiai?apikey=${global.giftedKey}&q=${encodeURIComponent(text)}`);
                if (aiResponse && aiResponse.result) {
                    giftedResponse = aiResponse.result;
                    apiUsed = 'Alternative API';
                } else {
                    throw new Error('Invalid response from alternative API');
                }
            } catch (fallbackError) {
                console.error('Alternative API also failed:', fallbackError.message);
                throw fallbackError;
            }
        }

        if (!giftedResponse) {
            throw new Error('No response from any API');
        }

        // Format response safely for Telegram
        const formattedResponse = geminiAPI.formatForTelegram(giftedResponse, true);
        
        // Add API source indicator (only for debugging, can be removed in production)
        if (global.ownerId.includes(m.from.id)) {
            if (formattedResponse.needsSplit) {
                // Add source to last chunk
                formattedResponse.chunks[formattedResponse.chunks.length - 1].text += `\n\n_Source: ${apiUsed}_`;
            } else {
                formattedResponse.text += `\n\n_Source: ${apiUsed}_`;
            }
        }

        // Handle chunked responses
        if (formattedResponse.needsSplit && formattedResponse.chunks) {
            // Send first chunk with buttons
            await Gifted.reply(formattedResponse.chunks[0], giftedButtons, m);
            
            // Send remaining chunks without buttons (except last one)
            for (let i = 1; i < formattedResponse.chunks.length; i++) {
                const isLastChunk = i === formattedResponse.chunks.length - 1;
                await Gifted.reply(formattedResponse.chunks[i], isLastChunk ? [] : undefined, m);
            }
        } else {
            // Single message
            await Gifted.reply(formattedResponse, giftedButtons, m);
        }

    } catch (error) {
        console.error('Error in Gemini command:', error);
        
        // Provide helpful error message based on configuration
        let errorMessage = '';
        const config = geminiAPI.getConfig();
        
        if (!config.enabled) {
            errorMessage = validateParseMode(`❌ *Gemini AI Unavailable*

Both Google Gemini API and fallback service are currently unavailable.

${config.helpText}`, 'Markdown');
        } else {
            errorMessage = validateParseMode('❌ *Gemini AI Temporarily Unavailable*\n\nPlease try again in a moment.', 'Markdown');
        }
        
        await Gifted.reply(errorMessage, giftedButtons, m);
    }
};

// Add configuration command for owners
let GeminiConfig = async (m, { Gifted }) => {
    if (!m.isOwner) {
        await Gifted.reply({ text: '❌ Owner-only command!' }, m);
        return;
    }

    const config = geminiAPI.getConfig();
    const configMessage = validateParseMode(`🔮 *Gemini API Configuration*

${config.helpText}

*Current Status:*
• API Key: ${config.hasApiKey ? '✅ Configured' : '❌ Not set'}
• Service: ${config.enabled ? '🟢 Active' : '🔴 Inactive'}

*Environment Variable:*
\`GEMINI_API_KEY\``, 'Markdown');

    await Gifted.reply(configMessage, m);
};

GeminiConfig.command = ['geminiconfig', 'gemini-config'];
GeminiConfig.desc = 'Check Gemini API configuration (Owner only)';
GeminiConfig.category = ['ai'];
GeminiConfig.settings = { owner: true };

Giftedd.command = ['gemini', 'geminiai'];
Giftedd.desc = 'Gemini AI Chat - Uses Google Gemini API if configured, with alternative API fallback';
Giftedd.category = ['ai'];

module.exports = [Giftedd, GeminiConfig];
