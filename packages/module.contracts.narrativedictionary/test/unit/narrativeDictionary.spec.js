'use strict';

const NarrativeDictionary = require('../../lib/NarrativeDictionary');
const debug = require('@sage/bc-debug-utils');
const { StatusCodeError, StatusCodeErrorItem } = require('@sage/bc-statuscodeerror');
const fs = require('fs');
const sinon = require('sinon');
const should = require('should');
const _ = require('underscore');

describe('@sage/bc-contracts-narrativedictionary.NarrativeDictionary', function(){
    let sandbox;

    before(() => {
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('CreateFromList', () => {
        it('should parse a single word depth list', (done) => {
            const list = [
                'one',
                'two',
                'three'
            ];

            const expected = {
                one: {
                    $terminate: 'one'
                },
                two: {
                    $terminate: 'two'
                },
                three: {
                    $terminate: 'three'
                }
            };

            try {
                const actual = NarrativeDictionary.CreateFromList(list);

                should(actual.data).eql(expected);

                console.log(actual.data);
                done();
            } catch(err){
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should parse a list', (done) => {
            const list = [
                'one two',
                'one three',
                'one two three',
                'one two three four',
                'one two two two',
                'two',
                'two one',
                'two three',
                'three four',
                'four four',
                'four three two one'
            ];

            const expected = {
                one: {
                    two: {
                        $terminate: 'one two',
                        two: {
                            two: {
                                $terminate: 'one two two two'
                            }
                        },
                        three: {
                            $terminate: 'one two three',
                            four: {
                                $terminate: 'one two three four'
                            }
                        }
                    },
                    three: {
                        $terminate: 'one three'
                    }
                },
                two: {
                    $terminate: 'two',
                    one: {
                        $terminate: 'two one'
                    },
                    three: {
                        $terminate: 'two three'
                    }
                },
                three: {
                    four: {
                        $terminate: 'three four'
                    }
                },
                four: {
                    four: {
                        $terminate: 'four four'
                    },
                    three: {
                        two: {
                            one: {
                                $terminate: 'four three two one'
                            }
                        }
                    }
                }
            };

            try {
                const actual = NarrativeDictionary.CreateFromList(list);

                should(actual.data).eql(expected);

                done();
            } catch(err){
                done(err instanceof Error ? err : new Error(err));
            }
        });
    });

    describe('matches', () => {
        const list = [
            'one two',
            'one three',
            'one two three',
            'one two three four',
            'one two two two',
            'two',
            'two one',
            'two three',
            'three four',
            'four four',
            'four three two one'
        ];

        let narrativeDictionary;

        beforeEach(() => {
            narrativeDictionary = NarrativeDictionary.CreateFromList(list);
        });

        it('should match a single word narrative', (done) => {
            try {
                const actual = narrativeDictionary.matches('two');
                const expected = { matches: ['two'], longest: 'two' };

                should(actual).eql(expected);

                done();
            } catch(err){
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should match a single word in a multiple word narrative (start of narrative)', (done) => {
            try {
                const actual = narrativeDictionary.matches('two missing');
                const expected = { matches: ['two'], longest: 'two' };

                should(actual).eql(expected);

                done();
            } catch(err){
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should match a single word in a multiple word narrative (middle of narrative)', (done) => {
            try {
                const actual = narrativeDictionary.matches('missing two missing');
                const expected = { matches: ['two'], longest: 'two' };

                should(actual).eql(expected);

                done();
            } catch(err){
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should match a single word in a multiple word narrative (end of narrative)', (done) => {
            try {
                const actual = narrativeDictionary.matches('missing two');
                const expected = { matches: ['two'], longest: 'two' };

                should(actual).eql(expected);

                done();
            } catch(err){
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should match multiple words in a multiple word narrative (start of narrative)', (done) => {
            try {
                const actual = narrativeDictionary.matches('three four missing missing');
                const expected = { matches: ['three four'], longest: 'three four' };

                should(actual).eql(expected);

                done();
            } catch(err){
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should match multiple words in a multiple word narrative (middle of narrative)', (done) => {
            try {
                const actual = narrativeDictionary.matches('missing three four missing');
                const expected = { matches: ['three four'], longest: 'three four' };

                should(actual).eql(expected);

                done();
            } catch(err){
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should match multiple words in a multiple word narrative (middle of narrative)', (done) => {
            try {
                const actual = narrativeDictionary.matches('missing missing three four');
                const expected = { matches: ['three four'], longest: 'three four' };

                should(actual).eql(expected);

                done();
            } catch(err){
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should set longest to the match with the most words', (done) => {
            try {
                const actual = narrativeDictionary.matches('one two');
                const expected = { matches: ['one two', 'two'], longest: 'one two' };

                should(actual).eql(expected);

                done();
            } catch(err){
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should set the first match (from the original list) as the longest if multiple same length matches are found', (done) => {
            try {
                const actual = narrativeDictionary.matches('two three four');
                const expected = { matches: ['two', 'two three', 'three four'], longest: 'two three' };

                should(actual).eql(expected);

                done();
            } catch(err){
                done(err instanceof Error ? err : new Error(err));
            }
        });
    });

    describe('validate', () => {
        const list = ['one two'];

        let narrativeDictionary;

        beforeEach(() => {
            narrativeDictionary = NarrativeDictionary.CreateFromList(list);
        });

        it('should call the static version', (done) => {
            try {
                sandbox.stub(NarrativeDictionary, 'validate');

                narrativeDictionary.validate();

                should(NarrativeDictionary.validate.callCount).eql(1);
                should(NarrativeDictionary.validate.calledWithExactly(
                    narrativeDictionary
                )).eql(true);

                done();
            } catch(err){
                done(err instanceof Error ? err : new Error(err));
            }
        });
    });

    describe('NarrativeDictionary.validate', () => {
        const list = ['one two'];

        let narrativeDictionary;

        beforeEach(() => {
            narrativeDictionary = NarrativeDictionary.CreateFromList(list);
        });

        it('should throw if data is undefined', () => {
            const expected = StatusCodeError.Create([StatusCodeErrorItem.Create('InvalidProperties', 'NarrativeDictionary.data: undefined', { data: undefined })], 400);
            narrativeDictionary.data = undefined;
            should(() => NarrativeDictionary.validate(narrativeDictionary)).throw(expected);
        });

        it('should throw if data is null', () => {
            const expected = StatusCodeError.Create([StatusCodeErrorItem.Create('InvalidProperties', 'NarrativeDictionary.data: null', { data: null })], 400);
            narrativeDictionary.data = null;
            should(() => NarrativeDictionary.validate(narrativeDictionary)).throw(expected);
        });
    });


    describe.skip('performance', function() {
        this.timeout(20000);

        let list;
        let narrativeDictionary;

        const wordsLength = 1000;
        const listLength = 1000;
        const maxWords = 20;

        before(() => {
            const file = fs.readFileSync('/usr/share/dict/words', 'utf8');

            const words = file.split('\n').splice(5000, wordsLength); // pick 1000 words from dict/words

            list = _.times(listLength, () => {
                const wordCount = Math.floor((Math.random() * maxWords) + 1);

                return _.times(wordCount, () => {
                    return words[Math.floor((Math.random() * wordsLength))];
                }).join(' ');
            });

            narrativeDictionary = NarrativeDictionary.CreateFromList(list);
        });

        it('should check our containsTest function also returns the correct results', (done) => {
            try {
                const test = containsTest(list);
                const actual = test('two three four');
                const expected = { matches: ['two', 'two three', 'three four'], longest: 'two three' };

                should(actual).eql(expected);

                done();
            } catch(err){
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should test performance when multiple matches', (done) => {
            // create a narrative by adding two of our list entries together, which guarantees at least two matches
            const narrative = list[Math.floor((Math.random() * listLength))] + ' ' + list[Math.floor((Math.random() * listLength))];

            const runs = 50000;

            console.log('_____MULTIPLE_MATCHES');

            let nd_totalTime = 0;
            let nd_maxTime = 0;
            _.times(runs, () => {
                const dictTimer = debug.timer.start();

                narrativeDictionary.matches(narrative);

                const time = debug.timer.end(dictTimer, { skipLog: true });
                if (time > nd_maxTime) {
                    nd_maxTime = time;
                }

                nd_totalTime += time;
            });

            console.log(`NarrativeDictionary lookup - avg: ${nd_totalTime / runs}; max: ${nd_maxTime}`);

            const test = containsTest(list);

            let ct_totalTime = 0;
            let ct_maxTime = 0;
            _.times(runs, () => {
                const dictTimer = debug.timer.start();

                test(narrative);

                const time = debug.timer.end(dictTimer, { skipLog: true });
                if (time > ct_maxTime) {
                    ct_maxTime = time;
                }

                ct_totalTime += time;
            });

            console.log(`contains lookup - avg: ${ct_totalTime / runs}; max: ${ct_maxTime}`);

            done();
        });

        it('should test performance when no matches', (done) => {
            // create a narrative by adding two of our list entries together, which guarantees at least two matches
            const narrative = 'notanactualword notanactualword notanactualword notanactualword';

            console.log('_____NO_MATCHES');
            const runs = 50000;

            let nd_totalTime = 0;
            let nd_maxTime = 0;
            _.times(runs, () => {
                const dictTimer = debug.timer.start();

                narrativeDictionary.matches(narrative);

                const time = debug.timer.end(dictTimer, { skipLog: true });
                if (time > nd_maxTime) {
                    nd_maxTime = time;
                }

                nd_totalTime += time;
            });

            console.log(`NarrativeDictionary lookup - avg: ${nd_totalTime / runs}; max: ${nd_maxTime}`);

            const test = containsTest(list);

            let ct_totalTime = 0;
            let ct_maxTime = 0;
            _.times(runs, () => {
                const dictTimer = debug.timer.start();

                test(narrative);

                const time = debug.timer.end(dictTimer, { skipLog: true });
                if (time > ct_maxTime) {
                    ct_maxTime = time;
                }

                ct_totalTime += time;
            });

            console.log(`contains lookup - avg: ${ct_totalTime / runs}; max: ${ct_maxTime}`);

            done();
        })
    })
});

const containsTest = (list) => (narrative) => {
    const matches = [];
    let longest = '';
    let longestSplitLength = -1;

    _.each(list, (entry) => {
        if (narrative.indexOf(entry) !== -1) {
            matches.push(entry);

            const len = entry.split(' ').length;
            if (len > longestSplitLength) {
                longestSplitLength = len;
                longest = entry;
            }
        }
    });

    return { matches, longest };
};