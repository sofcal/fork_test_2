const should = require('should');
const sinon = require('sinon');
const DB =  require('@sage/bc-services-db');
const { DBQueries } = require('../../lib/db');
const { logger: loggerGen } = require('@sage/bc-debug-utils');

describe('lambda-genericauth-postbankaccount-DBQueries', function(){
    let sandbox;
    const logger = loggerGen(true);
    const errFunc = () => { throw new Error('should be stubbed') };
    const db = { connect: errFunc, disconnect: errFunc};

    before(()=>{
        sandbox = sinon.createSandbox();
    });

    beforeEach(() => {

    });

    afterEach(()=>{
        sandbox.restore();
    });

    it('should exercise query connection', () => {
        sandbox.stub(DBQueries, 'Create').returns(Promise.resolve(db));
        DBQueries.Create(db);
        should(DBQueries.Create.callCount).eql(1);
        should(DBQueries.Create.calledWithExactly(db)).eql(true);
    });

    it('should exercise update', () => {
        sandbox.stub(DBQueries.prototype, 'updateBankAccount').returns(Promise.resolve());
        let bankAccount = {};
        let queries = DBQueries.Create(db);
        queries.updateBankAccount(bankAccount,{logger});
        should(queries.updateBankAccount.callCount).eql(1);
        should(queries.updateBankAccount.calledWithExactly(bankAccount,{logger})).eql(true);
    });

});
