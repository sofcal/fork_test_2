/**
 * Resource object for the application. Contains common error strings, base endpoints, and any other localisable or
 *  otherwise shared resources.
 * @typedef {Object} _Infrastructure._Common.Resources
 * @property {{String}} endpoints Shared endpoints used within the application
 * @property {{String}} api Strings relevant to the API, such as headers and applicationCodes
 * @property {{String}} services Information and Error strings used by the application services
 * @property {{String}} providers Information and Error strings used by the provider adapters
 * @property {{String}} phase Combined with phaseDetails, these are used to determine whether or not a request can be
 *  processed by a given adapter
 * @property {{String}} odata Information and error strings for use with OData query parameters
 * @property {{}} regex for validating database contracts
 * @property {String} phaseDetails Combined with phase, these are used to determine whether or not a request can be
 *  processed by a given adapter
 */

/**
 * @type _Infrastructure._Common.Resources
 */

const bankIds = require('@sage/bc-bankids');

/**
 * @type {_Infrastructure._Common.Resources}
 */
module.exports = (function() {
    /**
     * @type {_Infrastructure._Common.Resources}
     */
    const ns = {};
    // eslint-disable-next-line no-control-regex, no-useless-escape
    const emailRegex = /(?=^.{1,254}$)(?:[a-zA-Z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+\/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-zA-Z0-9-]*[a-zA-Z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/;

    ns.endpoints = {
        adapterBase: '/api/adapters/'
    };

    ns.api = {
        headers: {
            application: 'x-application',
            signature: 'x-signature',
            region: 'x-region',
            nonce: 'x-nonce',
            userId: 'x-user-id',
            authorization: 'authorization',
            bankingCloud: 'sage.bankingcloud',
            bankingCloudUser: '_internalUserId',
            bankingCloudUserDeprecated: '_deprecatedUserId',
            adminApi: 'sage.bankingcloud.admin-api',
            forwardedFor: 'x-forwarded-for',
            organisationId: 'x-organisation-id',
            companyId: 'x-company-id'
        },
        applicationCodes: {
            ApplicationNotFound: 'ApplicationNotFound',
            InvalidDateRange: 'InvalidDataRange'
        },
        applicationErrors: {
            InvalidRequest: 'InvalidRequest',
            InvalidEndDate: 'enddate must be a valid date.',
            InvalidStartDate: 'startdate must be a valid date.',
            InvalidDates: 'startdate must be less than or equal to enddate.'
        },
        progress: {
            preparing: 'preparing'
        },
        pageSize: 100,
        // TODO: Can we remove this now and get from config
        yodleeCobrandNames: ['sageUK', 'sage50', 'sageOne', 'Softline Pastel']
    };

    ns.services = {
        activity: {
            InvalidMessage: 'ActivityService: Invalid message: missing requestID.',
            InvalidEndpoint: 'ActivityService: Invalid endpoint: not a string.',
            NoSubscriptions: 'ActivityService: No subscriptions were found for the given endpoint.',
            TrackingNotFound: 'ActivityService: A Tracking object does not exist for the given requestID.',
            InvalidDataset: 'ActivityService: Invalid or missing dataset.',
            InvalidProvider: 'ActivityService: Invalid or missing provider',
            InvalidOperation: 'ActivityService: Invalid or missing operation.',
            InvalidRequestId: 'ActivityService: Invalid or missing request id',
            InvalidQuery: 'ActivityService: Invalid query',
            BadRequest: 'ActivityService: Bad Request',
            InvalidTrackingService: 'ActivityService: InvalidTrackingService: Missing functionality',
            InvalidNotificationService: 'ActivityService: InvalidNotificationService: Missing functionality',
            InvalidEncryptionService: 'ActivityService: InvalidEncryptionService: Missing functionality',
            InvalidKeyValuePairCacheService: 'ActivityService: InvalidKeyValuePairCacheService: Missing functionality'
        },
        common: {
            UnknownErrorCode: 'UnknownErrorCode',
            InvalidType: 'InvalidType',
            InvalidProperties: 'InvalidProperties',
            InvalidPropertiesFormat: '%s.%s: %s',
            MissingArrayItemFormat: '%s collection must have an item with %s of %s',
            MultipleUnfilledBuckets: 'multiple unfilled buckets'
        },
        transaction: {
            InvalidUuid: 'TransactionService: Invalid uuid.',
            InvalidType: 'TransactionService: Invalid type.',
            InvalidTransactionType: 'TransactionService: Invalid transactionType. Either no value was given, or it doesn\'t match a known value.',
            InvalidTransactionStatus: 'TransactionService: Invalid transactionStatus. It cannot exceed 12 characters.',
            InvalidDatePosted: 'TransactionService: Invalid datePosted value. Either no value was given, or it isn\'t a correct date.',
            InvalidDateUserInitiated: 'TransactionService: Invalid dateUserInitiated value. The given value isn\'t a correct date.',
            InvalidDateFundsAvailable: 'TransactionService: Invalid dateFundsAvailable value. The given value isn\'t a correct date.',
            InvalidTransactionAmount: 'TransactionService: Invalid transactionAmount. Either no value was given, or it isn\'t a correct number.',
            InvalidTransactionId: 'TransactionService: Invalid transactionId. Either no value was given, or it isn\'t a valid FITID.',
            InvalidCorrectionId: 'TransactionService: Invalid correctionId. Either no value was given, or it isn\'t a valid FITID.',
            InvalidCorrectionAction: 'TransactionService: Invalid correctionAction. If a value was given, it doesn\'t match a known value.',
            InvalidCheckNum: 'TransactionService: Invalid checkNum. The given value is invalid.',
            InvalidReferenceNumber: 'TransactionService: Invalid referenceNumber. The given value is invalid.',
            InvalidName: 'TransactionService: Invalid name.',
            InvalidExtendedName: 'TransactionService: Invalid extended name.',
            InvalidCurrency: 'TransactionService: Invalid currency. The given value is invalid.',
            InvalidBankAccountTo: 'TransactionService: Bank account hasn\'t been found.',

            category: {
                InvalidCategory: 'TransactionCategory: Invalid category.',
                InvalidTopLevelCategory: 'TransactionCategory: Invalid top level category.',
                InvalidSubCategory: 'TransactionCategory: Invalid sub-category.',
                InvalidId: 'TransactionCategory: Invalid category id. The given value isn\'t a valid number.',
                InvalidIndustrialCode: 'TransactionService: Invalid standardIndustrialCode. The given value is invalid.'
            },
            actualAction: {
                InvalidActualAction: 'Transaction actualAction: Invalid value',
                InvalidType: 'Transaction actualAction type: Invalid value',
                accountsPosting: {
                    InvalidAccountsPosting: 'Transaction actualAction accountsPosting: Invalid value',
                    InvalidAccountsTransactionId: 'Transaction actualAction accountsPosting TransactionID: Invalid value',
                    InvalidType: 'Transaction actualAction accountsPosting Type: Invalid value',
                    InvalidReference: 'Transaction actualAction accountsPosting Reference: Invalid value',
                    accountsPostings: {
                        InvalidAccountsPostings: 'Transaction actualAction accountsPosting accountsPostings: Invalid value',
                        InvalidGrossAmount: 'Transaction actualAction accountsPosting accountsPostings grossAmount: Invalid value',
                        InvalidNetAmount: 'Transaction actualAction accountsPosting accountsPostings netAmount: Invalid value',
                        InvalidTaxAmount: 'Transaction actualAction accountsPosting accountsPostings taxAmount: Invalid value',
                        InvalidAccountantNarrative: 'Transaction actualAction accountsPosting accountsPostings accountantNarrative: Invalid value',
                        postingInstructions: {
                            InvalidPostingInstructions: 'Transaction actualAction accountsPosting accountsPostings postingInstructions: Invalid value',
                            InvalidType: 'Transaction actualAction accountsPosting accountsPostings postingInstructions type: Invalid value',
                            InvalidUserDefinedTypeName: 'Transaction actualAction accountsPosting accountsPostings postingInstructions userDefinedTypeName: Invalid value',
                            InvalidCode: 'Transaction actualAction accountsPosting accountsPostings postingInstructions code: Invalid value',
                            InvalidName: 'Transaction actualAction accountsPosting accountsPostings postingInstructions name: Invalid value',
                            InvalidStatus: 'Transaction actualAction accountsPosting accountsPostings postingInstructions status: Invalid value',
                            InvalidValue: 'Transaction actualAction accountsPosting accountsPostings postingInstructions value: Invalid value',
                            InvalidDescription: 'Transaction actualAction accountsPosting accountsPostings postingInstructions description: Invalid value'
                        }
                    }
                }
            },

            InvalidInternalProcessingStatus: 'internalProcessingStatus: Invalid value.',
            Invalids3FileName: 's3FileName: Invalid value',
            Invalids3FileLineNumber: 's3FileLineNumber: Invalid value',
            Invalids3FileLineRaw: 's3FileLineRaw: Invalid value',
            Invalids3TransactionCode: 's3TransactionCode: Invalid value',

            payee: {
                InvalidPayee: 'TransactionPayee: Invalid payee.',
                InvalidId: 'TransactionPayee: Invalid id.',
                InvalidAddressLine1: 'TransactionPayee: Invalid address line 1.',
                InvalidAddressLine2: 'TransactionPayee: Invalid address line 2.',
                InvalidAddressLine3: 'TransactionPayee: Invalid address line 3.',
                InvalidCity: 'TransactionPayee: Invalid city.',
                InvalidState: 'TransactionPayee: Invalid state.',
                InvalidPostalCode: 'TransactionPayee: Invalid postal code.',
                InvalidCountry: 'TransactionPayee: Invalid country.',
                InvalidPhoneNumber: 'TransactionPayee: Invalid phone number.',
                InvalidBankId: 'TransactionPayee: Invalid bank id.',
                InvalidAccountId: 'TransactionPayee: Invalid account id.',
                InvalidNarrative1: 'TransactionPayee: Invalid narrative 1.',
                InvalidNarrative2: 'TransactionPayee: Invalid narrative 2.'
            },

            coordinates: {
                InvalidCoordinates: 'TransactionCoordinates: Invalid coordinates.',
                InvalidCoordinateLat: 'TransactionCoordinatesLat: Invalid latitude coordinate.',
                InvalidCoordinateLong: 'TransactionCoordinatesLong: Invalid longitude coordinate.'
            },

            InvalidHashComponent: 'Invalid transaction hash',
            InvalidHashComponentMessage: 'Transaction: A component of the transaction hash is missing: %s',

            accountsPostings: {
                InvalidGrossAmount: 'TransactionAccountsPostings: Invalid grossAmount.',
                InvalidNetAmount: 'TransactionAccountsPostings: Invalid netAmount.',
                InvalidTaxAmount: 'TransactionAccountsPostings: Invalid taxAmount.',
                InvalidAccountantNarrative: 'TransactionAccountsPostings: Invalid transaction narrative.',
                actions: {
                    InvalidType: 'TransactionAccountsPostingsActions: Invalid type.',
                    InvalidCode: 'TransactionAccountsPostingsActions: Invalid code.'
                }
            }
        }
    };

    ns.providers = {
        controller: {
            InvalidConfigProperties: 'ProviderController: Invalid config properties: not a string.',
            InvalidEndpoint: 'ProviderController: Invalid endpoint: not a string.'
        },
        processingState: {
            BeforeHookMustBeAFunction: 'ProcessingState: setBefore hook must be a function.',
            AfterHookMustBeAFunction: 'ProcessingState: setAfter hook must be a function.',
            RunInternalNotImplemented: 'ProcessingState: runInternal not implemented.'
        },
        aggregators: {
            MultipleAccounts: 'More than one aggregator account retrieved',
            InvalidResponse: 'Response from aggregator not in expected format',
            NoBankAccountOnMessage: 'BankAccountId not on queue message',
            NoCompanyOnMessage: 'CompanyId not on queue message',
            NoAccountIdOnMessage: 'AccountId not on queue message',
            NoPayloadOnMessage: 'Payload not on queue message',
            NoAggregatorIdOnMessage: 'AggregatorId not on queue message',
            InvalidDerivedController: 'Invalid derived controller',
            BankAccountNotPassedIn: 'Bank account not passed in',
            HistoricNoStartDate: 'Historic requested but no requested start date',
            plaid: {
                webhookType: {
                    initialUpdate: 'INITIAL_UPDATE',
                    historicalUpdate: 'HISTORICAL_UPDATE',
                    defaultUpdate: 'DEFAULT_UPDATE',
                    transactionsRemoved: 'TRANSACTIONS_REMOVED',
                    webhookUpdateAcknowledged: 'WEBHOOK_UPDATE_ACKNOWLEDGED',
                    error: 'ERROR',
                    productReady: 'PRODUCT_READY'
                },
                failState: 'Plaid Aggregator returned a failed state'
            },
            yodlee: {
                failState: 'Yodlee Aggregator returned a failed state',
                fetchAccounts: 'Yodlee Aggregator returned no accounts'
            },
            fetchAccounts: 'Failed to retrieve Aggregator account(s)',
            fetchBalances: 'Failed to retrieve Aggregator balance(s)',
            fetchTransactions: 'Failed to retrieve Aggregator transaction(s)',
        }
    };

    ns.phase = {
        uninitialised: 'uninitialised',
        initial: 'initial',
        failed: 'failed',
        finished: 'finished',
        applicationAdapter: 'applicationAdapter',
        applicationAdapterReturn: 'applicationAdapterReturn',
        providerAdapter: 'providerAdapter',
        providerAdapterReturn: 'providerAdapterReturn'
    };

    ns.phaseDetails = {
        initial: 'initialDetails',
        started: 'started',
        ended: 'ended'
    };

    ns.odata = {
        parseError: 'Error parsing OData string.'
    };

    ns.fixedLengthString = {
        // These are strings of a particular length used in validation, the actual values are meaningless
        len3: '4e8',
        len4: '4e8T',
        len59: '4e8Tf0Vi3Gft83kJTrmg0xe4S1Y1f5ExPgG9t5kangY1cezbnK8SM54p0me',
        len64: '4e8Tf0Vi3Gft83kJTrmg0xe4S1Y1f5ExPgG9t5kangY1cezbnK8SM54p0meHJNgJ',
        len65: '4e8Tf0Vi3Gft83kJTrmg0xe4S1Y1f5ExPgG9t5kangY1cezbnK8SM54p0meHJNgJx',
        len129: '4e8Tf0Vi3Gft83kJTrmg0xe4S1Y1f5ExPgG9t5kangY1cezbnK8SM54p0meHJNgJIUSOzbGnFTpea04p6P8H4AGzevMqwTTxczsymYsDFegfCYSbYZ0QUf12xqan4YaZj',
        len255: 'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstu',
        len256: 'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuv'
    };

    ns.fixedLengthString.len254email = `${ns.fixedLengthString.len64}@${ns.fixedLengthString.len129}.${ns.fixedLengthString.len59}`;

    ns.regex = {
        uuid: /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/,
        embeddedUuid: /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/,
        dateISO: /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/,
        product: {
            name: /^.{1,128}$/,
            country: /^[A-Z]{3}$/,
            authorisationMechanism: /^SageId|RequestSignature|Swagger$/,
            supportedCountries: /^GB$|^US$|^CA$|^IE$|^AU$|^ES$|^XX$/
        },
        bank: {
            name: /^.{1,128}$/,
            primaryCountry: /^[A-Z]{3}$/,
            primaryCountry2CharIso: /^[A-Z]{2}$/,
            authorisationMechanism: /^web|form|direct$/,
            authorisationData: /^[\s\S]{1,1024}$/, // match whitespace & non whitespace for multi-line matching
            topicName: /^.{1,255}$/,
            path: /^.{1,255}$/,
            status: /^supported|coming soon|not supported|needs investigation$/,
            accountTypes: /^Checking|Savings|Money Market|Line of Credit|Certificate of Deposit|Business Current Euro|Business Current|Current Account|Demand Deposit Account|Interest Bearing Account|Sweep Account|Savings Account|Foreign Currency Account$/,
            mandatoryCustomerBankDetailsIdentifier: /^.{1,64}$/,
            mandatoryCustomerBankDetailsName: /^.{1,64}$/,
            mandatoryCustomerBankDetailsValue: /^.{1,64}$/,
            address: /^(?:.|\n){1,256}$/,
            emailAddress: emailRegex,
            offBoardingEmailTitle: /^.{1,128}$/,
            agreement: /^(?:.|\n){1,4096}$/,
            dataProvider: /^direct|indirect$/
        },
        organisation: {
            token: /^[a-zA-Z0-9]{64}$/,
            emailAddress: emailRegex,
            serialNumber: /^.{1,128}$/,
            licenceHash: /^[a-fA-F0-9]{1,128}$/,
            crmId: /^.{0,200}$/,
            migrationStatus: /^pendingAuth$|^authorised$|^completed$/
        },
        bankAccount: {
            bankIdentifier: /^.{1,64}$/,
            accountIdentifier: /^.{1,64}$/,
            accountType: /^.{1,64}$/,
            branchIdentifier: /^.{1,128}$/,
            accountKey: /^.{1,256}$/,
            defaultCurrency: /^.{1,64}$/,
            bankAuthorisationToken: /^.{1,256}$/,
            status: /^pending|active|authRequired|verifyingAuth|cancelled|invalid/,
            accountName: /^.{1,128}$/,
            accountantLinkCode: /^[a-fA-F0-9]{8}$/
        },
        claim: {
            identity: /^.{1,128}$/,
            value: /^..*$/
        },
        company: {
            accessLevel: /^admin|user$/,
            name: /^.{1,128}$/,
            vatNumber: /^.{1,15}$/,
            postalCode: /^.{1,11}$/,
            standardIndustrialCode: /^.{1,16}$/,
            address: {
                address1: /^.{0,32}$/,
                address2: /^.{0,32}$/,
                address3: /^.{0,32}$/,
                city: /^.{0,32}$/,
                state: /^.{0,5}$/,
                postalCode: /^.{0,11}$/,
                country: /^.{0,3}$/
            },
            languageCode: /^[a-z]{2}-[A-Z]{2}$/
        },
        user: {
            emailAddress: emailRegex,
            identity: /^.{1,254}$/
        },
        transaction: {
            transactionType: /^CREDIT|DEBIT|INT|DIV|FEE|SRVCHG|DEP|ATM|POS|XFER|CHECK|PAYMENT|CASH|DIRECTDEP|DIRECTDEBIT|REPEATPMT|HOLD|OTHER|CLOSINGCREDIT|CLOSINGDEBIT$/,
            transactionStatus: /^.{1,12}$/,
            transactionId: /^.{1,255}$/,
            correctionId: /^.{0,255}$/,
            correctionAction: /^REPLACE|DELETE$/,
            checkNum: /^.{0,12}$/,
            referenceNumber: /^.{0,32}$/,
            payeeId: /^.{0,12}$/,
            name: /^.{0,512}$/,
            address1: /^.{0,32}$/,
            address2: /^.{0,32}$/,
            address3: /^.{0,32}$/,
            city: /^.{0,32}$/,
            state: /^.{0,32}$/,
            postalCode: /^.{0,11}$/,
            country: /^.{0,3}$/,
            phoneNumber: /^.{0,32}$/,
            extendedName: /^.{0,100}$/,
            payeeBankId: /^.{0,9}$/,
            payeeAccountId: /^.{0,22}$/,
            narrative1: /^.{0,32}$/,
            narrative2: /^.{0,32}$/,
            fileIdentificationNumber: /^.{0,255}$/,
            internalProcessingStatus: /^releasing$/,
            providerAdditionalFields: {
                name: /^.{1,50}$/,
                value: /^.{1,50}$/,
            },
            transactionNarrative: /^.{0,738}$/ // 732 = 32 (narrative1) + 32 (narrative2) + 512 (name) + 32 (referenceNumber) + 100 (extendedName) + 12 (payeeId) + 12 (checkNum) = 6 (padding between individual fields)
        },
        transactionBucket: {
            region: /^.{1,28}$/
        },
        companyData: {
            entityType: /^.{0,200}$/,
            entityCode: /^.{0,200}$/,
            entityName: /^.{0,200}$/,
            entityStatus: /^.{0,200}$/
        },
        accountsPosting: {
            type: /^.{1,200}$/,
            code: /^.{1,200}$/
        },
        ruleBucket: {
            region: /^.{1,28}$/
        },
        rule: {
            accountantNarrative: /^.{0,200}$/,
            ruleName: /^.{1,200}$/,
            ruleField: /^.{0,25}$/,
            ruleCriteria: /^.{1,200}$/,
            ruleOperatorType: /^=|<|<=|>|>=|is between|is|contains|does not contain$/,
            status: /^active|inactive$/,
            ruleType: /^User|Accountant|Feedback|Global$/,
            additionalFields: {
                name: /^.{1,50}$/,
                value: /^.{1,50}$/,
            },
            fileIdentificationNumber: /^.{0,255}$/
        },
        bankLocale: {
            logo: /^.{1,255}$/,
            code: /^[A-Z]{3}$/,
            code2CharIso: /^[A-Z]{2}$/
        },
        persistedCacheEntry: {
            /* cacheType: /^[a-zA-Z][a-zA-Z0-9_]{0,59}$/, */ // Todo - sort this regex out
            cacheType: /^.{1,60}$/,
            key: /^.{1,60}$/
        }
    };

    ns.regExMandatoryBankDetails = {
        aib: {
            bankId: bankIds.aib,
            accountTypes: {
                businessCurrentEuro: {
                    name: 'Business Current Euro', // Bank.accountTypes.businessCurrentEuro,
                    mandatoryCustomerBankDetails: [{
                        name: 'IBAN',
                        value: 'accountIdentifier',
                        validation: '^[a-zA-Z]{2}[0-9]{2}[a-zA-Z0-9]{4}[0-9]{14}$',
                        isAmendable: false
                    }, {
                        name: 'Account Name',
                        value: 'accountName',
                        validation: '^.{1,128}$',
                        isAmendable: true
                    }]
                }
            }
        },
        natwest: {
            bankId: bankIds.natwest,
            accountTypes: {
                businessCurrent: {
                    name: 'Business Current',
                    mandatoryCustomerBankDetails: [
                        {
                            name: 'AccountName',
                            value: 'accountName',
                            validation: '^.{1,128}$',
                            isAmendable: true
                        },
                        {
                            name: 'Sort Code',
                            value: 'bankIdentifier',
                            validation: '^[0-9]{6}$',
                            isAmendable: false

                        },
                        {
                            name: 'AccountNumber',
                            value: 'accountIdentifier',
                            validation: '^[0-9]{8}$',
                            isAmendable: false
                        }]
                }
            }
        },
        rbs: {
            bankId: bankIds.rbs,
            accountTypes: {
                businessCurrent: {
                    name: 'Business Current',
                    mandatoryCustomerBankDetails: [
                        {
                            name: 'AccountName',
                            value: 'accountName',
                            validation: '^.{1,128}$',
                            isAmendable: true
                        },
                        {
                            name: 'Sort Code',
                            value: 'bankIdentifier',
                            validation: '^[0-9]{6}$',
                            isAmendable: false
                        },
                        {
                            name: 'AccountNumber',
                            value: 'accountIdentifier',
                            validation: '^[0-9]{8}$',
                            isAmendable: false
                        }]
                }
            }
        },
        aps: {
            bankId: bankIds.aps,
            accountTypes: {
                businessCurrent: {
                    name: 'Cashplus Business Current',
                    mandatoryCustomerBankDetails: [
                        {
                            name: 'AccountName',
                            value: 'accountName',
                            validation: '^.{1,128}$',
                            isAmendable: true
                        },
                        {
                            name: 'Sort Code',
                            value: 'bankIdentifier',
                            validation: '^[0-9]{6}$',
                            isAmendable: false
                        },
                        {
                            name: 'AccountNumber',
                            value: 'accountIdentifier',
                            validation: '^[0-9]{8}$',
                            isAmendable: false
                        }]
                }
            }
        },
        lloyds: {
            bankId: bankIds.lloyds,
            accountTypes: {
                currentAccount: {
                    name: 'Current Account',
                    mandatoryCustomerBankDetails: [
                        {
                            name: 'Branch Name',
                            value: 'branchIdentifier',
                            validation: '^.{1,128}$',
                            isAmendable: true
                        },
                        {
                            name: 'Sort Code',
                            value: 'bankIdentifier',
                            validation: '^[0-9]{6}$',
                            isAmendable: false
                        },
                        {
                            name: 'AccountNumber',
                            value: 'accountIdentifier',
                            validation: '^[0-9]{8}$',
                            isAmendable: false
                        }]
                }
            }
        },
        usbank: {
            bankId: bankIds.usbank,
            accountTypes: {

                demandDepositAccount: {
                    name: 'Demand Deposit Account',
                    mandatoryCustomerBankDetails: [
                        {
                            name: 'Customer Identification Number',
                            value: 'clientAuthorisationToken',
                            validation: '^.{9}$',
                            isAmendable: true

                        },
                        {
                            name: 'Routing Number',
                            value: 'bankIdentifier',
                            validation: '^[0-9]{9}$',
                            isAmendable: false
                        },
                        {
                            name: 'Account Number',
                            value: 'accountIdentifier',
                            validation: '^[0-9]{12}$',
                            isAmendable: false
                        }]
                },

                interestBearingAccount: {
                    name: 'Interest Bearing Account',
                    mandatoryCustomerBankDetails: [
                        {
                            name: 'Customer Identification Number',
                            value: 'clientAuthorisationToken',
                            validation: '^.{9}$',
                            isAmendable: true
                        },
                        {
                            name: 'Routing Number',
                            value: 'bankIdentifier',
                            validation: '^[0-9]{9}$',
                            isAmendable: false
                        },
                        {
                            name: 'Account Number',
                            value: 'accountIdentifier',
                            validation: '^[0-9]{12}$',
                            isAmendable: false
                        }]
                },

                sweepAccount: {
                    name: 'Sweep Account',
                    mandatoryCustomerBankDetails: [
                        {
                            name: 'Customer Identification Number',
                            value: 'clientAuthorisationToken',
                            validation: '^.{9}$',
                            isAmendable: true
                        },
                        {
                            name: 'Routing Number',
                            value: 'bankIdentifier',
                            validation: '^[0-9]{9}$',
                            isAmendable: false
                        },
                        {
                            name: 'Account Number',
                            value: 'accountIdentifier',
                            validation: '^[0-9]{12}$',
                            isAmendable: false
                        }]
                }
            }
        },
        hsbc: {
            bankId: bankIds.hsbc,
            accountTypes: {

                currentAccount: {
                    name: 'Current Account',
                    mandatoryCustomerBankDetails: [
                        {
                            name: 'Sort Code',
                            value: 'bankIdentifier',
                            validation: '^[0-9]{6}$',
                            isAmendable: false
                        },
                        {
                            name: 'Account Number',
                            value: 'accountIdentifier',
                            validation: '^[0-9]{8}$',
                            isAmendable: false
                        },
                        {
                            name: 'Account Name',
                            value: 'accountName',
                            validation: '^.{1,128}$',
                            isAmendable: true
                        }]
                },
                savingsAccount: {
                    name: 'Savings Account',
                    mandatoryCustomerBankDetails: [
                        {
                            name: 'Sort Code',
                            value: 'bankIdentifier',
                            validation: '^[0-9]{6}$',
                            isAmendable: false
                        },
                        {
                            name: 'Account Number',
                            value: 'accountIdentifier',
                            validation: '^[0-9]{8}$',
                            isAmendable: false
                        },
                        {
                            name: 'Account Name',
                            value: 'accountName',
                            validation: '^.{1,128}$',
                            isAmendable: true
                        }]
                },
                foreignCurrencyAccount: {
                    name: 'Foreign Currency Account',
                    mandatoryCustomerBankDetails: [
                        {
                            name: 'Sort Code',
                            value: 'bankIdentifier',
                            validation: '^[0-9]{6}$',
                            isAmendable: false
                        },
                        {
                            name: 'Account Number',
                            value: 'accountIdentifier',
                            validation: '^[0-9]{8}$',
                            isAmendable: false
                        },
                        {
                            name: 'Account Name',
                            value: 'accountName',
                            validation: '^.{1,128}$',
                            isAmendable: true
                        }]
                }
            }
        }
    };

    ns.rules = {
        tax: {
            invalidGross: 'Gross amount must be a positive number greater than zero',
            invalidTaxPerc: 'Tax percentage must be a positive number - zero or higher',
            invalidCountry: 'Tax calculation is not supported in this country or region'
        },
        ruleType: {
            user: 'User',
            accountant: 'Accountant',
            feedback: 'Feedback',
            global: 'Global'
        }
    };

    ns.schedule = {
        ScheduledJobInvalidType: 'ScheduleService: Invalid ScheduledJob: type.',
        ScheduledJobInvalidProvider: 'ScheduleService: Invalid ScheduledJob: provider.',
        ScheduledJobInvalidEndpoint: 'ScheduleService: Invalid ScheduledJob: endpoint.',
        ScheduledJobInvalidOperation: 'ScheduleService: Invalid ScheduledJob: operation.',
        ScheduledJobNotFound: 'ScheduledJob not found',
        InvalidScheduledJobHandler: 'ScheduleService: Invalid ScheduledJob Handler',
        InvalidDiagnosticsService: 'ScheduleService: Invalid DiagnosticsService: Missing functionality.',
        InvalidDatasetsService: 'ScheduleService: Invalid DatasetsService: Missing functionality.',
        InvalidScheduleExecutor: 'ScheduleService: Invalid ScheduleExecutor: Missing functionality.',
        InvalidScheduler: 'ScheduleService: Invalid Scheduler: Missing functionality.',
        InvalidConfig: 'ScheduleService: Invalid Config: Missing schedule package.',
        InvalidPropertiesDay: 'ScheduleService: Invalid Properties: day.',
        InvalidPropertiesHour: 'ScheduleService: Invalid Properties: hour.',
        InvalidPropertiesMinute: 'ScheduleService: Invalid Properties: minute.',
        InvalidPropertiesSecond: 'ScheduleService: Invalid Properties: second.',
        InvalidPropertiesForRunOnceJob: 'ScheduleService: Invalid Properties: all values required for run once job.',
        InvalidPropertiesId: 'ScheduleService: Invalid Properties: a datasetId or providerAccountId must be specified.',
        InvalidQuery: 'ScheduleService: Invalid query',
        InvalidUuid: 'ScheduleService: Invalid uuid',
        BadRequest: 'ScheduleService: Bad Request'
    };

    Object.freeze(ns);
    return ns;
}());
