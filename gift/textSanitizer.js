/**
 * Text Sanitization Utilities for Telegram Bot
 * Handles special characters and formatting to prevent parse errors
 */

/**
 * Escape special characters for Telegram Markdown V2
 * @param {string} text - Text to escape
 * @returns {string} Escaped text safe for Markdown V2
 */
function escapeMarkdownV2(text) {
    if (!text || typeof text !== 'string') return '';
    
    // Characters that need to be escaped in MarkdownV2
    const specialChars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];
    
    return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
}

/**
 * Escape special characters for Telegram Markdown (legacy)
 * @param {string} text - Text to escape
 * @returns {string} Escaped text safe for Markdown
 */
function escapeMarkdown(text) {
    if (!text || typeof text !== 'string') return '';
    
    // Characters that need to be escaped in Markdown
    return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
}

/**
 * Remove or replace problematic Unicode characters
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
function sanitizeUnicode(text) {
    if (!text || typeof text !== 'string') return '';
    
    // Replace problematic box-drawing characters with safe alternatives
    return text
        .replace(/[╭╮╯╰]/g, '+')  // Corner characters
        .replace(/[─━]/g, '-')    // Horizontal lines
        .replace(/[│┃]/g, '|')    // Vertical lines
        .replace(/[┌┐└┘]/g, '+')  // Simple corners
        .replace(/[┏┓┗┛]/g, '+')  // Bold corners
        .replace(/[◊⊷]/g, '+')    // Diamond and other special chars
        .replace(/〘〙/g, '"')     // Special brackets
        .replace(/═/g, '=')       // Double horizontal line
        .replace(/[❍◊]/g, '*')    // Diamond bullets
};

/**
 * Sanitize text for safe Telegram sending with Markdown
 * @param {string} text - Text to sanitize
 * @param {boolean} preserveFormatting - Whether to preserve basic formatting
 * @returns {string} Sanitized text
 */
function sanitizeForTelegram(text, preserveFormatting = true) {
    if (!text || typeof text !== 'string') return '';
    
    let sanitized = text;
    
    // First sanitize Unicode characters
    sanitized = sanitizeUnicode(sanitized);
    
    // If we want to preserve formatting, use minimal escaping
    // Otherwise, escape all special characters
    if (!preserveFormatting) {
        sanitized = escapeMarkdown(sanitized);
    } else {
        // Only escape the most problematic characters, keep basic Markdown
        sanitized = sanitized.replace(/([_*[\]`])/g, '\\$1');
    }
    
    return sanitized;
}

/**
 * Create a safe monospace text for Telegram
 * @param {string} text - Text to make monospace
 * @returns {string} Safe monospace formatted text
 */
function safeMonospace(text) {
    if (!text || typeof text !== 'string') return '';
    
    // Escape backticks and wrap in backticks
    const escaped = text.replace(/`/g, '\\`');
    return `\`${escaped}\``;
}

/**
 * Create safe bold text for Telegram
 * @param {string} text - Text to make bold
 * @returns {string} Safe bold formatted text
 */
function safeBold(text) {
    if (!text || typeof text !== 'string') return '';
    
    // Escape asterisks and wrap in asterisks
    const escaped = text.replace(/\*/g, '\\*');
    return `*${escaped}*`;
}

/**
 * Create safe italic text for Telegram
 * @param {string} text - Text to make italic
 * @returns {string} Safe italic formatted text
 */
function safeItalic(text) {
    if (!text || typeof text !== 'string') return '';
    
    // Escape underscores and wrap in underscores
    const escaped = text.replace(/_/g, '\\_');
    return `_${escaped}_`;
}

/**
 * Split long text into chunks that fit Telegram limits
 * @param {string} text - Text to split
 * @param {number} maxLength - Maximum length per chunk (4096 for messages, 1024 for captions)
 * @returns {Array<string>} Array of text chunks
 */
function splitLongText(text, maxLength = 4096) {
    if (!text || typeof text !== 'string') return [''];
    
    if (text.length <= maxLength) return [text];
    
    const chunks = [];
    let currentChunk = '';
    const lines = text.split('\n');
    
    for (const line of lines) {
        // If single line is too long, split it by words
        if (line.length > maxLength) {
            if (currentChunk) {
                chunks.push(currentChunk.trim());
                currentChunk = '';
            }
            
            const words = line.split(' ');
            for (const word of words) {
                if ((currentChunk + ' ' + word).length > maxLength) {
                    if (currentChunk) {
                        chunks.push(currentChunk.trim());
                        currentChunk = word;
                    } else {
                        // Single word is too long, split it forcefully
                        chunks.push(word.substring(0, maxLength));
                        currentChunk = word.substring(maxLength);
                    }
                } else {
                    currentChunk += (currentChunk ? ' ' : '') + word;
                }
            }
        } else {
            // Check if adding this line exceeds the limit
            if ((currentChunk + '\n' + line).length > maxLength) {
                if (currentChunk) {
                    chunks.push(currentChunk.trim());
                    currentChunk = line;
                } else {
                    chunks.push(line);
                }
            } else {
                currentChunk += (currentChunk ? '\n' : '') + line;
            }
        }
    }
    
    if (currentChunk) {
        chunks.push(currentChunk.trim());
    }
    
    return chunks.filter(chunk => chunk.length > 0);
}

/**
 * Validate message length and split if necessary
 * @param {string} text - Text to validate
 * @param {boolean} isCaption - Whether this is a caption (1024 limit) or message (4096 limit)
 * @returns {object} Object with validated text chunks and metadata
 */
function validateMessageLength(text, isCaption = false) {
    const maxLength = isCaption ? 1024 : 4096;
    
    if (!text || typeof text !== 'string') {
        return { chunks: [''], needsSplit: false, originalLength: 0 };
    }
    
    const chunks = splitLongText(text, maxLength);
    
    return {
        chunks: chunks,
        needsSplit: chunks.length > 1,
        originalLength: text.length,
        chunkCount: chunks.length
    };
}

/**
 * Validate and fix parse_mode content
 * @param {string} text - Text to validate
 * @param {string} parseMode - Parse mode ('Markdown', 'HTML', etc.)
 * @returns {object} Object with sanitized text and safe parse mode
 */
function validateParseMode(text, parseMode = 'Markdown') {
    if (!text || typeof text !== 'string') {
        return { text: '', parse_mode: null };
    }
    
    try {
        let sanitizedText = text;
        
        if (parseMode === 'Markdown' || parseMode === 'MarkdownV2') {
            // Sanitize for Markdown
            sanitizedText = sanitizeForTelegram(text, true);
            
            // Validate that brackets are properly closed
            const openBrackets = (sanitizedText.match(/\[/g) || []).length;
            const closeBrackets = (sanitizedText.match(/\]/g) || []).length;
            
            if (openBrackets !== closeBrackets) {
                // If brackets don't match, escape them all
                sanitizedText = sanitizedText.replace(/[\[\]]/g, '\\$&');
            }
            
            return { 
                text: sanitizedText, 
                parse_mode: 'Markdown' 
            };
        } else if (parseMode === 'HTML') {
            // Basic HTML sanitization
            sanitizedText = text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
                
            return { 
                text: sanitizedText, 
                parse_mode: 'HTML' 
            };
        }
        
        // For no parse mode, still sanitize Unicode
        return { 
            text: sanitizeUnicode(text), 
            parse_mode: null 
        };
        
    } catch (error) {
        console.error('Error in validateParseMode:', error);
        // Fallback: return plain text without parse mode
        return { 
            text: sanitizeUnicode(text), 
            parse_mode: null 
        };
    }
}

module.exports = {
    escapeMarkdown,
    escapeMarkdownV2,
    sanitizeUnicode,
    sanitizeForTelegram,
    safeMonospace,
    safeBold,
    safeItalic,
    validateParseMode,
    splitLongText,
    validateMessageLength
};