module.exports = {
    keyNames: {
        primary: {
            public: 'accessToken.primary.publicKey',
            private: 'accessToken.primary.privateKey',
            createdAt: 'accessToken.primary.createdAt'
        },
        secondary: {
            public: 'accessToken.secondary.publicKey',
            private: 'accessToken.secondary.privateKey',
            createdAt: 'accessToken.secondary.createdAt'
        }
    },
    keyTypes: {
        secureString: 'SecureString'
    }
};
