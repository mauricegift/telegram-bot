module.exports = {
    command: ['gitclone', 'gitdl', 'repodl', 'repoclone'],
    desc: 'Download repo github',
    category: ['downloader'],
    async run(m, { Gifted, text }) {
        if (!text) return Gifted.reply({ text: `Provide a public github repo link ie ${global.prefix}gitclone https://github.com/mauricegift/gifted-pair-code` }, m)
		if (!text.includes('https://github.com')) return Gifted.reply({ text: 'Invalid url-!' }, m)
            Gifted.reply({ text: giftechMess.wait }, m)
		let [, user, repo] = text.match(/(?:https|git)(?::\/\/|@)github\.com[\/:]([^\/:]+)\/(.+)/i) || []
		try {
			Gifted.downloadAndSend({ document: `https://api.github.com/repos/${user}/${repo}/zipball`, fileName: `${repo}.zip`, caption: giftechMess.done }, m)
		} catch (e) {
			Gifted.reply({ text: giftechMess.error }, m)
		}
    }
}
