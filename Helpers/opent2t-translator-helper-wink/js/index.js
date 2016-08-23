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

    // Sets the desired state (of a single field)
    setDesiredStateAsync(deviceType, deviceId, field, value) {

        // build the object with desired state
        var putPayload = { 'desired_state': {} };
        putPayload.desired_state[field] = value;

        return this.putDeviceDetailsAsync(deviceType, deviceId, putPayload).then((response) => {

            // successfully put device details, parse out the desired state
            // of the requested field in the response
            var data = response.data;
            if (!!data) {
                var desiredStateCollection = data['desired_state'];

                if (!!desiredStateCollection) {
                    return desiredStateCollection[field];
                } else {
                    throw new Error('Invalid response from server: no desired state collection.');
                }
            } else {
                throw new Error('Invalid response from server: no data element.');
            }
        });
    }

    // Gets the desired state (of a single field)
    getDesiredStateAsync(deviceType, deviceId, field) {

        return this.getDeviceDetailsAsync(deviceType, deviceId).then((response) => {

            // successfully got device details, parse out the desired state
            // of the requested field
            var data = response.data;
            if (!!data) {
                var desiredStateCollection = data['desired_state'];

                if (!!desiredStateCollection) {
                    return desiredStateCollection[field];
                } else {
                    throw new Error('Invalid response from server: no desired state collection.');
                }
            } else {
                throw new Error('Invalid response from server: no data element.');
            }
        });
    }

    // Gets the last reading (of a single field)
    getLastReadingAsync(deviceType, deviceId, field) {

        return this.getDeviceDetailsAsync(deviceType, deviceId).then((details) => {

            // successfully got device details, parse out the last reading
            // of the requested field
            var data = details.data;
            if (!!data) {
                var lastReadingsCollection = data['last_reading'];

                if (!!lastReadingsCollection) {
                    return lastReadingsCollection[field];
                } else {
                    throw new Error('Invalid response from server: no last reading collection.');
                }
            } else {
                throw new Error('Invalid response from server: no data element.');
            }
        });
    }
}

// Export the helper from the module.
module.exports = WinkHelper;