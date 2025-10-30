require('./config');
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
        Gifted = new GiftedMd(`${global.botToken}`, {
          polling: true,
          baseApiUrl: "http://77.237.235.216:1500"
        });
        console.log(chalk.bgHex('#90EE90').hex('#333').bold(' Gifted Md Connected '));
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

        Gifted.on('message', async (m) => {
            await GiftedMess(Gifted, m);
        });

        require('./gift/gifted')(Gifted);
    }
}

startGifted();



