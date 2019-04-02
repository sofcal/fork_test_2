const JwtAuthenticatorLambda = require('../../lib/JwtAuthenticatorLambda');

const { JwtAuthenticator } = require('@sage/sfab-s2s-jwt-authenticator');
const { EndpointsStore } = require('@sage/sfab-s2s-jwt-endpoint-store');

const validate = require('../../lib/validators');

const should = require('should');
const sinon = require('sinon');

describe('jwt-authenticator.handler', function() {
    let sandbox;
    let validateConfigStub;
    let validateEventStub;
    let JwtAuthenticatorStub;

    const logger = {
        info: (msg) => console.log(msg),
        warn: (msg) => console.log(msg),
        error: (msg) => console.error(msg),
    };

    before(() => {
        sandbox = sinon.createSandbox();
        validateConfigStub = sinon.stub(validate, 'config');
        validateEventStub = sinon.stub(validate, 'event');
        sinon.stub(EndpointsStore, 'Create').returns({});
        JwtAuthenticatorStub = sinon.stub(JwtAuthenticator.prototype, 'checkAuthorisation');
        sinon.stub(JwtAuthenticator, 'Create').returns({});
    });

    afterEach(() => {
        sandbox.restore();
    });

    const hostname = 'https://www.testjwt.com';
    const serviceMappings = {
        'sage.serv1': `${hostname}/serv1`,
        'sage.serv2': `${hostname}/serv2`,
        'sage.serv3': 'invalid',
    };
    const config = { cacheExpiry: -1, refreshDelay: 100, serviceMappings: JSON.stringify(serviceMappings) }
    const test = JwtAuthenticatorLambda.Create( {config} );
    describe('JwtAuthenticator.constructor', function () {
        it('should create a new instance', () => {
            return test.should.be.instanceOf(JwtAuthenticatorLambda);
        });
    });

    describe('JwtAuthenticator.validator', function () {
        it('should call event and config validators', () => {
            validateConfigStub.returns(true);
            validateEventStub.returns(true);
            test.validate(undefined, {logger});
            (validateConfigStub.calledOnce).should.be.true();
            (validateEventStub.calledOnce).should.be.true();
        });

    });

    describe('JwtAuthenticator.init', function () {
        const init = test.init( { authToken: 'token' },  { logger });
        it('should return a promise', () => {
            init.should.be.a.Promise();
        });
        it('should return true', () => {
            return init.then((res) => res.should.be.true())
        });
        it('should default service mappings if not populated', () => {
            const testdefault = JwtAuthenticatorLambda.Create( { config: Object.assign( {} , config, { serviceMappings: undefined }) });
            const initdefault = testdefault.init( { authToken: 'token' },  { logger });
            initdefault.should.be.a.Promise();
            return initdefault.then((res) => {
                res.should.be.true()
            })
        })        
    });

    describe('JwtAuthenticator.impl', function () {
        before( () => {
            JwtAuthenticatorStub.resolves({ authResult : true })
        })
        const event = {
            logger,
            authorizationToken: 'Bearer test',
        }
        it('should return a promise', () => {
            const impl = test.impl(event);
            impl.should.be.a.Promise();
            return impl.then((data) => {
                data.result.authResult.should.be.true()
            })
        });
    });

    describe('JwtAuthenticator.buildResponse', function () {
        const claims = { testKey: true };
        const token = 'test';

        let [err, policy ] = test.buildResponse({ result: { claims }, headers: {}, token }, { logger })

        it('should not return an error', () => {
            should.not.exist(err);
        });

        it('should return policy', () => {
           policy.should.have.keys('context', 'policyDocument');
           policy.context.should.have.keys('testKey');
           policy.context.token.should.eql('test')
        });

        it('should default headers if not passed', () => {
        [err, policy ] = test.buildResponse({ result: { claims }, token }, { logger })
           policy.should.have.keys('context', 'policyDocument');
           policy.context.should.have.keys('testKey');
           policy.context.token.should.eql('test')
        });
            
    });

    describe('JwtAuthenticator.buildErrorResponse', function () {
        it('should return unauthorized', () => {
            (test.buildErrorResponse()).should.deepEqual(['Unauthorized']);
        });

    });

});
