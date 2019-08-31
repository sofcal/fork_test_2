'use strict';

const { createFilters } = require('@sage/bc-contracts-util');

/**
 * List of Rule properties and flags to state whether they can be created or updated via a client of the API.
 * NOTE: These settings are limitations applied to the CALLER of the API, NOT the API modules themselves. Internal code
 *  can modify any value at any time
 * @type {*[]}
 */

class FilterKeys {}

FilterKeys.settings = Object.freeze([
    // these fields can neither be created nor modified by the API client
    Object.freeze({ canCreate: false, canUpdate: false, canReturn: false, id: 'created' }),
    Object.freeze({ canCreate: false, canUpdate: false, canReturn: false, id: 'updated' }),
    Object.freeze({ canCreate: false, canUpdate: false, canReturn: false, id: 'etag' }),

    Object.freeze({ canCreate: false, canUpdate: false, canReturn: true, id: 'uuid' }),
    Object.freeze({ canCreate: false, canUpdate: false, canReturn: false, id: 'targetType' }),
    Object.freeze({ canCreate: false, canUpdate: false, canReturn: false, id: 'productId' }),
    Object.freeze({ canCreate: false, canUpdate: false, canReturn: false, id: 'globalRuleId' }),
    Object.freeze({ canCreate: false, canUpdate: false, canReturn: false, id: 'ruleCounts' }),

    // these fields can be created and updated by the API client
    Object.freeze({ canCreate: true, canUpdate: true, canReturn: true, id: 'ruleName' }),
    Object.freeze({ canCreate: true, canUpdate: true, canReturn: true, id: 'ruleRank' }),
    Object.freeze({ canCreate: true, canUpdate: true, canReturn: true, id: 'ruleConditions' }),
    Object.freeze({ canCreate: true, canUpdate: true, canReturn: true, id: 'ruleActions' }),
    Object.freeze({ canCreate: true, canUpdate: true, canReturn: true, id: 'ruleAdditionalFields' }),
    Object.freeze({ canCreate: true, canUpdate: true, canReturn: true, id: 'status' }),
    Object.freeze({ canCreate: true, canUpdate: true, canReturn: true, id: 'entities' }),

    // these fields can be created but not updated by the API client
    Object.freeze({ canCreate: true, canUpdate: false, canReturn: true, id: 'ruleType' }),
]);

const filters = createFilters(FilterKeys.settings);
FilterKeys.post = filters.post;
FilterKeys.update = filters.update;
FilterKeys.readOnly = filters.readOnly;
FilterKeys.returned = filters.returned;

module.exports = FilterKeys;
