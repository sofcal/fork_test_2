const index = require('../../lib/index');
const ConfigLoader = require('../../lib/ConfigLoader');
const SecretConfigLoader = require('../../lib/SecretConfigLoader');
const ConfigMergeLoader = require('../../lib/ConfigMergeLoader');
const mocks = require('../../lib/mocks');
const util = require('../../lib/util');
const should = require('should');

describe('@sage/bc-framework-parametercache.configloaders', () => {
    it('should export relevant exports', () => {
        should(index).eql({
            ConfigLoader,
            SecretConfigLoader,
            ConfigMergeLoader,
            mocks,
            util
        });
    });
});
