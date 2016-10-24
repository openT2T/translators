/* jshint esversion: 6 */
/* jshint node: true */
/* jshint sub:true */
// This code uses ES2015 syntax that requires at least Node.js v4.
// For Node.js ES2015 support details, reference http://node.green/

"use strict";
var request = require('request-promise');

/**
* This translator class implements the "Hub" interface.
*/
class Translator {
    constructor(accessTokenInfo) {
        this._accessToken = accessTokenInfo;
        this._baseUrl = 'https://api.meethue.com/v2/bridges/' + accessTokenInfo.bridgeId + '/' + accessTokenInfo.whitelistId;
        this._devicesPath = '/lights';
        this._name = "Hue Bridge"; // TODO: Can be pulled from OpenT2T global constants. This information is not available, at least, on hue hub.
    }

    /**
     * Get the list of devices discovered through the hub.
     */
    getHubResURI() {
        return this._makeRequest(this._devicesPath, 'GET').then((devices) => {

            var toReturn = {};
            var filteredDevices = [];
            for (var hueDeviceID in devices){

                var hueDevice = devices[hueDeviceID];
                // get the opent2t schema and translator for the hue device
                var opent2tInfo = this._getOpent2tInfo(hueDevice);

                if (opent2tInfo != undefined) // we support the device                    
                {
                    // we only need to return certain properties back
                    var device = {};
                    device.name = hueDevice.name;

                    // set the specific device object id to be the id
                    device.id = hueDeviceID;

                    // set the opent2t info for the hue device
                    device.openT2T = opent2tInfo;
                    
                    filteredDevices.push(device);
                }
            }

            toReturn.devices = filteredDevices;

            return toReturn;
        });
    }

    /**
     * Get the name of the hub.  Ties to the n property from oic.core
     */
    getN() {
        return this._name;
    }

    /**
     * Gets device details (all fields), response formatted per http://www.developers.meethue.com/documentation/lights-api
     */
    getDeviceDetailsAsync(deviceType, deviceId) {

        // build request URI
        var requestPath = '/' + deviceType + '/' + deviceId;

        // Make the async request
        return this._makeRequest(requestPath, 'GET');
    }

    /**
     * Puts device details (all fields) payload formatted per http://www.developers.meethue.com/documentation/lights-api
    */
    putDeviceDetailsAsync(deviceType, deviceId, putPayload) {

        // build request path and body
        var requestPath = '/' + deviceType + '/' + deviceId;

        var stateChanges = {};
        var nonStateChanges = {};
        for (var item in putPayload) {
            if (this._isLightState(item)) {
                stateChanges[item] = putPayload[item];
            } else {
                nonStateChanges[item] = putPayload[item];
            }
        }

        var promises = [];

        if (Object.keys(stateChanges).length > 0) {
            var statePromise = this._makeRequest(requestPath + '/state', 'PUT', JSON.stringify(stateChanges))
                    .then(function (response) {
                        return Promise.resolve(response);
                    })
            promises.push(statePromise);
        }

        if (Object.keys(nonStateChanges).length > 0) {
            var nonStatePromise = this._makeRequest(requestPath, 'PUT', JSON.stringify(nonStateChanges))
                        .then(function (response) {
                            return Promise.resolve(response);
                        })
            promises.push(nonStatePromise);
        }

        // Merge Responses
        var result = [];
        return Promise.all(promises).then(function (responses) {
            for (var i = 0; i < responses.length ; i++) {
                var partialResult = responses[i];
                for (var j = 0; j < partialResult.length ; j++) {
                    result.push(partialResult[j]);
                }
            }
            return Promise.resolve(result);
        });
    }

    /** 
     * Given the hub specific device, returns the opent2t schema and translator
    */
    _getOpent2tInfo(HueDevice) {
        if (HueDevice.modelid.startsWith('L')) {
            return { 
                "schema": 'org.opent2t.sample.lamp.superpopular',
                "translator": "opent2t-translator-com-hue-bulb"
            };
        }
        
        return undefined;
    }

    /**
     * Determine if a light property name is a device state property or not.
     */
    _isLightState(propertyName) {
        switch (propertyName) {
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
            default:
                return false;
        }
    }

    /**
     * Internal helper method which makes the actual request to the hue service
     */
    _makeRequest(path, method, content) {

        // build request URI
        var requestUri = this._baseUrl + path;

        // Set the headers
        var headers = {
            'Authorization': 'Bearer ' + this._accessToken.accessToken,
            'Accept': 'application/json'
        }

        if (content) {
            headers['Content-Type'] = 'application/json';
            headers['Content-length'] = content.length;
        }

        var options = {
            url: requestUri,
            method: method,
            headers: headers,
            followAllRedirects: true
        };

        if (content) {
            options.body = content;
        }

        // Start the async request
        return request(options)
            .then(function (body) {
                return JSON.parse(body);
            })
            .catch(function (err) {
                console.log("Request failed to: " + options.method + " - " + options.url);
                console.log("Error            : " + err.statusCode + " - " + err.response.statusMessage);
                // todo auto refresh in specific cases, issue 74
                throw err;
            });
    }
}

module.exports = Translator;