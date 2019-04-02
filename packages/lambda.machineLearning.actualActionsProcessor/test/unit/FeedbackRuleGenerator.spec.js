const Promise = require('bluebird');
const should = require('should');
const _ = require('underscore');
const impl = require('./../../lib/impl.js')
const DbQueries = require('./../../lib/dbQueries');
const FeedbackRuleGenerator = require('./../../lib/FeedbackRuleGenerator');
const { Rule } = require('@sage/bc-contracts-rule');
const sinon = require('sinon');

describe('lambda-machineLearning-actualActionsProcessor.FeedbackRuleGenerator', function(){
    let logger;
   
    before(()=>{
        const logFunc = (data) => {console.log(JSON.stringify(data))};
        logger =  { info: logFunc, error: logFunc };
    });
    after(()=> {
    });

    afterEach(()=>{
        sandbox.restore();
    });

    beforeEach(()=>{
        sandbox = sinon.sandbox.create();
    });

    describe('processTransaction', () => {
        it('should create a rule from actual action when narrative matches against dictionary', () => {
                
                const dbQueries = {addFeedbackRule: sandbox.stub};
                const feedbackRuleGenerator = new FeedbackRuleGenerator(logger,dbQueries);

                const narrativeDict = { matches: sandbox.stub()};
                narrativeDict.matches.returns({matches: [{}]});
             
                sandbox.stub(FeedbackRuleGenerator.prototype, 'getNarrativeDictionary').returns(Promise.resolve(narrativeDict));
                sandbox.stub(Rule, 'createFromActualAction').returns({});
                sandbox.stub(dbQueries, 'addFeedbackRule').returns(Promise.resolve());
                
                const orgId ='e09c1bbc-75d4-425a-8913-754f64f08524';
                const baId = 'ee905d97-5922-6ddc-33b9-5a83ed280670';
                const tr = {};
                const region = 'GBR';

                return feedbackRuleGenerator.processTransaction(orgId, baId, tr, region).then( () => {
                    should(Rule.createFromActualAction.callCount).eql(1);
                    should(dbQueries.addFeedbackRule.callCount).eql(1);
                });
        });

        it('should not create a rule from action action when narrative does not matc against dictionary', () => {
            const dbQueries = {addFeedbackRule: sandbox.stub};
                const feedbackRuleGenerator = new FeedbackRuleGenerator(logger,dbQueries);

                const narrativeDict = { matches: sandbox.stub()};
                narrativeDict.matches.returns({matches: []}); // no matches
             
                sandbox.stub(FeedbackRuleGenerator.prototype, 'getNarrativeDictionary').returns(Promise.resolve(narrativeDict));
                sandbox.stub(Rule, 'createFromActualAction').returns({});
                sandbox.stub(dbQueries, 'addFeedbackRule').returns(Promise.resolve());
                
                const orgId ='e09c1bbc-75d4-425a-8913-754f64f08524';
                const baId = 'ee905d97-5922-6ddc-33b9-5a83ed280670';
                const tr = {};
                const region = 'GBR';

                return feedbackRuleGenerator.processTransaction(orgId, baId, tr, region).then( () => {
                    should(Rule.createFromActualAction.callCount).eql(0);
                    should(dbQueries.addFeedbackRule.callCount).eql(0);
                });
        });

        it('should not throw if error does not have fail lambda flag', () => {
            let thrown = false;

            const dbQueries = {addFeedbackRule: sandbox.stub};
            const feedbackRuleGenerator = new FeedbackRuleGenerator(logger,dbQueries);

            const narrativeDict = { matches: sandbox.stub()};
            narrativeDict.matches.returns({matches: [{}]}); // no matches
         
            sandbox.stub(FeedbackRuleGenerator.prototype, 'getNarrativeDictionary').returns(Promise.resolve(narrativeDict));
            sandbox.stub(Rule, 'createFromActualAction').throws(new Error('eg. Rule failed validation'));
      
            
            const orgId ='e09c1bbc-75d4-425a-8913-754f64f08524';
            const baId = 'ee905d97-5922-6ddc-33b9-5a83ed280670';
            const tr = {};
            const region = 'GBR';

            return feedbackRuleGenerator.processTransaction(orgId, baId, tr, region).then( () => {
                should(Rule.createFromActualAction.callCount).eql(1);
            })
            .catch((err) =>{
                thrown = true;
            })
            .then(()=>{
                should(thrown).eql(false);
            })
        })

        it('should throw if error hasfail lambda flag', () => {
            let thrown = false;

            const dbQueries = {addFeedbackRule: ()=>{} };
            const failLambdaErr = new Error();
            failLambdaErr.failLambda = true;
            sandbox.stub(dbQueries, 'addFeedbackRule').throws(failLambdaErr);

            const feedbackRuleGenerator = new FeedbackRuleGenerator(logger,dbQueries);
            

            const narrativeDict = { matches: sandbox.stub()};
            narrativeDict.matches.returns({matches: [{}]}); // no matches
         
            sandbox.stub(FeedbackRuleGenerator.prototype, 'getNarrativeDictionary').returns(Promise.resolve(narrativeDict));
            sandbox.stub(Rule, 'createFromActualAction').returns({});
            
            const orgId ='e09c1bbc-75d4-425a-8913-754f64f08524';
            const baId = 'ee905d97-5922-6ddc-33b9-5a83ed280670';
            const tr = {};
            const region = 'GBR';

            return feedbackRuleGenerator.processTransaction(orgId, baId, tr, region).catch((err) =>{
                thrown = true;
            })
            .then(()=>{
                should(thrown).eql(true);
            })
        })
    })

    describe('getNarrativeDictionary', () => {
        it('should return null when narrative dictionary cannot be found', () =>{
            const dbQueries = {getNarrativeDictionary: ()=>{}}
            sandbox.stub(dbQueries, 'getNarrativeDictionary').returns(Promise.resolve(null));
            const feedbackRuleGenerator = new FeedbackRuleGenerator(logger,dbQueries);
            return feedbackRuleGenerator.getNarrativeDictionary('Timbuktu').then((result)=>{
                should(result).eql(null);
            })

        })
        it('should cache fetched dictionaries', () =>{
            const dbQueries = {getNarrativeDictionary: ()=>{}}
            sandbox.stub(dbQueries, 'getNarrativeDictionary').returns(Promise.resolve({data:'{}'}));
            const feedbackRuleGenerator = new FeedbackRuleGenerator(logger,dbQueries);
            return feedbackRuleGenerator.getNarrativeDictionary('GBR').then(()=>{
                return feedbackRuleGenerator.getNarrativeDictionary('GBR').then((result)=>{                
                should(result).not.eql(null);
                should(dbQueries.getNarrativeDictionary.callCount).eql(1);
                });
            });
        })
    })


});

