// external modules
const Big = require('bignumber.js');

class TransactionSummary {
    constructor(data = {}) {
        this.creditsTotalCount = data.creditsTotalCount || 0;
        this.creditsTotalValue = Math.round(data.creditsTotalValue) || 0;
        this.creditsMaxValue = Math.round(data.creditsMaxValue) || 0;

        this.debitsTotalCount = data.debitsTotalCount || 0;
        this.debitsTotalValue = Math.round(data.debitsTotalValue) || 0;
        this.debitsMaxValue = Math.round(data.debitsMaxValue) || 0;

        this.absoluteTotalCount = data.absoluteTotalCount || 0;
        this.absoluteTotalValue = Math.round(data.absoluteTotalValue) || 0;

        this.creditsAverageValue = data.creditsAverageValue || null;
        this.debitsAverageValue = data.debitsAverageValue || null;
        this.absoluteAverageValue = data.absoluteAverageValue || null;
    }

    updateFrom(source) {
        this.creditsTotalCount += source.creditsTotalCount;
        this.creditsTotalValue += source.creditsTotalValue;
        this.creditsMaxValue = Math.max(this.creditsMaxValue, source.creditsMaxValue);

        this.debitsTotalCount += source.debitsTotalCount;
        this.debitsTotalValue += source.debitsTotalValue;
        this.debitsMaxValue = Math.min(this.debitsMaxValue, source.debitsMaxValue);

        this.absoluteTotalCount += source.absoluteTotalCount;
        this.absoluteTotalValue += source.absoluteTotalValue;
    }

    updateAverages() {
        this.creditsAverageValue = average(this, 'credits');
        this.debitsAverageValue = average(this, 'debits');
        this.absoluteAverageValue = average(this, 'absolute');
    }
}

const average = (self, type) => {
    const value = new Big(self[`${type}TotalValue`]);
    const count = new Big(self[`${type}TotalCount`]);

    return value.div(count).round(2).toNumber();
};

module.exports = TransactionSummary;
