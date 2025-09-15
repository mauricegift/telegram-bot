require('../config');
const fs = require('fs');
const path = require('path');

class GiftedTechDB {
	giftedData = {}
	giftedFile = path.join(process.cwd(), 'gift', 'gifted-db.json');
	
	giftedRead = async () => {
		let giftedKenya;
		if (fs.existsSync(this.giftedFile)) {
			giftedKenya = JSON.parse(fs.readFileSync(this.giftedFile));
		} else {
			fs.writeFileSync(this.giftedFile, JSON.stringify(this.giftedData, null, 2));
			giftedKenya = this.giftedData;
		}
		return giftedKenya;
	}
	
	giftedWrite = async (gifteddevs) => {
		this.giftedData = !!gifteddevs ? gifteddevs : global.db;
		let mouricedevsDir = path.dirname(this.giftedFile);
		if (!fs.existsSync(mouricedevsDir)) fs.mkdirSync(mouricedevsDir, { recursive: true });
		fs.writeFileSync(this.giftedFile, JSON.stringify(this.giftedData, null, 2));
		return this.giftedFile;
	}
}

module.exports = { DataBase: GiftedTechDB };

