module.exports = (bankFile) => {
    const regExHSBC = /(?<=^03,)([0-9]{14})/gm;
    const bankFileString = bankFile.Body.toString();
    const accountIdentifiers = bankFileString.match(regExHSBC);

    return accountIdentifiers.map((value) => ({ accountIdentifier: value.slice(6), bankIdentifier: value.slice(0,6) }));
}