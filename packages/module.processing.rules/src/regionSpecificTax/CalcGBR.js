'use strict';

const Big = require('bignumber.js');

class CalcGBR {
    static calcTAX(gross, taxPercentage) {
        const bGross = new Big(gross);
        const bTaxPercentage = new Big(taxPercentage);
        let bRoundedNet = new Big(0);
        let bRoundedVat = new Big(0);

        if (bGross.greaterThan(0)) {
            const bTaxMultiplier = bTaxPercentage.div(100).plus(1);
            const bNet = bGross.div(bTaxMultiplier);
            bRoundedNet = bNet.round(2);
            const bVat = bGross.minus(bRoundedNet);
            bRoundedVat = bVat.round(2);
        }

        return { net: bRoundedNet.toNumber(), tax: bRoundedVat.toNumber() };
    }
}

module.exports = CalcGBR;
