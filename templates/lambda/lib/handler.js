const impl = require('./impl');

module.exports.emailMetaData = (event, context, callback) => {
    return Promise.resolve()
    // .then(() => ParameterCache.instance.load())
        .then(() => {
            const params = {
                originator: '17b42886-68e5-45ea-af23-bc0c932831a8',
                merchantId: 'eea366bf-ce94-4349-ba97-07c3102f785f',
                displayId: 'f534ed0e-647c-472e-a6e8-f3321aafde72',
                heroImage: 'https://s3-eu-west-1.amazonaws.com/wpb-dev2/secure.png'
            };

            return impl.run(event, params)
        })
        .then((ret) => {
            const response = {
                statusCode: 200,
                body: JSON.stringify(ret)
            };

            console.log('sending response');
            callback(null, response);
        })
        .catch((err) => {
            console.log(err);
            callback(null, { statusCode: 400, body: JSON.stringify({ error: 'an error occurred while processing the request' }) });
        })
};