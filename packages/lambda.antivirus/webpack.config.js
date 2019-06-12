const slsw = require('serverless-webpack');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

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
        new CopyWebpackPlugin([
            {from: 'bin', to: 'bin'},
            {from: 'lib64', to: 'lib64'}
        ])

        // new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
        // new webpack.optimize.UglifyJsPlugin({
        //     compress: {
        //         unused: true,
        //         dead_code: true,
        //         warnings: false,
        //         drop_debugger: true
        //     }
        // })
    ],
};

console.log('_____CONFIG', config);
module.exports = config;