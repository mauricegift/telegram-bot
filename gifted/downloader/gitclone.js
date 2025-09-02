module.exports = {
    command: ['gitclone', 'gitdl', 'repodl', 'repoclone'],
    desc: 'Download repo github',
    category: ['downloader'],
    async run(m, { Gifted, text }) {
        if (!text) return Gifted.reply({ text: `Provide a public github repo link ie ${global.prefix}gitclone https://github.com/mauricegift/gifted-pair-code` }, m);
        if (!text.includes('https://github.com')) return Gifted.reply({ text: '🔗 Invalid GitHub URL. Please provide a valid GitHub repository link.' }, m);
        
        Gifted.reply({ text: giftechMess.wait }, m);
        
        let [, user, repo] = text.match(/(?:https|git)(?::\/\/|@)github\.com[\/:]([^\/:]+)\/(.+)/i) || [];
        
        if (!user || !repo) {
            return Gifted.reply({ text: '❌ Invalid GitHub URL format. Please check the repository link and try again.' }, m);
        }
        
        try {
            Gifted.downloadAndSend({ 
                document: `https://api.github.com/repos/${user}/${repo}/zipball`, 
                fileName: `${repo}.zip`, 
                caption: giftechMess.done 
            }, m);
        } catch (e) {
            console.error('Error in gitclone command:', e);
            // Provide helpful error message based on error type
            const errorMsg = e.code === 'ENOTFOUND' 
                ? '🌐 Network error: Unable to access GitHub. Please check your internet connection and try again.'
                : '📦 Repository download failed. Please check if the repository exists and is public.';
            return Gifted.reply({ text: errorMsg }, m);
        }
    }
};
