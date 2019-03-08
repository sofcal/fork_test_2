'use strict';

const timer = require('../../lib/timer');
const sinon = require('sinon');
const should = require('should');

describe('@sage/bc-debug-utils.timer', function() {
    let sandbox;

    before(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('start', () => {
        it('should create a timer', () => {
            const hr = {};

            sandbox.stub(process, 'hrtime').returns(hr);

            timer.start();

            should(process.hrtime.callCount).eql(1);
            should(process.hrtime.calledWithExactly(
                // no args
            )).eql(true);
        });
    });

    describe('end', () => {
        it('should end a timer and return the value', () => {
            const hr = {};

            sandbox.stub(process, 'hrtime').returns([1, 1000000]);
            sandbox.stub(console, 'log');

            const actual = timer.end(hr, { factor: 1000, suffix: 's' });

            should(process.hrtime.callCount).eql(1);
            should(process.hrtime.calledWithExactly(
                hr
            )).eql(true);

            should(actual).eql(1.001);
        });

        it('should modify the result by the factor', () => {
            const hr = {};

            sandbox.stub(process, 'hrtime').returns([1, 1000000]);
            sandbox.stub(console, 'log');

            const actual = timer.end(hr, { factor: 1, suffix: 's' });

            should(process.hrtime.callCount).eql(1);
            should(process.hrtime.calledWithExactly(
                hr
            )).eql(true);

            should(actual).eql(1001);
        });

        it('should end a timer and print the result', () => {
            const hr = {};

            sandbox.stub(process, 'hrtime').returns([1, 1000000]);
            sandbox.stub(console, 'log');

            timer.end(hr, { factor: 1000, suffix: 's' });

            should(process.hrtime.callCount).eql(1);
            should(process.hrtime.calledWithExactly(
                hr
            )).eql(true);

            should(console.log.callCount).eql(1);
            should(console.log.calledWithExactly(
                'TIME_TAKEN: 1.001s'
            )).eql(true);
        });

        it('should not log if skipLog is true', () => {
            const hr = {};

            sandbox.stub(process, 'hrtime').returns([1, 1000000]);
            sandbox.stub(console, 'log');

            timer.end(hr, { factor: 1000, suffix: 's', skipLog: true });

            should(process.hrtime.callCount).eql(1);
            should(process.hrtime.calledWithExactly(
                hr
            )).eql(true);

            should(console.log.callCount).eql(0);
        });

        it('should default suffix to ms', () => {
            const hr = {};

            sandbox.stub(process, 'hrtime').returns([1, 1000000]);
            sandbox.stub(console, 'log');

            timer.end(hr, { factor: 1000 });

            should(console.log.callCount).eql(1);
            should(console.log.calledWithExactly(
                'TIME_TAKEN: 1.001ms'
            )).eql(true);
        });

        it('should default factor to 1', () => {
            const hr = {};

            sandbox.stub(process, 'hrtime').returns([1, 1000000]);
            sandbox.stub(console, 'log');

            timer.end(hr, { });

            should(console.log.callCount).eql(1);
            should(console.log.calledWithExactly(
                'TIME_TAKEN: 1001ms'
            )).eql(true);
        });
    });
});
