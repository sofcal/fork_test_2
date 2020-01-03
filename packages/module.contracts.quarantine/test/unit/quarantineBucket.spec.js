'use strict';

const QuarantineBucket = require('../../lib/QuarantineBucket');
const resources = require('@sage/bc-common-resources');
const { Transaction } = require('@sage/bc-contracts-transaction');
const validators = require('@sage/bc-services-validators');
const sinon = require('sinon');

// checker for properties of an instantiated object. Digs in to prototype level to ensure chained properties are included.
function hasProperty(obj, propName) {
    for (; obj != null; obj = Object.getPrototypeOf(obj)) {
        let op = Object.getOwnPropertyNames(obj);
        for (let i = 0; i < op.length; i++) {
            if (op[i] === propName) {
                return true;
            }
        }
    }
    return false;
}

describe('QuarantineBucket.js', function() {
    let sandbox;
    let data;

    const uuid = '23697b83-3d5b-4509-ac43-6209a5494687';
    const region = 'IRL';
    const bankId = 'b494e81c-8e72-41a2-8b45-96e40d2bf10b';
    const s3FileName = 'dummyS3File';
    const index = 1;
    const firstItem = 1;
    const lastItem = 2;
    const numberOfTransactions = 2;

    const transactions = [{somePropOne:'someValOne'}, {somePropTwo:'someValTwo'}];

    let startDate = new Date();
    let endDate = new Date();

    beforeEach(function () {
        sandbox = sinon.sandbox.create();
        data = { uuid,
            region,
            bankId,
            s3FileName,
            index,
            firstItem,
            lastItem,
            numberOfTransactions,
            transactions,
            startDate,
            endDate
        };
    });

    afterEach(function () {
        sandbox.restore();
    });

    it('should export a function for QuarantineBucket which can be instantiated and has the correct properties when providing a valid object when instantiating', (done) => {
        let qb = new QuarantineBucket(data);

        QuarantineBucket.should.be.a.Function();
        qb.should.be.an.Object();
        qb.should.be.instanceOf(QuarantineBucket);

        hasProperty(qb, 'uuid').should.eql(true);
        hasProperty(qb, 'region').should.eql(true);
        hasProperty(qb, 'bankId').should.eql(true);
        hasProperty(qb, 's3FileName').should.eql(true);
        hasProperty(qb, 'index').should.eql(true);
        hasProperty(qb, 'firstItem').should.eql(true);
        hasProperty(qb, 'lastItem').should.eql(true);
        hasProperty(qb, 'numberOfTransactions').should.eql(true);
        hasProperty(qb, 'transactions').should.eql(true);
        hasProperty(qb, 'startDate').should.eql(true);
        hasProperty(qb, 'endDate').should.eql(true);
        hasProperty(qb, 'validate').should.eql(true);

        // QuarantineBucket has an implementation of this, exposed through the prototype with same func name which is available for instantiated obj.
        hasProperty(QuarantineBucket, 'validate').should.eql(true);
        done();
    });

    it('should convert objects in data.transactions to transactions when providing an array with data for this property', (done) => {
        let qb = new QuarantineBucket(data);

        qb.transactions.forEach((t) => {
            t.should.be.instanceOf(Transaction);
        });

        done();
    });

    it('should set transactions to an empty array when providing an empty array for transactions in the data object passed to constructor', (done) => {
        data.transactions = [];
        let qb = new QuarantineBucket(data);

        qb.transactions.should.be.empty();
        done();
    });

    it('should export a function for QuarantineBucket which can be instantiated, but has no properties when providing no input', (done) => {
        let qb = new QuarantineBucket();

        QuarantineBucket.should.be.a.Function();
        qb.should.be.an.Object();
        qb.should.be.instanceOf(QuarantineBucket);

        if (Object.keys(qb).length > 0) {
            done(new Error('Expected object to have no properties but found at least one.'));
        }

        done();
    });

    it('should have a MAX_BUCKET_SIZE value which matches that of resource.api.pageSize', (done) => {
       should(QuarantineBucket.MAX_BUCKET_SIZE).eql(resources.api.pageSize);
        done();
    });

    describe('validate', function () {
        describe('QuarantineBucket', function () {
            it('should make call to validateContractObject and not throw any errors when ' +
                'QuarantineBucket.validate is called with an instance of QuarantineBucket', (done) => {
                let qb = new QuarantineBucket(data);
                let validatorStub = sandbox.stub(validators, 'validateContractObject').returns(undefined);
                validatorStub.called.should.be.false();
                QuarantineBucket.validate(qb);
                validatorStub.called.should.be.true();
                done();
            });

            it('should throw an error for the call to validateContractObject when providing no quarantineBucket instance to validate', (done) => {
                const errMsg = 'Some invalid validation message';
                sandbox.stub(validators, 'validateContractObject').throws(new Error(errMsg));

                try {
                    QuarantineBucket.validate();
                    done(new Error('should have thrown'));
                } catch (err) {
                    should(err.message).eql(errMsg);
                    done();
                }
            });
        });

        describe('instance of QuarantineBucket', function () {
            it('should call QuarantineBucket.validate when calling validate on the instance of QuarantineBucket', (done) => {
                let qb = new QuarantineBucket(data);
                const qbClassSpy = sandbox.spy(QuarantineBucket, 'validate');
                sandbox.stub(validators, 'validateContractObject').returns(undefined);

                qbClassSpy.called.should.be.false(); // should not have called validate at this point, as the instance has not made a call to validate.
                qb.validate(); // instance called validate - this should call through to the base class and call it's validate impl.
                qbClassSpy.called.should.be.true();
                done();
            });
        });
    });
});
