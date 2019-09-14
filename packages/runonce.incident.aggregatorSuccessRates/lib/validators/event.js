'use strict';

const ErrorSpecs = require('../ErrorSpecs');
const { StatusCodeError } = require('@sage/bc-statuscodeerror');

module.exports = (event, { logger }) => {
    const parsed = event.body ? JSON.parse(event.body) : event;

    parsed.db = parsed.db || defaults.DB;
    parsed.switchOverDate = parsed.switchOverDate || defaults.SWITCHOVER_DATE;
    parsed.countryCodes = parsed.countryCodes || defaults.COUNTRY_CODES;
    parsed.emailBlacklist = parsed.emailBlacklist || defaults.EMAIL_BLACKLIST;
    parsed.aggregatorWhitelist = parsed.aggregatorWhitelist || defaults.AGGREGATOR_WHITELIST;

    return parsed;
};

const defaults = {
    DB: 'bank_db',
    SWITCHOVER_DATE: new Date('2019-09-12T06:00:00.000Z'),
    COUNTRY_CODES: ['IRL', 'GBR', 'FRA', 'ESP'],
    EMAIL_BLACKLIST: [

    ],
    AGGREGATOR_WHITELIST: [
        'yodlee'
    ]
};