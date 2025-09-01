require('../../set');

/**
 * Text Utilities Toolkit
 * Comprehensive text manipulation and utility functions
 */

// Text case transformations
const textCaseUtils = {
    uppercase: (text) => text.toUpperCase(),
    lowercase: (text) => text.toLowerCase(),
    capitalize: (text) => text.charAt(0).toUpperCase() + text.slice(1).toLowerCase(),
    title: (text) => text.replace(/\w\S*/g, (txt) => 
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    ),
    camel: (text) => text.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
        index === 0 ? word.toLowerCase() : word.toUpperCase()
    ).replace(/\s+/g, ''),
    pascal: (text) => text.replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => 
        word.toUpperCase()
    ).replace(/\s+/g, ''),
    snake: (text) => text.replace(/\W+/g, ' ')
        .split(/ |\B(?=[A-Z])/)
        .map(word => word.toLowerCase())
        .join('_'),
    kebab: (text) => text.replace(/\W+/g, ' ')
        .split(/ |\B(?=[A-Z])/)
        .map(word => word.toLowerCase())
        .join('-'),
    inverse: (text) => text.split('').map(char => 
        char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase()
    ).join('')
};

// Text analysis functions
const textAnalysisUtils = {
    characterCount: (text) => text.length,
    wordCount: (text) => text.trim().split(/\s+/).filter(word => word.length > 0).length,
    sentenceCount: (text) => text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0).length,
    paragraphCount: (text) => text.split(/\n\s*\n/).filter(para => para.trim().length > 0).length,
    
    averageWordsPerSentence: (text) => {
        const words = textAnalysisUtils.wordCount(text);
        const sentences = textAnalysisUtils.sentenceCount(text);
        return sentences > 0 ? (words / sentences).toFixed(2) : 0;
    },
    
    readingTime: (text, wordsPerMinute = 200) => {
        const words = textAnalysisUtils.wordCount(text);
        const minutes = words / wordsPerMinute;
        return minutes < 1 ? '< 1 minute' : `${Math.ceil(minutes)} minute${minutes > 1 ? 's' : ''}`;
    },
    
    mostCommonWords: (text, limit = 5) => {
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 2); // Filter short words
            
        const wordCount = {};
        words.forEach(word => {
            wordCount[word] = (wordCount[word] || 0) + 1;
        });
        
        return Object.entries(wordCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, limit)
            .map(([word, count]) => ({ word, count }));
    },
    
    textComplexity: (text) => {
        const avgWordsPerSentence = parseFloat(textAnalysisUtils.averageWordsPerSentence(text));
        const words = text.toLowerCase().split(/\s+/);
        const longWords = words.filter(word => word.length > 6).length;
        const longWordRatio = longWords / words.length;
        
        // Simple complexity score based on sentence length and long words
        const complexity = (avgWordsPerSentence * 0.4) + (longWordRatio * 100);
        
        if (complexity < 10) return 'Simple';
        if (complexity < 15) return 'Moderate';
        if (complexity < 20) return 'Complex';
        return 'Very Complex';
    }
};

// Text formatting and styling
const textFormattingUtils = {
    bold: (text) => `*${text}*`,
    italic: (text) => `_${text}_`,
    monospace: (text) => `\`${text}\``,
    strikethrough: (text) => `~${text}~`,
    underline: (text) => `__${text}__`, // Note: Telegram doesn't support underline
    
    spoiler: (text) => `||${text}||`,
    quote: (text) => `> ${text}`,
    
    // Text decorations with Unicode characters
    bubble: (text) => text.split('').map(char => {
        const code = char.charCodeAt(0);
        if (code >= 65 && code <= 90) return String.fromCharCode(code - 65 + 9333); // A-Z
        if (code >= 97 && code <= 122) return String.fromCharCode(code - 97 + 9333); // a-z
        return char;
    }).join(''),
    
    smallCaps: (text) => text.toLowerCase().split('').map(char => {
        const small = 'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ';
        const normal = 'abcdefghijklmnopqrstuvwxyz';
        const index = normal.indexOf(char);
        return index !== -1 ? small[index] : char;
    }).join(''),
    
    fullWidth: (text) => text.split('').map(char => {
        const code = char.charCodeAt(0);
        if (code >= 33 && code <= 126) return String.fromCharCode(code - 33 + 65281);
        return char;
    }).join(''),
    
    upsideDown: (text) => {
        const map = {
            'a': 'ɐ', 'b': 'q', 'c': 'ɔ', 'd': 'p', 'e': 'ǝ', 'f': 'ɟ', 'g': 'ƃ', 'h': 'ɥ',
            'i': 'ı', 'j': 'ɾ', 'k': 'ʞ', 'l': 'l', 'm': 'ɯ', 'n': 'u', 'o': 'o', 'p': 'd',
            'q': 'b', 'r': 'ɹ', 's': 's', 't': 'ʇ', 'u': 'n', 'v': 'ʌ', 'w': 'ʍ', 'x': 'x',
            'y': 'ʎ', 'z': 'z', ' ': ' '
        };
        return text.toLowerCase().split('').map(char => map[char] || char).reverse().join('');
    }
};

// Text generation utilities
const textGenerationUtils = {
    lorem: (sentences = 3) => {
        const loremTexts = [
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
            "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
            "Ut enim ad minim veniam, quis nostrud exercitation ullamco.",
            "Laboris nisi ut aliquip ex ea commodo consequat.",
            "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum.",
            "Dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat.",
            "Non proident sunt in culpa qui officia deserunt mollit anim.",
            "Id est laborum sed ut perspiciatis unde omnis iste natus error.",
            "Sit voluptatem accusantium doloremque laudantium totam rem aperiam.",
            "Eaque ipsa quae ab illo inventore veritatis et quasi architecto."
        ];
        
        const result = [];
        for (let i = 0; i < sentences; i++) {
            result.push(loremTexts[i % loremTexts.length]);
        }
        return result.join(' ');
    },
    
    password: (length = 12, includeSymbols = true) => {
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        
        let charset = lowercase + uppercase + numbers;
        if (includeSymbols) charset += symbols;
        
        let password = '';
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return password;
    },
    
    randomText: (words = 10) => {
        const wordList = [
            'the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog', 'and', 'runs',
            'through', 'forest', 'with', 'great', 'speed', 'while', 'birds', 'sing', 'in',
            'trees', 'above', 'clouds', 'move', 'across', 'blue', 'sky', 'gentle', 'wind',
            'blows', 'leaves', 'fall', 'ground', 'where', 'flowers', 'bloom', 'spring',
            'sunshine', 'warms', 'earth', 'rivers', 'flow', 'mountains', 'stand', 'tall'
        ];
        
        const result = [];
        for (let i = 0; i < words; i++) {
            result.push(wordList[Math.floor(Math.random() * wordList.length)]);
        }
        return result.join(' ');
    }
};

// Text encoding/decoding utilities
const textEncodingUtils = {
    base64Encode: (text) => {
        try {
            return Buffer.from(text, 'utf8').toString('base64');
        } catch (error) {
            throw new Error('Failed to encode text to Base64');
        }
    },
    
    base64Decode: (encodedText) => {
        try {
            return Buffer.from(encodedText, 'base64').toString('utf8');
        } catch (error) {
            throw new Error('Failed to decode Base64 text');
        }
    },
    
    urlEncode: (text) => encodeURIComponent(text),
    urlDecode: (encodedText) => {
        try {
            return decodeURIComponent(encodedText);
        } catch (error) {
            throw new Error('Failed to decode URL encoded text');
        }
    },
    
    htmlEncode: (text) => text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;'),
    
    htmlDecode: (encodedText) => encodedText
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'"),
    
    reverseText: (text) => text.split('').reverse().join(''),
    
    removeAccents: (text) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
    
    removeEmojis: (text) => text.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, ''),
    
    extractEmojis: (text) => {
        const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
        return text.match(emojiRegex) || [];
    }
};

// Text manipulation utilities
const textManipulationUtils = {
    removeExtraSpaces: (text) => text.replace(/\s+/g, ' ').trim(),
    
    removeLineBreaks: (text) => text.replace(/\r?\n|\r/g, ' '),
    
    addLineBreaks: (text, wordsPerLine = 10) => {
        const words = text.split(' ');
        const lines = [];
        
        for (let i = 0; i < words.length; i += wordsPerLine) {
            lines.push(words.slice(i, i + wordsPerLine).join(' '));
        }
        
        return lines.join('\n');
    },
    
    centerText: (text, width = 40, fillChar = ' ') => {
        const lines = text.split('\n');
        return lines.map(line => {
            const padding = Math.max(0, width - line.length);
            const leftPadding = Math.floor(padding / 2);
            const rightPadding = padding - leftPadding;
            return fillChar.repeat(leftPadding) + line + fillChar.repeat(rightPadding);
        }).join('\n');
    },
    
    wrapText: (text, width = 50) => {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        for (const word of words) {
            if ((currentLine + word).length > width) {
                if (currentLine) {
                    lines.push(currentLine.trim());
                    currentLine = word + ' ';
                } else {
                    lines.push(word);
                }
            } else {
                currentLine += word + ' ';
            }
        }
        
        if (currentLine.trim()) {
            lines.push(currentLine.trim());
        }
        
        return lines.join('\n');
    },
    
    extractHashtags: (text) => {
        const hashtagRegex = /#\w+/g;
        return text.match(hashtagRegex) || [];
    },
    
    extractMentions: (text) => {
        const mentionRegex = /@\w+/g;
        return text.match(mentionRegex) || [];
    },
    
    extractUrls: (text) => {
        const urlRegex = /https?:\/\/[^\s]+/g;
        return text.match(urlRegex) || [];
    },
    
    highlightWords: (text, words, prefix = '**', suffix = '**') => {
        let result = text;
        words.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            result = result.replace(regex, `${prefix}$&${suffix}`);
        });
        return result;
    }
};

// Generate text utilities menu
function generateTextUtilsMenu() {
    return [
        [
            { text: '🔄 Case Transform', callback_data: JSON.stringify({ feature: 'textcase' }) },
            { text: '📊 Text Analysis', callback_data: JSON.stringify({ feature: 'textanalysis' }) }
        ],
        [
            { text: '🎨 Text Styling', callback_data: JSON.stringify({ feature: 'textstyle' }) },
            { text: '🔧 Text Tools', callback_data: JSON.stringify({ feature: 'texttools' }) }
        ],
        [
            { text: '🔐 Encode/Decode', callback_data: JSON.stringify({ feature: 'textencode' }) },
            { text: '🎲 Generate Text', callback_data: JSON.stringify({ feature: 'textgen' }) }
        ],
        [
            { text: '❌ Close', callback_data: JSON.stringify({ feature: 'closemenu' }) }
        ]
    ];
}

// Format text analysis results
function formatTextAnalysis(text) {
    const chars = textAnalysisUtils.characterCount(text);
    const words = textAnalysisUtils.wordCount(text);
    const sentences = textAnalysisUtils.sentenceCount(text);
    const paragraphs = textAnalysisUtils.paragraphCount(text);
    const avgWords = textAnalysisUtils.averageWordsPerSentence(text);
    const readTime = textAnalysisUtils.readingTime(text);
    const complexity = textAnalysisUtils.textComplexity(text);
    const commonWords = textAnalysisUtils.mostCommonWords(text, 5);
    
    let result = `📊 *Text Analysis Results*\n\n`;
    result += `📝 *Basic Stats:*\n`;
    result += `• Characters: ${chars}\n`;
    result += `• Words: ${words}\n`;
    result += `• Sentences: ${sentences}\n`;
    result += `• Paragraphs: ${paragraphs}\n\n`;
    
    result += `📈 *Advanced Metrics:*\n`;
    result += `• Avg words/sentence: ${avgWords}\n`;
    result += `• Reading time: ${readTime}\n`;
    result += `• Complexity: ${complexity}\n\n`;
    
    if (commonWords.length > 0) {
        result += `🔤 *Most Common Words:*\n`;
        commonWords.forEach((item, index) => {
            result += `${index + 1}. "${item.word}" (${item.count}x)\n`;
        });
    }
    
    return result;
}

module.exports = {
    textCaseUtils,
    textAnalysisUtils,
    textFormattingUtils,
    textGenerationUtils,
    textEncodingUtils,
    textManipulationUtils,
    generateTextUtilsMenu,
    formatTextAnalysis
};