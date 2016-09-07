'use strict';

var request = require('request-promise');

// Hue v2 api endpoint as documented here: http://www.developers.meethue.com/philips-hue-api
var apiBaseAddress = 'https://api.meethue.com/v2/bridges/';

// Internal state used to make subsequent API calls
var apiEndpoint, bearerToken;

function isLightState(propertyName)
{
    switch (propertyName){
        case "on":
        case "bri":
        case "hue":
        case "sat":
        case "xy":
        case "ct":
        case "alter":
        case "effect":
        case "colormode":
        case "reachable":
            return true;
            break;
        default:
            return false;
    }
    return false;
}

class HueHelper {

    // Init Helper: Sets the initial parameters to build our target endpoint
    constructor(accessToken, bridgeId, whitelistId) {
        bearerToken = accessToken;
		apiEndpoint =  apiBaseAddress + bridgeId + '/' + whitelistId;
        console.log('Initialized Hue Helper.');
    }

    // Gets device details (all fields), response formatted per http://docs.winkapiv2.apiary.io/
    getDeviceDetailsAsync(deviceType, deviceId) {
	
        // build request URI
        var requestUri = apiEndpoint + '/' + deviceType + '/' + deviceId;

        // Set the headers
        var headers = {
            'Authorization': 'Bearer ' + bearerToken,
            'Accept': 'application/json'
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

    // Puts device details (all fields) payload formatted per http://www.developers.meethue.com/philips-hue-api
    putDeviceDetailsAsync(deviceType, deviceId, putPayload) {

        var stateChanges = {};
        var nonStateChanges = {};
        var result = "[";
        var requestUri, headers, options;
        for (var item in putPayload)
        {
            if(isLightState(item))
            {
                stateChanges[item] = putPayload[item];
            }else{
                nonStateChanges[item] = putPayload[item];
            }
        }
        
        return sendAsyncRequest(apiEndpoint + '/' + deviceType + '/' + deviceId +　'/state', stateChanges)
        .then(function(body){
            result += body;
            return sendAsyncRequest(apiEndpoint + '/' + deviceType + '/' + deviceId, nonStateChanges)
            .then(function(body){
                if(body.length > 1 && result[result.length-1] == '}'){
                    result += ',';
                } 
                result += body + ']';
                return JSON.parse(result);
            })
        });
    }
}

function sendAsyncRequest(requestUri, payload)
{  
    if(payload != {}){
        
        var headers = {
                'Authorization': 'Bearer ' + bearerToken,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Content-length': (JSON.stringify(payload)).length
            }

            // Configure the request
        var options = {
                url: requestUri,
                method: 'PUT',
                headers: headers,
                followAllRedirects: true,
                body: JSON.stringify(payload)
            }
        
        return request(options).then(function (body) {
             // request succeeded.
             return body.substring(1,body.length-1);
        });
    }
    return Promise.resolve('');
}

// Export the helper from the module.
module.exports = HueHelper;