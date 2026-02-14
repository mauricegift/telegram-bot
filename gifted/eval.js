const { gmd } = require('../gift');
const { formatCodeHtml, sendAsFile, execAsync, fs, path, util } = require('../gift/gmdHelpers');

gmd({
    pattern: "eval",
    aliases: ["e", "run"],
    react: "👾",
    category: "owner",
    description: "Execute JavaScript code",
    owneronly: true,
    cooldown: 3
},

async (msg, Gifted, conText) => {
    const { reply, q } = conText;

    if (!q) {
        return await reply("Please provide code to evaluate.\nExample: /eval conText.pushName");
    }

    try {
        await Gifted.sendChatAction(conText.chatId, 'typing');

        const evalContext = {
            pushName: conText.pushName,
            sender: conText.sender,
            owner: conText.owner,
            isSuperUser: conText.isSuperUser,
            isAdmin: conText.isAdmin,
            isGroup: conText.isGroup,
            isChannel: conText.isChannel,
            isPrivate: conText.isPrivate,
            userId: conText.userId,
            chatId: conText.chatId,
            q: conText.q,
            args: conText.args,
            messageReply: conText.messageReply,
            botName: conText.botName,
            prefix: conText.prefix,
            ownerName: conText.ownerName,
            timezone: conText.timezone,
            sourceUrl: conText.sourceUrl,
            reply: conText.reply,
            sendMessage: conText.sendMessage,
            react: conText.react,
            Gifted: Gifted,
            conText: conText,
            msg: msg,
            require: require,
            process: process,
            axios: require('axios'),
            fs: fs,
            path: path,
            config: require('../config'),
            util: util
        };

        let code = q.trim();
        const isExpression = !code.includes(';') && !code.includes('return') && !code.includes('{');

        if (isExpression) {
            code = `return ${code}`;
        }

        const fn = new Function(...Object.keys(evalContext), code);
        const result = await fn(...Object.values(evalContext));

        let output;
        if (result === undefined || result === null) {
            output = "Executed successfully (no return value)";
        } else if (typeof result === 'object') {
            output = util.inspect(result, { depth: 3, colors: false });
        } else {
            output = result.toString();
        }

        if (output.length > 4000) {
            await sendAsFile(Gifted, conText.chatId, msg.message_id, output, 'eval');
        } else {
            await Gifted.sendMessage(conText.chatId, formatCodeHtml(output), {
                reply_to_message_id: msg.message_id,
                parse_mode: 'HTML'
            });
        }

    } catch (error) {
        const errMsg = error.message || String(error);
        if (errMsg.length > 4000) {
            await sendAsFile(Gifted, conText.chatId, msg.message_id, errMsg, 'eval_error');
        } else {
            await reply(`Error: ${errMsg}`);
        }
    }
});

gmd({
    pattern: "shell",
    aliases: ["exec", "terminal", "sh"],
    react: "👨‍💻",
    category: "owner",
    description: "Execute shell commands",
    owneronly: true,
    cooldown: 5
},

async (msg, Gifted, conText) => {
    const { reply, q } = conText;

    if (!q) {
        return await reply("Please provide a shell command.\nExample: /shell ls -la");
    }

    try {
        await Gifted.sendChatAction(conText.chatId, 'typing');

        const { stdout, stderr } = await execAsync(q, {
            timeout: 30000,
            maxBuffer: 10 * 1024 * 1024
        });

        let output = '';

        if (stderr) {
            output += `stderr:\n${stderr}\n\n`;
        }

        if (stdout) {
            output += stdout;
        } else if (!stderr) {
            output = 'Command executed successfully (no output)';
        }

        if (output.length > 4000) {
            await sendAsFile(Gifted, conText.chatId, msg.message_id, output, 'shell');
        } else {
            await Gifted.sendMessage(conText.chatId, formatCodeHtml(output), {
                reply_to_message_id: msg.message_id,
                parse_mode: 'HTML'
            });
        }

    } catch (error) {
        let errorMessage = error.message;

        if (error.killed) {
            errorMessage = 'Command was killed (timeout or manual termination)';
        } else if (error.code === 'ENOENT') {
            errorMessage = 'Command not found';
        } else if (error.signal === 'SIGTERM') {
            errorMessage = 'Command timed out';
        }

        if (error.stdout && error.stdout.length > 0) {
            const combined = `stdout:\n${error.stdout}\n\nstderr:\n${error.stderr || errorMessage}`;
            if (combined.length > 4000) {
                await sendAsFile(Gifted, conText.chatId, msg.message_id, combined, 'shell_error');
            } else {
                await reply(combined);
            }
        } else {
            await reply(`Error: ${errorMessage}`);
        }
    }
});
