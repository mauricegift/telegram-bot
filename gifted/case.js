const { fetchJson, clockString, pickRandom, runtime, formatp, executeCommand } = require('../gift');

module.exports = {
    async handleCases(m, { Gifted, text, command }) {
        try {
            switch (command) {
                    
                // case 1 ——————————————
   
                case 'thxto': {
                    let cap = `Special thanks to @mouricedevs, my developer. This project is just Amazing!`
                    Gifted.reply({ text: cap }, m)
                }
                break;
                
                // case 2 ——————————————
        
                case 'rate': {
                    let rate = Math.floor(Math.random() * 100)
            		Gifted.reply({ text: `Bot Rate : *${rate}%*`, parse_mode: 'Markdown' }, m)
                }
                break;

                // case 3 ——————————————
                
                case 'web': {
            		Gifted.reply({ text: 'Visit the Owner Website: Coming Soon! Join our WhatsApp channel: https://whatsapp.com/channel/0029VbAlmwn8V0tmhrtxSH0x' }, m)
                }
                break;
            }
        } catch (err) {
            console.log(err)
    	    Gifted.reply({ text: `${err}`, parse_mode: 'Markdown' }, m)
    	}
    }
}
