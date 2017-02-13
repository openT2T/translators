/* jshint esversion: 6 */
/* jshint node: true */

'use strict';

class authToken {
    constructor(token, expiration, type, scopes) {
        this.update(token, expiration, type, scopes);
    }

    update(token, expiration, type, scopes) {
        this.token = token;

        // If no expiration is provided, then set the expiration for the token token
        // 24 hours (86400 seconds) into the future.
        // getTime returns milliseconds, so we first convert to seconds.
        this.expiration = expiration ? expiration : Math.floor(new Date().getTime() / 1000) + 86400;

        // Overwrite type and scopes only if they are provided
        this.type = type ? type : this.type;
        this.scopes = scopes ? scopes : this.scopes;
    }

    /**
     * Converts a timespan (from now) into a Unix timestamp
     * (number of seconds from the epoch).
     */
    static convertTtlToExpiration(ttlInSeconds) {
        new (Date().getTime() / 1000) + ttlInSeconds;
    }
}

module.exports.authToken = authToken;