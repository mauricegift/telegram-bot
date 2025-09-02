// Global error handlers - These prevent the bot from crashing unexpectedly
// and help identify issues that cause the bot to stop responding
process.on('unhandledRejection', (reason, promise) => {
    console.error(chalk.red('🚨 Unhandled Promise Rejection:'), reason);
    console.error(chalk.red('🔍 Promise:'), promise);
    // Log additional context to help with debugging
    console.error(chalk.yellow('⚠️  This may indicate an async operation that failed without proper error handling'));
});

process.on('uncaughtException', (error) => {
    console.error(chalk.red('🚨 Uncaught Exception:'), error);
    console.error(chalk.red('🔍 Stack Trace:'), error.stack);
    // Log additional context but don't exit - let the bot continue running
    console.error(chalk.yellow('⚠️  This may indicate a synchronous error that wasn\'t caught'));
});

require('./set');
const path = require('path');
const express = require('express');
const GiftedMd = require('node-telegram-bot-api'); 
const chalk = require('chalk');
const { customMessage: GiftedMess, DataBase: GiftedDB } = require('./gift');
const gifteddb = new GiftedDB();
let Gifted;
const app = express();

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, './gift/gifted.html'));
});

const port = process.env.PORT || 7000;
app.listen(port, () => console.log(`App running on port ${port}`));

async function startGifted() {
    if (!Gifted) {
        Gifted = new GiftedMd(`${global.botToken}`, { polling: true });

        console.log(chalk.bgHex('#90EE90').hex('#333').bold(' 𝐂𝐨𝐨𝐥 𝐒𝐡𝐨𝐭 𝐀𝐈 𝐕2 Connected '));
        const miscInfo = await Gifted.getMe();
        console.log(chalk.white.bold('—————————————————'));
        console.log('Bot Info: ', JSON.stringify(miscInfo, null, 2));
        console.log(chalk.white.bold('—————————————————'));

        const loadGiftedData = await gifteddb.giftedRead();
        if (loadGiftedData && Object.keys(loadGiftedData).length === 0) {
            global.db = {
                users: {},
                groups: {},
                ...(loadGiftedData || {}),
            };
            await gifteddb.giftedWrite(global.db);
        } else {
            global.db = loadGiftedData;
        }
        setInterval(async () => {
            if (global.db) await gifteddb.giftedWrite(global.db);
        }, 5000);

        // Periodic health check - logs every 15 minutes to indicate bot is running
        // This helps identify when the bot stops responding or hangs
        setInterval(() => {
            const uptime = process.uptime();
            const uptimeFormatted = Math.floor(uptime / 60) + 'm ' + Math.floor(uptime % 60) + 's';
            const memUsage = process.memoryUsage();
            const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
            
            console.log(chalk.green('💚 Bot Health Check - Bot is alive and running'));
            console.log(chalk.cyan(`⏱️  Uptime: ${uptimeFormatted} | Memory: ${memUsageMB}MB`));
        }, 15 * 60 * 1000); // Every 15 minutes

        Gifted.on('message', async (m) => {
            try {
                console.log(chalk.magenta('📥 Message received by first handler (giftedmd)'));
                await GiftedMess(Gifted, m);
                console.log(chalk.magenta('✅ First handler completed successfully'));
            } catch (error) {
                console.error(chalk.red('❌ Error in first message handler:'), error);
            }
        });

        require('./gift/gifted')(Gifted);
    }
}

startGifted();
