const Step = require('../../src/index');
const should = require('should');

describe.only('@sage/bc-services-s3.index', function(){
    // ensures all files are evaluated for test coverage
    it('should do nothing', () => {
        const stepService = Step.Create({ region: 'eu-west-1' });

        const id = 'arn:aws:states:eu-west-1:277381856145:stateMachine:step_av_test';
        const input = JSON.stringify({ key: 'value' });

        return stepService.start({ id, input }, {})
            .then((executionArn) => {
                console.log('____EXECUTION_ARN', executionArn);
                return stepService.describe({ id: executionArn }, {})
                    .then(() => {

                    })
            })
    });
});