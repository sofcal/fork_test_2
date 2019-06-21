const Kid = require('../../lib/Kid');

describe('@sage/sfab-s2s-jwt-kid.Kid', function() {
    it('should generate a hex string containing a hash', () => {
        const actual = Kid.Generate('some data');
        should(actual).be.a.String().of.length(64);
    });

    it('should generate the same hash repeatedly for the same data', () => {
        const actual = Kid.Generate('some data');
        should(Kid.Generate('some data')).eql(actual);
        should(Kid.Generate('some data')).eql(actual);
        should(Kid.Generate('some data')).eql(actual);
    });

    it('should generate different hashes for different data', () => {
        const actual = Kid.Generate('some data');
        should(Kid.Generate('some date')).not.eql(actual);
        should(Kid.Generate('different data')).not.eql(actual);
        should(Kid.Generate('entirely different')).not.eql(actual);
    })
});