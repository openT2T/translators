'use strict';

var request = require('request-promise');

// wink v2 api endpoint as documented here: http://docs.winkapiv2.apiary.io/
var apiEndpoint = 'https://api.wink.com';

// Internal state used to make subsequent API calls
var bearerToken;

class WinkHelper {

    // Init Helper: Sets the initial parameters to build our target endpoint
    constructor(accessToken) {
        bearerToken = accessToken;

        console.log('Initialized Wink Helper.');
    }

    // Gets device details (all fields), response formatted per http://docs.winkapiv2.apiary.io/
    getDeviceDetailsAsync(deviceType, deviceId) {

        // build request URI
        var requestUri = apiEndpoint + '/' + deviceType + '/' + deviceId;

        // Set the headers
        var headers = {
            'Authorization': 'Bearer ' + bearerToken
        }

        // Configure the request
        var options = {
            url: requestUri,
            method: 'GET',
            headers: headers,
            followAllRedirects: true
        }

        // Start the async request
        return request(options)
            .then(function (body) {
                // request succeeded.
                return JSON.parse(body);
            });
    }

    // Puts device details (all fields) payload formatted per http://docs.winkapiv2.apiary.io/
    putDeviceDetailsAsync(deviceType, deviceId, putPayload) {

        // build request URI and body
        var requestUri = apiEndpoint + '/' + deviceType + '/' + deviceId;
        var putPayloadString = JSON.stringify(putPayload);

        // Set the headers
        var headers = {
            'Authorization': 'Bearer ' + bearerToken,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Content-length': putPayloadString.length
        }

        // Configure the request
        var options = {
            url: requestUri,
            method: 'PUT',
            headers: headers,
            followAllRedirects: true,
            body: putPayloadString
        }

        // Start the async request
        return request(options)
            .then(function (body) {
                // request succeeded.
                return JSON.parse(body);
            });
    }
}

// Export the helper from the module.
module.exports = WinkHelper;