require('../../set');

/**
 * Multi-Role AI Assistant System
 * Manages different AI personalities and roles for users
 */

// Available AI roles with their characteristics
const aiRoles = {
    'default': {
        name: '🤖 Default Assistant',
        description: 'General-purpose AI assistant',
        systemPrompt: 'You are a helpful AI assistant. Respond naturally and provide useful information.',
        capabilities: ['general', 'help', 'information']
    },
    'teacher': {
        name: '👨‍🏫 Teacher',
        description: 'Educational AI tutor',
        systemPrompt: 'You are an educational tutor. Explain concepts clearly, ask follow-up questions to ensure understanding, and provide examples.',
        capabilities: ['education', 'tutoring', 'explanations', 'examples']
    },
    'programmer': {
        name: '👨‍💻 Programmer',
        description: 'Coding expert and developer',
        systemPrompt: 'You are a programming expert. Help with code, debugging, best practices, and technical solutions. Provide clear code examples.',
        capabilities: ['coding', 'debugging', 'programming', 'technical']
    },
    'creative': {
        name: '🎨 Creative Writer',
        description: 'Creative writing and storytelling assistant',
        systemPrompt: 'You are a creative writing assistant. Help with storytelling, creative content, poetry, and imaginative writing.',
        capabilities: ['writing', 'creativity', 'storytelling', 'poetry']
    },
    'analyst': {
        name: '📊 Data Analyst',
        description: 'Data analysis and research expert',
        systemPrompt: 'You are a data analyst. Help analyze information, provide insights, create reports, and explain complex data.',
        capabilities: ['analysis', 'research', 'data', 'insights']
    },
    'casual': {
        name: '😊 Casual Friend',
        description: 'Friendly conversational companion',
        systemPrompt: 'You are a casual, friendly companion. Engage in relaxed conversation, be supportive, and maintain a fun, approachable tone.',
        capabilities: ['conversation', 'friendship', 'support', 'casual']
    },
    'professional': {
        name: '👔 Professional',
        description: 'Business and professional assistant',
        systemPrompt: 'You are a professional business assistant. Help with work-related tasks, formal communication, and business advice.',
        capabilities: ['business', 'professional', 'formal', 'work']
    }
};

// Language support system
const supportedLanguages = {
    'en': { name: 'English', flag: '🇺🇸', code: 'en' },
    'es': { name: 'Español', flag: '🇪🇸', code: 'es' },
    'fr': { name: 'Français', flag: '🇫🇷', code: 'fr' },
    'de': { name: 'Deutsch', flag: '🇩🇪', code: 'de' },
    'it': { name: 'Italiano', flag: '🇮🇹', code: 'it' },
    'pt': { name: 'Português', flag: '🇵🇹', code: 'pt' },
    'ru': { name: 'Русский', flag: '🇷🇺', code: 'ru' },
    'ja': { name: '日本語', flag: '🇯🇵', code: 'ja' },
    'ko': { name: '한국어', flag: '🇰🇷', code: 'ko' },
    'zh': { name: '中文', flag: '🇨🇳', code: 'zh' },
    'hi': { name: 'हिंदी', flag: '🇮🇳', code: 'hi' },
    'ar': { name: 'العربية', flag: '🇸🇦', code: 'ar' }
};

// Initialize or get user's role and language settings
function initializeUserSettings(userId) {
    if (!global.db.users[userId]) {
        global.db.users[userId] = {};
    }
    
    if (!global.db.users[userId].aiRole) {
        global.db.users[userId].aiRole = 'default';
    }
    
    if (!global.db.users[userId].language) {
        global.db.users[userId].language = 'en';
    }
    
    if (!global.db.users[userId].roleHistory) {
        global.db.users[userId].roleHistory = [];
    }
    
    return global.db.users[userId];
}

// Get user's current AI role
function getUserRole(userId) {
    const userSettings = initializeUserSettings(userId);
    return aiRoles[userSettings.aiRole] || aiRoles['default'];
}

// Set user's AI role
function setUserRole(userId, roleKey) {
    if (!aiRoles[roleKey]) {
        return false;
    }
    
    const userSettings = initializeUserSettings(userId);
    const oldRole = userSettings.aiRole;
    userSettings.aiRole = roleKey;
    
    // Track role change history
    userSettings.roleHistory.push({
        from: oldRole,
        to: roleKey,
        timestamp: Date.now()
    });
    
    // Keep only last 10 role changes
    if (userSettings.roleHistory.length > 10) {
        userSettings.roleHistory = userSettings.roleHistory.slice(-10);
    }
    
    return true;
}

// Get user's current language
function getUserLanguage(userId) {
    const userSettings = initializeUserSettings(userId);
    return supportedLanguages[userSettings.language] || supportedLanguages['en'];
}

// Set user's language
function setUserLanguage(userId, langCode) {
    if (!supportedLanguages[langCode]) {
        return false;
    }
    
    const userSettings = initializeUserSettings(userId);
    userSettings.language = langCode;
    return true;
}

// Get localized text based on user's language
function getLocalizedText(userId, textKey, fallback = '') {
    const userLang = getUserLanguage(userId).code;
    
    // Simple localization mapping (can be expanded)
    const translations = {
        'role_changed': {
            'en': 'AI role changed successfully!',
            'es': '¡Rol de IA cambiado exitosamente!',
            'fr': 'Rôle IA changé avec succès!',
            'de': 'KI-Rolle erfolgreich geändert!',
            'it': 'Ruolo IA cambiato con successo!',
            'pt': 'Função de IA alterada com sucesso!',
            'ru': 'Роль ИИ успешно изменена!',
            'ja': 'AIの役割が正常に変更されました！',
            'ko': 'AI 역할이 성공적으로 변경되었습니다!',
            'zh': 'AI角色更改成功！',
            'hi': 'एआई भूमिका सफलतापूर्वक बदल दी गई!',
            'ar': 'تم تغيير دور الذكاء الاصطناعي بنجاح!'
        },
        'language_changed': {
            'en': 'Language changed successfully!',
            'es': '¡Idioma cambiado exitosamente!',
            'fr': 'Langue changée avec succès!',
            'de': 'Sprache erfolgreich geändert!',
            'it': 'Lingua cambiata con successo!',
            'pt': 'Idioma alterado com sucesso!',
            'ru': 'Язык успешно изменен!',
            'ja': '言語が正常に変更されました！',
            'ko': '언어가 성공적으로 변경되었습니다!',
            'zh': '语言更改成功！',
            'hi': 'भाषा सफलतापूर्वक बदल दी गई!',
            'ar': 'تم تغيير اللغة بنجاح!'
        },
        'current_role': {
            'en': 'Current AI Role',
            'es': 'Rol de IA Actual',
            'fr': 'Rôle IA Actuel',
            'de': 'Aktuelle KI-Rolle',
            'it': 'Ruolo IA Attuale',
            'pt': 'Função de IA Atual',
            'ru': 'Текущая роль ИИ',
            'ja': '現在のAI役割',
            'ko': '현재 AI 역할',
            'zh': '当前AI角色',
            'hi': 'वर्तमान एआई भूमिका',
            'ar': 'دور الذكاء الاصطناعي الحالي'
        },
        'select_role': {
            'en': 'Select an AI Role:',
            'es': 'Selecciona un Rol de IA:',
            'fr': 'Sélectionnez un Rôle IA:',
            'de': 'Wählen Sie eine KI-Rolle:',
            'it': 'Seleziona un Ruolo IA:',
            'pt': 'Selecione uma Função de IA:',
            'ru': 'Выберите роль ИИ:',
            'ja': 'AI役割を選択してください：',
            'ko': 'AI 역할을 선택하세요:',
            'zh': '选择AI角色：',
            'hi': 'एक एआई भूमिका चुनें:',
            'ar': 'حدد دور الذكاء الاصطناعي:'
        }
    };
    
    if (translations[textKey] && translations[textKey][userLang]) {
        return translations[textKey][userLang];
    }
    
    return fallback || textKey;
}

// Generate role selection keyboard
function generateRoleKeyboard() {
    const keyboard = [];
    const roles = Object.keys(aiRoles);
    
    // Create rows of 2 buttons each
    for (let i = 0; i < roles.length; i += 2) {
        const row = [];
        row.push({
            text: aiRoles[roles[i]].name,
            callback_data: JSON.stringify({ feature: 'setrole', data: roles[i] })
        });
        
        if (roles[i + 1]) {
            row.push({
                text: aiRoles[roles[i + 1]].name,
                callback_data: JSON.stringify({ feature: 'setrole', data: roles[i + 1] })
            });
        }
        
        keyboard.push(row);
    }
    
    return keyboard;
}

// Generate language selection keyboard
function generateLanguageKeyboard() {
    const keyboard = [];
    const languages = Object.keys(supportedLanguages);
    
    // Create rows of 3 buttons each
    for (let i = 0; i < languages.length; i += 3) {
        const row = [];
        for (let j = 0; j < 3 && i + j < languages.length; j++) {
            const lang = languages[i + j];
            const langInfo = supportedLanguages[lang];
            row.push({
                text: `${langInfo.flag} ${langInfo.name}`,
                callback_data: JSON.stringify({ feature: 'setlang', data: lang })
            });
        }
        keyboard.push(row);
    }
    
    return keyboard;
}

module.exports = {
    aiRoles,
    supportedLanguages,
    getUserRole,
    setUserRole,
    getUserLanguage,
    setUserLanguage,
    getLocalizedText,
    generateRoleKeyboard,
    generateLanguageKeyboard,
    initializeUserSettings
};