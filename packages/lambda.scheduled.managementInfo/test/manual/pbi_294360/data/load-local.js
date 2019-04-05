db.getCollection('Product').remove({});
db.getCollection('Bank').remove({});
db.getCollection('Organisation').remove({});
db.getCollection('OrganisationExt').remove({});
db.getCollection('Company').remove({});
db.getCollection('CompanyExt').remove({});
db.getCollection('BankAccount').remove({});
db.getCollection('Transaction').remove({});
db.getCollection('Unresolved').remove({});

const products = [];
const banks = [];
const bankAccounts = [];
const companies = [];
const companyExts = [];
const organisations = [];
const organisationExts = [];
const transactions = [];
const unresolved = [];

const product = {
    _id: '10000000-0000-0000-0000-000000000001',
    name: 'MI TEST PRODUCT'
};

products.push(product);

const bank = {
    _id: '10000000-0000-0000-0000-000000000001',
    name: 'MI TEST BANK'
};

banks.push(bank);

const org1ID = '10000000-0000-0000-0000-000000000001';
const org2ID = '10000000-0000-0000-0000-000000000002';
const org3ID = '10000000-0000-0000-0000-000000000003';

//#region : setup for organisation 1 - no orgExt / cmpyExt data

const ba1_1 = {
    _id: '10000000-0000-0000-0000-100000000001',
    organisationId: org1ID,
    bankId: bank._id,
    bankIdentifier: '000000',
    accountIdentifier: '100000001',
    aggregatorName: null,
    status: 'pending',
    accountant: { accountantManaged: 'none' },
    lastTransactionId: 2,
    lastHeldTransactionId: 0
};

const ba1_2 = {
    _id: '10000000-0000-0000-0000-100000000002',
    organisationId: org1ID,
    bankId: bank._id,
    bankIdentifier: '000000',
    accountIdentifier: '100000002',
    aggregatorName: null,
    status: 'pending',
    accountant: { accountantManaged: 'none' },
    lastTransactionId: 2,
    lastHeldTransactionId: 0
};

const comp1_1 = {
    _id: '10000000-0000-0000-0000-100000000001',
    organisationId: org1ID,
    bankAccounts: [ba1_1._id, ba1_2._id]
};

const comp1_2 = {
    _id: '10000000-0000-0000-0000-100000000002',
    organisationId: org1ID,
    bankAccounts: [ba1_1._id]
};

const org1 = {
    _id: org1ID,
    companies: [comp1_1._id, comp1_2._id],
    products: [{ productId: product._id }],
    bankAccounts: [
        { bankAccountId: ba1_1._id, region: 'GBR', deleted: null },
        { bankAccountId: ba1_2._id, region: 'GBR', deleted: null },
        { bankAccountId: '10000000-0000-0000-0000-999999999999', region: 'GBR', deleted: new Date('2018-10-01') }
    ]
};

bankAccounts.push(ba1_1, ba1_2);
companies.push(comp1_1, comp1_2);
organisations.push(org1);

//#endregion organisation 1



//#region : setup for organisation 2 - orgExt / cmpyExt data no org/cmpy

const ba2 = {
    _id: '10000000-0000-0000-0000-200000000001',
    organisationId: org2ID,
    bankId: bank._id,
    bankIdentifier: '000000',
    accountIdentifier: '000000002',
    aggregatorName: null,
    status: 'active',
    accountant: { accountantManaged: 'none' },
    lastTransactionId: 101,
    lastHeldTransactionId: 0
};

const comp2 = {
    _id: '10000000-0000-0000-0000-200000000001',
    organisationId: org2ID,
    bankAccounts: [ba2._id]
};

const org2 = {
    _id: org2ID,
    companies: [comp2._id],
    products: [{ productId: product._id }],
    bankAccounts: [
        { bankAccountId: ba2._id, region: 'GBR', deleted: null },
    ]
};

bankAccounts.push(ba2);
companyExts.push(comp2);
organisationExts.push(org2);

//#endregion organisation 2




//#region : setup for organisation 3 - org/cmpy data and orgExt / cmpyExt data

const ba3_1 = {
    _id: '10000000-0000-0000-0000-300000000001',
    organisationId: org3ID,
    bankId: bank._id,
    bankIdentifier: '000000',
    accountIdentifier: '300000001',
    aggregatorName: null,
    status: 'pending',
    accountant: { accountantManaged: 'none' },
    lastTransactionId: 2,
    lastHeldTransactionId: 0
};

const ba3_2 = {
    _id: '10000000-0000-0000-0000-300000000002',
    organisationId: org3ID,
    bankId: bank._id,
    bankIdentifier: '000000',
    accountIdentifier: '300000002',
    aggregatorName: null,
    status: 'pending',
    accountant: { accountantManaged: 'none' },
    lastTransactionId: 2,
    lastHeldTransactionId: 0
};

const ba3_3 = {
    _id: '10000000-0000-0000-0000-300000000003',
    organisationId: org3ID,
    bankId: bank._id,
    bankIdentifier: '000000',
    accountIdentifier: '300000003',
    aggregatorName: null,
    status: 'pending',
    accountant: { accountantManaged: 'none' },
    lastTransactionId: 2,
    lastHeldTransactionId: 0
};

const comp3_1 = {
    _id: '10000000-0000-0000-0000-300000000001',
    organisationId: org1ID,
    bankAccounts: [ba3_1._id, ba3_2._id]
};

const comp3_2 = {
    _id: '10000000-0000-0000-0000-300000000002',
    organisationId: org1ID,
    bankAccounts: [ba3_2._id]
};

const org3 = {
    _id: org3ID,
    companies: [comp3_1._id, comp3_2._id],
    products: [{ productId: product._id }],
    bankAccounts: [
        { bankAccountId: ba3_1._id, region: 'GBR', deleted: null },
        { bankAccountId: ba3_2._id, region: 'GBR', deleted: null },
        { bankAccountId: '10000000-0000-0000-0000-999999999999', region: 'GBR', deleted: new Date('2018-10-01') }
    ]
};

bankAccounts.push(ba3_1, ba3_2);
companies.push(comp3_1, comp3_2);
organisations.push(org3);
companyExts.push(comp3_1, comp3_2);
organisationExts.push(org3);



//#endregion organisation 3


// const ba13ID = '10000000-0000-0000-0000-000000000013';
// const ba14ID = '10000000-0000-0000-0000-000000000014';

// const comp4 = {
//     _id: '10000000-0000-0000-0000-000000000004',
//     organisationId: org3ID,
//     bankAccounts: [
//         // bank accounts from region 2
//         ba13ID, ba14ID
//     ]
// };

// const org3 = {
//     _id: org3ID,
//     companies: [comp4._id],
//     products: [{ productId: product._id }],
//     bankAccounts: [
//         { bankAccountId: ba13ID, region: 'USA', deleted: null },
//         { bankAccountId: ba14ID, region: 'USA', deleted: null }
//     ]
// };

// companies.push(comp4);
// organisations.push(org3);

// // these bankAccounts belong to the other region, hence their _id fields begin with a 2
// const orphanba13 = {
//     // present on org
//     _id: '20000000-0000-0000-0000-000000000013',
//     organisationId: otherRegionOrg3Id,
//     bankId: bank._id,
//     bankIdentifier: '000000',
//     accountIdentifier: '000000013',
//     aggregatorName: null,
//     status: 'active',
//     accountant: { accountantManaged: 'none' },
//     lastTransactionId: 2,
//     lastHeldTransactionId: 0
// };

// const orphanba14 = {
//     // present on org
//     _id: '20000000-0000-0000-0000-000000000014',
//     organisationId: otherRegionOrg3Id,
//     bankId: bank._id,
//     bankIdentifier: '000000',
//     accountIdentifier: '000000014',
//     aggregatorName: null,
//     status: 'active',
//     accountant: { accountantManaged: 'none' },
//     lastTransactionId: 2,
//     lastHeldTransactionId: 0
// };

// const orphanba15 = {
//     // mising on org
//     _id: '20000000-0000-0000-0000-000000000015',
//     organisationId: otherRegionOrg3Id,
//     bankId: bank._id,
//     bankIdentifier: '000000',
//     accountIdentifier: '000000015',
//     aggregatorName: null,
//     status: 'active',
//     accountant: { accountantManaged: 'none' },
//     lastTransactionId: 2,
//     lastHeldTransactionId: 2
// };

// const orphanba16 = {
//     // missing, org does not exist at all
//     _id: '20000000-0000-0000-0000-000000000016',
//     organisationId: '20000000-0000-0000-0000-999999999999',
//     bankId: bank._id,
//     bankIdentifier: '000000',
//     accountIdentifier: '000000016',
//     aggregatorName: 'plaid',
//     status: 'active',
//     accountant: { accountantManaged: 'none' },
//     lastTransactionId: 2,
//     lastHeldTransactionId: 2
// };

// bankAccounts.push(orphanba13, orphanba14, orphanba15, orphanba16);

const generateTransactions = (bankAccount, unresolved) => {
    const prop = unresolved ? 'lastHeldTransactionId' : 'lastTransactionId';

    const raw = [];

    for (var i = 1; i <= bankAccount[prop]; ++i) {
        if (( i-1 ) % 100 === 0) {
            raw.push([]);
        }

        // CREDIT: >= 0
        // DEBIT: < 0
        // all odd transactionIds will be CREDIT, even will be DEBIT
        const mod = i % 2 === 0 ? -1 : 1;
        const transaction = {
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
};

bankAccounts.forEach((ba) => {
    transactions.push.apply(transactions, generateTransactions(ba, false));
    unresolved.push.apply(unresolved, generateTransactions(ba, true));
});

db.getCollection('Bank').insert(banks);
db.getCollection('Product').insert(products);
db.getCollection('Organisation').insert(organisations);
db.getCollection('OrganisationExt').insert(organisationExts);
db.getCollection('Company').insert(companies);
db.getCollection('CompanyExt').insert(companyExts);
db.getCollection('BankAccount').insert(bankAccounts);
db.getCollection('Transaction').insert(transactions);
db.getCollection('Unresolved').insert(unresolved);
