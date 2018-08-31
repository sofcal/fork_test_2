const { readdirSync, statSync } = require('fs');
const { join } = require('path');

const dirs = (p) => readdirSync(p).filter((f) => statSync(join(p, f)).isDirectory());
const read = (p) => readdirSync(p);

const packagesDir = join(__dirname, '/../../packages/');
const packages = dirs(packagesDir);

const includeFiles = (dir) => {
    const r = read(dir);

    r.forEach((u) => {
        const path = join(dir, u);
        const stat = statSync(path);

        if (stat.isFile()) {
            console.log('file:', path);
            require(path);
        } else if (stat.isDirectory()) {
            includeFiles(path);
        }
    });
};

packages.forEach((p) => {
    const testDir = join(packagesDir, p, 'test/unit');
    console.log('testDir:', testDir);

    includeFiles(testDir);
});
