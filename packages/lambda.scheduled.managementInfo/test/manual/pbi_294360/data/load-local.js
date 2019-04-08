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
const org4ID = '10000000-0000-0000-0000-000000000004';

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
    source: 'Company',
    bankAccounts: [ba1_1._id, ba1_2._id]
};

const comp1_2 = {
    _id: '10000000-0000-0000-0000-100000000002',
    organisationId: org1ID,
    source: 'Company',
    bankAccounts: [ba1_1._id]
};

const org1 = {
    _id: org1ID,
    companies: [comp1_1._id, comp1_2._id],
    products: [{ productId: product._id }],
    source: 'Organisation',
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
    source: 'CompanyExt',
    bankAccounts: [ba2._id]
};

const org2 = {
    _id: org2ID,
    companies: [comp2._id],
    products: [{ productId: product._id }],
    source: 'OrganisationExt',
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
    source: 'Company',
    bankAccounts: [ba3_1._id, ba3_2._id]
};
const compExt3_1 = Object.assign( {}, comp3_1, { source: 'CompanyExt' } );

const comp3_2 = {
    _id: '10000000-0000-0000-0000-300000000002',
    organisationId: org1ID,
    source: 'Company',
    bankAccounts: [ba3_2._id]
};
const compExt3_2 = Object.assign( {}, comp3_2, { source: 'CompanyExt' } );

const org3 = {
    _id: org3ID,
    companies: [comp3_1._id, comp3_2._id],
    products: [{ productId: product._id }],
    source: 'Organisation',
    bankAccounts: [
        { bankAccountId: ba3_1._id, region: 'GBR', deleted: null },
        { bankAccountId: ba3_2._id, region: 'GBR', deleted: null },
        { bankAccountId: '10000000-0000-0000-0000-999999999999', region: 'GBR', deleted: new Date('2018-10-01') }
    ]
};
const orgExt3 = Object.assign( {}, org3, { source: 'OrganisationExt' } );

bankAccounts.push(ba3_1, ba3_2);
companies.push(comp3_1, comp3_2);
organisations.push(org3);
companyExts.push(compExt3_1, compExt3_2);
organisationExts.push(orgExt3);



//#endregion organisation 3

//#region : setup for orphaned bank accounts

// Bank Account doesn't exist on Org, Org exists on Organisation, not OrganisationExt
const orphanba1 = {
    _id: '10000000-0000-0000-0000-400000000001',
    organisationId: org1ID,
    bankId: bank._id,
    bankIdentifier: '000000',
    accountIdentifier: '400000000001',
    aggregatorName: null,
    status: 'active',
    accountant: { accountantManaged: 'none' },
    lastTransactionId: 2,
    lastHeldTransactionId: 0
};

// Bank Account doesn't exist on Org, Org exists on OrganisationExt, not Organisation
const orphanba2 = {
    _id: '10000000-0000-0000-0000-400000000002',
    organisationId: org2ID,
    bankId: bank._id,
    bankIdentifier: '000000',
    accountIdentifier: '400000000002',
    aggregatorName: null,
    status: 'active',
    accountant: { accountantManaged: 'none' },
    lastTransactionId: 2,
    lastHeldTransactionId: 0
};

// Bank Account doesn't exist on Org, Org exists on both Organisation and OrganisationExt
const orphanba3 = {
    _id: '10000000-0000-0000-0000-400000000003',
    organisationId: org1ID,
    bankId: bank._id,
    bankIdentifier: '000000',
    accountIdentifier: '400000000003',
    aggregatorName: null,
    status: 'active',
    accountant: { accountantManaged: 'none' },
    lastTransactionId: 2,
    lastHeldTransactionId: 0
};

// Org doesn't exist
const orphanba4 = {
    _id: '10000000-0000-0000-0000-400000000004',
    organisationId: org4ID,
    bankId: bank._id,
    bankIdentifier: '000000',
    accountIdentifier: '400000000004',
    aggregatorName: null,
    status: 'active',
    accountant: { accountantManaged: 'none' },
    lastTransactionId: 2,
    lastHeldTransactionId: 0
};

bankAccounts.push(orphanba1, orphanba2, orphanba3, orphanba4);

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
