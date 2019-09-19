module.exports = (api) => {
    console.log('LOADING BABEL CONFIG');
    api.cache.forever();
    const presets = [
        [
            '@babel/preset-env',
            {
                targets: {
                    node: 6
                }
            }
        ]
    ];

    const plugins = [
        '@babel/plugin-proposal-class-properties',
        'transform-async-to-promises'
    ];

    const sourceMaps = 'inline';
    const retainLines = true;
    const env = {
        test: {
            plugins: [['istanbul']]
        }
    };

    return { presets, plugins, sourceMaps, retainLines, env };
};
