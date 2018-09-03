'use strict';

const _ = require('underscore');
const { toStatusCodeError } = require('internal-jsonschema-to-statuscodeerror');
const { Validator } = require('jsonschema');
const schema = require('./schema');

const validator = new Validator();
validator.addSchema(schema);

const delimiter = ' ';

class NarrativeDictionary {
    constructor(data) {
        if (data) {
            this.data = data;
        }
    }

    validate() {
        NarrativeDictionary.validate(this);
    }

    matches(narrative) {
        const matches = [];
        let longest = '';
        let longestSplitLength = -1;

        const checkSplits = (splits) => {
            let ref = this.data;

            _.find(splits, (split, i) => { // use find so we can short circuit when the search ends
                if (!ref[split]) {
                    return true; // to end the search
                }

                ref = ref[split];

                if (ref.$terminate) {
                    matches.push(ref.$terminate);

                    if (i > longestSplitLength) {
                        longest = ref.$terminate;
                        longestSplitLength = i;
                    }
                }

                return false;
            });

            if (splits.length > 1) {
                checkSplits(_.rest(splits));
            }
        };

        checkSplits(narrative.split(delimiter));

        return { matches, longest };
    }

    static validate(narrativeDictionary) {
        const result = validator.validate(narrativeDictionary, schema, { throwError: false, propertyName: NarrativeDictionary.name });

        // StatusCodeError.Create([StatusCodeErrorItem.Create('InvalidProperties', 'NarrativeDictionary.data: undefined', { data: undefined })], 400);
        const error = toStatusCodeError(result, NarrativeDictionary, narrativeDictionary);

        if (error) {
            throw error;
        }
    }

    static CreateFromList(list) {
        const data = {};

        _.each(list, (item) => {
            // keep track of the object we're modifying. We'll change this with each split
            let ref = data;

            // split the string by the delimiter, this will give us the words we'll create nested objects for
            const splits = item.split(delimiter);
            const last = splits.length - 1;
            _.each(splits, (split, i) => {
                if (!ref[split]) {
                    ref[split] = {};
                }

                if (i === last && !ref[split].$terminate) {
                    ref[split].$terminate = item;
                } else {
                    ref = ref[split];
                }
            });
        });

        return new NarrativeDictionary(data);
    }
}

module.exports = NarrativeDictionary;
