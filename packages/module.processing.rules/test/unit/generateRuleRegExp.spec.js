'use strict';

const { Rule } = require('@sage/bc-contracts-rule');
const generateRuleRegExp = require('../../lib/generateRuleRegExp');
const should = require('should');
const sinon = require('sinon');

describe('@sage/bc-processing-rules.generateRuleRegExp', function () {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should reduce multiple * characters to a single .*?', (done) => {
        let string = '*********** *** **';

        try {
            should(generateRuleRegExp(string)).eql(
                /.*?\ .*?\ .*?/
            );
            done();
        } catch (err) {
            done(err instanceof Error ? err : new Error(err));
        }
    });

    it('should reduce multiple *? combinations to a single .*?', (done) => {
        let string = '**?****??**** *?* ?* *? ?? ?*?';

        try {
            should(generateRuleRegExp(string)).eql(
                /.*?\ .*?\ .*?\ .*?\ ..\ .*?/
            );
            done();
        } catch (err) {
            done(err instanceof Error ? err : new Error(err));
        }
    });

    it('should NOT reduce escaped characters (escaped ? at start)', (done) => {
        let string = '\\?**?****\\???**** *?* \\?* *? ?\\? ?*\\? \\***';

        try {
            should(generateRuleRegExp(string)).eql(
                /\?.*?\?.*?\ .*?\ \?.*?\ .*?\ .\?\ .*?\?\ \*.*?/
            );
            done();
        } catch (err) {
            done(err instanceof Error ? err : new Error(err));
        }
    });

    it('should NOT reduce escaped characters (escaped * at start)', (done) => {
        let string = '\\***?****\\???**** *?* \\?* *? ?\\? ?*\\? \\***';

        try {
            should(generateRuleRegExp(string)).eql(
                /\*.*?\?.*?\ .*?\ \?.*?\ .*?\ .\?\ .*?\?\ \*.*?/
            );
            done();
        } catch (err) {
            done(err instanceof Error ? err : new Error(err));
        }
    });

    it('should handle 200 character regex', (done) => {
        let string = '\\***?****\\???**** *?* \\?* *? ?\\? ?*\\? \\*** \\***?****\\???**** *?* \\?* *? ?\\? ?*\\? \\*** \\***?****\\???**** *?* \\?* *? ?\\? ?*\\? \\*** \\***?****\\???**** *?* \\?* *? ?\\? ?*\\? \\*** *****';

        try {
            const generated = generateRuleRegExp(string);
            should(generated).eql(
                /\*.*?\?.*?\ .*?\ \?.*?\ .*?\ .\?\ .*?\?\ \*.*?\ \*.*?\?.*?\ .*?\ \?.*?\ .*?\ .\?\ .*?\?\ \*.*?\ \*.*?\?.*?\ .*?\ \?.*?\ .*?\ .\?\ .*?\?\ \*.*?\ \*.*?\?.*?\ .*?\ \?.*?\ .*?\ .\?\ .*?\?\ \*.*?\ .*?/
            );
            should(generated.test('*this?text will ?match the X? regex? *because *I?spent way ?longer than I? should? *have *typing?data into ?regex101 . 4? Also? *Bruce *Willis?was dead ?the whole 4? time? *#spoilers ')).eql(true);
            done();
        } catch (err) {
            done(err instanceof Error ? err : new Error(err));
        }
    });

    it('should escape all regexp characters that are not * or ?', (done) => {
        let string = '-[]{}()+.,\\^$|#\s';

        try {
            should(generateRuleRegExp(string)).eql(
                /\-\[\]\{\}\(\)\+\.\,\\\^\$\|\#s/
            );
            done();
        } catch (err) {
            done(err instanceof Error ? err : new Error(err));
        }
    });

    it('should replace * with .*', (done) => {
        let string = 'some*regex';

        try {
            should(generateRuleRegExp(string)).eql(
                /some.*?regex/
            );
            done();
        } catch (err) {
            done(err instanceof Error ? err : new Error(err));
        }
    });

    it('should replace ? with .?', (done) => {
        let string = 'some?regex';

        try {
            should(generateRuleRegExp(string)).eql(
                /some.regex/
            );
            done();
        } catch (err) {
            done(err instanceof Error ? err : new Error(err));
        }
    });

    it('should allow multiple ? characters', (done) => {
        let string = 'some???regex';

        try {
            should(generateRuleRegExp(string)).eql(
                /some...regex/
            );
            done();
        } catch (err) {
            done(err instanceof Error ? err : new Error(err));
        }
    });

    it('should not escape an already escaped ?', (done) => {
        let string = 'some\\?regex';

        try {
            should(generateRuleRegExp(string)).eql(
                /some\?regex/
            );
            done();
        } catch (err) {
            done(err instanceof Error ? err : new Error(err));
        }
    });

    it('should not escape an already escaped *', (done) => {
        let string = 'some\\*regex';

        try {
            should(generateRuleRegExp(string)).eql(
                /some\*regex/
            );
            done();
        } catch (err) {
            done(err instanceof Error ? err : new Error(err));
        }
    });

    it('should not escape an already escaped \\ (single backslash)', (done) => {
        let string = 'some\\\\regex';

        try {
            should(generateRuleRegExp(string)).eql(
                /some\\regex/
            );
            done();
        } catch (err) {
            done(err instanceof Error ? err : new Error(err));
        }
    });

    it('should allow a * at the start', (done) => {
        let string = '*someregex';

        try {
            should(generateRuleRegExp(string)).eql(
                /.*?someregex/
            );
            done();
        } catch (err) {
            done(err instanceof Error ? err : new Error(err));
        }
    });

    it('should allow multiple * at the start', (done) => {
        // we don't worry about multiple * characters, as .* can match nothing
        let string = '***someregex';

        try {
            should(generateRuleRegExp(string)).eql(
                /.*?someregex/
            );
            done();
        } catch (err) {
            done(err instanceof Error ? err : new Error(err));
        }
    });

    it('should a * at the end', (done) => {
        // we don't worry about multiple * characters, as .* can match nothing
        let string = 'someregex*';

        try {
            should(generateRuleRegExp(string)).eql(
                /someregex.*?/
            );
            done();
        } catch (err) {
            done(err instanceof Error ? err : new Error(err));
        }
    });

    it('should allow multiple * at the end', (done) => {
        // we don't worry about multiple * characters, as .* can match nothing
        let string = 'someregex***';

        try {
            should(generateRuleRegExp(string)).eql(
                /someregex.*?/
            );
            done();
        } catch (err) {
            done(err instanceof Error ? err : new Error(err));
        }
    });

    it('should allow a ? at the start', (done) => {
        let string = '?someregex';

        try {
            should(generateRuleRegExp(string)).eql(
                /.someregex/
            );
            done();
        } catch (err) {
            done(err instanceof Error ? err : new Error(err));
        }
    });

    it('should allow multiple ? at the start', (done) => {
        let string = '???someregex';

        try {
            should(generateRuleRegExp(string)).eql(
                /...someregex/
            );
            done();
        } catch (err) {
            done(err instanceof Error ? err : new Error(err));
        }
    });

    it('should a ? at the end', (done) => {
        let string = 'someregex?';

        try {
            should(generateRuleRegExp(string)).eql(
                /someregex./
            );
            done();
        } catch (err) {
            done(err instanceof Error ? err : new Error(err));
        }
    });

    it('should allow multiple * at the end', (done) => {
        // we don't worry about multiple * characters, as .* can match nothing
        let string = 'someregex???';

        try {
            should(generateRuleRegExp(string)).eql(
                /someregex.../
            );
            done();
        } catch (err) {
            done(err instanceof Error ? err : new Error(err));
        }
    });

    it('should create a runnable regexp using *', (done) => {
        let string = 'some*regex';

        try {
            let regex = generateRuleRegExp(string);
            should(regex.test('some regex')).eql(true);
            should(regex.test('someregex')).eql(true);
            should(regex.test('some     regex')).eql(true);
            should(regex.test('some_random_data_in_the_middleregex')).eql(true);
            should(regex.test('somexxxxxregex')).eql(true);
            should(regex.test('some1234regex')).eql(true);
            should(regex.test('some[]regex')).eql(true);
            should(regex.test('some-[]{}()+.,\\^$|#\sregex')).eql(true);

            done();
        } catch (err) {
            done(err instanceof Error ? err : new Error(err));
        }
    });

    it('should create a runnable regexp using ?', (done) => {
        let string = 'some?regex';

        try {
            let regex = generateRuleRegExp(string);
            should(regex.test('some regex')).eql(true);
            should(regex.test('some_regex')).eql(true);
            should(regex.test('some[regex')).eql(true);
            should(regex.test('some]regex')).eql(true);
            should(regex.test('some{regex')).eql(true);
            should(regex.test('some}regex')).eql(true);
            should(regex.test('some-regex')).eql(true);
            should(regex.test('some\\regex')).eql(true);
            should(regex.test('some^regex')).eql(true);
            should(regex.test('some$regex')).eql(true);
            should(regex.test('some(regex')).eql(true);
            should(regex.test('some)regex')).eql(true);
            should(regex.test('some+regex')).eql(true);
            should(regex.test('some.regex')).eql(true);
            should(regex.test('some,regex')).eql(true);
            should(regex.test('some|regex')).eql(true);
            should(regex.test('some#regex')).eql(true);

            should(regex.test('some  regex')).eql(false);

            done();
        } catch (err) {
            done(err instanceof Error ? err : new Error(err));
        }
    });

    it('should handle all special characters in one go', (done) => {
        let string = 'some\\[]{}()*+?.,^$|#\sregex';

        try {
            let regex = generateRuleRegExp(string);
            should(regex).eql(
                /some\\\[\]\{\}\(\).*?\+.\.\,\^\$\|\#sregex/
            );

            should(regex.test('some\\\[\]\{\}\(\)X\+X\.\,\^\$\|\#sregex')).eql(true);
            done();
        } catch (err) {
            done(err instanceof Error ? err : new Error(err));
        }
    });

    it('should handle a regular enough looking string with wildcards', (done) => {
        let string = '$$$FUEL PAYMENT ?? VALUE *$$$';

        try {
            let regex = generateRuleRegExp(string);
            should(regex).eql(
                /\$\$\$FUEL\ PAYMENT\ ..\ VALUE\ .*?\$\$\$/
            );

            should(regex.test('$$$FUEL PAYMENT BP VALUE £10.00$$$')).eql(true);
            done();
        } catch (err) {
            done(err instanceof Error ? err : new Error(err));
        }
    });

    it('should surround with stand and end tags if checking equality', (done) => {
        let string = 'some?regex';

        try {
            should(generateRuleRegExp(string, Rule.operations.eq)).eql(
                /^some.regex$/
            );
            done();
        } catch (err) {
            done(err instanceof Error ? err : new Error(err));
        }
    });

    it('should escape wildcard characters if disableRuleWildcards is true', (done) => {
        try {
            should(generateRuleRegExp('some?regex', Rule.operations.eq, true)).eql(
                /^some\?regex$/
            );
            should(generateRuleRegExp('$$$FUEL PAYMENT ?? VALUE *$$$', Rule.operations.eq, true)).eql(
                /^\$\$\$FUEL\ PAYMENT\ \?\?\ VALUE\ \*\$\$\$$/
            );
            should(generateRuleRegExp('some\\[]{}()*+?.,^$|#sregex', Rule.operations.eq, true)).eql(
                /^some\\\[\]\{\}\(\)\*\+\?\.\,\^\$\|\#sregex$/
            );
            should(generateRuleRegExp('*********** *** **', Rule.operations.eq, true)).eql(
                /^\*\*\*\*\*\*\*\*\*\*\*\ \*\*\*\ \*\*$/
            );
            should(generateRuleRegExp('**?****??**** *?* ?* *? ?? ?*?', Rule.operations.eq, true)).eql(
                /^\*\*\?\*\*\*\*\?\?\*\*\*\*\ \*\?\*\ \?\*\ \*\?\ \?\?\ \?\*\?$/
            );
            done();
        } catch (err) {
            done(err instanceof Error ? err : new Error(err));
        }
    })
});