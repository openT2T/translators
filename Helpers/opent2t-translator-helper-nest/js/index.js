'use strict';

var request = require('request-promise');
var OpenT2TLogger = require('opent2t').Logger;

// Nest developer endpoint as documented here: http:/developers.nest.com/
var apiEndpoint = 'https://developer-api.nest.com';

// Internal state used to make subsequent API calls
var bearerToken;

class NestHelper {

    // Init Helper: Sets the initial parameters to build our target endpoint
    constructor(accessToken, logLevel = "info") {
        this.ConsoleLogger = new OpenT2TLogger(logLevel);
        this.ConsoleLogger.info("Initilizing Nest helper");
        
        bearerToken = accessToken;
        
        this.ConsoleLogger.info('Initialized Nest Helper.');
    }

    // Gets device details (all fields), response formatted per http:/developers.nest.com/
    getDeviceDetailsAsync(deviceType, deviceId) {

        // build request URI
        var requestUri = apiEndpoint + '/devices/' + deviceType + '/' + deviceId;

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

    // Puts device details (all fields) payload formatted per http:/developers.nest.com/
    putDeviceDetailsAsync(deviceType, deviceId, putPayload) {

        // build request URI and body
        var requestUri = apiEndpoint + '/devices/' + deviceType + '/' + deviceId;
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
module.exports = NestHelper;