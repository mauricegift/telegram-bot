const { gmd } = require('../gift');
const { uploadToGiftedCdn, uploadToCatbox, uploadToGithubCdn, uploadToImgBB, uploadToPixhost, downloadTgFile, isImageFile, fs, path, tempDir } = require('../gift/gmdHelpers');

gmd({
    pattern: "giftedcdn",
    aliases: ["url", "geturl", "filelink", "cdn"],
    react: "🔥",
    category: "upload",
    description: "Upload file to GiftedCDN",
    cooldown: 10
},

async (msg, Gifted, conText) => {
    const { reply, messageReply } = conText;

    if (!messageReply) {
        return await reply("Reply to a file, photo, video, or audio to upload it.");
    }

    let filePath = null;
    try {
        await Gifted.sendChatAction(conText.chatId, 'upload_document');

        const file = await downloadTgFile(Gifted, messageReply);
        if (!file) return await reply("Unsupported file type.");

        filePath = file.filePath;
        const buffer = fs.readFileSync(filePath);
        const result = await uploadToGiftedCdn(buffer, file.fileName);

        await reply(`📎 GiftedCDN Link:\n${result.url}`);
    } catch (error) {
        console.error('GiftedCDN upload error:', error.message);
        await reply("Upload failed. Try again later.");
    } finally {
        try { if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (e) {}
    }
});

gmd({
    pattern: "catbox",
    react: "🔥",
    category: "upload",
    description: "Upload file to Catbox",
    cooldown: 10
},

async (msg, Gifted, conText) => {
    const { reply, messageReply } = conText;

    if (!messageReply) {
        return await reply("Reply to a file, photo, video, or audio to upload it.");
    }

    let filePath = null;
    try {
        await Gifted.sendChatAction(conText.chatId, 'upload_document');

        const file = await downloadTgFile(Gifted, messageReply);
        if (!file) return await reply("Unsupported file type.");

        filePath = file.filePath;
        const buffer = fs.readFileSync(filePath);
        const result = await uploadToCatbox(buffer, file.fileName);

        await reply(`📎 Catbox Link:\n${result.url}`);
    } catch (error) {
        console.error('Catbox upload error:', error.message);
        await reply("Upload failed. Try again later.");
    } finally {
        try { if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (e) {}
    }
});

gmd({
    pattern: "githubcdn",
    aliases: ["ghcdn"],
    react: "🔥",
    category: "upload",
    description: "Upload file to GitHub CDN",
    cooldown: 10
},

async (msg, Gifted, conText) => {
    const { reply, messageReply } = conText;

    if (!messageReply) {
        return await reply("Reply to a file, photo, video, or audio to upload it.");
    }

    let filePath = null;
    try {
        await Gifted.sendChatAction(conText.chatId, 'upload_document');

        const file = await downloadTgFile(Gifted, messageReply);
        if (!file) return await reply("Unsupported file type.");

        filePath = file.filePath;
        const buffer = fs.readFileSync(filePath);
        const result = await uploadToGithubCdn(buffer, file.fileName);

        await reply(`📎 GitHub CDN Link:\n${result.url}`);
    } catch (error) {
        console.error('GitHub CDN upload error:', error.message);
        await reply("Upload failed. Try again later.");
    } finally {
        try { if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (e) {}
    }
});

gmd({
    pattern: "imgbb",
    react: "🔥",
    category: "upload",
    description: "Upload image to ImgBB",
    cooldown: 10
},

async (msg, Gifted, conText) => {
    const { reply, messageReply } = conText;

    if (!messageReply) {
        return await reply("Reply to an image to upload it.");
    }

    let filePath = null;
    try {
        await Gifted.sendChatAction(conText.chatId, 'upload_document');

        const file = await downloadTgFile(Gifted, messageReply);
        if (!file) return await reply("Unsupported file type.");

        if (!isImageFile(file.fileName)) {
            return await reply("ImgBB only supports image files (jpg, png, gif, webp, bmp).");
        }

        filePath = file.filePath;
        const buffer = fs.readFileSync(filePath);
        const result = await uploadToImgBB(buffer, file.fileName);

        await reply(`📎 ImgBB Link:\n${result.url}`);
    } catch (error) {
        console.error('ImgBB upload error:', error.message);
        await reply("Upload failed. Try again later.");
    } finally {
        try { if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (e) {}
    }
});

gmd({
    pattern: "pixhost",
    react: "🔥",
    category: "upload",
    description: "Upload image to Pixhost",
    cooldown: 10
},

async (msg, Gifted, conText) => {
    const { reply, messageReply } = conText;

    if (!messageReply) {
        return await reply("Reply to an image to upload it.");
    }

    let filePath = null;
    try {
        await Gifted.sendChatAction(conText.chatId, 'upload_document');

        const file = await downloadTgFile(Gifted, messageReply);
        if (!file) return await reply("Unsupported file type.");

        if (!isImageFile(file.fileName)) {
            return await reply("Pixhost only supports image files (jpg, png, gif, webp, bmp).");
        }

        filePath = file.filePath;
        const buffer = fs.readFileSync(filePath);
        const result = await uploadToPixhost(buffer, file.fileName);

        await reply(`📎 Pixhost Link:\n${result.url}`);
    } catch (error) {
        console.error('Pixhost upload error:', error.message);
        await reply("Upload failed. Try again later.");
    } finally {
        try { if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (e) {}
    }
});
