'use strict';

module.exports = (function() {
    const ns = {};

    // Please add comments for each alert (or closely-related group of alerts).
    // This file doubles as documentation for LSM.

    ns.alerts = {
        // An attempt was made to access an endpoint for a company that doesn't belong to the organisation.
        unauthorisedCompanyAccess: 'UnauthorisedCompanyAccess',

        // An attempt was made to access an endpoint for a bankAccount that doesn't belong to the organisation.
        unauthorisedBankAccountAccess: 'UnauthorisedBankAccountAccess',

        // An attempt to read s3 bucket data failed
        s3DataReadFailed: 'S3DataReadFailed',
        s3InvalidMessage: 'S3InvalidMessage',
        s3FileTooLarge: 'S3FileTooLarge',
        s3FileEmpty: 'S3FileEmpty',
        s3FileMissing: 'S3FileMissing',
        s3InvalidExtension: 's3InvalidExtension',

        // Failed precedes last processed file
        attemptToProcessFileOutOfSequence: 'AttemptToProcessFileOutOfSequence',

        // Adapter file limit
        fileFrequencyLimitExceeded: 'FileFrequencyLimitExceeded',

        // Failed to validate bank data file
        bankDataPrevalidationFailed: 'BankDataPrevalidationFailed',

        // Failed to transform bank data into sage format
        bankDataTransformationFailed: 'BankDataTransformationFailed',

        // Failed to save bank file data to the database
        bankDataPostvalidationFailed: 'bankDataPostvalidationFailed',

        // Failed to process accountants data
        releaseAccountantsTransactionsFailed: 'ReleaseOfAccountantsTransactionsFailed',
        accountantsDataFailure: 'AccountantsDataFailure',

        // Bank account found without a company.companyId property
        bankAccountWithoutLinkedCompany: 'BankAccountWithoutLinkedCompany',

        // An expected bank account was not found in the database.
        bankAccountNotFound: 'BankAccountNotFound',

        // A bank account's client authorisation token doesn't match the bank token (status is invalid)
        bankAccountTokenMismatch: 'BankAccountTokenMismatch',

        // Secondary token used more than 10 times following a key refresh
        secondaryTokenAccessLimitExceeded: 'SecondaryTokenAccessLimitExceeded',

        // Database locking failure
        lockExpired: 'LockExpiredDuringProcessing',
        lockMaxAttempt: 'FailedToObtainLockAfterMaxRetries',

        // End point limits
        rateLimit: 'EndPointRateLimit',

        // Account Balance Validation failed: Opening Balance + sum of Transactions should equal Closing Balance
        accountBalanceError: 'accountBalanceError',

        // Duplicate transactions detected
        duplicatesDetected: 'duplicatesDetected',

        // OutboundAPI encryption / decryption
        outboundApiEncryptionError: 'ouboundApiEncryptionError',
        outboundApiDecryptionError: 'ouboundApiDecryptionError',

        //
        // Aggregators
        //

        // Bank has been deleted in the aggregator, but bank accounts exist in our db for that bank
        bankRemovedByAggregator: 'BankRemovedByAggregator',
        // The aggregator returned fewer banks than we were expecting
        banksFromAggregatorBelowThreshold: 'BanksFromAggregatorBelowThreshold',

        // Error sending notification
        webhookNotificationError: 'webhookNotificationError',

        // Error syncing aggregator transactions
        aggregatorFetchTransactionsError: 'aggregatorFetchTransactionsError',

        // Error syncing aggregator transactions for country code (by schedule)
        aggregatorFetchTransactionsForCountryError: 'aggregatorFetchTransactionsForCountryError',

        // Unknown refresh status code on Yodlee bank account
        yodleeUnknownRefreshStatusCode: 'yodleeUnknownRefreshStatusCode',

        // No accounts were returned from yodlee
        yodleeNoAccountsReturned: 'yodleeNoAccountsReturned',

        // bank deletion
        aggregatorDeleteBankAccountError: 'aggregatorDeleteBankAccountError',

        // yodlee cache cleanup
        aggregatorDeleteUserError: 'aggregatorDeleteUserError',
        aggregatorCleanCacheError: 'aggregatorCleanCacheError',

        // Aggregator CreatePublicToken
        aggregatorCreatePublicToken: 'aggregatorCreatePublicTokenError',

        // Aggregator Exchange Key
        aggregatorExchangeKey: 'aggregatorExchangeKeyError',

        // Aggregator Exchange Key
        aggregatorAttachEncryptedCredentials: 'aggregatorAttachEncryptedCredentials',

        // Backup to s3
        aggregatorSendToS3: 'aggregatorSendToS3Error',

        // failed to process transactions for an aggregator
        aggregatorFailedToProcessTransactions: 'aggregatorFailedToProcessTransactions',

        // admin portal
        adminApiFailedToReleaseTransactions: 'adminApiFailedToReleaseTransactions',

        // off-boarding
        createOffBoardingEmailFailed: 'createOffBoardingEmailFailed',
        sendOffBoardingEmailFailed: 'sendOffBoardingEmailFailed',

        adapterFailureDuplicate: 'adapterFailureDuplicate',
        adapterFailureVerify: 'adapterFailureVerify',
        adapterFailureProcessing: 'adapterFailureProcessing',

        // on-boarding
        sissDifferentOrganisationOnSISSAccount: 'sissDifferentOrganisationOnSISSAccount'
    };

    Object.freeze(ns);
    return ns;
}());
