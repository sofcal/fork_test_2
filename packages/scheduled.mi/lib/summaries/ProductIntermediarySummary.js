const TransactionSummary = require('./TransactionSummary');

class ProductIntermediarySummary {
    constructor({ productName, productId, organisations = [], transactionsSummary = new TransactionSummary() } = {}) {
        this.productName = productName;
        this.productId = productId;
        this.organisations = organisations;
        this.transactionSummary = transactionsSummary;
    }
}

module.exports = ProductIntermediarySummary;
