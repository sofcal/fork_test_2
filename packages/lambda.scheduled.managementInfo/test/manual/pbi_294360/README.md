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

Run int294360 script:

```bash
npm run int294360
```

which will run the following script:
```json
{
  "int294360": "NODE_ENV=test AWS_REGION=eu-west-1 NODE_ENV=test Environment='dev' localhost=true bucket='eu-west-1-logs' mocha -b --colors --reporter spec \"./test/manual/pbi_294360/*.spec.js\"",
}
```
