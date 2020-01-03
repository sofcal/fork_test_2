'use strict';

const dictionary = {
    AuthorisationMechanism: {
        web: 'web',
        form: 'form',
        direct: 'direct',
    },

    accountTypes: {
        checking: 'Checking',
        savings: 'Savings',
        moneyMrkt: 'Money Market',
        creditLine: 'Line of Credit',
        cd: 'Certificate of Deposit',
        businessCurrentEuro: 'Business Current Euro',
        businessCurrent: 'Business Current',
        cashPlusBusinessCurrent: 'Cashplus Business Current',
        currentAccount: 'Current Account',
        demandDepositAccount: 'Demand Deposit Account',
        interestBearingAccount: 'Interest Bearing Account',
        sweepAccount: 'Sweep Account',
    },

    statuses: {
        comingSoon: 'coming soon',
        supported: 'supported',
        notSupported: 'not supported',
        needsInvestigation: 'needs investigation',
    },

    internalStatusValues: {
        clientDataFlowBlocked: 'clientDataFlowBlocked',
    },

    dataProviders: {
        direct: 'direct',
        indirect: 'indirect',
    },

    aggregatorProviders: {
        plaid: 'plaid',
        yodlee: 'yodlee',
        siss: 'siss',
    },

    quarantineValidationStatus: {
        pendingAuthorisation: 'pendingAuth',
        authorised: 'authorised',
    },

    offBoardingTypes: {
        email: 'email',
        direct: 'direct',
        none: 'none',
    },
};

module.exports = dictionary;
