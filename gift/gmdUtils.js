function getCategoryIcon(category) {
    const icons = {
        'GENERAL': '📋',
        'DOWNLOAD': '⬇️',
        'AI': '🤖',
        'FUN': '🎮',
        'GROUP': '👥',
        'SYSTEM': '⚙️',
        'UTILITY': '🛠️',
        'TOOLS': '🔧',
        'MISC': '📦',
        'OWNER': '👑',
        'MEDIA': '🎬',
        'SEARCH': '🔍',
        'MUSIC': '🎵',
        'ANIME': '🎌',
        'STICKER': '🎨'
    };
    return icons[category] || '📁';
}

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

function buildButtons(rows) {
    return { inline_keyboard: rows };
}

function urlButton(text, url) {
    return { text, url };
}

function callbackButton(text, data) {
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    return { text, callback_data: payload };
}

async function react(Gifted, chatId, messageId, emoji) {
    try {
        await Gifted.setMessageReaction(chatId, messageId, {
            reaction: [{ type: 'emoji', emoji }]
        });
    } catch (e) {
        console.log(`[React] Failed to react with ${emoji}: ${e.message || e}`);
    }
}

function copyFolderSync(source, target) {
    const fs = require('fs');
    const path = require('path');

    if (!fs.existsSync(target)) {
        fs.mkdirSync(target, { recursive: true });
    }

    const items = fs.readdirSync(source);
    for (const item of items) {
        const srcPath = path.join(source, item);
        const destPath = path.join(target, item);

        if (item === ".env" || item === ".env.example" || item === "example.env" || item === ".example.env" || item === "README.md" || item === "LICENSE" || item === "Procfile" || item === "heroku.yml" || item === "app.json" || item === "version.txt"  ) { // to preserve settings from env if any
            continue;
        }

        if (item === "node_modules" || item === ".git" || item === "logs") {
            continue;
        }

        if (fs.lstatSync(srcPath).isDirectory()) {
            copyFolderSync(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

module.exports = {
    getCategoryIcon,
    formatUptime,
    buildButtons,
    urlButton,
    callbackButton,
    react,
    copyFolderSync
};
