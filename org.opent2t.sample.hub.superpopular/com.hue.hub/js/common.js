'use strict';

class accessTokenInfo {
    constructor(
        accessToken,
        accessToken_ttl,
        refreshToken,
        refreshToken_ttl,
        tokenType, // ex: 'bearer'
        bridgeId,
        whitelistId
    ) {
        this.accessToken = accessToken;
        this.accessToken_ttl = accessToken_ttl;
        this.refreshToken = refreshToken;
        this.refreshToken_ttl = refreshToken_ttl;
        this.tokenType = tokenType;
        this.bridgeId = bridgeId;
        this.whitelistId = whitelistId;
    }
}

module.exports.accessTokenInfo = accessTokenInfo;