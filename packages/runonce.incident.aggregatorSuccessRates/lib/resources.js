module.exports = {
    dbs: {
        bc: 'bank_db',
        ap: 'admin_db'
    },
    tasks: {
        manual_upload: 'manual_upload',
        transaction_sync: 'transaction_sync',
        bank_info: 'bank_info',
        parse_csv: 'parse_csv'
    },
    countryCodes: {
        irl: 'IRL',
        gbr: 'GBR',
        fra: 'FRA',
        esp: 'ESP'
    },
    aggregators: {
        yodlee: 'yodlee',
        plaid: 'plaid',
        demo: 'demo',
        siss: 'siss'
    }
};