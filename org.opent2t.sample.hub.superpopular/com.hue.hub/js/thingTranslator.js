// This code uses ES2015 syntax that requires at least Node.js v4.
// For Node.js ES2015 support details, reference http://node.green/

"use strict";
var request = require('request-promise');
var OpenT2T = require('opent2t').OpenT2T;

/**
* This translator class implements the "Hub" interface.
*/
class Translator {
    constructor(accessTokenInfo) {
        this._accessToken = accessTokenInfo;
        this._baseUrl = 'https://api.meethue.com/v2/bridges/' + accessTokenInfo.bridgeId + '/' + accessTokenInfo.whitelistId;
        this._devicesPath = '/lights';
        this._name = "Hue Bridge"; // TODO: Can be pulled from OpenT2T global constants. This information is not available, at least, on hub hub.
    }

    /**
    * Get the hub definition and devices
    */
    get(expand, payload) {
        return this.getPlatforms(expand, payload);
    }

    /**
    * Get the list of devices discovered through the hub.
    */
    getPlatforms(expand, payload) {
        if (payload != undefined) {
            return this._providerSchemaToPlatformSchema(payload, expand);
        }
        else {
            return this._makeRequest(this._devicesPath, 'GET')
                .then((devices) => {
                    return this._providerSchemaToPlatformSchema(devices, expand);
                });
        }
    }

    /**
     * Translates an array of provider schemas into an opent2t/OCF representations
     */
    _providerSchemaToPlatformSchema(providerSchemas, expand) {
        var platformPromises = [];
        // Ensure that we have an array of provider schemas, even if a single object was given.
        var devices = [];
        for (var id in providerSchemas) {
            var device = providerSchemas[id];
            device.deviceid = id;
            devices.push(device);
        }

        devices.forEach((hueDevice) => {

            // get the opent2t schema and translator for the hue device
            var opent2tInfo = this._getOpent2tInfo(hueDevice);

            if (opent2tInfo !== 'undefined') // we support the device                    
            {
                // set the opent2t info for the Hue light
                var deviceInfo = {};
                deviceInfo.opent2t = {};
                deviceInfo.opent2t.controlId = hueDevice.deviceid;

                // Create a translator for this device and get the platform information, possibly expanded
                platformPromises.push(OpenT2T.createTranslatorAsync(opent2tInfo.translator, { 'deviceInfo': deviceInfo, 'hub': this })
                    .then((translator) => {
                        // Use get to translate the SmartThings formatted device that we already got in the previous request.
                        // We already have this data, so no need to make an unnecesary request over the wire.
                        return OpenT2T.invokeMethodAsync(translator, opent2tInfo.schema, 'get', [expand, hueDevice])
                            .then((platformResponse) => {
                                return platformResponse;
                            });
                    }));
            }
        });

        return Promise.all(platformPromises)
                .then((platforms) => {
                    var toReturn = {};
                    toReturn.schema = "opent2t.p.hub";
                    toReturn.platforms = platforms;
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
        return this._makeRequest(requestPath, 'GET')
            .then((response) => {
                var device = response;
                device.deviceid = deviceId;
                return device;
            });
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
                    if (partialResult[j].success !== undefined) {

                        //construct partial provider schema from the return message
                        var key = Object.keys(partialResult[j].success)[0];
                        var tokens = key.split('/');
                        var partialDevice;

                        switch (tokens.length) {
                            case 5:
                                partialDevice = { [tokens[3]]: { [tokens[4]]: partialResult[j].success[key] } };
                                break;
                            case 4:
                                partialDevice = { [tokens[3]]: partialResult[j].success[key] };
                                break;
                            default:
                                break;
                        }
                        partialDevice.deviceid = deviceId;

                        result.push(partialDevice);
                    } else {

                        var error = {
                            statusCode: partialResult[j].error.type,
                            response: {
                                statusMessage: partialResult[j].error.description,
                                address: partialResult[j].error.address
                            }
                        }

                        throw error;
                    }
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