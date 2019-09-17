'use strict';

const { countryCodes, aggregators, tasks, dbs } = require('../resources');

const ErrorSpecs = require('../ErrorSpecs');
const { StatusCodeError } = require('@sage/bc-statuscodeerror');

module.exports = (event, { logger }) => {
    const parsed = event.body ? JSON.parse(event.body) : event;

    parsed.db = parsed.db || defaults.DB;
    parsed.startDate = new Date(parsed.startDate || defaults.START_DATE);
    parsed.countryCodes = parsed.countryCodes || defaults.COUNTRY_CODES;
    parsed.emailBlacklist = parsed.emailBlacklist || defaults.EMAIL_BLACKLIST;
    parsed.aggregatorWhitelist = parsed.aggregatorWhitelist || defaults.AGGREGATOR_WHITELIST;
    parsed.taskWhitelist = parsed.taskWhitelist || defaults.TASK_WHITELIST;

    return parsed;
};

const defaults = {
    DB: dbs.bc,
    START_DATE: '2019-09-15T06:00:00.000Z', // day after PSD2 legislation
    COUNTRY_CODES: [countryCodes.irl, countryCodes.gbr],
    EMAIL_BLACKLIST: [],
    AGGREGATOR_WHITELIST: [aggregators.yodlee],
    TASK_WHITELIST: [tasks.manual_upload, tasks.transaction_sync, tasks.bank_info, tasks.parse_csv]
};