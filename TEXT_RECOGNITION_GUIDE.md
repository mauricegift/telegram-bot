# Text Recognition and Formatting Guide

This guide explains how to extend text recognition to handle bold, italic, and other formatting in Telegram messages.

## Overview

Telegram provides rich message entities that contain formatting information. These entities can be parsed to handle bold text, italic text, code blocks, mentions, URLs, and more.

## Message Entities Structure

When a user sends a formatted message, Telegram includes an `entities` array in the message object:

```javascript
// Example message with formatting
{
  text: "Hello *world* _this is italic_ and `code`",
  entities: [
    {
      type: "bold",
      offset: 6,
      length: 7
    },
    {
      type: "italic", 
      offset: 14,
      length: 16
    },
    {
      type: "code",
      offset: 35,
      length: 6
    }
  ]
}
```

## Implementing Text Recognition

### 1. Basic Entity Parser

Add this function to your message handler:

```javascript
function parseMessageEntities(message) {
    if (!message.entities || message.entities.length === 0) {
        return { text: message.text, hasFormatting: false };
    }
    
    const text = message.text;
    const entities = message.entities;
    const formattedSegments = [];
    
    // Sort entities by offset
    entities.sort((a, b) => a.offset - b.offset);
    
    let lastOffset = 0;
    
    entities.forEach(entity => {
        // Add unformatted text before entity
        if (entity.offset > lastOffset) {
            formattedSegments.push({
                text: text.substring(lastOffset, entity.offset),
                type: 'text'
            });
        }
        
        // Add formatted entity
        const entityText = text.substring(entity.offset, entity.offset + entity.length);
        formattedSegments.push({
            text: entityText,
            type: entity.type,
            offset: entity.offset,
            length: entity.length
        });
        
        lastOffset = entity.offset + entity.length;
    });
    
    // Add remaining unformatted text
    if (lastOffset < text.length) {
        formattedSegments.push({
            text: text.substring(lastOffset),
            type: 'text'
        });
    }
    
    return {
        originalText: text,
        segments: formattedSegments,
        hasFormatting: true
    };
}
```

### 2. Using the Parser in Commands

Integrate the parser into your command handlers:

```javascript
// In your command handler
async function handleFormattedCommand(m, { Gifted, text, command }) {
    const parsedMessage = parseMessageEntities(m);
    
    if (parsedMessage.hasFormatting) {
        console.log('Message has formatting:', parsedMessage.segments);
        
        // Process each segment
        parsedMessage.segments.forEach(segment => {
            switch (segment.type) {
                case 'bold':
                    console.log(`Bold text: ${segment.text}`);
                    break;
                case 'italic':
                    console.log(`Italic text: ${segment.text}`);
                    break;
                case 'code':
                    console.log(`Code: ${segment.text}`);
                    break;
                case 'mention':
                    console.log(`Mention: ${segment.text}`);
                    break;
                case 'url':
                    console.log(`URL: ${segment.text}`);
                    break;
                default:
                    console.log(`Regular text: ${segment.text}`);
            }
        });
    } else {
        console.log('Plain text message:', parsedMessage.text);
    }
}
```

### 3. Advanced Entity Types

Telegram supports various entity types:

- `bold` - Bold text
- `italic` - Italic text
- `underline` - Underlined text
- `strikethrough` - Strikethrough text
- `code` - Inline code
- `pre` - Code block
- `text_link` - Text with URL
- `text_mention` - Text mention of a user
- `mention` - @username mention
- `hashtag` - #hashtag
- `cashtag` - $cashtag
- `bot_command` - /command
- `url` - URL
- `email` - Email address
- `phone_number` - Phone number
- `spoiler` - Spoiler text

### 4. Example Implementation

Here's a complete example for the AI chat handler:

```javascript
// Add to your AI command handler
function processFormattedInput(message) {
    const parsed = parseMessageEntities(message);
    
    if (!parsed.hasFormatting) {
        return message.text;
    }
    
    // Convert formatting to markdown for AI processing
    let processedText = '';
    
    parsed.segments.forEach(segment => {
        switch (segment.type) {
            case 'bold':
                processedText += `**${segment.text}**`;
                break;
            case 'italic':
                processedText += `*${segment.text}*`;
                break;
            case 'code':
                processedText += `\`${segment.text}\``;
                break;
            case 'pre':
                processedText += `\`\`\`${segment.text}\`\`\``;
                break;
            default:
                processedText += segment.text;
        }
    });
    
    return processedText;
}

// Usage in AI handler
const processedInput = processFormattedInput(m);
// Send processedInput to AI service instead of raw text
```

### 5. Integration Points

To integrate this into your bot, modify these files:

1. **gift/gifted.js** - Add the parser to the main message handler
2. **gifted/ai/gemini.js** - Use formatted text for AI processing  
3. **Command handlers** - Check for formatting in command arguments

### 6. Testing Formatted Messages

Test with these Telegram message examples:

- `*bold text*` (bold)
- `_italic text_` (italic)  
- `` `inline code` `` (code)
- `@username` (mention)
- `#hashtag` (hashtag)
- `/command` (bot_command)

## Best Practices

1. **Always check** if entities exist before processing
2. **Sort entities** by offset to avoid overlapping issues
3. **Preserve original text** for fallback scenarios  
4. **Handle nested formatting** carefully
5. **Test with various** client apps (mobile, desktop, web)

## Example Usage

```javascript
// In your message handler
Gifted.on('message', async (m) => {
    if (m.entities && m.entities.length > 0) {
        console.log('📝 Message has formatting entities:', m.entities.length);
        const parsed = parseMessageEntities(m);
        // Process formatted message
    }
});
```

This guide provides the foundation for handling rich text formatting in your Telegram bot. Extend the parsing logic based on your specific needs.