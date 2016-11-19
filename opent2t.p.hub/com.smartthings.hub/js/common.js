/* jshint esversion: 6 */
/* jshint node: true */

'use strict';

class accessTokenInfo {
    constructor(
        accessToken,
        clientId,
        tokenType, // ex: 'bearer'
        ttl,       // time to live    
        scopes
    ) {
        this.accessToken = accessToken;
        this.cliendId = clientId
        this.toketype = tokenType;
        this.ttl = ttl;
        this.scope = scopes;
    }
}

module.exports.accessTokenInfo = accessTokenInfo;