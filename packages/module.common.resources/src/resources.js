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
 * @type {_Infrastructure._Common.Resources}
 */
module.exports = (function() {
    /**
     * @type {_Infrastructure._Common.Resources}
     */
    const ns = {};
    // eslint-disable-next-line no-control-regex, no-useless-escape
    const emailRegex = /(?=^.{1,254}$)(?:[a-zA-Z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+\/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-zA-Z0-9-]*[a-zA-Z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/;

    ns.api = {
        pageSize: 100
    };

    ns.services = {
        common: {
            UnknownErrorCode: 'UnknownErrorCode',
            InvalidType: 'InvalidType',
            InvalidProperties: 'InvalidProperties',
            InvalidPropertiesFormat: '%s.%s: %s',
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
        company: {
            standardIndustrialCode: /^.{1,16}$/,
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
                name: /^receipt$/,
                value: /^.{1,50}$/,
                object: {
                    currency: /^[A-Z]{3}$/,
                    receiptDate: /^[2][0|1][0-9]{2}-(?:[0][1-9]|[1][0-2])-(?:[0-2][0-9]|3[0-1])T(?:[0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]\\.[0-9]{3}Z$/,
                    merchantName: /^.{0,128}$/
                }
            },
            transactionNarrative: /^.{0,738}$/ // 732 = 32 (narrative1) + 32 (narrative2) + 512 (name) + 32 (referenceNumber) + 100 (extendedName) + 12 (payeeId) + 12 (checkNum) = 6 (padding between individual fields)
        },
        transactionBucket: {
            region: /^.{1,28}$/
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

    ns.lock = {
        alerts: {
            // Database locking failure
            lockExpired: 'LockExpiredDuringProcessing',
        }
    };

    Object.freeze(ns);
    return ns;
}());
