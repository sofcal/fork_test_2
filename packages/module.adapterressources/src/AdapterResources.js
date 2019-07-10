/* eslint-disable key-spacing */
/* eslint-disable no-multi-spaces */

'use strict';

/**
 * The common resource elements for adapters
 * @typedef {Object} _Infrastructure._Adapters.Providers.Common.Resources
 * @property {{string}} errors Collection of error strings
 * @property {{string}} literals Collection of string literals
 * @property {{string}} bankProgressLog log message values for bankFileProgress.status
 * @property {{string}} offBoarding
 * @property {{string}} bankAuthorisationForm Collection of string literals
 */

/**
 * @type {_Infrastructure._Adapters.Providers.Common.Resources}
 */
module.exports = (function() {
    /**
     * @type {_Infrastructure._Adapters.Providers.Common.Resources}
     */
    const ns = {};

    ns.errors = {
        duplicateFile: 'Duplicate File',
        InvalidProperty: 'InvalidProperty',
        InvalidState: 'InvalidState',
        invalidBank: 'Bank not registered',
        invalidTypeCode: 'Invalid Type Code',
        invalidBankAccount: 'Bank Account not registered',
        duplicateBankAccount: 'Duplicate Bank Account Entry',
        invalidBankAccountStatus: 'Bank Account status is not valid for the requested action',
        dataShouldBeString: 'Data should be a string',
        invalidBankData: 'Invalid bank data',
        numberOfFields: 'Fields must be equal to ',
        fixedLengthRow: 'Each row must be equal to ',
        maximumLengthRow: 'Each row must be a maximum length of ',
        minimumLengthRow: 'Each row must be a minimum length of ',
        invalidNumberOfFields: 'Invalid Number Of Fields',
        invalidCurrencyCode: 'Invalid Currency Code',
        invalidAmount: 'Invalid Amount',
        invalidText: 'Invalid Text',
        invalidNumberOfRecords: 'Invalid Number Of Records',
        invalidPositiveInteger: 'Invalid Positive Integer',
        invalidDate: 'Invalid Date',
        bankAccountNotImplemented: 'function bankAccount must be overridden in the implementing controller',
        debitTotalWrong: 'Debit total value wrong',
        creditTotalWrong: 'Credit total value wrong',
        debitCountWrong: 'Debit count wrong',
        creditCountWrong: 'Credit count wrong',
        recordCountWrong: 'Record count wrong',
        balanceCountWrong: 'Balance count wrong',
        accountsCountWrong: 'Number of accounts count wrong',
        groupsCountWrong: 'Number of groups count wrong',
        controlTotalWrong: 'Control total wrong',
        missingFileHeader01: 'Missing file header (01)',
        unexpectedFileHeader01: 'Unexpected file header (01)',
        unexpectedGroupHeader02: 'Unexpected group header (02)',
        unexpectedAccountHeader03: 'Unexpected account header (03)',
        unexpectedTransaction16: 'Unexpected transaction line (16)',
        unexpectedAccountTrailer49: 'Unexpected account trailer (49)',
        unexpectedGroupTrailer98: 'Unexpected group trailer (98)',
        unexpectedFileTrailer99: 'Unexpected file trailer (99)',
        afterFileTrailer99: 'Record(s) follow file trailer (99)',
        missingFileTrailer99: 'Missing file trailer (99)',
        accountBalanceError: 'Account Balance Validation Failed'
    };

    ns.literals = {
        transactionStatusPosted: 'posted',
        statusDelete: 'DELETE',
        statusReplace: 'REPLACE'
    };

    ns.bankProgressLog = {
        inProgress: 'InProgress',
        completed : 'Completed',
        failed    : 'Failed'
    };

    ns.offBoarding = {
        noBankAccountOnMessage: 'bankAccountId not on queue message',
        unexpectedOffBoardingType: 'Unexpected type of off-boarding mechanism',
        missingOffBoardingEmailInfo: 'Missing off-boarding email information'
    };

    ns.bankAuthorisationForm = {
        addressHeader: 'Post your completed form to:',
        emailHeader: 'Alternatively you can print, sign and scan the document and email it as an attachment to:',

        mainHeader: 'Authority to Disclose Information to Sage',
        infoHeader: 'What is this Consent Form about?',
        infoText: 'You would like to import your account data into your Sage Software and you have asked Sage to obtain ' +
            'that data directly from your Banking service provider. This Consent Form sets out your consent to the data transfer ' +
            'and enables Sage to liaise with your Banking service provider to obtain your data.',

        detailsHeader: 'Your Details',
        bankNameLabel: 'Bank Name',
        companyNameLabel: 'Company Name',
        bankIdentifierLabel: 'Sort Code / BIC',
        accountIdentifierLabel: 'Account Number / IBAN',
        accountNameLabel: 'Account Name',

        consentHeader: 'Your Consent',
        consentText1: 'By signing this Consent Form you acknowledge that you have read and understood the above terms and agree ' +
            'to be bound by them.',
        consentText2: 'You confirm that you are authorised to provide this consent for the Account(s) listed above.',

        signatoryLabel: 'Signature of authorised signatory',
        nameLabel: 'Name',
        positionLabel: 'Position',
        dateLabel: 'Date',

        signedForLabel: 'Signed for and on behalf of',

        sageCopyrightText: '© The Sage Group plc 2016',
        sageAddressText: 'Sage Global Services Limited, North Park, Newcastle upon Tyne. NE13 9AA',
        sageContactText: 'Tel: +44191 294 3000   Fax: +44 845 245 0297   VAT number: GB555909605   www.sage.com',
        lastUpdatedText: 'Last updated August 2016'
    };

    ns.transactionTypes = {
        totalsDt: 'TOTALSDEBIT',
        totalsCt: 'TOTALSCREDIT',
        closingDt: 'CLOSINGDEBIT',
        closingCt: 'CLOSINGCREDIT',
        credit: 'CREDIT',
        debit: 'DEBIT',
        int: 'INT',                 // Interest earned or paid (note: Depends on signage of amount)
        div: 'DIV',                 // Dividend
        fee: 'FEE',                 // FI fee
        srvChg: 'SRVCHG',           // Service charge
        dep: 'DEP',                 // Deposit
        atm: 'ATM',                 // ATM debit or credit (note: Depends on signage of amount)
        pos: 'POS',                 // Point of sale debit or credit (note: Depends on signage of amount)
        xfer: 'XFER',               // Transfer
        check: 'CHECK',             // Check
        payment: 'PAYMENT',         // Electronic Payment
        cash: 'CASH',               // Cash withdrawal
        directDep: 'DIRECTDEP',     // Direct Deposit
        directDebit: 'DIRECTDEBIT', // Merchant initiated debit
        repeatPmt: 'REPEATPMT',     // Repeating payment/standard order
        hold: 'HOLD',               // Only valid in pending transactions; indicates the amount is under a hold (note: Depends on signage of amount and account type)
        other: 'OTHER'              // Other
    };

    // Needs Replacing with proper separation of Service Model vs View Model - current pattern in BankAccounts not re-usable in current form
    // Product Backlog Item 231583:Establish good pattern for separation of service models from view models
    ns.transactionTypesMasked = {
        credit: ns.transactionTypes.credit,
        debit: ns.transactionTypes.debit,
        int: ns.transactionTypes.int,
        div: ns.transactionTypes.div,
        fee: ns.transactionTypes.fee,
        srvChg: ns.transactionTypes.srvChg,
        dep: ns.transactionTypes.dep,
        atm: ns.transactionTypes.atm,
        pos: ns.transactionTypes.pos,
        xfer: ns.transactionTypes.xfer,
        check: ns.transactionTypes.check,
        payment: ns.transactionTypes.payment,
        cash: ns.transactionTypes.cash,
        directDep: ns.transactionTypes.directDep,
        directDebit: ns.transactionTypes.directDebit,
        repeatPmt: ns.transactionTypes.repeatPmt,
        hold: ns.transactionTypes.hold,
        other: ns.transactionTypes.other
    };

    ns.validationAction = {
        off: 'off',
        logOnly: 'logOnly',
        fail: 'fail'
    };

    ns.regex = {
        empty: /^$/,
        integer: /^\d+$/,
        date: {
            yymmdd: /^(\d{2})(0[1-9]|1[0-2])(0[1-9]|[1-2][0-9]|31(?!(?:0[2469]|11))|30(?!02))$/,
            julianDate: /^([0-9]{2})(00[1-9]|0[1-9][0-9]|[1-2][0-9][0-9]|3[0-5][0-9]|36[0-6])$/,
            spaceJulianDate: /^( [0-9]{2})(00[1-9]|0[1-9][0-9]|[1-2][0-9][0-9]|3[0-5][0-9]|36[0-6])$/
        },
        time: {
            milTime: /^([01]\d|2[0-3])([0-5]\d)$|(^2400$)|(^9999$)/
        },
        iso: {
            currencyCode: /(^$)|(^(AED|AFN|ALL|AMD|ANG|AOA|ARS|AUD|AWG|AZN|BAM|BBD|BDT|BGN|BHD|BIF|BMD|BND|BOB|BOV|BRL|BSD|BTN|BWP|BYR|BZD|CAD|CDF|CHE|CHF|CHW|CLF|CLP|CNY|COP|COU|CRC|CUC|CUP|CVE|CZK|DJF|DKK|DOP|DZD|EGP|ERN|ETB|EUR|FJD|FKP|GBP|GEL|GHS|GIP|GMD|GNF|GTQ|GYD|HKD|HNL|HRK|HTG|HUF|IDR|ILS|INR|IQD|IRR|ISK|JMD|JOD|JPY|KES|KGS|KHR|KMF|KPW|KRW|KWD|KYD|KZT|LAK|LBP|LKR|LRD|LSL|LTL|LVL|LYD|MAD|MDL|MGA|MKD|MMK|MNT|MOP|MRO|MUR|MVR|MWK|MXN|MXV|MYR|MZN|NAD|NGN|NIO|NOK|NPR|NZD|OMR|PAB|PEN|PGK|PHP|PKR|PLN|PYG|QAR|RON|RSD|RUB|RWF|SAR|SBD|SCR|SDG|SEK|SGD|SHP|SLL|SOS|SRD|SSP|STD|SVC|SYP|SZL|THB|TJS|TMT|TND|TOP|TRY|TTD|TWD|TZS|UAH|UGX|USD|USN|USS|UYI|UYU|UZS|VEF|VND|VUV|WST|XAF|XAG|XAU|XBA|XBB|XBC|XBD|XCD|XDR|XFU|XOF|XPD|XPF|XPT|XSU|XTS|XUA|XXX|YER|ZAR|ZMW|ZWL)$)/
        }
    };

    ns.dataEnrichment = {
        transactionNarrativeMatching: {
            off: 'off',
            on: 'on',
            sourceName: 'NarrativeMatch',
            searchLimitDays: 100
        }
    };

    Object.freeze(ns);
    return ns;
}());
