const should = require('should');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const imported = require('../../lib/authenticate');
const utils  = require('../../lib/utils');

const { Authenticate } = imported;

describe('module-jwt-authenticator.authenticate', function(){
    const logger = {
        info: (msg) => console.log(msg),
        warn: (msg) => console.log(msg),
        error: (msg) => console.error(msg),
    };
    let jwtDecodeStub;
    let storeServiceSpy;
    const certs = {
        kid1: [
            'cert1',
            'cert2',
        ],
        kid2: [
            'cert3',
            'cert4',
        ],
    };
    const storeService = {
        getCache: () => certs,
    };
    const storeServiceErrors = {
        getCache: () => {throw new Error('getCertListError')},
    };

    before(() => {
        jwtDecodeStub = sinon.stub(jwt, 'decode');
        storeServiceSpy = sinon.spy(storeService, 'getCache');
    });

    afterEach(() => {
       jwtDecodeStub.resetHistory();
    });

    after(() => {
        sinon.restore();
    });

    it('should export the correct modules', () => {
        imported.should.have.only.keys('Authenticate');
    });

    describe('Authenticate.constructor', () => {
        it('should be able to create new authenticate object', () => {
            const test = new Authenticate({
                validIssuers: ['valid issuer'],
                storeService: { name: 'store service'},
            }, logger);

            test.should.be.Object();
            test.should.be.instanceof(Authenticate);
        });
        // afterEach(() => {
        //     jwtDecodeStub.resetHistory();
        // });

        // it('should be able to create new authenticate object', () => {
        //     jwtDecodeStub.returns({
        //         exp: Infinity,
        //         iss: 'valid issuer',
        //         kid: '12345',
        //     });

        //     const test = new Authenticate({
        //         authToken: 'authToken',
        //         validIssuers: ['valid issuer'],
        //         storeService: { name: 'store service'},
        //     }, logger);

        //     test.should.be.Object();
        //     test.should.be.instanceof(Authenticate);
        //     should.strictEqual(jwtDecodeStub.calledOnce, true);
        // });

        // it('should throw an error if jwt decode returns null', () => {
        //     jwtDecodeStub.returns(null);

        //     should.throws(() => new Authenticate({
        //         authToken: 'authToken',
        //         validIssuers: ['valid issuer'],
        //         storeService: { name: 'store service'},
        //     }, logger), /invalidAuthToken/);
        //     should.strictEqual(jwtDecodeStub.calledOnce, true);
        // });

        // it('should default logger when not passed in', () => {
        //     jwtDecodeStub.returns({
        //         exp: Infinity,
        //         iss: 'valid issuer',
        //         kid: '12345',
        //     });

        //     const test = new Authenticate({
        //         authToken: 'authToken',
        //         validIssuers: ['valid issuer'],
        //         storeService: { name: 'store service'},
        //     });
    
        //     (test.logger).should.be.a.Object();
        //     (test.logger).should.have.properties(['info', 'warn', 'error']);
        //     should.equal(test.logger.error(), undefined);
        // });
    });


    describe('Authenticate.validate', () => {
        let validateTokenStub;

        before(() => {
            validateTokenStub = sinon.stub(utils, 'validateToken');
        });

        after(() => {
            validateTokenStub.reset();
        })

        it('should return true if validateToken passes ', () => {
            validateTokenStub.returns(true);

            const test = new Authenticate({
                validIssuers: ['test'],
                storeService: { name: 'store service'},
            }, logger);

            test.validate().should.be.true();
        });

        it('should throw error if validate fails ', () => {
            // jwtDecodeStub.returns({
            //    exp: Infinity,
            //    iss: 'test',
            //    kid: '12345',
            // });
            const errMsg = 'failValidate';
            validateTokenStub.throws(() => new Error(errMsg));

            const test = new Authenticate({
                validIssuers: ['test'],
                storeService: { name: 'store service'},
            }, logger);

            should.throws(() => test.validate(), /^Error: failValidate$/);
        });
    });

    describe('Authenticate.populateCertList', () => {
        let test;
        const kid = 'kid1';
        before(() => {
            jwtDecodeStub.returns({
                exp: Infinity,
                iss: 'test',
                kid,
            });

            test = new Authenticate({
                authToken: 'authToken',
                validIssuers: ['valid issuer'],
                storeService: storeService,
            }, logger);
        });

        it('should call store service populateCertList method', () => {
            const result = test.populateCertList();

            result.should.be.Promise();
            return result.then(() => (storeServiceSpy.called).should.be.true());
        });

        it('should populate store cert keys', () => {
            const result = test.populateCertList();
            return result
                .then((res) => res.should.eql(certs[kid]))
                .then(() => test.certKeys.should.eql(certs[kid]))
        });

        it('should reject promise if error thrown', () => {
            test = new Authenticate({
                authToken: 'authToken',
                validIssuers: ['valid issuer'],
                storeService: storeServiceErrors,
            }, logger);

            const result = test.populateCertList(true);
            return result.should.be.rejectedWith('getCertListError');
        });
    });

    describe('Authenticate.checkAuthorisation', () => {
        let test;
        let anyValidStub;

        const kid = 'kid1';
        before(() => {
            jwtDecodeStub.returns({
                exp: Infinity,
                iss: 'test',
                kid,
            });

            test = new Authenticate({
                authToken: 'authToken',
                validIssuers: ['valid issuer'],
                storeService: storeService,
            }, logger);

            anyValidStub = sinon.stub(utils, 'anyValid');
        });

        const populateCertListSpy = sinon.spy(Authenticate.prototype, 'populateCertList');
        it('should call populateCertList method', () => {
            anyValidStub.returns(true);

            return test.checkAuthorisation()
                .then(() => (populateCertListSpy.called).should.be.true());
        });

        it('should return Authorised if valid token found', () => {
            anyValidStub.returns(true);

            return test.checkAuthorisation()
                .then((res) => res.authorised.should.equal(true));
        });

        it('should reject promise if no valid token found', () => {
            anyValidStub.returns(false);

            return (test.checkAuthorisation()).should.be.rejectedWith('AuthFailed');
        });
    });
});
