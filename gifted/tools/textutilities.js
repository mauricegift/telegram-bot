const {
    textCaseUtils,
    textAnalysisUtils,
    textFormattingUtils,
    textGenerationUtils,
    textEncodingUtils,
    textManipulationUtils,
    generateTextUtilsMenu,
    formatTextAnalysis
} = require('./textutils');
const { validateParseMode, sanitizeForTelegram } = require('../../gift/textSanitizer');

let textUtilities = async (m, { Gifted, text, command }) => {
    
    if (command === 'textutils' && !text) {
        const message = validateParseMode(`🔧 *Text Utilities Toolkit*

Welcome to the comprehensive text manipulation toolkit!

🔄 *Case Transform* - Change text case
📊 *Text Analysis* - Analyze your text  
🎨 *Text Styling* - Apply text formatting
🔧 *Text Tools* - Manipulate text
🔐 *Encode/Decode* - Convert text formats
🎲 *Generate Text* - Create sample text

Select a category or use specific commands directly.`, 'Markdown');
        
        const keyboard = generateTextUtilsMenu();
        
        await Gifted.reply({ 
            text: message.text, 
            parse_mode: message.parse_mode 
        }, keyboard, m);
        return;
    }
    
    if (!text) {
        await Gifted.reply({ text: '❌ Please provide text to process.' }, m);
        return;
    }
    
    // Case transformation commands
    if (command === 'uppercase' || command === 'upper') {
        const result = textCaseUtils.uppercase(text);
        const safeResponse = validateParseMode(`🔄 *Uppercase:*\n${sanitizeForTelegram(result)}`, 'Markdown');
        await Gifted.reply(safeResponse, m);
        return;
    }
    
    if (command === 'lowercase' || command === 'lower') {
        const result = textCaseUtils.lowercase(text);
        const safeResponse = validateParseMode(`🔄 *Lowercase:*\n${sanitizeForTelegram(result)}`, 'Markdown');
        await Gifted.reply(safeResponse, m);
        return;
    }
    
    if (command === 'capitalize') {
        const result = textCaseUtils.capitalize(text);
        await Gifted.reply({ text: `🔄 *Capitalize:*\n${result}`, parse_mode: 'Markdown' }, m);
        return;
    }
    
    if (command === 'title') {
        const result = textCaseUtils.title(text);
        await Gifted.reply({ text: `🔄 *Title Case:*\n${result}`, parse_mode: 'Markdown' }, m);
        return;
    }
    
    if (command === 'camel') {
        const result = textCaseUtils.camel(text);
        await Gifted.reply({ text: `🔄 *camelCase:*\n${result}`, parse_mode: 'Markdown' }, m);
        return;
    }
    
    if (command === 'pascal') {
        const result = textCaseUtils.pascal(text);
        await Gifted.reply({ text: `🔄 *PascalCase:*\n${result}`, parse_mode: 'Markdown' }, m);
        return;
    }
    
    if (command === 'snake') {
        const result = textCaseUtils.snake(text);
        await Gifted.reply({ text: `🔄 *snake_case:*\n\`${result}\``, parse_mode: 'Markdown' }, m);
        return;
    }
    
    if (command === 'kebab') {
        const result = textCaseUtils.kebab(text);
        await Gifted.reply({ text: `🔄 *kebab-case:*\n\`${result}\``, parse_mode: 'Markdown' }, m);
        return;
    }
    
    if (command === 'inverse') {
        const result = textCaseUtils.inverse(text);
        await Gifted.reply({ text: `🔄 *InVeRsE cAsE:*\n${result}`, parse_mode: 'Markdown' }, m);
        return;
    }
    
    // Text analysis
    if (command === 'analyze' || command === 'textanalysis') {
        const analysis = formatTextAnalysis(text);
        await Gifted.reply({ text: analysis, parse_mode: 'Markdown' }, m);
        return;
    }
    
    // Text formatting
    if (command === 'bold') {
        const result = textFormattingUtils.bold(text);
        await Gifted.reply({ text: `🎨 *Bold Text:*\n${result}`, parse_mode: 'Markdown' }, m);
        return;
    }
    
    if (command === 'italic') {
        const result = textFormattingUtils.italic(text);
        await Gifted.reply({ text: `🎨 *Italic Text:*\n${result}`, parse_mode: 'Markdown' }, m);
        return;
    }
    
    if (command === 'mono') {
        const result = textFormattingUtils.monospace(text);
        await Gifted.reply({ text: `🎨 *Monospace Text:*\n${result}`, parse_mode: 'Markdown' }, m);
        return;
    }
    
    if (command === 'strike') {
        const result = textFormattingUtils.strikethrough(text);
        await Gifted.reply({ text: `🎨 *Strikethrough Text:*\n${result}`, parse_mode: 'Markdown' }, m);
        return;
    }
    
    if (command === 'spoiler') {
        const result = textFormattingUtils.spoiler(text);
        await Gifted.reply({ text: `🎨 *Spoiler Text:*\n${result}`, parse_mode: 'Markdown' }, m);
        return;
    }
    
    if (command === 'quote') {
        const result = textFormattingUtils.quote(text);
        await Gifted.reply({ text: `🎨 *Quote:*\n${result}`, parse_mode: 'Markdown' }, m);
        return;
    }
    
    // Special text styles
    if (command === 'bubble') {
        const result = textFormattingUtils.bubble(text);
        await Gifted.reply({ text: `🎨 *Bubble Text:*\n${result}` }, m);
        return;
    }
    
    if (command === 'smallcaps') {
        const result = textFormattingUtils.smallCaps(text);
        await Gifted.reply({ text: `🎨 *Small Caps:*\n${result}` }, m);
        return;
    }
    
    if (command === 'fullwidth') {
        const result = textFormattingUtils.fullWidth(text);
        await Gifted.reply({ text: `🎨 *Full Width:*\n${result}` }, m);
        return;
    }
    
    if (command === 'upsidedown') {
        const result = textFormattingUtils.upsideDown(text);
        await Gifted.reply({ text: `🎨 *Upside Down:*\n${result}` }, m);
        return;
    }
    
    // Encoding/Decoding
    if (command === 'base64encode' || command === 'b64encode') {
        try {
            const result = textEncodingUtils.base64Encode(text);
            await Gifted.reply({ text: `🔐 *Base64 Encoded:*\n\`${result}\``, parse_mode: 'Markdown' }, m);
        } catch (error) {
            await Gifted.reply({ text: `❌ Error: ${error.message}` }, m);
        }
        return;
    }
    
    if (command === 'base64decode' || command === 'b64decode') {
        try {
            const result = textEncodingUtils.base64Decode(text);
            await Gifted.reply({ text: `🔓 *Base64 Decoded:*\n${result}`, parse_mode: 'Markdown' }, m);
        } catch (error) {
            await Gifted.reply({ text: `❌ Error: ${error.message}` }, m);
        }
        return;
    }
    
    if (command === 'urlencode') {
        const result = textEncodingUtils.urlEncode(text);
        await Gifted.reply({ text: `🔐 *URL Encoded:*\n\`${result}\``, parse_mode: 'Markdown' }, m);
        return;
    }
    
    if (command === 'urldecode') {
        try {
            const result = textEncodingUtils.urlDecode(text);
            await Gifted.reply({ text: `🔓 *URL Decoded:*\n${result}`, parse_mode: 'Markdown' }, m);
        } catch (error) {
            await Gifted.reply({ text: `❌ Error: ${error.message}` }, m);
        }
        return;
    }
    
    if (command === 'htmlencode') {
        const result = textEncodingUtils.htmlEncode(text);
        await Gifted.reply({ text: `🔐 *HTML Encoded:*\n\`${result}\``, parse_mode: 'Markdown' }, m);
        return;
    }
    
    if (command === 'htmldecode') {
        const result = textEncodingUtils.htmlDecode(text);
        await Gifted.reply({ text: `🔓 *HTML Decoded:*\n${result}`, parse_mode: 'Markdown' }, m);
        return;
    }
    
    // Text manipulation
    if (command === 'reverse') {
        const result = textEncodingUtils.reverseText(text);
        await Gifted.reply({ text: `🔄 *Reversed Text:*\n${result}` }, m);
        return;
    }
    
    if (command === 'removeaccents') {
        const result = textEncodingUtils.removeAccents(text);
        await Gifted.reply({ text: `🔄 *Without Accents:*\n${result}` }, m);
        return;
    }
    
    if (command === 'removeemojis') {
        const result = textEncodingUtils.removeEmojis(text);
        await Gifted.reply({ text: `🔄 *Without Emojis:*\n${result}` }, m);
        return;
    }
    
    if (command === 'extractemojis') {
        const result = textEncodingUtils.extractEmojis(text);
        if (result.length > 0) {
            await Gifted.reply({ text: `😀 *Extracted Emojis:*\n${result.join(' ')}` }, m);
        } else {
            await Gifted.reply({ text: '😅 No emojis found in the text' }, m);
        }
        return;
    }
    
    if (command === 'cleanspaces') {
        const result = textManipulationUtils.removeExtraSpaces(text);
        await Gifted.reply({ text: `🔄 *Clean Spaces:*\n${result}` }, m);
        return;
    }
    
    if (command === 'wrap') {
        const result = textManipulationUtils.wrapText(text, 40);
        await Gifted.reply({ text: `🔄 *Wrapped Text:*\n\`${result}\``, parse_mode: 'Markdown' }, m);
        return;
    }
    
    if (command === 'center') {
        const result = textManipulationUtils.centerText(text, 40);
        await Gifted.reply({ text: `🔄 *Centered Text:*\n\`${result}\``, parse_mode: 'Markdown' }, m);
        return;
    }
    
    if (command === 'hashtags') {
        const result = textManipulationUtils.extractHashtags(text);
        if (result.length > 0) {
            await Gifted.reply({ text: `#️⃣ *Hashtags:*\n${result.join('\n')}` }, m);
        } else {
            await Gifted.reply({ text: '❌ No hashtags found' }, m);
        }
        return;
    }
    
    if (command === 'mentions') {
        const result = textManipulationUtils.extractMentions(text);
        if (result.length > 0) {
            await Gifted.reply({ text: `@️⃣ *Mentions:*\n${result.join('\n')}` }, m);
        } else {
            await Gifted.reply({ text: '❌ No mentions found' }, m);
        }
        return;
    }
    
    if (command === 'urls') {
        const result = textManipulationUtils.extractUrls(text);
        if (result.length > 0) {
            await Gifted.reply({ text: `🔗 *URLs:*\n${result.join('\n')}` }, m);
        } else {
            await Gifted.reply({ text: '❌ No URLs found' }, m);
        }
        return;
    }
    
    // Text generation
    if (command === 'lorem') {
        const sentences = parseInt(text) || 3;
        const result = textGenerationUtils.lorem(sentences);
        await Gifted.reply({ text: `📝 *Lorem Ipsum (${sentences} sentences):*\n\n${result}` }, m);
        return;
    }
    
    if (command === 'password') {
        const length = parseInt(text) || 12;
        const result = textGenerationUtils.password(length, true);
        await Gifted.reply({ text: `🔐 *Generated Password:*\n\`${result}\``, parse_mode: 'Markdown' }, m);
        return;
    }
    
    if (command === 'randomtext') {
        const words = parseInt(text) || 10;
        const result = textGenerationUtils.randomText(words);
        await Gifted.reply({ text: `🎲 *Random Text (${words} words):*\n${result}` }, m);
        return;
    }
};

// Handle text utilities callbacks
textUtilities.callback = async (m, { Gifted, data }) => {
    const helpTexts = {
        'textcase': `🔄 *Case Transformation*\n\n` +
                   `Available commands:\n` +
                   `• \`/upper <text>\` - UPPERCASE\n` +
                   `• \`/lower <text>\` - lowercase\n` +
                   `• \`/capitalize <text>\` - Capitalize\n` +
                   `• \`/title <text>\` - Title Case\n` +
                   `• \`/camel <text>\` - camelCase\n` +
                   `• \`/pascal <text>\` - PascalCase\n` +
                   `• \`/snake <text>\` - snake_case\n` +
                   `• \`/kebab <text>\` - kebab-case\n` +
                   `• \`/inverse <text>\` - InVeRsE`,
        
        'textanalysis': `📊 *Text Analysis*\n\n` +
                       `Use \`/analyze <text>\` to get detailed analysis including:\n` +
                       `• Character, word, sentence counts\n` +
                       `• Reading time estimation\n` +
                       `• Text complexity score\n` +
                       `• Most common words\n` +
                       `• Average words per sentence`,
        
        'textstyle': `🎨 *Text Styling*\n\n` +
                    `Formatting commands:\n` +
                    `• \`/bold <text>\` - **Bold**\n` +
                    `• \`/italic <text>\` - _Italic_\n` +
                    `• \`/mono <text>\` - \`Monospace\`\n` +
                    `• \`/strike <text>\` - ~~Strike~~\n` +
                    `• \`/spoiler <text>\` - ||Spoiler||\n\n` +
                    `Special styles:\n` +
                    `• \`/bubble <text>\` - Bubble text\n` +
                    `• \`/smallcaps <text>\` - Small caps\n` +
                    `• \`/fullwidth <text>\` - Full width\n` +
                    `• \`/upsidedown <text>\` - Upside down`,
        
        'texttools': `🔧 *Text Tools*\n\n` +
                    `Manipulation commands:\n` +
                    `• \`/reverse <text>\` - Reverse text\n` +
                    `• \`/cleanspaces <text>\` - Remove extra spaces\n` +
                    `• \`/wrap <text>\` - Wrap text to lines\n` +
                    `• \`/center <text>\` - Center align text\n` +
                    `• \`/removeaccents <text>\` - Remove accents\n` +
                    `• \`/removeemojis <text>\` - Remove emojis\n` +
                    `• \`/extractemojis <text>\` - Extract emojis\n` +
                    `• \`/hashtags <text>\` - Extract hashtags\n` +
                    `• \`/mentions <text>\` - Extract mentions\n` +
                    `• \`/urls <text>\` - Extract URLs`,
        
        'textencode': `🔐 *Encode/Decode*\n\n` +
                     `Encoding commands:\n` +
                     `• \`/b64encode <text>\` - Base64 encode\n` +
                     `• \`/b64decode <text>\` - Base64 decode\n` +
                     `• \`/urlencode <text>\` - URL encode\n` +
                     `• \`/urldecode <text>\` - URL decode\n` +
                     `• \`/htmlencode <text>\` - HTML encode\n` +
                     `• \`/htmldecode <text>\` - HTML decode`,
        
        'textgen': `🎲 *Text Generation*\n\n` +
                  `Generation commands:\n` +
                  `• \`/lorem [sentences]\` - Lorem ipsum\n` +
                  `• \`/password [length]\` - Random password\n` +
                  `• \`/randomtext [words]\` - Random words`
    };
    
    const helpText = helpTexts[data];
    if (helpText) {
        await Gifted.editMessageText(helpText, {
            chat_id: m.chat.id,
            message_id: m.message_id,
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [[
                    { text: '🔙 Back', callback_data: JSON.stringify({ feature: 'textutils' }) }
                ]]
            }
        });
    } else {
        await Gifted.answerCallbackQuery(m.id, { text: 'Feature coming soon!' });
    }
};

textUtilities.command = [
    'textutils', 'analyze', 'textanalysis',
    'upper', 'uppercase', 'lower', 'lowercase', 'capitalize', 'title', 'camel', 'pascal', 'snake', 'kebab', 'inverse',
    'bold', 'italic', 'mono', 'strike', 'spoiler', 'quote',
    'bubble', 'smallcaps', 'fullwidth', 'upsidedown',
    'base64encode', 'b64encode', 'base64decode', 'b64decode', 'urlencode', 'urldecode', 'htmlencode', 'htmldecode',
    'reverse', 'removeaccents', 'removeemojis', 'extractemojis', 'cleanspaces', 'wrap', 'center',
    'hashtags', 'mentions', 'urls', 'lorem', 'password', 'randomtext'
];
textUtilities.desc = 'Comprehensive text manipulation and analysis toolkit';
textUtilities.category = ['tools', 'utility'];

module.exports = textUtilities;