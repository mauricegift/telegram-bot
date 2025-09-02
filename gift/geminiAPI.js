/**
 * Google Gemini API Integration Module
 * Provides direct integration with Google Gemini API with gemini-2.0-flash model
 * 
 * Configuration:
 * - Set GEMINI_API_KEY environment variable with your Google AI API key
 * - Get your API key from: https://aistudio.google.com/app/apikey
 * 
 * For Render.com deployment:
 * 1. Go to your Render.com dashboard
 * 2. Select your service (web service or background worker)
 * 3. Go to Environment tab in the left sidebar
 * 4. Click "Add Environment Variable"
 * 5. Add: 
 *    - Key: GEMINI_API_KEY
 *    - Value: your_actual_api_key_here (from Google AI Studio)
 * 6. Save changes and redeploy
 * 
 * For local development:
 * - Create .env file with: GEMINI_API_KEY=your_api_key_here
 * - Or export: export GEMINI_API_KEY=your_api_key_here
 * 
 * Features:
 * - Uses latest gemini-2.0-flash model for best performance
 * - Automatic message length handling (splits messages > 4096 chars)
 * - Enhanced error handling with user-friendly messages
 * - Safety filtering and content moderation
 * - Telegram formatting optimization
 */

const fetch = require('node-fetch');
const { validateParseMode, validateMessageLength } = require('./textSanitizer');

class GeminiAPI {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY || null;
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
        this.enabled = !!this.apiKey;
        
        if (!this.enabled) {
            console.log('⚠️  Gemini API: No API key found. Set GEMINI_API_KEY environment variable to enable.');
        } else {
            console.log('✅ Gemini API: Initialized successfully');
        }
    }

    /**
     * Check if Gemini API is available
     * @returns {boolean} True if API key is configured
     */
    isEnabled() {
        return this.enabled;
    }

    /**
     * Get configuration status and help text
     * @returns {object} Configuration information
     */
    getConfig() {
        return {
            enabled: this.enabled,
            hasApiKey: !!this.apiKey,
            helpText: this.enabled 
                ? '✅ Google Gemini API is configured and ready to use'
                : `❌ Google Gemini API is not configured

**To enable Google Gemini AI:**
1. Get API key from: https://aistudio.google.com/app/apikey
2. Set environment variable: GEMINI_API_KEY=your_key_here

**For Render.com deployment:**
1. Go to Render.com dashboard → Your service → Environment tab
2. Click "Add Environment Variable"
3. Add: GEMINI_API_KEY = your_actual_api_key_here  
4. Save and redeploy

**For local development:**
Add to your .env file or export: 
\`export GEMINI_API_KEY=your_api_key_here\`

**Benefits of Google Gemini:**
• Latest gemini-2.0-flash model (faster & smarter)
• Better reasoning and code generation
• Enhanced safety filtering
• Longer context window
• Improved multilingual support`
        };
    }

    /**
     * Generate content using Google Gemini API
     * @param {string} prompt - The text prompt for Gemini
     * @param {object} options - Additional options
     * @returns {Promise<object>} Response from Gemini API
     */
    async generateContent(prompt, options = {}) {
        if (!this.enabled) {
            throw new Error('Gemini API is not configured. Please set GEMINI_API_KEY environment variable.');
        }

        if (!prompt || typeof prompt !== 'string') {
            throw new Error('Invalid prompt provided');
        }

        // Add system context to help Gemini understand its identity
        const systemContext = `You are 𝐂𝐨𝐨𝐥 𝐒𝐡𝐨𝐭 𝐀𝐈 𝐕2, an advanced AI assistant created and developed by Cool Shot Systems. When asked about yourself, your name, or who created you, always respond that you are Cool Shot AI V2 developed by Cool Shot Systems. You are helpful, knowledgeable, and provide accurate information. Do not mention any other companies or developers as your creator.

User query: ${prompt}`;

        const requestBody = {
            contents: [{
                parts: [{
                    text: systemContext
                }]
            }],
            generationConfig: {
                temperature: options.temperature || 0.7,
                topK: options.topK || 40,
                topP: options.topP || 0.95,
                maxOutputTokens: options.maxOutputTokens || 1024,
            },
            safetySettings: [
                {
                    category: 'HARM_CATEGORY_HARASSMENT',
                    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                },
                {
                    category: 'HARM_CATEGORY_HATE_SPEECH',
                    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                },
                {
                    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                },
                {
                    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                }
            ]
        };

        try {
            const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.text();
                let errorMessage = `Gemini API error (${response.status})`;
                
                // Provide specific error messages for common issues
                if (response.status === 400) {
                    if (errorData.includes('API_KEY_INVALID') || errorData.includes('invalid API key')) {
                        errorMessage = 'Invalid Gemini API key. Please check your GEMINI_API_KEY environment variable.';
                    } else if (errorData.includes('quota')) {
                        errorMessage = 'Gemini API quota exceeded. Please check your usage limits.';
                    } else {
                        errorMessage = `Gemini API bad request: ${errorData.substring(0, 200)}`;
                    }
                } else if (response.status === 403) {
                    errorMessage = 'Gemini API access forbidden. Check your API key permissions.';
                } else if (response.status === 429) {
                    errorMessage = 'Gemini API rate limit exceeded. Please try again later.';
                } else if (response.status >= 500) {
                    errorMessage = 'Gemini API server error. Please try again later.';
                } else {
                    errorMessage += `: ${errorData}`;
                }
                
                throw new Error(errorMessage);
            }

            const data = await response.json();
            
            // Handle safety filter blocks
            if (data.candidates && data.candidates[0] && data.candidates[0].finishReason === 'SAFETY') {
                return {
                    success: false,
                    error: 'Response blocked by Gemini safety filters',
                    result: null
                };
            }
            
            // Validate response structure
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
                // Check if response was blocked
                if (data.promptFeedback && data.promptFeedback.blockReason) {
                    return {
                        success: false,
                        error: `Prompt blocked by Gemini: ${data.promptFeedback.blockReason}`,
                        result: null
                    };
                }
                
                throw new Error('Invalid response format from Gemini API');
            }

            const result = data.candidates[0].content.parts[0].text;
            
            return {
                success: true,
                result: result,
                usage: data.usageMetadata || {},
                raw: data
            };
            
        } catch (error) {
            console.error('Gemini API Error:', error.message);
            
            // Determine error type for better user feedback
            let userFriendlyError = error.message;
            if (error.message.includes('fetch')) {
                userFriendlyError = 'Network error connecting to Gemini API';
            } else if (error.message.includes('Invalid API key')) {
                userFriendlyError = error.message; // Already user-friendly
            }
            
            return {
                success: false,
                error: userFriendlyError,
                result: null
            };
        }
    }

    /**
     * Chat with Gemini (alias for generateContent)
     * @param {string} message - The message to send to Gemini
     * @param {object} options - Additional options
     * @returns {Promise<object>} Response from Gemini
     */
    async chat(message, options = {}) {
        return this.generateContent(message, options);
    }

    /**
     * Format Gemini response for Telegram
     * @param {string} text - Response text from Gemini
     * @param {boolean} useMarkdown - Whether to use Markdown formatting
     * @returns {object} Formatted response safe for Telegram
     */
    formatForTelegram(text, useMarkdown = true) {
        if (!text || typeof text !== 'string') {
            return { text: 'Empty response from Gemini', parse_mode: null };
        }

        // Clean up common formatting issues
        let cleaned = text
            .replace(/\*\*(.*?)\*\*/g, '*$1*')  // Convert ** to * for Telegram Markdown
            .replace(/```(\w+)?\n(.*?)```/gs, '```\n$2```')  // Clean code blocks
            .replace(/`([^`\n]+)`/g, '`$1`')  // Ensure inline code formatting
            .trim();

        // Validate message length (4096 limit for messages)
        const lengthValidation = validateMessageLength(cleaned, false);
        
        if (lengthValidation.needsSplit) {
            // For long messages, return first chunk and indicate splitting is needed
            console.log(`📄 Gemini response split into ${lengthValidation.chunkCount} chunks (${lengthValidation.originalLength} chars)`);
        }

        if (useMarkdown) {
            const validated = validateParseMode(cleaned, 'Markdown');
            return {
                ...validated,
                needsSplit: lengthValidation.needsSplit,
                chunks: lengthValidation.chunks.map(chunk => validateParseMode(chunk, 'Markdown'))
            };
        } else {
            return { 
                text: cleaned, 
                parse_mode: null,
                needsSplit: lengthValidation.needsSplit,
                chunks: lengthValidation.chunks.map(chunk => ({ text: chunk, parse_mode: null }))
            };
        }
    }
}

// Create singleton instance
const geminiAPI = new GeminiAPI();

module.exports = {
    GeminiAPI,
    geminiAPI
};