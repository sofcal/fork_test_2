const generatePrincipalId = require('../../../lib/helpers/generatePrincipalId');

const should = require('should');

describe('@sage/sfab-s2s-cloudId-authenticator-lambda.helpers.generatePrincipalId', function() {
    it('should generate a principalId from a simple template and claims', () => {
        const template = '${organisationId}_${companyId}';
        const claims = { organisationId: 'organisation1', companyId: 'company1' };

        should(generatePrincipalId(template, claims)).eql('organisation1_company1');
    });

    it('should generate a principalId where the same template param is used multiple times', () => {
        const template = '${organisationId}_${companyId}-----${organisationId}';
        const claims = { organisationId: 'organisation1', companyId: 'company1' };

        should(generatePrincipalId(template, claims)).eql('organisation1_company1-----organisation1');
    });

    it('should generate a principalId from a more complex template and claims', () => {
        // technically this inner template style isn't supported, it's just a side effect and works if the nesting and ordering is correct
        const template = '${o${i${inner2}1}1}./"?\'';
        const claims = { inner2: 'nner', inner1: 'uter', outer1: 'replaced' };

        should(generatePrincipalId(template, claims)).eql('replaced./"?\'');
    });

    it('should generate a principalId where the claim for a template is missing', () => {
        const template = '${organisationId}_${companyId}';
        const claims = { companyId: 'company1' };

        should(generatePrincipalId(template, claims)).eql('${organisationId}_company1');
    });

    it('should generate a principalId where claims is missing', () => {
        const template = '${organisationId}_${companyId}';
        const claims = undefined;

        should(generatePrincipalId(template, claims)).eql('${organisationId}_${companyId}');
    });

    it('should generate a principalId where the claim for a template is null', () => {
        const template = '${organisationId}_${companyId}';
        const claims = { organisationId: null, companyId: null };

        should(generatePrincipalId(template, claims)).eql('null_null');
    });

    it('should generate a principalId where the claim for a template is undefined', () => {
        const template = '${organisationId}_${companyId}';
        const claims = { organisationId: undefined, companyId: 'company1' };

        should(generatePrincipalId(template, claims)).eql('undefined_company1');
    });

    it('should generate a principalId where the claim for a template is a number', () => {
        const template = '${organisationId}_${companyId}';
        const claims = { organisationId: 1, companyId: '9' };

        should(generatePrincipalId(template, claims)).eql('1_9');
    });

    it('should generate a principalId where the claim for a template is an object', () => {
        const template = '${organisationId}_${companyId}';
        const claims = { organisationId: {}, companyId: { value: 1 } };

        should(generatePrincipalId(template, claims)).eql('[object Object]_[object Object]');
    });

    it('should generate a principalId where the claim for a template is an array', () => {
        const template = '${organisationId}_${companyId}';
        const claims = { organisationId: [], companyId: [] };

        should(generatePrincipalId(template, claims)).eql('_');
    });

    it('should generate a principalId where the claim for a template is a function', () => {
        const template = '${organisationId}_${companyId}';
        const claims = { organisationId: () => {}, companyId: 'company1' };

        should(generatePrincipalId(template, claims)).eql('undefined_company1');
    });

    it('should generate a principalId where the template has empty template parameters', () => {
        const template = 'empty ${} parameter';
        const claims = { organisationId: 'organisation1', companyId: 'company1' };

        should(generatePrincipalId(template, claims)).eql('empty ${} parameter');
    });

    it('should return an empty string if template is undefined', () => {
        const template = undefined;
        const claims = { organisationId: 'organisation1', companyId: 'company1' };

        should(generatePrincipalId(template, claims)).eql('');
    });

    it('should generate a principalId from the default value if one is passed', () => {
        const template =  undefined;
        const claims = { organisationId: 'organisation1', companyId: 'company1' };

        should(generatePrincipalId(template, claims, 'default')).eql('default');
    });

    it('should return an empty string if template is null', () => {
        const template = null;
        const claims = { organisationId: 'organisation1', companyId: 'company1' };

        should(generatePrincipalId(template, claims)).eql('');
    });

    it('should return a literal if the template is a number', () => {
        const template = 1;
        const claims = { organisationId: 'organisation1', companyId: 'company1' };

        should(generatePrincipalId(template, claims)).eql('1');
    });

    it('should return a literal if the template is a function', () => {
        const template = () => {};
        const claims = { organisationId: 'organisation1', companyId: 'company1' };

        should(generatePrincipalId(template, claims)).eql('() => {}');
    });

    it('should return the template if it has no template parameters', () => {
        const template = 'some literal string';
        const claims = { organisationId: 'organisation1', companyId: 'company1' };

        should(generatePrincipalId(template, claims)).eql('some literal string');
    });

    it('should should replace a maximum of 3 instances of the same template', () => {
        const template = '${organisationId}_${organisationId}_${organisationId}_${organisationId}_${organisationId}';
        const claims = { organisationId: 'organisation1', companyId: 'company1' };

        should(generatePrincipalId(template, claims)).eql('organisation1_organisation1_organisation1_${organisationId}_${organisationId}');
    });
});
