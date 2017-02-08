'use strict';

class accessTokenInfo {
        constructor(
            accessToken,
            refreshToken,
            apiKey,
            tokenType, // ex: 'bearer'
            ttl
        )
    {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.apiKey = apiKey;
        this.tokenType = tokenType;
        this.ttl = ttl;
    }
}

module.exports.accessTokenInfo = accessTokenInfo;