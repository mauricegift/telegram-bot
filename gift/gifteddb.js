require('../set');
const fs = require('fs');
const path = require('path');

class GiftedTechDB {
	giftedData = {}
	giftedFile = path.join(process.cwd(), 'gift', 'gifted-db.json');
	
	giftedRead = async () => {
		let coolshotData;
		if (fs.existsSync(this.giftedFile)) {
			coolshotData = JSON.parse(fs.readFileSync(this.giftedFile));
		} else {
			fs.writeFileSync(this.giftedFile, JSON.stringify(this.giftedData, null, 2));
			coolshotData = this.giftedData;
		}
		return coolshotData;
	}
	
	giftedWrite = async (gifteddevs) => {
		this.giftedData = !!gifteddevs ? gifteddevs : global.db;
		let coolshotDir = path.dirname(this.giftedFile);
		if (!fs.existsSync(coolshotDir)) fs.mkdirSync(coolshotDir, { recursive: true });
		fs.writeFileSync(this.giftedFile, JSON.stringify(this.giftedData, null, 2));
		return this.giftedFile;
	}
}

module.exports = { DataBase: GiftedTechDB };
