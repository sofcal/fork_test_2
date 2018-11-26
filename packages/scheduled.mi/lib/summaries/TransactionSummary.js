class TransactionSummary {
    constructor(data = {}) {
        this.creditsTotalCount = data.creditsTotalCount || 0;
        this.creditsTotalValue = data.creditsTotalValue || 0;
        this.creditsMaxValue = data.creditsMaxValue || 0;

        this.debitsTotalCount = data.debitsTotalCount || 0;
        this.debitsTotalValue = data.debitsTotalValue || 0;
        this.debitsMaxValue = data.debitsMaxValue || 0;

        this.absoluteTotalCount = data.absoluteTotalCount || 0;
        this.absoluteTotalValue = data.absoluteTotalValue || 0;

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
        this.creditsAverageValue = average('credits');
        this.debitsAverageValue = average('debits');
        this.absoluteAverageValue = average('absolute');
    }
}

const average = (self, type) => {
    const value = self[`${type}TotalValue`];
    const count = self[`${type}TotalCount`];
    return Math.ceil(value / count);
};

module.exports = TransactionSummary;
