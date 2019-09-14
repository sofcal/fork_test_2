const fs = require('fs');
const sageLiveOrgs = require('./raw/sage-live-raw/sage.live.orgs');
const sageLiveAccounts = require('./raw/sage-live-raw/sage.live.accounts');

try {
	console.log('STARTED');

	const available = [];
	const missing = [];

	sageLiveOrgs.bankAccounts.forEach((orgLevel) => {
		let found = false;
		sageLiveAccounts.bankAccounts.forEach((accountLevel) => {
			if (accountLevel._id === orgLevel.bankAccountId) {
				available.push(Object.assign({}, orgLevel, accountLevel, { _id: orgLevel._id }));
				found = true;
			}
		})

		if (!found) {
			missing.push(Object.assign({}, orgLevel));
		}
	});

	console.log(`FOUND ${available.length} ACCOUNTS`);
	console.log(`MISSING ${missing.length} ACCOUNTS`);

	fs.writeFileSync(`${__dirname}/./raw/sage.live.json`, JSON.stringify({ _id: 'sage.live', bankAccounts: available }));
	fs.writeFileSync(`${__dirname}/./raw/sage.live.why.json`, JSON.stringify({ _id: 'sage.live', bankAccounts: missing }));

	console.log('ENDED');
} catch (err) {
	console.log(err);
}