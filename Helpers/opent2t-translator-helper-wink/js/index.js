'use strict';

var request = require('request');
var q = require('q');

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

        // q will help us with returning a promise
        var deferred = q.defer();

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

        // Start the request
        request(options, function (error, response, body) {

            // console.log('***** RESPONSE: ' + JSON.stringify(response));

            if (!error && response.statusCode == 200) {
                deferred.resolve(JSON.parse(body));
            } else {
                deferred.reject('Woops, there was an error getting device details: ' + error + ' (' + response.statusCode + ')');
            }
        });

        return deferred.promise;
    }

    // Puts device details (all fields) payload formatted per http://docs.winkapiv2.apiary.io/
    putDeviceDetailsAsync(deviceType, deviceId, putPayload) {

        // q will help us with returning a promise
        var deferred = q.defer();

        // build request URI
        var requestUri = apiEndpoint + '/' + deviceType + '/' + deviceId;

        // Set the headers
        var headers = {
            'Authorization': 'Bearer ' + bearerToken,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Content-length': JSON.stringify(putPayload).length
        }

        // Configure the request
        var options = {
            url: requestUri,
            method: 'PUT',
            headers: headers,
            followAllRedirects: true,
            body: JSON.stringify(putPayload)
        }

        // Start the request
        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                deferred.resolve(JSON.parse(body));
            } else {
                deferred.reject('Woops, there was an error putting device details: ' + error + ' (' + response.statusCode + ')');
            }
        });

        return deferred.promise;
    }

    // Sets the desired state (of a single field)
    setDesiredStateAsync(deviceType, deviceId, field, value) {

        // q will help us with returning a promise
        var deferred = q.defer();

        // build the object with desired state
        var putPayload = { 'data': { 'desired_state': {} } };
        putPayload.data.desired_state[field] = value;

        this.putDeviceDetailsAsync(deviceType, deviceId, putPayload).then((response) => {

            // successfully put device details, parse out the desired state
            // of the requested field in the response
            var data = response.data;
            if (!!data) {
                var desiredStateCollection = data['desired_state'];

                if (!!desiredStateCollection) {
                    deferred.resolve(desiredStateCollection[field]);
                } else {
                    deferred.reject('Invalid response from server: no desired state collection.');
                }
            } else {
                deferred.reject('Invalid response from server: no data element.');
            }
        }).catch((error) => {
            // there was an error
            deferred.reject(error);
        });

        return deferred.promise;
    }

    // Gets the desired state (of a single field)
    getDesiredStateAsync(deviceType, deviceId, field) {

        // q will help us with returning a promise
        var deferred = q.defer();

        this.getDeviceDetailsAsync(deviceType, deviceId).then((response) => {

            // successfully got device details, parse out the desired state
            // of the requested field
            var data = response.data;
            if (!!data) {
                var desiredStateCollection = data['desired_state'];

                if (!!desiredStateCollection) {
                    deferred.resolve(desiredStateCollection[field]);
                } else {
                    deferred.reject('Invalid response from server: no desired state collection.');
                }
            } else {
                deferred.reject('Invalid response from server: no data element.');
            }
        }).catch((error) => {
            // there was an error
            deferred.reject(error);
        });

        return deferred.promise;
    }

    // Gets the last reading (of a single field)
    getLastReadingAsync(deviceType, deviceId, field) {

        // q will help us with returning a promise
        var deferred = q.defer();

        this.getDeviceDetailsAsync(deviceType, deviceId).then((details) => {

            // successfully got device details, parse out the last reading
            // of the requested field
            var data = details.data;
            if (!!data) {
                var lastReadingsCollection = data['last_reading'];

                if (!!lastReadingsCollection) {
                    deferred.resolve(lastReadingsCollection[field]);
                } else {
                    deferred.reject('Invalid response from server: no last reading collection.');
                }
            } else {
                deferred.reject('Invalid response from server: no data element.');
            }
        }).catch((error) => {
            // there was an error
            deferred.reject(error);
        });

        return deferred.promise;
    }
}

// Export the helper from the module.
module.exports = WinkHelper;