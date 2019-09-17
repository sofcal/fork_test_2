const { tasks, aggregators } = require('../resources');
const Promise = require('bluebird');
const _ = require('underscore');

const OK = 'OK';
const NOT_SUPPORTED = 'NOT_SUPPORTED';
const LOGIN_RELATED = 'LOGIN_RELATED';
const UNKNOWN = 'UNKNOWN';

const statuses = {
    OK: OK,
    STATUS_PARTIAL_SUCCESS: OK,

    SITE_NOT_SUPPORTED: NOT_SUPPORTED,
    SITE_CURRENTLY_NOT_SUPPORTED: NOT_SUPPORTED,
    SITE_DOWN_FOR_MAINTENANCE: NOT_SUPPORTED,
    NO_CONNECTION: NOT_SUPPORTED,
    SITE_UNAVILABLE: NOT_SUPPORTED,
    BETA_SITE_WORK_IN_PROGRESS: NOT_SUPPORTED,
    SITE_APPLICATION_ERROR: NOT_SUPPORTED,

    LOGIN_NOT_COMPLETED: LOGIN_RELATED,
    PASSWORD_EXPIRED: LOGIN_RELATED,
    MFA_INFO_MISMATCH_FOR_AGENTS: LOGIN_RELATED,
    LOGIN_FAILED: LOGIN_RELATED,
    NEW_MFA_INFO_REQUIRED_FOR_AGENTS: LOGIN_RELATED,
    MFA_INFO_NOT_PROVIDED_IN_REAL_TIME_BY_USER_VIA_APP: LOGIN_RELATED,
    GENERAL_EXCEPTION_WHILE_GATHERING_MFA_DATA: LOGIN_RELATED,
    REFRESH_NEVER_DONE_AFTER_CREDENTIALS_UPDATE: LOGIN_RELATED,
    ACCOUNT_LOCKED: LOGIN_RELATED,
    MFA_INFO_NOT_PROVIDED_IN_REAL_TIME_BY_GATHERER: LOGIN_RELATED,
    INVALID_MFA_INFO_IN_REAL_TIME_BY_USER_VIA_APP: LOGIN_RELATED,

    NO_ACCOUNT_FOUND: UNKNOWN,
    DATA_EXPECTED: UNKNOWN,
    COMPLETELY_FAILED: UNKNOWN,
    UPDATE_INFORMATION_ERROR: UNKNOWN,
    SITE_SESSION_ALREADY_ESTABLISHED: UNKNOWN,
    SITE_TERMINATED_SESSION: UNKNOWN,
    INTERNAL_ERROR: UNKNOWN,
    INSTANT_REQUEST_TIMEDOUT: UNKNOWN,
    NEW_TERMS_AND_CONDITIONS: UNKNOWN,
    ACCOUNT_CANCELLED: UNKNOWN,
    ACCT_INFO_UNAVAILABLE: UNKNOWN
};

const aggregatorParsers = {};

aggregatorParsers[aggregators.yodlee] = (data, bankInfo) => {
    const toReview = _.sortBy(data.statuses, (s) => statuses[s.statusMessage]);

    const okBanks = _.find(toReview, (s) => s.statusMessage === OK).banksWithThisStatus;

    let csv = 'categorization,status,status_code,status_message,affected_accounts,affected_banks,affected_banks_after_filter, affected_banks_after_filter_names';
    let row = 1;
    const rowIds = {
        OK: { from: 0, to: 0 },
        LOGIN_RELATED: { from: 0, to: 0 },
        NOT_SUPPORTED: { from: 0, to: 0 },
        UNKNOWN: { from: 0, to: 0 },
        undefined: { from: 0, to: 0 }
    };

    _.each(toReview, (s) => {
        row += 1;
        const status = statuses[s.statusMessage];

        if (!rowIds[status].from) {
            rowIds[status].from = row;
        }
        rowIds[status].to = row;

        const filtered = _.reject(s.banksWithThisStatus, (b) => _.contains(okBanks, b));
        const bankNames = _.reduce(filtered, (memo, bId) => {
            const bank = _.find(bankInfo, (bi) => bi.bankId === bId) || {};
            const toAppend = `${memo === '' ? '' : '...'}${bank.bankName}:${bank.aggregatorId}`;
            return `${memo}${toAppend}`;
        }, '');

        csv += `\n${status},${s.status},${s.statusCode},${s.statusMessage},${s.total},${s.banksWithThisStatus.length},${filtered.length},"${bankNames}"`;
    });

    const tot = data.total;
    const has = data.hasReceivedTransactionsCount;
    const not = data.notReceivedTransactionsCount;

    csv += `\n\n,totalAccounts,${tot}`;
    csv += `\n,receivedTransactions,${has},${((has/tot)*100).toFixed(2)}%`;
    csv += `\n,NOTreceivedTransactions,${not},${((not/tot)*100).toFixed(2)}%\n`;
    _.each(_.keys(rowIds), (k) => {
        csv += `,,,,${k},=SUM(E${rowIds[k].from}:E${rowIds[k].to})\n`;
    });

    return csv;
};

module.exports.retrieve = Promise.method(({ data, task, countryCode, dbQueries, blob, event }, { logger }) => {
    const { aggregatorWhitelist } = event.parsed;
    data[task][countryCode] = {};
    _.each(aggregatorWhitelist, (aggregator) => {
        if (aggregatorParsers[aggregator]) {
            const toReview = data[tasks.transaction_sync][countryCode][aggregator];
            const banks = data[tasks.bank_info][countryCode][aggregator].banks;

            data[task][countryCode][aggregator] = aggregatorParsers[aggregator](toReview, banks);
        }
    });
});

module.exports.store = Promise.method(({ data, task, dbQueries, blob, event }, { logger }) => {
    const { aggregatorWhitelist, countryCodes } = event.parsed;
    const keys = [];
    return Promise.each(countryCodes,
        (countryCode) => {
            return Promise.each(aggregatorWhitelist,
                (aggregator) => {
                    const keyPostfix = `${task}_${countryCode}_${aggregator}.csv`;
                    return blob.storeResults({ keyPostfix, stringified: data[task][countryCode][aggregator] }, { logger })
                        .then(({ key }) => {
                            keys.push(key);
                        });
                })
        })
        .then(() => keys);
});