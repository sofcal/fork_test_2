const ParameterService = require('internal-parameter-service');

// create and return any services that you'll need in your impl.
//  NOTE: db service is created automatically in handler.js
module.exports = ({ env, region, params }) => {
    const paramPrefix = `/${env}/`;
    return {
        parameter: ParameterService.Create({ env: { region }, paramPrefix })
    };
};
