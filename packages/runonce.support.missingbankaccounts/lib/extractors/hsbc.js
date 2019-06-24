module.exports = (bankFile) => {
    const regExHSBC = /(?<=^03,)([0-9]{14})/gm;     // TODO could this be passed in as an event parameter? Alternatively, could we have an object of regexes, and a bank flag on the event
    const bankFileString = bankFile.Body.toString();
    const accountIdentifiers = bankFileString.match(regExHSBC);

    return accountIdentifiers.map((value) => ({ accountIdentifier: value.slice(6), bankIdentifier: value.slice(0,6) }));
}