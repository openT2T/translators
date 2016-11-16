/* jshint esversion: 6 */
/* jshint node: true */

'use strict';

class accessTokenInfo {
        constructor(
            accessToken,
            refreshToken,
            tokenType, // ex: 'bearer'
            scopes // ex: 'full_access'
        )
    {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.tokenType = tokenType;
        this.scopes = scopes;
    }
}

module.exports.accessTokenInfo = accessTokenInfo;