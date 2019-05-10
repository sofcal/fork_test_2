const index = require('../../../lib/helpers');
const createKeyPair = require('../../../lib/helpers/createKeyPair');
const createParams = require('../../../lib/helpers/createParams');

describe('@sage/sfab-s2s-jwt-certificaterotation-lambda.helpers.index', function() {
    it('should export the correct modules', () => {
        should(index).eql({ createKeyPair, createParams });
    });
});
