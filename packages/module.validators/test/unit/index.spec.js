const index = require('../../lib/index');
const { validateTypeNoThrow } = require('../../lib/validateType');
const {
    validateContractObject,
    validateContractObjectNoThrow,
} = require('../../lib/validatorContractObject');
const should = require('should');

describe('@sage/bc-validators.index', () => {
    it('should export the correct modules', () => {
        should(index).eql({
            validateTypeNoThrow,
            validateContractObject,
            validateContractObjectNoThrow,
        });
    });
});
