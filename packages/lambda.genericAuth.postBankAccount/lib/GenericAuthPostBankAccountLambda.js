const validate = require('./validators');
const { Handler } = require('@sage/bc-independent-lambda-handler');

class GenericAuthPostBankAccountLambda extends Handler{
    constructor(config) {
        super(config);
        console.log('AG TEST - Constructor Hit');

        this.cache = null;
        this.issuer = null;
    }

    static Create(...args) {
        console.log('AG TEST - Create Hit');
        return new GenericAuthPostBankAccountLambda(...args);
    }

    validate(event, debug) {
        console.log('AG TEST - Validate Hit');
        validate.config(this.config, debug);
        validate.event(event, debug);

        return super.validate(event, debug);
    }

    init(event, {Logger}) {
        console.log('AG TEST - Init Hit');
        const func = `${GenericAuthPostBankAccountLambda.name}.init`;
        event.logger.info({ function: func, log: 'started' });

        return Promise.resolve(undefined)
            .then(() => {
                event.logger.info({ function: func, log: 'ended' });
                return { statusCode: 200, body: 'Success' };
            });
    }

    impl(event) {
        // TODO: Understand what event looks like
        console.log('AG TEST - Init Hit');
        const func = `${GenericAuthPostBankAccountLambda.name}.impl`;
        event.logger.info({ function: func, log: 'started' });

        // TODO: Implement me
        return Promise.resolve(undefined)
            .then(() => {
                console.log('AG TEST - Event: ', JSON.stringify(event.Records[0].cf.response.body.someKey));
                event.logger.info({ function: func, log: 'ended' });
                return { statusCode: 200, body: 'Success' };
            });
    }

    buildResponse({statusCode, body}, { logger }) {
        console.log('AG TEST - Build Response Hit');
        console.log(`AG TEST -  statusCode: ${statusCode} - body: ${body}`);
        const func = `${GenericAuthPostBankAccountLambda.name}.buildResponse`;
        logger.info({ function: func, log: 'started' });
        logger.info({ function: func, log: 'building response' });
        logger.info({ function: func, log: 'ended' });
        return {statusCode, body};
    }
}

module.exports = GenericAuthPostBankAccountLambda;
