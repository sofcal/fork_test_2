const TransactionSummary = require('./TransactionSummary');

const _ = require('underscore');

class ProductSummary {
    constructor({ productId, productName }) {
        this.productId = productId;
        this.productName = productName;

        this.organisations = {
            total: 0,
            companiesMax: 0,
            bankAccountsMax: 0
        };

        this.companies = {
            total: 0,
            bankAccountsMax: 0
        };

        this.bankAccounts = {
            total: 0,
            missing: 0,
            statuses: {
                pending: 0,
                active: 0,
                authRequired: 0,
                verifyingAuth: 0,
                inactiveFeed: 0,
                inactiveClient: 0,
                cancelled: 0,
                invalid: 0
            },
            accountantManaged: 0,
            transactionsMax: 0
        };

        this.transactions = new TransactionSummary();
    }

    updateFrom(org) {
        this.organisations.total += 1;
        this.organisations.companiesMax = Math.max(this.organisations.companiesMax, org.companyCount);
        this.organisations.bankAccountsMax = Math.max(this.organisations.bankAccountsMax, org.bankAccountCount);

        _.each(org.companies, (company) => {
            this.companies.total += 1;
            this.companies.bankAccountsMax = Math.max(this.companies.bankAccountsMax, company.bankAccountCount);
        });

        _.each(org.bankAccounts, (bankAccount) => {
            if (bankAccount.missing) {
                this.bankAccounts.missing += 1;
            } else {
                this.bankAccounts.total += 1;
                this.bankAccounts.statuses[bankAccount.status] += 1;
                this.bankAccounts.accountantManaged += bankAccount.accountantManaged === 'none' ? 0 : 1;
                this.bankAccounts.transactionsMax = Math.max(this.bankAccounts.transactionsMax, bankAccount.transactionCount);
            }
        });
    }
}

module.exports = ProductSummary;
