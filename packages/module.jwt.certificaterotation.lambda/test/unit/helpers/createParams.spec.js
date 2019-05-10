const createParams = require('../../../lib/helpers/createParams');

const { logger: loggerGen } = require('@sage/bc-debug-utils');

const _ = require('underscore');
const should = require('should');
const sinon = require('sinon');

describe('@sage/sfab-s2s-jwt-certificaterotation-lambda.helpers.createKeyPair', function() {
    const sandbox = sinon.createSandbox();

    let primaryKeyPair;
    let secondaryKeyPair;

    const logger = loggerGen(true);

    const expected = Object.freeze({
        primary: Object.freeze([{
            name: 'accessToken.primary.publicKey',
            overwrite: true,
            type: 'SecureString',
            value: 'primary_public'
        }, {
            name: 'accessToken.primary.privateKey',
            overwrite: true,
            type: 'SecureString',
            value: 'primary_private'
        }, {
            name: 'accessToken.primary.createdAt',
            overwrite: true,
            type: 'SecureString',
            value: 1
        }]),
        secondary: Object.freeze([{
            name: 'accessToken.secondary.publicKey',
            overwrite: true,
            type: 'SecureString',
            value: 'secondary_public'
        }, {
            name: 'accessToken.secondary.privateKey',
            overwrite: true,
            type: 'SecureString',
            value: 'secondary_private'
        }, {
            name: 'accessToken.secondary.createdAt',
            overwrite: true,
            type: 'SecureString',
            value: 1
        }])
    });

    beforeEach(() => {
        sandbox.useFakeTimers(1000);

        primaryKeyPair = {
            private: 'primary_private',
            public: 'primary_public',
        };

        secondaryKeyPair = {
            private: 'secondary_private',
            public: 'secondary_public',
        };
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should create params', () => {
        should(createParams(primaryKeyPair, secondaryKeyPair, { logger })).eql(expected);
    });

    it('should throw if primary key pair is not provided', () => {
        should(
            () => createParams(undefined, secondaryKeyPair, { logger })
        ).throwError(new Error('invalid primary key pair'));
    });

    it('should throw if primary key pair is missing a private key', () => {
        delete primaryKeyPair.private;
        should(
            () => createParams(undefined, secondaryKeyPair, { logger })
        ).throwError(new Error('invalid primary key pair'));
    });

    it('should throw if primary key pair is missing a public key', () => {
        delete primaryKeyPair.public;
        should(
            () => createParams(undefined, secondaryKeyPair, { logger })
        ).throwError(new Error('invalid primary key pair'));
    });

    it('should create the secondary keys as a copy of the primary if secondary key pair is not provided', () => {
        const expected = Object.freeze({
            primary: Object.freeze([{
                name: 'accessToken.primary.publicKey',
                overwrite: true,
                type: 'SecureString',
                value: 'primary_public'
            }, {
                name: 'accessToken.primary.privateKey',
                overwrite: true,
                type: 'SecureString',
                value: 'primary_private'
            }, {
                name: 'accessToken.primary.createdAt',
                overwrite: true,
                type: 'SecureString',
                value: 1
            }]),
            secondary: Object.freeze([{
                name: 'accessToken.secondary.publicKey',
                overwrite: true,
                type: 'SecureString',
                value: 'primary_public'
            }, {
                name: 'accessToken.secondary.privateKey',
                overwrite: true,
                type: 'SecureString',
                value: 'primary_private'
            }, {
                name: 'accessToken.secondary.createdAt',
                overwrite: true,
                type: 'SecureString',
                value: 1
            }])
        });

        should(createParams(primaryKeyPair, undefined, { logger })).eql(expected);
    });

    it('should create the secondary keys as a copy of the primary if secondary key pair is missing a private key', () => {
        const expected = Object.freeze({
            primary: Object.freeze([{
                name: 'accessToken.primary.publicKey',
                overwrite: true,
                type: 'SecureString',
                value: 'primary_public'
            }, {
                name: 'accessToken.primary.privateKey',
                overwrite: true,
                type: 'SecureString',
                value: 'primary_private'
            }, {
                name: 'accessToken.primary.createdAt',
                overwrite: true,
                type: 'SecureString',
                value: 1
            }]),
            secondary: Object.freeze([{
                name: 'accessToken.secondary.publicKey',
                overwrite: true,
                type: 'SecureString',
                value: 'primary_public'
            }, {
                name: 'accessToken.secondary.privateKey',
                overwrite: true,
                type: 'SecureString',
                value: 'primary_private'
            }, {
                name: 'accessToken.secondary.createdAt',
                overwrite: true,
                type: 'SecureString',
                value: 1
            }])
        });

        delete secondaryKeyPair.private;
        should(createParams(primaryKeyPair, secondaryKeyPair, { logger })).eql(expected);
    });

    it('should create the secondary keys as a copy of the primary if secondary key pair is missing a secondary key', () => {
        const expected = Object.freeze({
            primary: Object.freeze([{
                name: 'accessToken.primary.publicKey',
                overwrite: true,
                type: 'SecureString',
                value: 'primary_public'
            }, {
                name: 'accessToken.primary.privateKey',
                overwrite: true,
                type: 'SecureString',
                value: 'primary_private'
            }, {
                name: 'accessToken.primary.createdAt',
                overwrite: true,
                type: 'SecureString',
                value: 1
            }]),
            secondary: Object.freeze([{
                name: 'accessToken.secondary.publicKey',
                overwrite: true,
                type: 'SecureString',
                value: 'primary_public'
            }, {
                name: 'accessToken.secondary.privateKey',
                overwrite: true,
                type: 'SecureString',
                value: 'primary_private'
            }, {
                name: 'accessToken.secondary.createdAt',
                overwrite: true,
                type: 'SecureString',
                value: 1
            }])
        });

        delete secondaryKeyPair.public;
        should(createParams(primaryKeyPair, secondaryKeyPair, { logger })).eql(expected);
    });
});