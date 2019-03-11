const ParameterService = require('@sage/bc-services-parameter');

// create and return any services that you'll need in your impl.
//  NOTE: db service is created automatically in @sage/bc-default-lambda-handler/Handler.js
module.exports = ({ env, region, params }) => {
    const paramPrefix = `/${env}/`;

    return {
        parameter: ParameterService.Create({ env: { region }, paramPrefix })
    };
};
