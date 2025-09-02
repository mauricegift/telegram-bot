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
                return Gifted.reply({ text: '❌ App not found or temporarily unavailable. Please check the app name and try again.' }, m);
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
            console.error('Error in apk download command:', e);
            // Provide helpful error message based on error type
            const errorMsg = e.code === 'ENOTFOUND' 
                ? '🌐 Network error: Unable to search for apps. Please check your internet connection and try again.'
                : '📱 App download service temporarily unavailable. Please try again in a few minutes.';
            return Gifted.reply({ text: errorMsg }, m);
        }
    }
};
