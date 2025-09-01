const { getUserLanguage, setUserLanguage, getLocalizedText, generateLanguageKeyboard, supportedLanguages } = require('../ai/roles');

let languageManager = async (m, { Gifted, text, command }) => {
    const userId = m.from.id;
    const currentLang = getUserLanguage(userId);
    
    if (command === 'language' && !text) {
        // Show current language and available options
        const langList = Object.values(supportedLanguages).map(lang => 
            `${lang.code === currentLang.code ? '👉 ' : ''}${lang.flag} ${lang.name}`
        ).join('\n');
        
        const message = `🌐 *Language Settings*\n\n` +
                       `Current Language: *${currentLang.flag} ${currentLang.name}*\n\n` +
                       `Select a language:\n\n${langList}`;
        
        const keyboard = generateLanguageKeyboard();
        
        await Gifted.reply({ 
            text: message, 
            parse_mode: 'Markdown' 
        }, keyboard, m);
        return;
    }
    
    if (command === 'setlang') {
        const langCode = text.toLowerCase();
        
        if (!supportedLanguages[langCode]) {
            const availableLangs = Object.keys(supportedLanguages).join(', ');
            await Gifted.reply({ 
                text: `❌ Invalid language code. Available: ${availableLangs}`, 
                parse_mode: 'Markdown' 
            }, m);
            return;
        }
        
        const success = setUserLanguage(userId, langCode);
        if (success) {
            const newLang = getUserLanguage(userId);
            const message = `✅ ${getLocalizedText(userId, 'language_changed')}\n\n` +
                           `New Language: *${newLang.flag} ${newLang.name}*\n\n` +
                           `🤖 The bot interface will now be displayed in your selected language.`;
            
            await Gifted.reply({ 
                text: message, 
                parse_mode: 'Markdown' 
            }, m);
        } else {
            await Gifted.reply({ 
                text: '❌ Failed to update language', 
                parse_mode: 'Markdown' 
            }, m);
        }
        return;
    }
};

// Handle callback for language selection
languageManager.callback = async (m, { Gifted, data }) => {
    const userId = m.from.id;
    const langCode = data;
    
    if (!supportedLanguages[langCode]) {
        await Gifted.answerCallbackQuery(m.id, { text: '❌ Invalid language' });
        return;
    }
    
    const success = setUserLanguage(userId, langCode);
    if (success) {
        const newLang = getUserLanguage(userId);
        const message = `✅ ${getLocalizedText(userId, 'language_changed')}\n\n` +
                       `New Language: *${newLang.flag} ${newLang.name}*\n\n` +
                       `🤖 Bot interface updated to ${newLang.name}!`;
        
        await Gifted.editMessageText(message, {
            chat_id: m.chat.id,
            message_id: m.message_id,
            parse_mode: 'Markdown'
        });
    }
};

languageManager.command = ['language', 'lang', 'setlang'];
languageManager.desc = 'Manage bot language settings';
languageManager.category = ['settings', 'general'];

module.exports = languageManager;