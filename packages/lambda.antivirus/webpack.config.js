const slsw = require('serverless-webpack');
const webpack = require('webpack');
const WebpackPluginCopy = require('webpack-plugin-copy');

const config = {
    entry: slsw.lib.entries,
    target: 'node',
    node: {
        __dirname: false,
    },
    externals: [
        'aws-sdk'
    ],
    module: {
        // rules: [{
        //     test: /\.js$/,
        //     exclude: /node_modules/,
        //     use: [{
        //         loader: 'babel-loader',
        //         options: {
        //             presets: ["es2015", "stage-0"]
        //         }
        //     }],
        // }],
    },
    plugins: [
        new WebpackPluginCopy([
            { from: 'bin', to: 'bin', copyPermissions: true },
            { from: 'lib64', to: 'lib64', copyPermissions: true },
        ])
    ]
};

console.log('_____CONFIG', config);
module.exports = config;