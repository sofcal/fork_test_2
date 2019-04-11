# PBI 294360 - Banking Cloud: MI post behind auth service

 [Stack Overflow - combine collections](https://stackoverflow.com/questions/5681851/mongodb-combine-data-from-multiple-collections-into-one-how)

 ## Loading test data into localhost

Note - this will clear down the localhost database before loading the test data.
Make sure MongoDB is running first

```bash
 mongo localhost/bank_db data/load-local.js
```

 ## Runnning test pipeplines, writing output to result folder :

```bash
 mongo localhost/bank_db --quiet pipelines/organisationsCompaniesBankAccounts.js > result/organisationsCompaniesBankAccounts.json
 mongo localhost/bank_db --quiet pipelines/organisationsCompaniesBankAccounts_orig.js > result/organisationsCompaniesBankAccounts_orig.json
 mongo localhost/bank_db --quiet pipelines/orphanedBankAccounts.js > result/orphanedBankAccounts.json
 mongo localhost/bank_db --quiet pipelines/orphanedBankAccounts_orig.js > result/orphanedBankAccounts_orig.json
```

## Running pbi_294360 integration test

First remove .skip from manual/pbi_294360/index.spec.js to make sure it runs.
Start local mongodb session.
Load test data (see above).
Run manualtest script:

```bash
npm run manualtest
```

which will run the following script:
```json
{
  "manualtest": "NODE_ENV=test AWS_REGION=eu-west-1 NODE_ENV=test Environment='dev' localhost=true bucket='eu-west-1-logs' mocha -b --colors --reporter spec \"./test/manual/**/*.spec.js\"",
}
```
