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
            missing: 0,
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
                cancelled: 0, // Canceled by the user.
                invalid: 0,
                autoCancelled: 0 // Cancelled by out automatic mechanism. It is not a valid status, just a metric.
            },
            accountantManaged: 0,
            transactionsMax: 0,
            unresolvedMax: 0
        };

        this.transactions = new TransactionSummary();
    }

    updateFrom(org) {
        this.organisations.total += 1;
        this.organisations.companiesMax = Math.max(this.organisations.companiesMax, org.companyCount);
        this.organisations.bankAccountsMax = Math.max(this.organisations.bankAccountsMax, org.bankAccountCount);

        _.each(org.companies, (company) => {
            if (company.missing) {
                this.companies.missing += 1;
            } else {
                this.companies.total += 1;
                this.companies.bankAccountsMax = Math.max(this.companies.bankAccountsMax, company.bankAccountCount);
            }
        });

        _.each(org.bankAccounts, (bankAccount) => {
            if (bankAccount.missing) {
                this.bankAccounts.missing += 1;
            } else {
                this.bankAccounts.total += 1;
                this.bankAccounts.statuses = this.incrementStatus(this.bankAccounts.statuses, bankAccount);
                this.bankAccounts.accountantManaged += bankAccount.accountantManaged === 'none' ? 0 : 1;
                this.bankAccounts.transactionsMax = Math.max(this.bankAccounts.transactionsMax, bankAccount.transactionCount);
                this.bankAccounts.unresolvedMax = Math.max(this.bankAccounts.unresolvedMax, bankAccount.unresolvedCount);
            }
        });
    }

    incrementStatus(bankAccountStatuses, bankAccount) {
        const statuses = bankAccountStatuses;
        if (bankAccount.status === 'cancelled' && this.isAutoCancelled(bankAccount)) {
            statuses.autoCancelled += 1;
        } else if (bankAccount.status === 'cancelled') {
            statuses.cancelled += 1;
        } else {
            statuses[bankAccount.status] += 1;
        }
        return statuses;
    }

    /**
     * A cancelled status is automatically cancelled if we have an additional field explaining the cancellation circumstances.
     * @param bankAccount
     * @returns {*}
     */
    isAutoCancelled(bankAccount) {
        return bankAccount.internal && bankAccount.internal.cancellationReason && bankAccount.internal.cancellationReason.code === 'auto';
    }

    toCSV() {
        // Product,Organisations,Companies,BankAccounts,ActiveBankAccounts,Transactions,TotalCredit,TotalDebit,TotalAbsolute
        const notActiveKeys = ['cancelled', 'pending'];
        let active = 0;
        _.each(this.bankAccounts.statuses, (v, k) => {
            if (!_.contains(notActiveKeys, k)) {
                active += v;
            }
        });

        const totalCreditsMajor = (this.transactions.creditsTotalValue / 100).toFixed(2);
        const totalDebitsMajor = (this.transactions.debitsTotalValue / 100).toFixed(2);
        const totalAbsoluteMajor = (this.transactions.absoluteTotalValue / 100).toFixed(2);
        return `${this.productName},${this.organisations.total},${this.companies.total},${this.bankAccounts.total},${active},${this.transactions.absoluteTotalCount},${totalCreditsMajor},${totalDebitsMajor},${totalAbsoluteMajor}`;
    }
}

module.exports = ProductSummary;