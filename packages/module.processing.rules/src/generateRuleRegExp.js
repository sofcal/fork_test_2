'use strict';

const _ = require('underscore');
const { Rule } = require('@sage/bc-contracts-rule');

module.exports = (condition, op, disableWildcards = false) => {
    // Banking Cloud uses two wildcard characters (* to many many characters and ? to match a single character). But the easiest way
    //  for us to do pattern matching is a regex, so we need to convert. That means we have to selectively escape most regex characters
    //  except our wildcards (? and *) which we need to replace with actual regex search characters. We also need to take into account
    //  that these characters might have been escaped already using the \ character, which acts as an escape character in banking cloud
    //  as well. Sooooooo.....

    // replace all occurrences of multiple * or *?|?* combinations into single instances of *. This prevents us ending up
    // with regexes that have multiple wildcard patterns
    const reduced = disableWildcards ? condition : condition.replace(/(^|[^\\])((?:\?{1,}\*\?*)|(?:\?*\*\?{1,}))/g, '$1*').replace(/(^|[^\\])(\*{2,})/g, '$1*');

    // search for any regex special characters
    let escaped = reduced.replace(/[-[\]{}()+.,\\\?\*^$|#\s]/g, (match, offset, str) => { // eslint-disable-line no-useless-escape
        // if it's a BC wildcard or escape character...
        if (!disableWildcards && (match === '*' || match === '?' || match === '\\')) {
            let count = 0;

            // we need to check how many \ characters there were before it, to see if it's already escaped.
            // NB: The main reason we need to do this is that javascript regex does not support negative lookbehind,
            //  otherwise we'd be able to do this whole function block in a single regex
            for (let i = offset - 1; i >= 0; --i) {
                if (str[i] === '\\') {
                    count += 1;
                } else {
                    break;
                }
            }

            // an odd number of preceeding \ characters means this character is already escaped, so we just return it as is,
            //  otherwise we need to figure out what to replace it with. For * and ? it's pretty simple:
            //  - * is replaced by .* (which in regex lets us match multiple characters)
            //  - ? is replaced by . (which in regex lets us match a single character)
            // for a \ we also need to check that the NEXT character isn't one of our special characters, if it is, this \ is escaping
            //  the next character so we'd just return it as is, if the next character is not special, we need to escape the \.

            // This all seems fairly complex, but the unit tests should show what's going on

            const next = offset + 1 < str.length && str[offset + 1];
            /* eslint-disable no-nested-ternary */
            const replace =
                match === '*' ? '.*?' : // we replace a * with .*? to search for any number of wildcards but non-greedy (this is really important, or we get backtracking issues)
                    match === '?' ? '.' :  // a ? with a . to search a single wildcard
                        (next === '?' || next === '*' || next === '\\') ? match : `\\${match}`; // for a \, we don't replace it if the next char is a ? or *, otherwise we escape it
            /* eslint-enable no-nested-ternary */
            return (count % 2 === 0) ? replace : match;
        }

        // for any other regex special character, we just escape it
        return `\\${match}`;
    });

    switch (op) {
        case Rule.operations.eq:
            escaped = `^${escaped}$`;
            break;
        case Rule.operations.containsWords:
            const specialChars = '-[/]{}()+*?|.$^\\';
            let firstPos = 0;
            let lastPos = escaped.length;
            let setFirst = true;
            let setLast = false;
            _.each(specialChars, (specialChar) => {
                if (escaped.includes(specialChar)) {
                    let chars = [...escaped];
                    _.each(chars, (c, index) => {
                        if (specialChars.includes(c)) {
                            if (setFirst) {
                                if (index > firstPos && index < lastPos) {
                                    firstPos = index;
                                }
                            }
                            if (setLast && index > firstPos) {
                                lastPos = index;
                                setLast = false;
                            }
                        } else {
                            setFirst = false;
                            lastPos = escaped.length;
                            setLast = true;
                        }
                    });
                }
            });
            if (firstPos > 0) {
                escaped = `${escaped.substring(0, firstPos + 1)}\\b${escaped.substring(firstPos + 1)}`;
            } else {
                escaped = `\\b${escaped}`;
            }
            escaped = `${escaped.substring(0, lastPos + 2)}\\b${escaped.substring(lastPos + 2)}`;
            break;
        default:
            // do not change escaped
            break;
    }

    // escapes all regex characters with the exception of
    return new RegExp(escaped);
};
