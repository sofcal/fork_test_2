const TransactionSummary = require('../summaries/TransactionSummary');

const _ = require('underscore');

class ResultsSummary {
    constructor({ products = [] } = {}) {
        this.orphaned = {
            bankAccounts: [
                // any bank accounts that don't have an associated organisation. If we're not in concat mode, it's still possible these accounts exist on the other region
            ],
            transactions: new TransactionSummary()
            // TODO what are we doing about unresolved?
            // transaction totals for bank accounts that don't have an associated organisation. Only present as a result of concat mode
        };

        this.products = products;
        this.csv = null;
    }

    updateCSV = () => {
        const initial = 'Product,Organisations,Companies,BankAccounts,ActiveBankAccounts,Transactions,TotalCredit,TotalDebit,TotalAbsolute';
        this.csv = _.reduce(this.products, (memo, product) => {
            return `${memo}\n${product.toCSV()}`;
        }, initial);
    }
}

module.exports = ResultsSummary;
