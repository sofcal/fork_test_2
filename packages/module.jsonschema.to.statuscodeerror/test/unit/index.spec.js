const index = require('../../lib/index');
const Mapper = require('../../lib/Mapper');

describe('@sage/bc-jsonschema-to-statuscodeerror.index', () => {
    it('should export the correct modules', () => {
        should(index).eql({ Mapper });
    })
});