const Promise = require('bluebird');
const should = require('should');
const sinon = require('sinon');
const _ = require('underscore');
const impl = require('./../../lib/impl.js');
const DbQueries = require('./../../lib/dbQueries');
const FeedbackRuleGenerator = require('./../../lib/FeedbackRuleGenerator');

describe('lambda-machineLearning-actualActionsProcessor.impl', function(){
    let sandbox;
    before(()=>{
    });

    after(()=> {
    });

    beforeEach(()=>{
        sandbox = sinon.sandbox.create();
    });

    afterEach(()=>{
        sandbox.restore();
    });

    it('should invoke FeedbackRule generator for each notification', () => {
        const logFunc = (data) => {console.log(JSON.stringify(data))};
                
        let notification = {orgId:'e09c1bbc-75d4-425a-8913-754f64f08524', baId:'ee905d97-5922-6ddc-33b9-5a83ed280670', trId:1, region:'GBR'}
        let bodyString = JSON.stringify({"Message": JSON.stringify(notification)});
        let event = { logger: { info: logFunc, error: logFunc }, Records: [{body: bodyString }]};
        let services = { db:{ getConnection: sandbox.stub()}};
        let params = {};
       
        sinon.stub(DbQueries.prototype, 'getTransactions').returns(Promise.resolve([{},{}]));
        sinon.stub(FeedbackRuleGenerator.prototype, 'processTransaction').returns(Promise.resolve());

        return impl.run(event, params, services)
            .then(()=>{
                should(DbQueries.prototype.getTransactions.callCount).eql(1);
                should(FeedbackRuleGenerator.prototype.processTransaction.callCount).eql(2);
            })
    }); 
});

