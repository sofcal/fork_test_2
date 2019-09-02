'use strict';

const TaxCalculator = require('../../lib/TaxCalculator');
const should = require('should');
const sinon = require('sinon');
const _ = require('underscore');

describe('@sage/bc-processing-rules.TaxCalculator', function () {
    var sandbox;
    var taxCalc;

    before(function () {
        sandbox = sinon.sandbox.create();
    });

    beforeEach(function () {
        taxCalc = new TaxCalculator();
    });

    afterEach(function () {
        sandbox.restore();
    });

    describe('calc Tax', function () {

        describe('constructor', function () {
            var taxCalc = new TaxCalculator();

            it('should be an instance of TaxCalculation', function (done) {
                try {
                    should(taxCalc).be.an.instanceOf(TaxCalculator);
                    done();
                }
                catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });
        });

        describe('calcTAX', function () {

            it('should calculate tax when supplied gross and tax perc', function (done) {
                try {
                    var result = taxCalc.calcTAX(120, 20)
                    result.net.should.equal(100);
                    result.tax.should.equal(20);
                    done();
                }
                catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
                ;
            });
        });

        describe('gross value checks', function () {

            it('should not throw if gross is zero', function (done) {
                try {
                    var result = taxCalc.calcTAX(0, 20);
                    result.net.should.equal(0);
                    result.tax.should.equal(0);
                    done();
                }
                catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should throw if gross is less than 0', function (done) {
                try {
                    taxCalc.calcTAX(-1, 20);
                    done(new Error('should have thrown'));
                }
                catch (err) {
                    err.message.should.equal('Gross amount must be a positive number greater than zero');
                    done();
                }
            });
        });

        describe('tax percentage checks', function () {

            it('should not throw if tax perc is 100', function (done) {
                try {
                    var result = taxCalc.calcTAX(100, 100);
                    result.net.should.equal(50);
                    result.tax.should.equal(50);
                    done();
                }
                catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should not throw if tax perc is zero', function (done) {
                try {
                    var result = taxCalc.calcTAX(100, 0);
                    result.net.should.equal(100);
                    result.tax.should.equal(0);
                    done();
                }
                catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should throw if tax perc is less than 0', function (done) {
                try {
                    taxCalc.calcTAX(120, -1);
                    done(new Error('should have thrown'));
                }
                catch (err) {
                    err.message.should.equal('Tax percentage must be a positive number - zero or higher');
                    done();
                }
            });

            // Reintroduce when rounding is in
            it('should not throw if tax percentage > 100', function (done) {
                try {
                    var result = taxCalc.calcTAX(100, 200);
                    result.net.should.equal(33.33);
                    result.tax.should.equal(66.67);
                    done();
                }
                catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });
        });

        describe('country code checks', function () {

            it('should throw if country code is not supported', function (done) {
                try {
                    taxCalc.calcTAX(120, 20, 'US');
                    done(new Error('should have thrown'));
                }
                catch (err) {
                    err.message.should.equal('Tax calculation is not supported in this country or region');
                    done();
                }
            });

            it('should not throw if country code is supported', function (done) {
                try {
                    var result = taxCalc.calcTAX(120, 20, 'GBR');
                    result.net.should.equal(100);
                    result.tax.should.equal(20);
                    done();
                }
                catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            })
        });

        describe('edge cases', function () {
            it('should calculate VAT at 1p on 5p Gross', function (done) {
                try {
                    var result = taxCalc.calcTAX(0.05, 20);
                    result.net.should.equal(0.04);
                    result.tax.should.equal(0.01);
                    done();
                }
                catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should calculate VAT at 1p on 4p Gross', function (done) {
                try {
                    var result = taxCalc.calcTAX(0.04, 20);
                    result.net.should.equal(0.03);
                    result.tax.should.equal(0.01);
                    done();
                }
                catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should calculate VAT at 0p on 3p Gross', function (done) {
                try {
                    var result = taxCalc.calcTAX(0.03, 20);
                    result.net.should.equal(0.03);
                    result.tax.should.equal(0);
                    done();
                }
                catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should calculate VAT at 0p on 2p Gross', function (done) {
                try {
                    var result = taxCalc.calcTAX(0.02, 20);
                    result.net.should.equal(0.02);
                    result.tax.should.equal(0);
                    done();
                }
                catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should calculate VAT at 0p on 1p Gross', function (done) {
                try {
                    var result = taxCalc.calcTAX(0.01, 20);
                    result.net.should.equal(0.01);
                    result.tax.should.equal(0);
                    done();
                }
                catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should calculate VAT at 0p on 0p Gross', function (done) {
                try {
                    var result = taxCalc.calcTAX(0.00, 20);
                    result.net.should.equal(0);
                    result.tax.should.equal(0);
                    done();
                }
                catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });
        });
    });
});

