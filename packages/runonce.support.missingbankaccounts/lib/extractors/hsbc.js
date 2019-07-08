const ErrorSpecs = require('./../ErrorSpecs');
const { StatusCodeError } = require('@sage/bc-statuscodeerror');

module.exports = (bankFile /* TODO WHY ARE YOU LYING TO ME!!!!!! */) => {
    const regExHSBC = /(?<=^03,)([0-9]{14})/gm;

    if (!bankFile.Body) {
        throw StatusCodeError.CreateFromSpecs([ErrorSpecs.invalidExtractorInput.body], ErrorSpecs.invalidExtractorInput.body.statusCode);
    }

    const bankFileString = bankFile.Body.toString();
    const accountIdentifiers = bankFileString.match(regExHSBC) || [];

    return accountIdentifiers.map((value) => ({ accountIdentifier: value.slice(6), bankIdentifier: value.slice(0,6) }));
}