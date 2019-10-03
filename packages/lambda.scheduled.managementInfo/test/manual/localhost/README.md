# PBI 294360 - Banking Cloud: MI post behind auth service

 ## Loading test data into localhost

Note - this will clear down the localhost database before loading the test data.
Make sure MongoDB is running first

```bash
 mongo localhost/bank_db data/load-local.js
```

 ## Runnning test pipeplines, writing output to result folder :

 Use to run manual tests of aggregator pipelines against local database.

```bash
 mongo localhost/bank_db --quiet pipelines/organisationsCompaniesBankAccounts.js > result/organisationsCompaniesBankAccounts.json
 mongo localhost/bank_db --quiet pipelines/organisationsCompaniesBankAccounts_orig.js > result/organisationsCompaniesBankAccounts_orig.json
 mongo localhost/bank_db --quiet pipelines/orphanedBankAccounts.js > result/orphanedBankAccounts.json
 mongo localhost/bank_db --quiet pipelines/orphanedBankAccounts_orig.js > result/orphanedBankAccounts_orig.json
```

## Running localhost integration test

First remove .skip from manual/localhost/index.spec.js to make sure it runs.
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

This is set up to write reports to /test/manual/localhost/result/ folder.
Note concatenated report will show orphaned accounts twice, this is because the processing repeats for eu-west-1 and us-east-1 regions, which is loading the local test file twice.
