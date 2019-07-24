/* eslint-disable no-console */

module.exports = (enabled) => ({
    debug: (obj) => { if (enabled) { console.log(JSON.stringify(obj)); } },
    info: (obj) => { if (enabled) { console.log(JSON.stringify(obj)); } },
    warn: (obj) => { if (enabled) { console.log(JSON.stringify(obj)); } },
    error: (obj) => { if (enabled) { console.log(JSON.stringify(obj)); } }
});
