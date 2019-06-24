const MissingBankAccountsLambda = require('../../lib/MissingBankAccountsLambda');
const extractors = require('../../lib/extractors');

const debugUtils = require('@sage/bc-debug-utils');

const sinon = require('sinon');
const should = require('should');

describe('runonce-support-missingbankaccounts.MissingBankAccountsLambda', function() {
    let sandbox;

    before(() => {
        sandbox = sinon.createSandbox();
    })

    afterEach(() => {
        sandbox.restore();
    })

    describe('constructor', () => {
        it('should create an instance of MissingBankAccountsLambda', () => {
            // should also be instance of base class
        });

        it('should assign properties', () => {

        });
    });

    describe('Create', () => {
        it('should create an instance of MissingBankAccountsLambda', () => {
            // should also be instance of base class
        });

        it('should assign properties', () => {

        });
    });

    describe('impl', () => {
        let uut;
        beforeEach(() => {
            uut = MissingBankAccountsLambda.Create({});
        })

        it('should do something', () => {
            sandbox.stub(extractors, 'hsbc').callsFake(() => {
                console.log('meh')
            });

            return uut.impl({});
        })
    });
})