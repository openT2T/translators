/* jshint esversion: 6 */
/* jshint node: true */

'use strict';

class accessTokenInfo {
        constructor(
            accessToken,
            ttl // time to live
        )
    {
        this.accessToken = accessToken;
        this.ttl = ttl;
    }
}

module.exports.accessTokenInfo = accessTokenInfo;