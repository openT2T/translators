'use strict';

var request = require('request-promise');

// Nest developer endpoint as documented here: http:/developer.nest.com/
var apiEndpoint = 'https://developer-api.nest.com';

// Internal state used to make subsequent API calls
var bearerToken;

class NestHelper {

    // Init Helper: Sets the initial parameters to build our target endpoint
    constructor(accessToken) {
        bearerToken = accessToken;

        console.log('Initialized Nest Helper.');
    }

    // Gets device details (all fields), response formatted per http:/developer.nest.com/
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

    // Puts device details (all fields) payload formatted per http:/developer.nest.com/
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

    // Sets the desired state (of a single field)
    setFieldAsync(deviceType, deviceId, field, value) {

        // build the object with desired state
        var putPayload = {};
        putPayload[field] = value;

        return this.putDeviceDetailsAsync(deviceType, deviceId, putPayload).then((response) => {

            console.log('***** RESPONSE: ' + JSON.stringify(response));

            // successfully put device details, parse out the desired state
            // of the requested field in the response
            if (!!response) {
                return response[field];
            } else {
                throw new Error('Invalid response from server: empty or undefined');
            }
        });
    }

    // Gets the desired state (of a single field)
    getFieldAsync(deviceType, deviceId, field) {

        return this.getDeviceDetailsAsync(deviceType, deviceId).then((response) => {

            console.log('***** RESPONSE: ' + JSON.stringify(response));

            // successfully got device details, parse out the desired state
            // of the requested field
            if (!!response) {
                return response[field];
            } else {
                throw new Error('Invalid response from server: empty or undefined');
            }
        });
    }
}

// Export the helper from the module.
module.exports = NestHelper;