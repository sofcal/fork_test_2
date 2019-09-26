const index = require('../../lib/index');
const Bank = require('../../lib/Bank');
const should = require('should');

describe('@sage/bc-bank.index', () => {
    it('should export Bank', () => {
        should(index).eql(Bank);
    });
});
