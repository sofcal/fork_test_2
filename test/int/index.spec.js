const { readdirSync, statSync } = require('fs');
const { join } = require('path');

const dirs = (p) => readdirSync(p).filter((f) => statSync(join(p, f)).isDirectory());
const files = (p) => readdirSync(p).filter((f) => statSync(join(p, f)).isFile());

const packagesDir = join(__dirname, '/../../packages/');
const packages = dirs(packagesDir);

packages.forEach((p) => {
    const testDir = join(packagesDir, p, 'test/int');
    console.log('testDir:', testDir);
    const tests = files(testDir);

    tests.forEach((u) => {
        const file = join(testDir, u);
        console.log('file:', file);
        require(file)
    });
});