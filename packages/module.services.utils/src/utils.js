/* eslint-disable no-param-reassign */

'use strict';

const { StatusCodeError, StatusCodeErrorItem } = require('@sage/bc-common-statuscodeerror');
const httpMethod = require('@sage/bc-framework-httpmethod');
const resources = require('@sage/bc-common-resources');

const _ = require('underscore');
const Promise = require('bluebird');

const servicesUtils = {
    wrapServiceFunctionSetUp(ApplicationError) {
        return Promise.method((service, func, args) => {
            args = Array.prototype.slice.call(args);

            return func.apply(service, args)
                .catch((err) => {
                    if (err instanceof StatusCodeError) {
                        throw err;
                    }

                    if (err instanceof ApplicationError) {
                        const items = _.map(err.items, (item) => StatusCodeErrorItem.Create(item.code || null, item.message, item.params));
                        throw StatusCodeError.Create(items, err.statusCode);
                    }

                    throw StatusCodeError.Create([StatusCodeErrorItem.Create(resources.services.common.UnknownErrorCode, err.message)], 400, err.stack);
                });
        });
    },

    ensureId(query) {
        // not all databases use the same property name for the object id but all our apps use uuid as the name. To
        // handle this, the framework converts from uuid to the required key name and back each time a db call is
        // made. For custom service functions, this needs done too, but there's currently no pass through in the
        // framework for it, so this is a temporary fix.

        if (query.where.uuid) {
            query.where._id = query.where.uuid;
            delete query.where.uuid;
        }
    },

    extend(destination, source, method, keys, readOnlyKeys) {
        // first, we need to filter any value from the source object that doesn't belong on this Type. The allowable
        // values are different if we're updating an existing object, than if we're creating a new one
        source = _.pick(source, keys);

        // if we're only interested in keeping the readonly fields, we need to strip all other fields from the
        // destination object. That way if they're not provided on the source, the object won't validate.
        if (method === httpMethod.put) {
            destination = _.pick(destination, readOnlyKeys);
        }

        return _.extendOwn({}, destination, source);
    },

    addSingleIfPresent(where, query, qKey, wKey = qKey) {
        if (query[qKey]) {
            where[wKey] = query[qKey];
        }
    },

    addInIfPresent(where, query, qKey, wKey = qKey) {
        if (query[qKey]) {
            if (_.isArray(query[qKey])) {
                where[wKey] = { $in: query[qKey] };
            } else {
                where[wKey] = { $in: query[qKey].split(',') };
            }
        }
    },
};

module.exports = servicesUtils;
