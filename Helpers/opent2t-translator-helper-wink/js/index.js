'use strict';

var request = require('request-promise');
var url = require('url');

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

    // TODO: Is the WinkHelper an appropriate place for this?  Or should I just move them to the wink hub translator?
    // The translate method needs to live on the translator, so these could go there as well.  The winkhelper keeps
    // the authorization though, but this comes from the translator/onboarding anyhow, right?

    // Subscribe to Wink notifications
    // serviceurl - The url endpoint set up to receive postbacks and manage verification
    // secret - Subscriber generated secret for HMAC computation (if omitted, HMAC digest will
    //      not be present on callbacks)
    // This method passes the PubSubHubbub a subscriber URL to the Wink device so that the subscriber
    // will receive postbacks.  This subscription needs to be refreshed or it will expire (currently 24 hrs).
    subscribe(deviceType, deviceId, serviceUrl, secret) {
        var requestUri = apiEndpoint + '/' + deviceType + '/' + deviceId + '/' + 'subscriptions';

        // Winks implementation of PubSubHubbub differs from the standard in that we do not need to provide
        // the topic, or mode on this request.  Topic is implicit from the URL (deviceType/deviceId), and
        // separate requests exist for mode (subscribe and unsubscribe vis POST/DELETE).
        var putPayload = {
            'callback': serviceUrl,
            'secret': secret
        }

        var putPayloadString = JSON.stringify(putPayload);

        console.log("Attempting to subscribe to %s with %s", requestUri, JSON.stringify(putPayload));

        var headers = {
            'Authorization': 'Bearer ' + bearerToken,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Content-length': putPayloadString.length
        }

        var options = {
            url: requestUri,
            method: 'POST',
            headers: headers,
            followAllRedirects: true,
            body: putPayloadString
        }

        return request(options)
            .then(function (body) {
                // The request succeeded.
                // The hub response will be 202 "Accepted", and now validation with the service url
                // will proceed.
                return JSON.parse(body);
            });
    }

    // Unsubscribes a subscription id from the device.  This will
    unsubscribe(deviceType, deviceId, subscriptionid)
    {
        var requestUri = apiEndpoint + '/' + deviceType + '/' + deviceId + '/' + 'subscriptions/' + subscriptionid;

        console.log("Attempting to unsubscribe from %s", requestUri)
        
        var headers = {
            'Authorization': 'Bearer ' + bearerToken,
        }

        var options = {
            url: requestUri,
            method: 'DELETE',
            header = headers,
            followAllRedirects: true
        }

        return request(options)
            .then(function (body) {
                return JSON.parse(body);
            });
    }
}

// Export the helper from the module.
module.exports = WinkHelper;