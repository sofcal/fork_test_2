const getBanksInfo = require('./getBanksInfo');
const getManualUploads = require('./getManualUploads');
const getTransactionSyncs = require('./getTransactionSyncs');
const parseCSV = require('./parseCSV');

const { tasks } = require('../resources');

module.exports[tasks.bank_info] = getBanksInfo;
module.exports[tasks.manual_upload] = getManualUploads;
module.exports[tasks.transaction_sync] = getTransactionSyncs;
module.exports[tasks.parse_csv] = parseCSV;
