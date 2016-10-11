/* jshint esversion: 6 */
/* jshint node: true */

'use strict';

class accessTokenInfo {
    constructor(
        accessToken,
        refreshToken,
        tokenType, // ex: 'bearer'
        bridgeId,
        whitelistId
    ) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.tokenType = tokenType;
        this.bridgeId = bridgeId;
        this.whitelistId = whitelistId;
    }
}

module.exports.accessTokenInfo = accessTokenInfo;