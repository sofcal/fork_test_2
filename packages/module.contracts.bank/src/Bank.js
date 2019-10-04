'use strict';

const Resources = require('@sage/bc-common-resources');
const validators = require('@sage/bc-services-validators');

const _ = require('underscore');
const FileDescriptors = require('./FileDescriptors');
const bankValidators = require('./bankValidators');
const dict = require('./bankDictionary');
const access = require('safe-access');

class Bank {
    constructor(data, plaidFeatureEnabled = true) {
        if (data) {
            this.uuid = data.uuid;
            this.name = data.name;
            this.primaryCountry = data.primaryCountry;
            this.primaryCountry2CharIso = data.primaryCountry2CharIso;
            this.authorisationMechanism = data.authorisationMechanism;
            this.recentFileHistory = data.recentFileHistory || [];
            this.topicName = data.topicName;

            // this is the folder name for this bank, ie adapters/providers/bank1 would have bank1 as the path
            //  it's used to pass the generation of pdfs to the appropriate code base (and other things)
            this.path = data.path;
            this.accountTypes = data.accountTypes || [];
            this.status = data.status;
            this.internalStatuses = data.internalStatuses || [];
            this.address = data.address;
            this.emailAddress = data.emailAddress;
            this.agreement = data.agreement;
            this.authorisationData = data.authorisationData;
            this.offBoardingMechanism = data.offBoardingMechanism || { type: Bank.offBoardingTypes.none, instructions: '' };
            this.quarantine = data.quarantine || { forceQuarantine: false, transactionTypes: [] };
            this.proxy = data.proxy || null;
            this.supportiframe = !_.isUndefined(data.supportiframe) ? data.supportiframe : true;

            this.internal = { longURL: data.longURL || false };

            /* aggregator feature */
            if (plaidFeatureEnabled) {
                this.dataProvider = data.dataProvider || Bank.dataProviders.direct;
                this.aggregatorId = data.aggregatorId;
                this.aggregatorName = data.aggregatorName;
            }
        }
    }

    validate() {
        Bank.validate(this);
    }

    recentFileDescriptors() {
        return new FileDescriptors(this);
    }

    static validate(bank) {
        const val = bankValidators(bank);
        let properties = [
            { path: 'uuid', regex: Resources.regex.uuid, optional: true },
            { path: 'name', regex: Resources.regex.bank.name },
            { path: 'primaryCountry', regex: Resources.regex.bank.primaryCountry },
            { path: 'primaryCountry2CharIso', regex: Resources.regex.bank.primaryCountry2CharIso },
            { path: 'authorisationMechanism', regex: Resources.regex.bank.authorisationMechanism },
            { path: 'authorisationData', regex: Resources.regex.bank.authorisationData, optional: true, allowNull: true },
            { path: 'topicName', regex: Resources.regex.bank.topicName, optional: true, allowNull: true },
            { path: 'path', regex: Resources.regex.bank.path },
            { path: 'accountTypes', nested: val.validateAccountTypes, optional: true },
            { path: 'status', regex: Resources.regex.bank.status },
            { path: 'internalStatuses', arrayCustom: val.validateInternalStatuses, allowEmptyArray: true },
            { path: 'address', regex: Resources.regex.bank.address, conditional: val.isFormAuthorisation, allowNull: true },
            { path: 'emailAddress', regex: Resources.regex.bank.emailAddress, conditional: val.isFormAuthorisation, optional: true, allowNull: true },
            { path: 'agreement', regex: Resources.regex.bank.agreement, conditional: val.isFormAuthorisation, allowNull: true },
            { path: 'quarantine', nested: val.validateQuarantine },
            { path: 'offBoardingMechanism', nested: val.validateOffBoardingMechanism },
            { path: 'proxy', nested: val.validateProxy, optional: true, allowNull: true },
            { path: 'supportiframe', custom: _.isBoolean },
            { path: 'recentFileHistory', nested: val.validateRecentFileHistory, optional: true, allowNull: true },
            { path: 'internal', nested: val.validateInternal, optional: true, allowNull: true }
        ];

        /* aggregator feature */
        if (bank && Object.prototype.hasOwnProperty.call(bank, 'dataProvider')) {
            /* for indirect, we only need these fields */
            if (access(bank, 'dataProvider') === Bank.dataProviders.indirect) {
                properties = [
                    { path: 'uuid', regex: Resources.regex.uuid, optional: true },
                    { path: 'name', regex: Resources.regex.bank.name },
                    { path: 'primaryCountry', regex: Resources.regex.bank.primaryCountry },
                    { path: 'aggregatorId', custom: _.isString },
                    { path: 'aggregatorName', custom: _.isString },
                    { path: 'status', regex: Resources.regex.bank.status }
                ];
            }

            properties.push.apply(properties, [
                { path: 'dataProvider', custom: val.validateDataProvider }
            ]);
        }

        validators.validateContractObject(bank, Bank, properties);
    }

    /* eslint-disable no-param-reassign */
    static filter(data) {
        _.each(data.accountTypes, (accountType) => {
            _.each(accountType.mandatoryCustomerBankDetails, (mandatoryDetail) => {
                mandatoryDetail.validation = Buffer.from(JSON.stringify(mandatoryDetail.validation)).toString('base64');
            });
        });

        // delete any properties from bank account that should not be returned to the client via the API
        delete data.created;
        delete data.updated;
        delete data.etag;

        delete data.path;
        delete data.topicName;
        delete data.recentFileHistory;
        delete data.address;
        delete data.emailAddress;
        delete data.agreement;
        delete data.quarantine;
        delete data.proxy;
        delete data.internalStatuses;
        delete data.internal;

        if (data.offBoardingMechanism) {
            delete data.offBoardingMechanism.emailAddress;
            delete data.offBoardingMechanism.emailTitle;
        }

        /* aggregator feature */
        if (data && Object.prototype.hasOwnProperty.call(data, 'dataProvider')) {
            delete data.aggregatorId;
            delete data.aggregatorName;
        }

        return data;
    }
    /* eslint-enable no-param-reassign */
}

// add properties from bankDictionary
Object.assign(Bank, dict);

module.exports = Bank;
