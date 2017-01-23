/* jshint esversion: 6 */
/* jshint node: true */

'use strict';

class accessTokenInfo {
        constructor(
            accessToken,
            refreshToken,
            tokenType, // ex: 'bearer'
            scopes, // ex: 'full_access'
            expiration // Timestamp for expiration (seconds)
        )
    {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.tokenType = tokenType;
        this.scopes = scopes;
        
        if (expiration === undefined) {
            // If no expiration is provided, then set the expiration for the token token
            // 24 hours (86400 seconds) into the future.
            // getTime returns milliseconds, so we first convert to seconds.
            this.expiration = Math.floor(new Date().getTime() / 1000) + 86400;
        } else {
            this.times = expiration;
        }
    }
}

module.exports.accessTokenInfo = accessTokenInfo;