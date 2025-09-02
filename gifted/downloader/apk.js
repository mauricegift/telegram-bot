module.exports = {
    command: ['apk', 'apkdl', 'app'],
    desc: 'Download Android Apps',
    category: ['downloader'],
    async run(m, { Gifted, text, GiftedApkDl }) {

        if (!text) return Gifted.reply({ text: `Provide an App Name ie ${global.prefix}apk Facebook Lite` }, m);
        Gifted.reply({ text: giftechMess.wait }, m);

        try {
            const giftedAppData = await GiftedApkDl(text);
            if (!giftedAppData || !giftedAppData.link || !giftedAppData.appname) {
                return Gifted.reply({ text: 'Failed to fetch app data.' }, m);
            }

            let giftedButtons = [
                [
                    { text: 'App Link', url: `${giftedAppData.link}` },
                    { text: 'WaChannel', url: global.giftedWaChannel }
                ]
            ];

            Gifted.downloadAndSend({
                document: `${giftedAppData.link}`,
                fileName: `${giftedAppData.appname}`,
                mimetype: "application/vnd.android.package-archive",
                caption: giftechMess.done
            }, giftedButtons, m);
        } catch (e) {
            console.error('Error:', e); 
            Gifted.reply({ text: giftechMess.error }, m);
        }
    }
};
