'use strict';

var request = require('request');
var q = require('q');

// wink v2 api endpoint as documented here: http://docs.winkapiv2.apiary.io/
var apiEndpoint = 'https://api.wink.com';

// Internal state used to make subsequent API calls
var bearerToken;

// Gets device details, per http://docs.winkapiv2.apiary.io/
function getDeviceDetails(deviceType, deviceId) {

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
        headers: headers
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

// Puts device details, per http://docs.winkapiv2.apiary.io/
function putDeviceDetails(deviceType, deviceId, value) {

    // q will help us with returning a promise
    var deferred = q.defer();

    // build request URI
    var requestUri = apiEndpoint + '/' + deviceType + '/' + deviceId;

    // Set the headers
    var headers = {
        'Authorization': 'Bearer ' + bearerToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-length': JSON.stringify(value).length
    }

    // Configure the request
    var options = {
        url: requestUri,
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(value)
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

module.exports =
    {
        // set the initial parameters to build our target endpoint
        init: function (accessToken) {
            bearerToken = accessToken;

            console.log('Initialized Wink Helper.');
        },

        setDesiredState: function (deviceType, deviceId, field, value) {

            // q will help us with returning a promise
            var deferred = q.defer();

            // build the object with desired state
            var putBody = { 'data': { 'desired_state': {} } };
            putBody.data.desired_state[field] = value;

            putDeviceDetails(deviceType, deviceId, putBody).then((response) => {

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
        },

        getDesiredState: function (deviceType, deviceId, field) {

            // q will help us with returning a promise
            var deferred = q.defer();

            getDeviceDetails(deviceType, deviceId).then((details) => {

                // successfully got device details, parse out the desired state
                // of the requested field
                var data = details.data;
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
        },

        getLastReading: function (deviceType, deviceId, field) {

            // q will help us with returning a promise
            var deferred = q.defer();

            getDeviceDetails(deviceType, deviceId).then((details) => {

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



