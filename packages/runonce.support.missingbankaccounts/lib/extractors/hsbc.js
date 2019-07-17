module.exports = (bankFileString) => {
    const regExHSBC = /^03,([0-9]{6})([0-9]{8})/gm;

    let result;
    const ret = [];
    while (result = regExHSBC.exec(bankFileString)) {
        ret.push({ bankIdentifier: result[1], accountIdentifier: result[2] });
    }
    return ret;
}