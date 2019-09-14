const fs = require('fs');
const raw = require('./raw');

const keys = [
	"organisationId",
	"adminEmail",
	"crmId",
	"companyName",
	"companyId",
	"bankId",
	"bankName",
	"aggregatorId",
	"aggregatorName",
	"bankAccountId",
	"accountType",
	"status",
	"dataProvider",
	"transactionCount",
	"unresolvedCount",
	"accountantManaged",
	"deleted",
	"lastTransactionsReceived",
    "lastUpdatedByProvider",
    "lastTransactionsGet"
];

try {
	console.log('STARTED');

	raw.products.forEach((product) => {
		console.log(`STARTING WRITING PRODUCT ${product.name}`);
		let final = `${keys.join(',')}\n`;
		console.log('FINAL', final)
		product.bankAccounts.forEach((bankAccount) => {
			if (bankAccount.status !== 'cancelled') {
				const values = [];
				keys.forEach((key) => {
					const escaped = (key === 'companyName') ? `"${bankAccount[key]}"` : bankAccount[key];
					values.push(escaped)
				});
				final += `${values.join(',')}\n`	
			}
		});

		fs.writeFileSync(`${__dirname}/./${product.name.replace(/ /, '_')}.csv`, final);
		console.log(`FINISHED WRITING PRODUCT ${product.name}`);
	});

	console.log('ENDED');
} catch (err) {
	console.log(err);
}