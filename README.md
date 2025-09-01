# ProfTech Bot - Multi-Role AI Assistant

A comprehensive Telegram bot combining the features of ProfTech_bot and Prof-Tech_MVAI, offering advanced multi-role AI assistance, administrative tools, support system, and extensive utilities.

## 🌟 Key Features

### 🤖 Multi-Role AI Assistant System
- **7 AI Personalities**: Default, Teacher, Programmer, Creative Writer, Data Analyst, Casual Friend, Professional
- **Smart Role Switching**: Users can switch between AI roles for specialized assistance
- **Contextual Responses**: Each role provides tailored responses based on their expertise
- **Role History**: Track and manage role changes

### 🌐 Multi-Language Support
- **12 Languages Supported**: English, Spanish, French, German, Italian, Portuguese, Russian, Japanese, Korean, Chinese, Hindi, Arabic
- **Localized Interface**: Bot messages adapt to user's selected language
- **Easy Language Switching**: Simple commands and inline keyboards for language selection

### 👨‍💼 Advanced Admin Panel
- **Comprehensive Statistics**: User activity, command usage, system metrics
- **User Management**: Block/unblock users, set premium status, view user info
- **Group Management**: Enable/disable bot in groups, manage group settings
- **Command Analytics**: Top commands, usage trends, performance metrics
- **System Monitoring**: Uptime, memory usage, bot health

### 📢 Broadcast System
- **Targeted Broadcasting**: Send messages to all users, groups, or premium users
- **Delivery Tracking**: Monitor message delivery success/failure rates
- **Admin Controls**: Create and manage broadcast campaigns

### 🎫 Support Ticket System
- **Comprehensive Ticketing**: Create, manage, and track support requests
- **Priority Levels**: Low, Medium, High, Urgent priority classification
- **Category System**: Technical, Feature Request, Bug Report, Account, General, Other
- **Status Tracking**: Open, In Progress, Waiting, Resolved, Closed
- **Admin Tools**: Assign tickets, update status, reply to users
- **Statistics**: Ticket analytics and performance metrics

### 🔧 Text Utilities Toolkit
- **Case Transformations**: Upper, lower, title, camel, pascal, snake, kebab case
- **Text Analysis**: Word count, reading time, complexity analysis, common words
- **Text Styling**: Bold, italic, monospace, strikethrough, spoiler, special Unicode styles
- **Encoding/Decoding**: Base64, URL, HTML encoding and decoding
- **Text Manipulation**: Reverse, clean spaces, wrap text, extract hashtags/mentions/URLs
- **Text Generation**: Lorem ipsum, random passwords, random text

### 📊 Analytics & Statistics
- **User Analytics**: Registration trends, activity patterns, command usage
- **Performance Metrics**: Response times, error rates, system performance
- **Command Statistics**: Most used commands, usage trends over time
- **Database Insights**: User growth, retention rates, feature adoption

### 🎮 Existing Bot Features
- **AI Integration**: GPT, Gemini, Flux, StableDiffusion, LuminAI
- **Downloaders**: YouTube (MP3/MP4), APK downloader, Git clone, Play search
- **Anime Content**: Neko, Waifu, Konachan images
- **Search Tools**: Wikipedia integration
- **Utilities**: QR code generation, Pastebin integration
- **NSFW Content**: Age-restricted content (where applicable)

## 🚀 Quick Start

### Prerequisites
- Node.js 16.x or higher
- Telegram Bot Token (from [@BotFather](https://t.me/BotFather))
- Your Telegram User ID

### Installation

1. **Fork and Clone Repository**
   ```bash
   git clone https://github.com/RayBen445/ProfTech_bot.git
   cd ProfTech_bot
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Bot Settings**
   
   Edit `set.js` with your credentials:
   ```javascript
   global.botToken = 'YOUR_TELEGRAM_BOT_TOKEN_HERE'; // Get from @BotFather
   global.ownerId = [YOUR_TELEGRAM_USER_ID]; // Your Telegram user ID
   global.ownerUsername = 'YOUR_USERNAME'; // Your Telegram username
   global.botName = 'Your Bot Name';
   global.timeZone = 'Your/Timezone'; // e.g., 'America/New_York'
   ```

4. **Start the Bot**
   ```bash
   npm start
   ```

## 🔧 Configuration

### Environment Variables
Create a `.env` file for sensitive data (recommended):
```env
TELEGRAM_TOKEN=your_bot_token_here
OWNER_ID=your_user_id_here
GIFTED_API_KEY=your_api_key_here
MAHER_API_KEY=your_api_key_here
```

### Important Notes
- **Use Your Own Token**: Always use ProfTech_bot's own `TELEGRAM_TOKEN`
- **No Credential Copying**: Never copy tokens from Prof-Tech_MVAI
- **Secure Storage**: Keep sensitive data in environment variables

## 📖 Usage Guide

### 🤖 AI Role Management
```bash
/role                    # View current role and available options
/setrole <role_name>     # Set AI role (teacher, programmer, creative, etc.)
/roles                   # List all available roles
```

### 🌐 Language Settings
```bash
/language               # View current language and options
/setlang <code>        # Set language (en, es, fr, de, it, pt, ru, ja, ko, zh, hi, ar)
```

### 👨‍💼 Admin Commands (Owner Only)
```bash
/admin                  # Open admin control panel
/adminstats            # System statistics
/userinfo <user_id>    # Get user information
/blockuser <user_id>   # Block/unblock user
/premium <user_id>     # Set premium status
/broadcast <message>   # Send broadcast message
/tickets               # View all support tickets
```

### 🎫 Support System
```bash
/ticket                # View your tickets
/createticket          # Create new support ticket
/ticket <id>           # View specific ticket
```

### 🔧 Text Utilities
```bash
/textutils             # Open text utilities menu
/upper <text>          # Convert to UPPERCASE
/analyze <text>        # Analyze text statistics
/base64encode <text>   # Encode to Base64
/lorem 5               # Generate lorem ipsum (5 sentences)
/password 16           # Generate 16-character password
```

### 🎮 General Commands
```bash
/menu or /start        # Main menu
/help                  # Command help
/ping                  # Bot response time
/system                # System information
/uptime                # Bot uptime
```

## 🌟 New Features Highlights

### Multi-Role AI Personalities

#### 🤖 Default Assistant
General-purpose AI for everyday questions and tasks.

#### 👨‍🏫 Teacher
Educational tutor that explains concepts with examples and asks follow-up questions.

#### 👨‍💻 Programmer
Coding expert providing technical solutions, debugging help, and best practices.

#### 🎨 Creative Writer
Assists with storytelling, creative content, poetry, and imaginative writing.

#### 📊 Data Analyst
Helps analyze information, provides insights, and explains complex data.

#### 😊 Casual Friend
Friendly companion for relaxed conversations and emotional support.

#### 👔 Professional
Business assistant for formal communication and professional tasks.

### Enhanced User Experience

- **Smart Language Detection**: Auto-detects user preferences
- **Contextual Help**: Role-specific assistance and suggestions
- **Interactive Menus**: Intuitive inline keyboards for easy navigation
- **Real-time Statistics**: Live updates on bot usage and performance

## 🔄 Migration Guide

### For ProfTech_bot Users
Your existing bot will gain:
- Multi-role AI system
- Language support
- Admin panel
- Support tickets
- Text utilities
- Enhanced analytics

**No configuration changes needed** - all new features are additive.

### For Prof-Tech_MVAI Users
To migrate to ProfTech_bot:

1. **Backup Data**: Export your user data and settings
2. **Update Token**: Use ProfTech_bot's `TELEGRAM_TOKEN`
3. **Configure Settings**: Update `set.js` with your preferences
4. **Import Data**: User data structure is compatible
5. **Test Features**: Verify all functionality works as expected

### Compatibility Notes
- **Database Format**: Enhanced with new fields, backward compatible
- **Command Structure**: All existing commands remain functional
- **Plugin System**: Existing plugins continue to work
- **API Keys**: Use your own API keys, don't copy from other bots

## 🛠️ Development

### Adding New Features
The bot uses a modular plugin system. Create new plugins in:
- `/gifted/ai/` - AI-related features
- `/gifted/general/` - General utilities
- `/gifted/tools/` - Utility tools
- `/gifted/admin/` - Admin features

### Plugin Structure
```javascript
let myPlugin = async (m, { Gifted, text, command }) => {
    // Plugin logic here
};

myPlugin.command = ['mycommand', 'alias'];
myPlugin.desc = 'Plugin description';
myPlugin.category = ['category'];
myPlugin.settings = { owner: false, group: false, private: false };

module.exports = myPlugin;
```

## 🚢 Deployment

### Heroku
1. Fork this repository
2. Connect to Heroku
3. Set environment variables
4. Deploy

### Render
1. Connect GitHub repository
2. Set build command: `npm install`
3. Set start command: `npm start`
4. Configure environment variables

### VPS/Local
```bash
# Clone repository
git clone https://github.com/RayBen445/ProfTech_bot.git
cd ProfTech_bot

# Install dependencies
npm install

# Configure bot
# Edit set.js with your settings

# Start bot
npm start

# Or use PM2 for production
pm2 start index.js --name "proftech-bot"
```

## 🔒 Security

- **Token Protection**: Never share your bot token
- **User Privacy**: User data is stored locally and securely
- **Admin Controls**: Comprehensive user management and moderation
- **Rate Limiting**: Built-in protection against spam and abuse

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Credits

- **Original ProfTech_bot**: Base bot functionality and structure
- **Prof-Tech_MVAI**: Multi-role AI system inspiration
- **GiftedTech**: Bot framework and utilities
- **Contributors**: Everyone who helped improve this bot

## 📞 Support

- **Telegram**: [@Prof_essor2025](https://t.me/Prof_essor2025)
- **Issues**: [GitHub Issues](https://github.com/RayBen445/ProfTech_bot/issues)
- **Support Ticket**: Use `/createticket` in the bot

## 🔄 Updates

Stay updated with the latest features:
- ⭐ Star this repository
- 📢 Join our channel for announcements
- 🔔 Enable GitHub notifications

---

**© 2024-2025 ProfTech Bot - Enhanced Multi-Role AI Assistant**

*Combining the best of both worlds: ProfTech_bot's reliability with Prof-Tech_MVAI's advanced features.*