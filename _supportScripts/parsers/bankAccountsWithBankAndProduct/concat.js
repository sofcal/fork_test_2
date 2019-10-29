const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const dir = args[0] || `${__dirname}`;

const files = fs.readdirSync(dir);
const accounts = [];
const organisations = [];

/** USAGE: node concat "path_to_dir_containing_results" **/

files.forEach((file) => {
    if (file.endsWith('.json')) {
        const stat = fs.statSync(`${dir}/${file}`);
        if (stat.isFile() && file !== '.DS_Store') {
            console.log('INCLUDING', file);
            // Do whatever you want to do with the file
            const parsed = require(`${path.join(dir, file)}`);
            if (parsed.accounts) {
                accounts.push(...parsed.accounts);
            } else if (parsed.organisations) {
                organisations.push(...parsed.organisations);
            }
        }
    }
});

let keys = null;
let output = null;
let matched = 0;
// TODO: Thought for self. Could this loop be more efficient by a) using Sets, and b) moving the bankAccount into a new set once parsed?
organisations.forEach((o) => {
    accounts.forEach((a, i) => {
        if (a.organisationId === o.organisationId) {
            matched += 1;
            // add properties onto account that exist on organisation
            Object.assign(a, o);
            if (!keys) {
                keys = Object.keys(a);
                output = keys.join(',');
            }
        }
    });
});

console.log(`MATCHED ${matched} of ${accounts.length} bank accounts`);

if (!accounts[0] || !matched) {
    throw new Error('DATA NOT RETRIEVED, OR NOT MATCHED');
}

accounts.forEach((a) => {
    const line = [];
    keys.forEach((k) => {
        const needsEscaped = (a[k] && typeof a[k] === 'string' && a[k].indexOf(',') !== -1);
        line.push((needsEscaped ? `"${a[k]}"` : a[k]));
    });
    output += `\n${line.join(',')}`;
});
fs.writeFileSync(`${path.join(dir, 'output.csv')}`, output);
