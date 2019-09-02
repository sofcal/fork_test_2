'use strict';

const { CalcGBR } = require('./regionSpecificTax');
const _ = require('underscore');

const consts = {
    invalidGross: 'Gross amount must be a positive number greater than zero',
    invalidTaxPerc: 'Tax percentage must be a positive number - zero or higher',
    invalidCountry: 'Tax calculation is not supported in this country or region'
};

class TaxCalculator {
    constructor() {
        this.calculators = {
            GBR: CalcGBR
        };
    }

    calcTAX(gross, taxPerc, countryCode = 'GBR') { // Currently only UK VAT supported
        validate(gross, taxPerc, countryCode);

        return this.calculators[countryCode] ? this.calculators[countryCode].calcTAX(gross, taxPerc) : null;
    }
}

const validate = (gross, taxPerc, countryCode) => {
    const validateNumber = (value) => _.isNumber(value) && !_.isNaN(value);
    const validateCountry = (value) => (value === 'GBR');

    if (!validateNumber(gross) || gross < 0) {
        throw new Error(consts.invalidGross);
    }
    if (!validateNumber(taxPerc) || taxPerc < 0) {
        throw new Error(consts.invalidTaxPerc);
    }
    if (!validateCountry(countryCode)) {
        throw new Error(consts.invalidCountry);
    }
};

module.exports = TaxCalculator;
