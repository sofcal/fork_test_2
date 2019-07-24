'use strict';

const FuzzyAccess = require('../../lib/FuzzyAccess');
const sinon = require('sinon');
const should = require('should');

describe('@sage/bc-util-fuzzyaccess.FuzzyAccess', function() {
    let sandbox;
    let testObject;

    before(() => {
        sandbox = sinon.createSandbox();

        testObject = {
            property1: 'value1',
            PropErTy2: 'VaLue2',
            Property3: {
                Property3Nested1: 'value3',
                property3nested2: 'value4',
                PROPERTY3NESTED3: 'value4',
                property3Nested4: [{
                    arrayObject1Property1: 'value5',
                    arrayOBJECT1Property2: 'value6'
                }, {
                    arrayObject2Property1: 'value7',
                    arrayOBJECT2prOPERTY2: {
                        arrayOBJECT2prOPERTY2Nested1: 'value8'
                    }
                },
                'value9',
                ['value10', 'value11']
                ]
            }
        };
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('get', () => {
        it('should get the correct property regardless of case', () => {
            should(FuzzyAccess.Get(testObject, 'PROPERTY1')).eql('value1');
            should(FuzzyAccess.Get(testObject, 'PROPERTy1')).eql('value1');
            should(FuzzyAccess.Get(testObject, 'PROPERty1')).eql('value1');
            should(FuzzyAccess.Get(testObject, 'PROPErty1')).eql('value1');
            should(FuzzyAccess.Get(testObject, 'PROPerty1')).eql('value1');
            should(FuzzyAccess.Get(testObject, 'PROperty1')).eql('value1');
            should(FuzzyAccess.Get(testObject, 'PRoperty1')).eql('value1');
            should(FuzzyAccess.Get(testObject, 'Property1')).eql('value1');
            should(FuzzyAccess.Get(testObject, 'property1')).eql('value1');
        });
    });

    describe('getMany', () => {
        it('should get the correct properties regardless of case', () => {
            should(FuzzyAccess.GetMany(testObject, ['PROPERTY1', 'property2'])).eql({
                PROPERTY1: 'value1',
                property2: 'VaLue2'
            });
        });
    })
});
