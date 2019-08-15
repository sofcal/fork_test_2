'use strict';

const HttpMethod = require('../../lib/HttpMethod');
const sinon = require('sinon');
const should = require('should');

describe('@sage/bc-util-httpmethod.HttpMethod', function() {
    let sandbox;
    let testObject;

    before(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('statics', () => {
        it('should export static values', () => {
            should(HttpMethod.get).eql('get');
            should(HttpMethod.post).eql('post');
            should(HttpMethod.patch).eql('patch');
            should(HttpMethod.put).eql('put');
            should(HttpMethod.delete).eql('delete');
            should(HttpMethod.head).eql('head');
            should(HttpMethod.options).eql('options');
        })
    });

    describe('IsGet', () => {
        it('should return true if method is GET', () => {
            should(HttpMethod.IsGet('GET')).eql(true);
            should(HttpMethod.IsGet('Get')).eql(true);
            should(HttpMethod.IsGet('GEt')).eql(true);
            should(HttpMethod.IsGet('geT')).eql(true);
            should(HttpMethod.IsGet('gET')).eql(true);
            should(HttpMethod.IsGet('get')).eql(true);
        });
        
        it('should return false if the method is not GET', () => {
            should(HttpMethod.IsGet('post')).eql(false);
            should(HttpMethod.IsGet('patch')).eql(false);
            should(HttpMethod.IsGet('put')).eql(false);
            should(HttpMethod.IsGet('delete')).eql(false);
            should(HttpMethod.IsGet('head')).eql(false);
            should(HttpMethod.IsGet('options')).eql(false);
        });
    });

    describe('IsPost', () => {
        it('should return true if method is POST', () => {
            should(HttpMethod.IsPost('POST')).eql(true);
            should(HttpMethod.IsPost('Post')).eql(true);
            should(HttpMethod.IsPost('POst')).eql(true);
            should(HttpMethod.IsPost('POSt')).eql(true);
            should(HttpMethod.IsPost('posT')).eql(true);
            should(HttpMethod.IsPost('poST')).eql(true);
            should(HttpMethod.IsPost('pOST')).eql(true);
            should(HttpMethod.IsPost('post')).eql(true);
        });

        it('should return false if the method is not POST', () => {
            should(HttpMethod.IsPost('get')).eql(false);
            should(HttpMethod.IsPost('patch')).eql(false);
            should(HttpMethod.IsPost('put')).eql(false);
            should(HttpMethod.IsPost('delete')).eql(false);
            should(HttpMethod.IsPost('head')).eql(false);
            should(HttpMethod.IsPost('options')).eql(false);
        });
    });

    describe('IsPut', () => {
        it('should return true if method is PUT', () => {
            should(HttpMethod.IsPut('PUT')).eql(true);
            should(HttpMethod.IsPut('Put')).eql(true);
            should(HttpMethod.IsPut('PUt')).eql(true);
            should(HttpMethod.IsPut('puT')).eql(true);
            should(HttpMethod.IsPut('PUt')).eql(true);
            should(HttpMethod.IsPut('put')).eql(true);
        });

        it('should return false if the method is not PUT', () => {
            should(HttpMethod.IsPut('get')).eql(false);
            should(HttpMethod.IsPut('post')).eql(false);
            should(HttpMethod.IsPut('patch')).eql(false);
            should(HttpMethod.IsPut('delete')).eql(false);
            should(HttpMethod.IsPut('head')).eql(false);
            should(HttpMethod.IsPut('options')).eql(false);
        });
    });

    describe('IsPatch', () => {
        it('should return true if method is PATCH', () => {
            should(HttpMethod.IsPatch('PATCH')).eql(true);
            should(HttpMethod.IsPatch('Patch')).eql(true);
            should(HttpMethod.IsPatch('PATCH')).eql(true);
            should(HttpMethod.IsPatch('pATCH')).eql(true);
            should(HttpMethod.IsPatch('PAtCH')).eql(true);
            should(HttpMethod.IsPatch('patch')).eql(true);
        });

        it('should return false if the method is not PATCH', () => {
            should(HttpMethod.IsPatch('get')).eql(false);
            should(HttpMethod.IsPatch('post')).eql(false);
            should(HttpMethod.IsPatch('put')).eql(false);
            should(HttpMethod.IsPatch('delete')).eql(false);
            should(HttpMethod.IsPatch('head')).eql(false);
            should(HttpMethod.IsPatch('options')).eql(false);
        });
    });

    describe('IsDelete', () => {
        it('should return true if method is DELETE', () => {
            should(HttpMethod.IsDelete('DELETE')).eql(true);
            should(HttpMethod.IsDelete('Delete')).eql(true);
            should(HttpMethod.IsDelete('DELetE')).eql(true);
            should(HttpMethod.IsDelete('dELETE')).eql(true);
            should(HttpMethod.IsDelete('DElETE')).eql(true);
            should(HttpMethod.IsDelete('delete')).eql(true);
        });

        it('should return false if the method is not DELETE', () => {
            should(HttpMethod.IsDelete('get')).eql(false);
            should(HttpMethod.IsDelete('post')).eql(false);
            should(HttpMethod.IsDelete('put')).eql(false);
            should(HttpMethod.IsDelete('patch')).eql(false);
            should(HttpMethod.IsDelete('head')).eql(false);
            should(HttpMethod.IsDelete('options')).eql(false);
        });
    });

    describe('IsHead', () => {
        it('should return true if method is HEAD', () => {
            should(HttpMethod.IsHead('HEAD')).eql(true);
            should(HttpMethod.IsHead('Head')).eql(true);
            should(HttpMethod.IsHead('HEaD')).eql(true);
            should(HttpMethod.IsHead('hEAD')).eql(true);
            should(HttpMethod.IsHead('HeAD')).eql(true);
            should(HttpMethod.IsHead('head')).eql(true);
        });

        it('should return false if the method is not HEAD', () => {
            should(HttpMethod.IsHead('get')).eql(false);
            should(HttpMethod.IsHead('post')).eql(false);
            should(HttpMethod.IsHead('put')).eql(false);
            should(HttpMethod.IsHead('patch')).eql(false);
            should(HttpMethod.IsHead('delete')).eql(false);
            should(HttpMethod.IsHead('options')).eql(false);
        });
    });

    describe('IsOptions', () => {
        it('should return true if method is OPTIONS', () => {
            should(HttpMethod.IsOptions('OPTIONS')).eql(true);
            should(HttpMethod.IsOptions('Options')).eql(true);
            should(HttpMethod.IsOptions('OPtiONS')).eql(true);
            should(HttpMethod.IsOptions('oPTIONS')).eql(true);
            should(HttpMethod.IsOptions('OPTiONS')).eql(true);
            should(HttpMethod.IsOptions('options')).eql(true);
        });

        it('should return false if the method is not OPTIONS', () => {
            should(HttpMethod.IsOptions('get')).eql(false);
            should(HttpMethod.IsOptions('post')).eql(false);
            should(HttpMethod.IsOptions('put')).eql(false);
            should(HttpMethod.IsOptions('patch')).eql(false);
            should(HttpMethod.IsOptions('delete')).eql(false);
            should(HttpMethod.IsOptions('head')).eql(false);
        });
    });
});
