'use strict';

const CalcGBR = require('../../lib/regionSpecificTax/CalcGBR');
const Big = require('bignumber.js');
const should = require('should');
const sinon = require('sinon');
const _ = require('underscore');


describe('@sage/bc-processing-rules.CalcGBR', function () {
    var sandbox;

    before(function () {
        sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
        sandbox.restore();
    });

    describe('calc tax for GBR', function () {
        describe('Calculate and check range of values', function () {
            var toValue = 9999;
            it('should calculate tax when supplied gross and tax perc for all values from 0.01 to ' + toValue / 100 + ' at 20%', function (done) {
                var errCount = 0;
                _.times(toValue + 1, function (i) {
                    var bGross = new Big(i).div(100);
                    try {
                        var result = CalcGBR.calcTAX(bGross.toNumber(), 20);
                        var bNet = new Big(result.net);
                        var bVat = new Big(result.tax);
                        var bNetAndTax = bNet.plus(bVat);
                        //console.log('Gross:' + bGross.toNumber() + ' bNet:' + bNet.toNumber() + ' bVat:' + bVat.toNumber() + ' summed: ', bNetAndTax.toNumber());
                        bNetAndTax.toNumber().should.equal(bGross.toNumber());
                    }
                    catch (err) {
                        errCount++;
                        done(new Error('Check every value failed'))
                    }
                });
                if (errCount === 0) {
                    done();
                }
                else {
                    done(new Error('Check every value failed'))
                }
            });

            it('should calculate tax when supplied gross and tax perc for all values from 0.01 to ' + toValue / 100 + ' at 17.5%', function (done) {
                var errCount = 0;
                _.times(toValue + 1, function (i) {
                    var bGross = new Big(i).div(100);
                    try {
                        var result = CalcGBR.calcTAX(bGross.toNumber(), 17.5);
                        var bNet = new Big(result.net);
                        var bVat = new Big(result.tax);
                        var bNetAndTax = bNet.plus(bVat);
                        //console.log('Gross:' + bGross.toNumber() + ' bNet:' + bNet.toNumber() + ' bVat:' + bVat.toNumber() + ' summed: ', bNetAndTax.toNumber());
                        bNetAndTax.toNumber().should.equal(bGross.toNumber());
                    }
                    catch (err) {
                        console.log('Failed', err);
                        errCount++;
                        done(new Error('Check every value failed'))
                    }
                });
                if (errCount === 0) {
                    done();
                }
                else {
                    done(new Error('Check every value failed'))
                }
            });
        });
    });
});

