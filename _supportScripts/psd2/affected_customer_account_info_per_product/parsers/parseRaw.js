const fs = require('fs');

const dir = `${__dirname}/./raw`;
const files = fs.readdirSync(dir);
const parsedFiles = [];

const productIds = {
    'sage.live'             : '35e1bc00-7183-408f-b363-a3a8eaeb2162',
    'sage.one'              : 'ad3544e2-f959-42da-86c5-34e3a4db5a72',
    'sage.uki.50.accounts'    : '2ac2a370-6f73-4be4-b138-08eb9f2e7992',
    'sage.uki.200.accounts'   : 'a70e3079-a931-4a39-aa52-49afbce97005',
    'sage.es.50.accounts'     : '97f054f1-3660-4f6f-a3e2-4cfd603ede68',
    'sage.es.200.accounts'    : 'b2967e8f-a249-4ef8-aa6d-d23b56c4aff7'
};

//listing all files using forEach
files.forEach((file) => {
	const stat = fs.statSync(`${dir}/${file}`);
	if (stat.isFile() && file !== '.DS_Store') {
		console.log('INCLUDING', file);
	// Do whatever you want to do with the file
    	parsedFiles.push(require(`${dir}/${file}`));
	}
});


try {
	console.log('STARTED');
	const products = [];

	parsedFiles.forEach((parsed) => {
		let found;

		for(let i = 0; i < products.length; ++i) {
			if(products[i].name === parsed._id) {
				console.log('FOUND EXISTING PRODUCT ENTRY', parsed._id);
				found = products[i];
				break;
			}
		}

		if (!found) {
			found = {
				name: parsed._id,
				id: productIds[parsed._id],
				bankAccounts: []
			};
			products.push(found);
			console.log('CREATED NEW PRODUCT ENTRY', parsed._id);
		}

		found.bankAccounts.push(...parsed.bankAccounts);
		console.log('ADDED ACCOUNTS', parsed.bankAccounts.length);
	});
	
	fs.writeFileSync(`${__dirname}/./raw.json`, JSON.stringify({ products }));
	console.log('ENDED');
} catch (err) {
	console.log(err);
}