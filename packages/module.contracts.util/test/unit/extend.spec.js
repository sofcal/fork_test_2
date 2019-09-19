'use strict';

const extend = require('../../lib/extend');
const should = require('should');

describe('@sage/bc-contracts-util.extend', function() {
    it('should should merge destination and source into a single object', () => {
        const source = { sk1: 'sv1', sk2: 'sv2' };
        const destination = { dk1: 'dv1', dk2: 'dv2' };
        const expected = { dk1: 'dv1', dk2: 'dv2', sk1: 'sv1', sk2: 'sv2' };

        should(extend({ destination, source })).eql(expected);
    });

    it('should should give priority to values on the source', () => {
        const source = { sk1: 'sv1', sk2: 'sv2', shared1: 'shared1' };
        const destination = { dk1: 'dv1', dk2: 'dv2', shared1: 'shared2' };
        const expected = { dk1: 'dv1', dk2: 'dv2', sk1: 'sv1', sk2: 'sv2', shared1: 'shared1' };

        should(extend({ destination, source })).eql(expected);
    });

    it('should filter out source properties not in sourceWhitelist', () => {
        const sourceWhitelist = ['sk1'];
        const source = { sk1: 'sv1', sk2: 'sv2' };
        const destination = { dk1: 'dv1', dk2: 'dv2' };
        const expected = { dk1: 'dv1', dk2: 'dv2', sk1: 'sv1' };

        should(extend({ destination, source, sourceWhitelist })).eql(expected);
    });

    it('should should use the property on destination if it is filtered from source', () => {
        const sourceWhitelist = ['sk1', 'sk2'];
        const source = { sk1: 'sv1', sk2: 'sv2', shared1: 'shared1' };
        const destination = { dk1: 'dv1', dk2: 'dv2', shared1: 'shared2' };
        const expected = { dk1: 'dv1', dk2: 'dv2', sk1: 'sv1', sk2: 'sv2', shared1: 'shared2' };

        should(extend({ destination, source, sourceWhitelist,  })).eql(expected);
    });

    it('should filter out destination properties not in destinationWhitelist', () => {
        const destinationWhitelist = ['dk2'];
        const source = { sk1: 'sv1', sk2: 'sv2' };
        const destination = { dk1: 'dv1', dk2: 'dv2' };
        const expected = { dk2: 'dv2', sk1: 'sv1', sk2: 'sv2' };

        should(extend({ destination, source, destinationWhitelist })).eql(expected);
    });

    it('should filter both objects', () => {
        const sourceWhitelist = ['sk1'];
        const destinationWhitelist = ['dk2'];
        const source = { sk1: 'sv1', sk2: 'sv2', shared1: 'shared1' };
        const destination = { dk1: 'dv1', dk2: 'dv2', shared1: 'shared2' };
        const expected = { dk2: 'dv2', sk1: 'sv1' };

        should(extend({ destination, source, sourceWhitelist, destinationWhitelist })).eql(expected);
    });
});
