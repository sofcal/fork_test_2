﻿var pipeline = (skip, limit) => {
    return [{ $skip: skip }, { $limit: limit }, {
        $project: {
            _id: 1,
            productId: { $arrayElemAt: ['$products.productId', 0] },
            crmId: 1,
            licenseHash: 1,
            created: 1
        }
    }, {
        $lookup: {
            from: 'Product',
            localField: 'productId',
            foreignField: '_id',
            as: 'productLookup'
        }
    }, { $unwind: { path: '$productLookup', preserveNullAndEmptyArrays: true } }, {
        $project: {
            _id: 1,
            crmId: 1,
            licenseHash: 1,
            productId: 1,
            productHeader: '$productLookup.header',
            created: { $dateToString: { format: '%Y-%m-%dT%H:%M:%S:%LZ', date: '$created' } },
            createdDate: { $dateToString: { format: '%Y-%m-%d', date: '$created' } }
        }
    }, {
        $group: {
            _id: 1,
            organisations: {
                $addToSet: {
                    organisationId: '$_id',
                    organisationCrmId: '$crmId',
                    organisationLicenseHash: '$licenseHash',
                    productId: '$productId',
                    productHeader: '$productHeader',
                    organisationCreated: '$created',
                    organisationCreatedDate: '$createdDate'
                }
            }
        }
    }];
};

var options = { allowDiskUse: true };

var pageSize = 25000;

var orgCount = db.getCollection('Organisation').count();
var orgPages = Math.ceil(orgCount / pageSize);

print('ORG_COUNT/ORG_PAGES:', orgCount, orgPages);

var allOrgs = [];
for(let i = 0; i < orgPages; ++i) {
    var result = db.getCollection('Organisation').aggregate(pipeline(i * pageSize, pageSize), options).toArray();
    allOrgs.push(...result[0].organisations);
}

printjson(allOrgs);

var orgExtCount = db.getCollection('OrganisationExt').count();
var orgExtPages = Math.ceil(orgExtCount / pageSize);

print('ORG_EXT_COUNT/ORG_EXT_PAGES:', orgExtCount, orgExtPages);

var allOrgExts = [];
for(let i = 0; i < orgExtPages; ++i) {
    var result = db.getCollection('OrganisationExt').aggregate(pipeline(i * pageSize, pageSize), options).toArray();
    allOrgExts.push(...result[0].organisations);
}

printjson({ organisations: allOrgExts });