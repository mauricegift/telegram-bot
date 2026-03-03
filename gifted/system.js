const { gmd } = require('../gift');
const { formatUptime, copyFolderSync } = require('../gift/gmdUtils');
const { axios, fs, path } = require('../gift/gmdHelpers');
const os = require('os');
const AdmZip = require("adm-zip");

gmd({
    pattern: "restart",
    aliases: ["reboot", "reset"],
    react: "🫡",
    category: "system",
    description: "Restart the bot",
    owneronly: true,
    cooldown: 5
},

async (msg, Gifted, conText) => {
    const { reply } = conText;

    try {
        await reply("🔄 Restarting bot...");
        setTimeout(() => {
            process.exit(0);
        }, 2000);
    } catch (error) {
        console.error("Restart error:", error);
        await reply("❌ Restart failed.");
    }
});

gmd({
    pattern: "update",
    aliases: ["updatenow", "sync"],
    react: "🔥",
    category: "system",
    description: "Update the bot to the latest version",
    owneronly: true,
    cooldown: 10
},

async (msg, Gifted, conText) => {
    const { reply } = conText;

    try {
        await reply("🔍 Checking for new updates...");

        const { data: commitData } = await axios.get("https://api.github.com/repos/mauricegift/telegram-bot/commits/main");
        const latestCommitHash = commitData.sha;

        const commitFile = path.join(__dirname, '..', 'gift' 'current_commit.txt');
        let currentHash = '';

        if (fs.existsSync(commitFile)) {
            currentHash = fs.readFileSync(commitFile, 'utf8').trim();
        }

        if (latestCommitHash === currentHash) {
            return await reply("✅ Your bot is already up-to-date!");
        }

        const authorName = commitData.commit.author.name;
        const authorEmail = commitData.commit.author.email;
        const commitDate = new Date(
        commitData.commit.author.date,
        ).toLocaleString();
        const commitMessage = commitData.commit.message;

        await reply(`🔄 Updating Bot...\n\nCommit Details:\n👤 Author: ${authorName} (${authorEmail})\n📅 Date: ${commitDate}\n💬 Message: ${commitMessage}`);

        const zipPath = path.join(__dirname, '..', 'telegram-bot-latest.zip');
        const { data: zipData } = await axios.get("https://github.com/mauricegift/telegram-bot/archive/main.zip", {
            responseType: "arraybuffer"
        });
        fs.writeFileSync(zipPath, zipData);

        const extractPath = path.join(__dirname, '..', 'latest');
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(extractPath, true);

        const sourcePath = path.join(extractPath, 'telegram-bot-main');
        const destinationPath = path.join(__dirname, '..');
        copyFolderSync(sourcePath, destinationPath);

        fs.writeFileSync(commitFile, latestCommitHash);

        fs.unlinkSync(zipPath);
        fs.rmSync(extractPath, { recursive: true, force: true });

        await reply("✅ Update complete! Restarting the bot...");

        setTimeout(() => {
            process.exit(0);
        }, 2000);

    } catch (error) {
        console.error("Update error:", error);
        await reply("❌ Update failed. Please try manually.");
    }
});

gmd({
    pattern: "ping",
    aliases: ["speed", "test"],
    react: "⚡",
    category: "system",
    description: "Check bot response time",
    cooldown: 3
},

async (msg, Gifted, conText) => {
    const { reply } = conText;

    try {
        const startTime = Date.now();
        const sentMessage = await reply("🏓 Pong!");
        const pingTime = Date.now() - startTime;

        await Gifted.editMessageText(`🏓 Pong!\n⚡ Ping: ${pingTime}ms`, {
            chat_id: conText.chatId,
            message_id: sentMessage.message_id
        });
    } catch (error) {
        console.error('[ERROR]', error);
        await reply('An error occurred while checking ping.');
    }
});

gmd({
    pattern: "uptime",
    aliases: ["up", "status"],
    react: "💯",
    category: "system",
    description: "Display bot statistics",
    cooldown: 5
},

async (msg, Gifted, conText) => {
    const { reply, botName } = conText;

    try {
        const uptime = process.uptime();
        const memoryUsage = (process.memoryUsage().rss / (1024 * 1024)).toFixed(2);
        const cpuLoad = os.loadavg()[0].toFixed(2);

        const statsMessage = `
📊 ${botName} Statistics 📊

🕒 Uptime: ${formatUptime(uptime)}
💾 Memory Usage: ${memoryUsage} MB
⚡ CPU Load: ${cpuLoad}
        `.trim();

        await reply(statsMessage);
    } catch (error) {
        console.error('[ERROR]', error);
        await reply('An error occurred while fetching the stats.');
    }
});
