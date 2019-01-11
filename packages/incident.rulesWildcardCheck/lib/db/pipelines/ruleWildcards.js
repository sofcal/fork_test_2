'use strict';

// project

// internal modules

// external modules
const _ = require('underscore');

module.exports = () => {
    return [
        // find rule buckets that contain at least 1 rule with multiple consecutive * characters
        { $match: { 'rules.ruleConditions.ruleCriteria': /.*\*\*.*?/i } },
        // unwind those buckets so we have a single document per rule
        { $unwind: { path: '$rules' } },
        // and further reduce those so we only have the actual rules with consecutive * characters
        { $match: { 'rules.ruleConditions.ruleCriteria': /.*\*\*.*?/i } },
        // filter out the properties we don't care about (as they're no use to us) - we don't include the ruleNarrative
        // in this result because it could be PII
        {
            $project: {
                _id: '$bankAccountId',
                organisationId: 1,
                bucketId: '$_id',
                ruleId: '$rules.uuid',
                region: 1
            }
        },
        // group up the results so we have a single document per bank account which includes some useful information for
        // when we go to fix this data
        {
            $group: {
                _id: {
                    _id: '$_id',
                    organisationId: '$organisationId',
                    region: '$region'
                },
                buckets: { $addToSet: '$bucketId' },
                rules: { $addToSet: '$ruleId' }
            }
        },
        // and just restructure the object to have more appropriate keys
        {
            $project: {
                _id: '$_id._id',
                organisationId: '$_id.organisationId',
                region: '$_id.region',
                buckets: '$buckets',
                rules: '$rules'
            }
        }
    ];
};
