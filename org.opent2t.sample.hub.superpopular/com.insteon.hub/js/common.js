/* jshint esversion: 6 */
/* jshint node: true */

'use strict';

class accessTokenInfo {
    constructor(
        accessToken,
        refreshToken,
        apiKey,
        tokenType, // ex: 'bearer'
        expires_in
    ) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.apiKey = apiKey;
        this.tokenType = tokenType;
        this.expires_in = expires_in;
    }
}

module.exports.accessTokenInfo = accessTokenInfo;