db.getCollection('Product').remove({});
db.getCollection('Bank').remove({});
db.getCollection('Organisation').remove({});
db.getCollection('Company').remove({});
db.getCollection('BankAccount').remove({});
db.getCollection('Transaction').remove({});
db.getCollection('Unresolved').remove({});

var products = [];
var banks = [];
var bankAccounts = [];
var companies = [];
var organisations = [];
var transactions = [];
var unresolved = [];

var product = {
    _id: '10000000-0000-0000-0000-000000000001',
    name: 'MI TEST PRODUCT'
};

products.push(product);

var bank = {
    _id: '10000000-0000-0000-0000-000000000001',
    name: 'MI TEST BANK'
};

banks.push(bank);

var org1ID = '20000000-0000-0000-0000-000000000001';
var org2ID = '20000000-0000-0000-0000-000000000002';
var org3ID = '20000000-0000-0000-0000-000000000003'; // bank accounts exist on region 1
var otherRegionOrg3Id = '10000000-0000-0000-0000-000000000003'; // id of the org one region1

/* setup for organisation 1 */
var ba1 = {
    _id: '20000000-0000-0000-0000-000000000001',
    organisationId: org1ID,
    bankId: bank._id,
    bankIdentifier: '000000',
    accountIdentifier: '000000001',
    aggregatorName: null,
    status: 'pending',
    accountant: { accountantManaged: 'none' },
    lastTransactionId: 2,
    lastHeldTransactionId: 0
};

var ba2 = {
    _id: '20000000-0000-0000-0000-000000000002',
    organisationId: org1ID,
    bankId: bank._id,
    bankIdentifier: '000000',
    accountIdentifier: '000000002',
    aggregatorName: null,
    status: 'active',
    accountant: { accountantManaged: 'none' },
    lastTransactionId: 2,
    lastHeldTransactionId: 0
};

var ba3 = {
    _id: '20000000-0000-0000-0000-000000000003',
    organisationId: org1ID,
    bankId: bank._id,
    bankIdentifier: '000000',
    accountIdentifier: '000000003',
    aggregatorName: null,
    status: 'authRequired',
    accountant: { accountantManaged: 'none' },
    lastTransactionId: 2,
    lastHeldTransactionId: 0
};

var ba4 = {
    _id: '20000000-0000-0000-0000-000000000004',
    organisationId: org1ID,
    bankId: bank._id,
    bankIdentifier: '000000',
    accountIdentifier: '000000004',
    aggregatorName: 'plaid',
    status: 'verifyingAuth',
    accountant: { accountantManaged: 'none' },
    lastTransactionId: 2,
    lastHeldTransactionId: 0
};

var ba5 = {
    _id: '20000000-0000-0000-0000-000000000005',
    organisationId: org1ID,
    bankId: bank._id,
    bankIdentifier: '000000',
    accountIdentifier: '000000005',
    aggregatorName: null,
    status: 'inactiveFeed',
    accountant: { accountantManaged: 'none' },
    lastTransactionId: 2,
    lastHeldTransactionId: 0
};

var ba6 = {
    _id: '20000000-0000-0000-0000-000000000006',
    organisationId: org1ID,
    bankId: bank._id,
    bankIdentifier: '000000',
    accountIdentifier: '000000006',
    aggregatorName: null,
    status: 'inactiveClient',
    accountant: { accountantManaged: 'none' },
    lastTransactionId: 2,
    lastHeldTransactionId: 0
};

var ba7 = {
    _id: '20000000-0000-0000-0000-000000000007',
    organisationId: org1ID,
    bankId: bank._id,
    bankIdentifier: '000000',
    accountIdentifier: '000000007',
    aggregatorName: null,
    status: 'cancelled',
    accountant: { accountantManaged: 'none' },
    lastTransactionId: 2,
    lastHeldTransactionId: 0
};

var ba8 = {
    _id: '20000000-0000-0000-0000-000000000008',
    organisationId: org1ID,
    bankId: bank._id,
    bankIdentifier: '000000',
    accountIdentifier: '000000008',
    aggregatorName: null,
    status: 'cancelled',
    internal: {
        cancellationReason: {
            code: "auto",
            description: "bank account pending for over 180 days"
        }
    },
    accountant: { accountantManaged: 'none' },
    lastTransactionId: 0,
    lastHeldTransactionId: 0
};

var ba9 = {
    _id: '20000000-0000-0000-0000-000000000009',
    organisationId: org1ID,
    bankId: bank._id,
    bankIdentifier: '000000',
    accountIdentifier: '000000009',
    aggregatorName: null,
    status: 'invalid',
    accountant: { accountantManaged: 'none' },
    lastTransactionId: 2,
    lastHeldTransactionId: 0
};

var comp1 = {
    _id: '20000000-0000-0000-0000-000000000001',
    organisationId: org1ID,
    bankAccounts: [ba1._id, ba2._id, ba3._id, ba4._id, ba5._id, ba6._id, ba7._id, ba8._id, ba9._id]
};

var comp2 = {
    _id: '20000000-0000-0000-0000-000000000002',
    organisationId: org1ID,
    bankAccounts: [ba1._id]
};

var org1 = {
    _id: org1ID,
    companies: [comp1._id, comp2._id],
    products: [{ productId: product._id }],
    bankAccounts: [
        { bankAccountId: ba1._id, region: 'GBR', deleted: null },
        { bankAccountId: ba2._id, region: 'GBR', deleted: null },
        { bankAccountId: ba3._id, region: 'GBR', deleted: null },
        { bankAccountId: ba4._id, region: 'GBR', deleted: null },
        { bankAccountId: ba5._id, region: 'GBR', deleted: null },
        { bankAccountId: ba6._id, region: 'GBR', deleted: null },
        { bankAccountId: ba7._id, region: 'GBR', deleted: null },
        { bankAccountId: ba8._id, region: 'GBR', deleted: null },
        { bankAccountId: ba9._id, region: 'GBR', deleted: null },
        { bankAccountId: '20000000-0000-0000-0000-999999999999', region: 'GBR', deleted: new Date('2018-10-01') }
    ]
};

bankAccounts.push(ba1, ba2, ba3, ba4, ba5, ba6, ba7, ba8, ba9);
companies.push(comp1, comp2);
organisations.push(org1);

/* setup for organisation 1 */

var ba10 = {
    _id: '20000000-0000-0000-0000-000000000010',
    organisationId: org2ID,
    bankId: bank._id,
    bankIdentifier: '000000',
    accountIdentifier: '000000010',
    aggregatorName: null,
    status: 'active',
    accountant: { accountantManaged: 'none' },
    lastTransactionId: 101,
    lastHeldTransactionId: 0
};

var ba11 = {
    _id: '20000000-0000-0000-0000-000000000011',
    organisationId: org2ID,
    bankId: bank._id,
    bankIdentifier: '000000',
    accountIdentifier: '000000011',
    aggregatorName: null,
    status: 'active',
    accountant: { accountantManaged: 'active' },
    lastTransactionId: 0,
    lastHeldTransactionId: 101
};

var ba12 = {
    _id: '20000000-0000-0000-0000-000000000012',
    organisationId: org2ID,
    bankId: bank._id,
    bankIdentifier: '000000',
    accountIdentifier: '000000012',
    aggregatorName: null,
    status: 'active',
    accountant: { accountantManaged: 'active' },
    lastTransactionId: 101,
    lastHeldTransactionId: 101
};

var ba13 = {
    _id: '20000000-0000-0000-0000-000000000013',
    organisationId: org2ID,
    bankId: bank._id,
    bankIdentifier: '000000',
    accountIdentifier: '000000013',
    aggregatorName: null,
    status: 'active',
    accountant: { accountantManaged: 'pending' },
    lastTransactionId: 0,
    lastHeldTransactionId: 0
};

var comp3 = {
    _id: '20000000-0000-0000-0000-000000000003',
    organisationId: org2ID,
    bankAccounts: [ba10._id, ba11._id, ba12._id, ba13._id]
};

var org2 = {
    _id: org2ID,
    companies: [comp3._id],
    products: [{ productId: product._id }],
    bankAccounts: [
        { bankAccountId: ba10._id, region: 'GBR', deleted: null },
        { bankAccountId: ba11._id, region: 'GBR', deleted: null },
        { bankAccountId: ba12._id, region: 'GBR', deleted: null },
        { bankAccountId: ba13._id, region: 'GBR', deleted: null }
    ]
};

bankAccounts.push(ba10, ba11, ba12, ba13);
companies.push(comp3);
organisations.push(org2);

var ba14ID = '20000000-0000-0000-0000-000000000016';
var ba15ID = '20000000-0000-0000-0000-000000000017';

var comp4 = {
    _id: '20000000-0000-0000-0000-000000000004',
    organisationId: org3ID,
    bankAccounts: [
        // bank accounts from region 1
        ba14ID, ba15ID
    ]
};

var org3 = {
    _id: org3ID,
    companies: [comp4._id],
    products: [{ productId: product._id }],
    bankAccounts: [
        { bankAccountId: ba14ID, region: 'GBR', deleted: null },
        { bankAccountId: ba15ID, region: 'GBR', deleted: null }
    ]
};

companies.push(comp4);
organisations.push(org3);

// these bankAccounts belong to the other region, hence their _id fields begin with a 1
var orphanba16 = {
    // mising
    _id: '10000000-0000-0000-0000-000000000016',
    organisationId: otherRegionOrg3Id,
    bankId: bank._id,
    bankIdentifier: '000000',
    accountIdentifier: '000000013',
    aggregatorName: 'plaid',
    status: 'active',
    accountant: { accountantManaged: 'none' },
    lastTransactionId: 2,
    lastHeldTransactionId: 0
};

var orphanba17 = {
    // mising
    _id: '10000000-0000-0000-0000-000000000017',
    organisationId: otherRegionOrg3Id,
    bankId: bank._id,
    bankIdentifier: '000000',
    accountIdentifier: '000000014',
    aggregatorName: null,
    status: 'active',
    accountant: { accountantManaged: 'none' },
    lastTransactionId: 2,
    lastHeldTransactionId: 0
};

var orphanba18 = {
    // mising on org
    _id: '10000000-0000-0000-0000-000000000018',
    organisationId: otherRegionOrg3Id,
    bankId: bank._id,
    bankIdentifier: '000000',
    accountIdentifier: '000000015',
    aggregatorName: null,
    status: 'active',
    accountant: { accountantManaged: 'none' },
    lastTransactionId: 2,
    lastHeldTransactionId: 2
};

var orphanba19 = {
    // missing, org does not exist at all
    _id: '10000000-0000-0000-0000-000000000019',
    organisationId: '10000000-0000-0000-0000-999999999999',
    bankId: bank._id,
    bankIdentifier: '000000',
    accountIdentifier: '000000016',
    aggregatorName: 'plaid',
    status: 'active',
    accountant: { accountantManaged: 'none' },
    lastTransactionId: 2,
    lastHeldTransactionId: 2
};

bankAccounts.push(orphanba16, orphanba17, orphanba18, orphanba19);

var generateTransactions = (bankAccount, unresolved) => {
    var prop = unresolved ? 'lastHeldTransactionId' : 'lastTransactionId';

    var raw = [];

    if (bankAccount[prop] > 0) {
        for (var i = 1; i <= bankAccount[prop]; ++i) {
            if ((i - 1) % 100 === 0) {
                raw.push([]);
            }

            // CREDIT: >= 0
            // DEBIT: < 0
            // all odd transactionIds will be CREDIT, even will be DEBIT
            var mod = i % 2 === 0 ? -1 : 1;
            var transaction = {
                incrementedId: i,
                transactionAmount: (i * mod) / 100,
                transactionType: mod === 1 ? 'CREDIT' : 'DEBIT'
            };

            raw[raw.length - 1].push(transaction);
        }

        return raw.map((transactions) => {
            return {
                bankAccountId: bankAccount._id,
                startIncrementedId: transactions[0].incrementedId,
                endIncrementedId: transactions[transactions.length - 1].incrementedId,
                numberOfTransactions: transactions.length,
                transactions
            }
        });
    }
    return undefined;
};

bankAccounts.forEach((ba) => {
    transactions.push.apply(transactions, generateTransactions(ba, false));
    unresolved.push.apply(unresolved, generateTransactions(ba, true));
});

db.getCollection('Bank').insert(bank);
db.getCollection('Product').insert(products);
db.getCollection('Organisation').insert(organisations);
db.getCollection('Company').insert(companies);
db.getCollection('BankAccount').insert(bankAccounts);
db.getCollection('Transaction').insert(transactions);
db.getCollection('Unresolved').insert(unresolved);


// NOTES: Totals for transactions across both regions =
// CREDITS (odd transactions): 2 batches of 101 transactions (2 * 10201) + 10 batches of 2 transactions (10 * 1) = 20412
// DEBITS (even transactions): 2 batches of 101 transactions (2 * 10302) + 10 batches of 2 transactions (10 * 2) = 20624