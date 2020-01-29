const TransactionSummary = require('./TransactionSummary');

const _ = require('underscore');

class ProductSummary {
    constructor({ productId, productName, logger }) {
        this.logger = logger;
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
            unresolvedMax: 0,
            siteNotSupported: 0,
            institutions: {
                direct: 0,
                siss: 0,
                plaid: 0,
                yodlee: 0
            },
            // Y to P Migration
            providerMigrations: {
                awaitingCustomerInput: 0,
                success: 0,
                failed: 0,
                delayed: 0
            }
        };

        this.transactions = new TransactionSummary();
    }

    updateFrom(org) {
        const func = 'ProductSummary.updateFrom';
        this.logger.info({ function: func, log: 'started', params: { } });

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
                this.bankAccounts.siteNotSupported += (bankAccount.internal && bankAccount.internal.siteNotSupported === true) ? 1 : 0;
                this.bankAccounts.institutions = this.incrementInstitution(this.bankAccounts.institutions, bankAccount);
                // Y to P Migration
                this.bankAccounts.providerMigrations = this.incrementMigrationProgress(this.bankAccounts.providerMigrations, bankAccount);
            }
        });
    }

    incrementInstitution(institutions, bankAccount) {
        const func = 'ProductSummary.incrementInstitution';
        this.logger.info({ function: func, log: 'started', params: {} });
        if (bankAccount.status === 'cancelled') {
            // Include accounts in all states except cancelled
            return institutions;
        }

        if (!bankAccount.dataProvider) {
            this.logger.warn({ function: func, log: 'dataProvider not specified', params: { dataProvider: bankAccount.dataProvider, aggregatorName: bankAccount.aggregatorName } });
        } else if (bankAccount.dataProvider === 'direct') {
            institutions[bankAccount.dataProvider] += 1;
        } else {
            institutions[bankAccount.aggregatorName] += 1;
        }

        return institutions;
    }

    incrementMigrationProgress(providerMigrations, bankAccount) {
        const func = 'ProductSummary.incrementMigrationProgress';
        this.logger.info({ function: func, log: 'started', params: { } });
        if (bankAccount.status === 'cancelled' || !bankAccount.providerMigration) {
            // Include accounts in all states except cancelled
            return providerMigrations;
        }

        const delayedReasons = ['delayed', 'failedLogin', 'userCancelled'];

        if (bankAccount.providerMigration.progress === 'transactionSyncComplete' && !_.contains(delayedReasons, bankAccount.providerMigration.progressReason)) {
            providerMigrations.awaitingCustomerInput += 1;
        } else if (bankAccount.providerMigration.progress === 'complete') {
            providerMigrations.success += 1;
        } else if (bankAccount.providerMigration.progress === 'failed') {
            providerMigrations.failed += 1;
        } else if (_.contains(delayedReasons, bankAccount.providerMigration.progressReason)) {
            providerMigrations.delayed += 1;
        }

        return providerMigrations;
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
        // Product,Organisations,Companies,BankAccounts,ActiveBankAccounts,Transactions,TotalCredit,TotalDebit,TotalAbsolute,SiteNotSupported,Direct,SISS,Plaid,Yodlee,ProviderMigration_AwaitingCustomerInput,PB_Success,PM_Failed,PM_Delayed
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
        return `${this.productName},${this.organisations.total},${this.companies.total},${this.bankAccounts.total},${active},${this.transactions.absoluteTotalCount},${totalCreditsMajor},${totalDebitsMajor},${totalAbsoluteMajor},${this.bankAccounts.siteNotSupported},${this.bankAccounts.institutions.direct},${this.bankAccounts.institutions.siss},${this.bankAccounts.institutions.plaid},${this.bankAccounts.institutions.yodlee},${this.bankAccounts.providerMigrations.awaitingCustomerInput},${this.bankAccounts.providerMigrations.success},${this.bankAccounts.providerMigrations.failed},${this.bankAccounts.providerMigrations.delayed}`;
    }
}

module.exports = ProductSummary;
