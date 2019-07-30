class BankSummary {
    constructor({ bankId, bankName, aggregatorName, aggregatorId }) {
        this.bankId = bankId;
        this.bankName = bankName;
        this.aggregatorName = aggregatorName;
        this.aggregatorId = aggregatorId;
        this.dataProvider = aggregatorId ? 'indirect' : 'direct';

        this.statuses = {
            pending: 0,
            active: 0,
            authRequired: 0,
            verifyingAuth: 0,
            inactiveFeed: 0,
            inactiveClient: 0,
            cancelled: 0, // Canceled by the user.
            invalid: 0,
            autoCancelled: 0 // Cancelled by out automatic mechanism. It is not a valid status, just a metric.
        };
    }

    updateFrom(bankAccount) {
        this.statuses[bankAccount.status] += 1;
    }

    toCSV() {
        // BankId, BankName, DataProvider, AggregatorName, AggregatorId, Pending, Active, AuthRequired, VerifyingAuth, InactiveFeed, InactiveClient, Cancelled, Invalid, AutoCancelled
        return `${this.bankId},${this.bankName},${this.dataProvider},${this.aggregatorName},${this.aggregatorId},${this.statuses.pending},${this.statuses.active},${this.statuses.authRequired},${this.statuses.verifyingAuth},${this.statuses.inactiveFeed},${this.statuses.inactiveClient},${this.statuses.cancelled},${this.statuses.invalid},${this.statuses.autoCancelled}`;
    }
}

module.exports = BankSummary;
