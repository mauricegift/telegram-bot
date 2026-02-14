const fs = require('fs');
const path = require('path');
const axios = require('axios');
const util = require('util');
const { exec } = require('child_process');
const { Readable } = require('stream');
const FormData = require('form-data');
const execAsync = util.promisify(exec);

const tempDir = path.resolve(__dirname, '..', 'temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function detectLang(content) {
    if (/^\s*[\{\[]/.test(content) && /[\}\]]$/.test(content.trim())) {
        try { JSON.parse(content); return { lang: 'json', ext: '.json', mime: 'application/json' }; } catch (e) {}
    }
    if (/<\s*html[\s>]|<!DOCTYPE html>/i.test(content)) return { lang: 'html', ext: '.html', mime: 'text/html' };
    if (/^\s*<\?xml\s+version/m.test(content)) return { lang: 'xml', ext: '.xml', mime: 'text/xml' };
    if (/function\s*\w*\s*\(|const\s+\w+\s*=|let\s+\w+\s*=|require\s*\(|module\.exports/i.test(content)) return { lang: 'javascript', ext: '.js', mime: 'application/javascript' };
    if (/^\s*(def|class)\s+\w+|^\s*import\s+\w+|^\s*from\s+\w+\s+import|^\s*print\(/m.test(content)) return { lang: 'python', ext: '.py', mime: 'text/x-python' };
    if (/^\s*package\s+\w+|^\s*public\s+class\s+\w+/m.test(content)) return { lang: 'java', ext: '.java', mime: 'text/x-java' };
    if (/<\?php|\$[a-zA-Z_]+\s*=/m.test(content)) return { lang: 'php', ext: '.php', mime: 'application/x-httpd-php' };
    if (/^\s*#include\s+<|^\s*int\s+main\s*\(/m.test(content)) return { lang: 'cpp', ext: '.cpp', mime: 'text/x-c++src' };
    if (/^\s*func\s+\w+|^\s*package\s+main/m.test(content)) return { lang: 'go', ext: '.go', mime: 'text/x-go' };
    if (/^\s*fn\s+\w+|^\s*let\s+mut\s+/m.test(content)) return { lang: 'rust', ext: '.rs', mime: 'text/x-rust' };
    if (/^\s*\w+\s*{[\s\S]*?:\s*[\w#]/m.test(content) && /;\s*$/m.test(content)) return { lang: 'css', ext: '.css', mime: 'text/css' };
    return { lang: '', ext: '.txt', mime: 'text/plain' };
}

function formatCodeHtml(content) {
    const detected = detectLang(content);
    const escaped = escapeHtml(content);
    if (detected.lang) {
        return `<pre><code class="language-${detected.lang}">${escaped}</code></pre>`;
    }
    return `<pre>${escaped}</pre>`;
}

async function sendAsFile(Gifted, chatId, msgId, content, prefix) {
    const detected = detectLang(content);
    const filePath = path.resolve(tempDir, `output_${Date.now()}${detected.ext}`);
    try {
        fs.writeFileSync(filePath, content);
        const stream = fs.createReadStream(filePath);
        await Gifted.sendDocument(chatId, stream, {
            reply_to_message_id: msgId,
            caption: `📤 Output sent as file (${content.length} chars)`
        }, {
            filename: `${prefix}_output${detected.ext}`,
            contentType: detected.mime
        });
    } finally {
        try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (e) {}
    }
}

function formatViews(views) {
    if (!views && views !== 0) return 'N/A';
    return Number(views).toLocaleString('en-US');
}

function formatDuration(duration) {
    if (!duration) return 'N/A';
    if (typeof duration === 'string' && duration.includes(':')) return duration;
    const totalSeconds = typeof duration === 'object' && duration.seconds !== undefined
        ? (duration.hours || 0) * 3600 + (duration.minutes || 0) * 60 + (duration.seconds || 0)
        : Number(duration);
    if (isNaN(totalSeconds)) return String(duration);
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    return `${mins}:${String(secs).padStart(2, '0')}`;
}

function cleanupFile(filePath) {
    try {
        if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (e) {}
}

async function downloadToFile(downloadUrl, fileType) {
    const extension = fileType === 'audio' ? '.mp3' : '.mp4';
    const filePath = path.resolve(tempDir, `dl_${Date.now()}${extension}`);

    console.log(`Downloading ${fileType} from: ${downloadUrl}`);

    const response = await axios({
        url: downloadUrl,
        method: 'GET',
        responseType: 'stream',
        timeout: 900000,
        maxContentLength: 2 * 1024 * 1024 * 1024,
        maxBodyLength: 2 * 1024 * 1024 * 1024
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', (err) => { cleanupFile(filePath); reject(err); });
        response.data.on('error', (err) => { cleanupFile(filePath); reject(err); });
    });

    const stat = fs.statSync(filePath);
    if (stat.size === 0) {
        cleanupFile(filePath);
        throw new Error('Downloaded file is empty');
    }

    const sizeMB = (stat.size / (1024 * 1024)).toFixed(1);
    console.log(`Downloaded ${sizeMB} MB`);
    return filePath;
}

async function tryDownloadWithFallback(apis, videoUrl, fileType) {
    for (let i = 0; i < apis.length; i++) {
        const apiUrl = apis[i](videoUrl);
        try {
            console.log(`Trying API ${i + 1}/${apis.length}`);
            const response = await axios.get(apiUrl, { timeout: 30000 });
            const data = response.data;

            if (!data.success || !data.result || !data.result.download_url) {
                console.log(`API ${i + 1} returned no download_url, trying next...`);
                continue;
            }

            console.log(`API ${i + 1} succeeded, downloading file...`);
            try {
                const filePath = await downloadToFile(data.result.download_url, fileType);
                return { filePath, data };
            } catch (dlErr) {
                console.log(`API ${i + 1} download failed: ${dlErr.message}, trying next...`);
                continue;
            }
        } catch (err) {
            console.log(`API ${i + 1} failed: ${err.message}, trying next...`);
        }
    }
    return null;
}

const AUDIO_APIS = [
    (url) => `https://api.giftedtech.co.ke/api/download/yta?apikey=gifted&url=${encodeURIComponent(url)}`,
    (url) => `https://api.giftedtech.co.ke/api/download/ytmp3?apikey=gifted&url=${encodeURIComponent(url)}`,
    (url) => `https://api.giftedtech.co.ke/api/download/savetubemp3?apikey=gifted&url=${encodeURIComponent(url)}`,
    (url) => `https://api.giftedtech.co.ke/api/download/dlmp3?apikey=gifted&url=${encodeURIComponent(url)}`,
    (url) => `https://api.giftedtech.co.ke/api/download/savemp3?apikey=gifted&url=${encodeURIComponent(url)}`
];

const VIDEO_APIS = [
    (url) => `https://api.giftedtech.co.ke/api/download/ytv?apikey=gifted&url=${encodeURIComponent(url)}`,
    (url) => `https://api.giftedtech.co.ke/api/download/ytmp4?apikey=gifted&quality=720p&url=${encodeURIComponent(url)}`,
    (url) => `https://api.giftedtech.co.ke/api/download/savetubemp4?apikey=gifted&url=${encodeURIComponent(url)}`,
    (url) => `https://api.giftedtech.co.ke/api/download/dlmp4?apikey=gifted&url=${encodeURIComponent(url)}`,
    (url) => `https://api.giftedtech.co.ke/api/download/savemp4?apikey=gifted&quality=720&url=${encodeURIComponent(url)}`
];

function bufferToStream(buffer) {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
}

function getFileContentType(ext) {
    const types = {
        '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
        '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.bmp': 'image/bmp',
        '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.avi': 'video/x-msvideo',
        '.mkv': 'video/x-matroska', '.webm': 'video/webm', '.flv': 'video/x-flv',
        '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg',
        '.m4a': 'audio/mp4', '.flac': 'audio/flac',
        '.pdf': 'application/pdf', '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.ppt': 'application/vnd.ms-powerpoint',
        '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        '.txt': 'text/plain', '.csv': 'text/csv',
        '.zip': 'application/zip', '.rar': 'application/x-rar-compressed',
        '.7z': 'application/x-7z-compressed', '.tar': 'application/x-tar', '.gz': 'application/gzip',
        '.js': 'application/javascript', '.json': 'application/json',
        '.html': 'text/html', '.css': 'text/css', '.php': 'application/x-httpd-php',
        '.py': 'text/x-python', '.java': 'text/x-java-source',
        '.c': 'text/x-csrc', '.cpp': 'text/x-c++src', '.h': 'text/x-chdr',
        '.vcf': 'text/vcard', '.md': 'text/markdown', '.xml': 'application/xml',
        '.exe': 'application/x-msdownload', '.apk': 'application/vnd.android.package-archive',
        '.iso': 'application/x-iso9660-image', '': 'application/octet-stream'
    };
    return types[ext.toLowerCase()] || 'application/octet-stream';
}

async function uploadToCatbox(buffer, filename) {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('userhash', 'ae78e7174c674f133a271261b');
    form.append('fileToUpload', buffer, {
        filename: filename,
        contentType: getFileContentType(path.extname(filename)),
        knownLength: buffer.length
    });

    const { data } = await axios.post('https://catbox.moe/user/api.php', form, {
        headers: form.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity
    });

    return { url: data.trim() };
}

async function uploadToGithubCdn(buffer, filename) {
    const form = new FormData();
    form.append('file', buffer, {
        filename: filename,
        contentType: getFileContentType(path.extname(filename)),
        knownLength: buffer.length
    });

    const { data } = await axios.post('https://ghbcdn.giftedtech.co.ke/api/upload.php', form, {
        headers: form.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity
    });

    return { url: data.rawUrl || data };
}

async function uploadToGiftedCdn(buffer, filename, deleteKey = '') {
    const form = new FormData();
    form.append('file', buffer, {
        filename: filename,
        contentType: getFileContentType(path.extname(filename)),
        knownLength: buffer.length
    });
    if (deleteKey) {
        form.append('deleteKey', deleteKey);
    }

    const { data } = await axios.post('https://cdn.giftedtech.co.ke/api/upload.php', form, {
        headers: form.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity
    });

    return { url: data.url || data };
}

async function uploadToPixhost(buffer, filename) {
    const { fileTypeFromBuffer } = await import('file-type');
    const type = await fileTypeFromBuffer(buffer);
    const ext = type?.ext || path.extname(filename).replace('.', '');

    const form = new FormData();
    form.append('img', buffer, {
        filename: `image.${ext}`,
        contentType: type?.mime || getFileContentType(`.${ext}`),
        knownLength: buffer.length
    });
    form.append('content_type', '0');

    const { data } = await axios.post('https://api.pixhost.to/images', form, {
        headers: {
            ...form.getHeaders(),
            'Accept': 'application/json'
        }
    });
    const { data: html } = await axios.get(data.show_url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    });

    const regex = html.match(/id="image"[^>]*class="image-img"[^>]*src="([^"]*)"/);
    if (!regex || !regex[1]) {
        throw new Error("Failed to get image URL from Pixhost");
    }

    return { url: regex[1] };
}

async function uploadToImgBB(buffer, filename) {
    const form = new FormData();
    form.append('image', buffer, {
        filename: filename,
        contentType: getFileContentType(path.extname(filename)),
        knownLength: buffer.length
    });

    const { data } = await axios.post(
        'https://api.imgbb.com/1/upload?key=bbc0c59714520ebcd0af58caf995bd08',
        form,
        { headers: form.getHeaders() }
    );

    return { url: data.data.url };
}

function monospace(input) {
    const boldz = {
        'A': '𝙰', 'B': '𝙱', 'C': '𝙲', 'D': '𝙳', 'E': '𝙴', 'F': '𝙵', 'G': '𝙶',
        'H': '𝙷', 'I': '𝙸', 'J': '𝙹', 'K': '𝙺', 'L': '𝙻', 'M': '𝙼', 'N': '𝙽',
        'O': '𝙾', 'P': '𝙿', 'Q': '𝚀', 'R': '𝚁', 'S': '𝚂', 'T': '𝚃', 'U': '𝚄',
        'V': '𝚅', 'W': '𝚆', 'X': '𝚇', 'Y': '𝚈', 'Z': '𝚉',
        '0': '𝟎', '1': '𝟏', '2': '𝟐', '3': '𝟑', '4': '𝟒', '5': '𝟓', '6': '𝟔',
        '7': '𝟕', '8': '𝟖', '9': '𝟗',
        ' ': ' '
    };
    return String(input).split('').map(char => boldz[char.toUpperCase()] || char).join('');
}

function formatBytes(bytes) {
    if (bytes >= Math.pow(1024, 3)) {
        return (bytes / Math.pow(1024, 3)).toFixed(2) + ' GB';
    } else if (bytes >= Math.pow(1024, 2)) {
        return (bytes / Math.pow(1024, 2)).toFixed(2) + ' MB';
    } else if (bytes >= 1024) {
        return (bytes / 1024).toFixed(2) + ' KB';
    } else {
        return bytes.toFixed(2) + ' bytes';
    }
}

const readmore = String.fromCharCode(8206).repeat(4001);

const gmdBuffer = async (url, options = {}) => {
    try {
        const res = await axios({
            method: "GET",
            url,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.70 Safari/537.36",
                'DNT': 1,
                'Upgrade-Insecure-Request': 1
            },
            ...options,
            responseType: 'arraybuffer',
            timeout: 2400000
        });
        if (!res.data || res.data.length === 0) {
            throw new Error("Empty response data");
        }
        return res.data;
    } catch (err) {
        console.error("gmdBuffer Error:", err);
        return err;
    }
};

const gmdJson = async (url, options = {}) => {
    try {
        const res = await axios({
            method: 'GET',
            url: url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36',
                'Accept': 'application/json'
            },
            ...options,
            timeout: 2400000
        });
        if (!res.data) {
            throw new Error("Empty response data");
        }
        return res.data;
    } catch (err) {
        console.error("gmdJson Error:", err);
        return err;
    }
};

async function getFileSize(url) {
    try {
        const response = await axios.head(url, { timeout: 10000 });
        const contentLength = response.headers['content-length'];
        return contentLength ? parseInt(contentLength) : 0;
    } catch {
        return 0;
    }
}

function getMimeCategory(mimetype) {
    if (!mimetype) return 'document';
    if (mimetype.startsWith('audio/')) return 'audio';
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype.startsWith('image/')) return 'image';
    return 'document';
}

function getMimeFromUrl(url) {
    const ext = url.split('?')[0].split('.').pop().toLowerCase();
    const mimeMap = {
        'mp3': 'audio/mpeg', 'mp4': 'video/mp4', 'webm': 'video/webm',
        'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
        'gif': 'image/gif', 'pdf': 'application/pdf', 'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'ppt': 'application/vnd.ms-powerpoint',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'zip': 'application/zip', 'rar': 'application/x-rar-compressed'
    };
    return mimeMap[ext] || 'application/octet-stream';
}

const MIME_EXTENSIONS = {
    'application/json': '.json', 'text/html': '.html', 'text/css': '.css',
    'text/javascript': '.js', 'application/javascript': '.js', 'text/plain': '.txt',
    'text/xml': '.xml', 'application/xml': '.xml', 'text/csv': '.csv',
    'text/markdown': '.md', 'application/pdf': '.pdf', 'application/zip': '.zip',
    'application/x-rar-compressed': '.rar', 'application/x-7z-compressed': '.7z',
    'application/gzip': '.gz', 'application/x-tar': '.tar',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.ms-powerpoint': '.ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
    'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif',
    'image/webp': '.webp', 'image/svg+xml': '.svg', 'image/bmp': '.bmp',
    'image/tiff': '.tiff', 'image/x-icon': '.ico',
    'audio/mpeg': '.mp3', 'audio/wav': '.wav', 'audio/ogg': '.ogg',
    'audio/flac': '.flac', 'audio/aac': '.aac', 'audio/m4a': '.m4a', 'audio/webm': '.weba',
    'video/mp4': '.mp4', 'video/webm': '.webm', 'video/ogg': '.ogv',
    'video/avi': '.avi', 'video/x-msvideo': '.avi', 'video/quicktime': '.mov',
    'video/x-matroska': '.mkv', 'video/3gpp': '.3gp',
    'application/octet-stream': '.bin', 'application/x-executable': '.exe',
    'application/x-sh': '.sh', 'application/x-python': '.py', 'text/x-python': '.py',
    'application/x-httpd-php': '.php', 'text/x-java-source': '.java',
    'text/x-c': '.c', 'text/x-c++': '.cpp', 'application/typescript': '.ts',
    'text/typescript': '.ts', 'application/wasm': '.wasm',
    'font/woff': '.woff', 'font/woff2': '.woff2', 'font/ttf': '.ttf', 'font/otf': '.otf',
    'application/vnd.android.package-archive': '.apk',
    'application/x-apple-diskimage': '.dmg', 'application/x-debian-package': '.deb',
    'application/x-rpm': '.rpm', 'application/sql': '.sql',
    'application/x-sqlite3': '.db', 'application/yaml': '.yaml',
    'text/yaml': '.yaml', 'application/toml': '.toml'
};

function getExtensionFromMime(contentType) {
    const baseMime = contentType.split(';')[0].trim().toLowerCase();
    if (MIME_EXTENSIONS[baseMime]) return MIME_EXTENSIONS[baseMime];
    for (const [mime, ext] of Object.entries(MIME_EXTENSIONS)) {
        if (baseMime.includes(mime.split('/')[1])) return ext;
    }
    if (baseMime.startsWith('text/')) return '.txt';
    if (baseMime.startsWith('image/')) return '.bin';
    if (baseMime.startsWith('audio/')) return '.bin';
    if (baseMime.startsWith('video/')) return '.bin';
    return '.bin';
}

function isTextContent(contentType) {
    const textTypes = [
        'text/', 'application/json', 'application/javascript', 'application/xml',
        'application/sql', 'application/yaml', 'application/toml', '+json', '+xml'
    ];
    return textTypes.some(t => contentType.includes(t));
}

async function downloadTgFile(bot, messageReply) {
    const config = require('../config');
    let fileId, fileName;

    if (messageReply.photo) {
        fileId = messageReply.photo[messageReply.photo.length - 1].file_id;
        fileName = `photo_${Date.now()}.jpg`;
    } else if (messageReply.document) {
        fileId = messageReply.document.file_id;
        fileName = messageReply.document.file_name || `file_${Date.now()}`;
    } else if (messageReply.video) {
        fileId = messageReply.video.file_id;
        fileName = messageReply.video.file_name || `video_${Date.now()}.mp4`;
    } else if (messageReply.audio) {
        fileId = messageReply.audio.file_id;
        fileName = messageReply.audio.file_name || `audio_${Date.now()}.mp3`;
    } else if (messageReply.voice) {
        fileId = messageReply.voice.file_id;
        fileName = `voice_${Date.now()}.ogg`;
    } else if (messageReply.sticker) {
        fileId = messageReply.sticker.file_id;
        fileName = messageReply.sticker.is_animated ? `sticker_${Date.now()}.tgs`
            : messageReply.sticker.is_video ? `sticker_${Date.now()}.webm`
            : `sticker_${Date.now()}.webp`;
    } else if (messageReply.video_note) {
        fileId = messageReply.video_note.file_id;
        fileName = `videonote_${Date.now()}.mp4`;
    } else if (messageReply.animation) {
        fileId = messageReply.animation.file_id;
        fileName = messageReply.animation.file_name || `animation_${Date.now()}.mp4`;
    } else if (messageReply.contact) {
        const vcard = messageReply.contact.vcard || '';
        const name = messageReply.contact.first_name || 'contact';
        const content = vcard || `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL:${messageReply.contact.phone_number}\nEND:VCARD`;
        const savePath = path.join(tempDir, `${Date.now()}_${name}.vcf`);
        fs.writeFileSync(savePath, content);
        return { filePath: savePath, fileName: `${name}.vcf` };
    } else if (messageReply.location) {
        const loc = messageReply.location;
        const content = `Latitude: ${loc.latitude}\nLongitude: ${loc.longitude}`;
        const savePath = path.join(tempDir, `${Date.now()}_location.txt`);
        fs.writeFileSync(savePath, content);
        return { filePath: savePath, fileName: `location_${Date.now()}.txt` };
    } else if (messageReply.poll) {
        const poll = messageReply.poll;
        let content = `Poll: ${poll.question}\nType: ${poll.type}\n\nOptions:\n`;
        poll.options.forEach((opt, i) => { content += `${i + 1}. ${opt.text}\n`; });
        const savePath = path.join(tempDir, `${Date.now()}_poll.txt`);
        fs.writeFileSync(savePath, content);
        return { filePath: savePath, fileName: `poll_${Date.now()}.txt` };
    } else if (messageReply.dice) {
        const content = `Dice: ${messageReply.dice.emoji}\nValue: ${messageReply.dice.value}`;
        const savePath = path.join(tempDir, `${Date.now()}_dice.txt`);
        fs.writeFileSync(savePath, content);
        return { filePath: savePath, fileName: `dice_${Date.now()}.txt` };
    } else if (messageReply.text) {
        const savePath = path.join(tempDir, `${Date.now()}_text.txt`);
        fs.writeFileSync(savePath, messageReply.text);
        return { filePath: savePath, fileName: `text_${Date.now()}.txt` };
    }

    if (!fileId) return null;

    const officialApi = "https://api.telegram.org";
    const fileInfo = await axios.get(`${officialApi}/bot${config.token}/getFile?file_id=${fileId}`);
    const filePath = fileInfo.data.result.file_path;
    const fileUrl = `${officialApi}/file/bot${config.token}/${filePath}`;

    const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);

    const savePath = path.join(tempDir, `${Date.now()}_${fileName}`);
    fs.writeFileSync(savePath, buffer);

    return { filePath: savePath, fileName };
}

function isImageFile(fileName) {
    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    return imageExts.includes(path.extname(fileName).toLowerCase());
}

module.exports = {
    tempDir,
    escapeHtml,
    detectLang,
    formatCodeHtml,
    sendAsFile,
    formatViews,
    formatDuration,
    cleanupFile,
    downloadToFile,
    tryDownloadWithFallback,
    AUDIO_APIS,
    VIDEO_APIS,
    bufferToStream,
    getFileContentType,
    uploadToCatbox,
    uploadToGithubCdn,
    uploadToGiftedCdn,
    uploadToPixhost,
    uploadToImgBB,
    downloadTgFile,
    isImageFile,
    monospace,
    formatBytes,
    readmore,
    gmdBuffer,
    gmdJson,
    getFileSize,
    getMimeCategory,
    getMimeFromUrl,
    MIME_EXTENSIONS,
    getExtensionFromMime,
    isTextContent,
    execAsync,
    fs,
    path,
    util,
    axios
};
