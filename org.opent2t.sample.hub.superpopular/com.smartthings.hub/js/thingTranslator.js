// This code uses ES2015 syntax that requires at least Node.js v4.
// For Node.js ES2015 support details, reference http://node.green/

"use strict";
var request = require('request-promise');
var OpenT2T = require('opent2t').OpenT2T;
var OpenT2TLogger = require('opent2t').Logger;
/**
* This translator class implements the "Hub" interface.
*/
class Translator {
    constructor(authTokens, logLevel = "info") {
        this._authTokens = authTokens;
        this._baseUrl = '';
        this._devicesPath = '/devices';
        this._updatePath = '/update';
        this._name = "SmartThings Hub"; // TODO: Can be pulled from OpenT2T global constants.
        this.ConsoleLogger = new OpenT2TLogger(logLevel);
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
            return this._providerSchemaToPlatformSchema(payload, expand, undefined);
        } else {
            return this._getEndpoints().then((endpoints) => {
                if (endpoints.length === 0) return undefined;
                    
                var endpointPromises = [];
                
                endpoints.forEach((endpointUri) => {
                    endpointPromises.push(this._makeRequest(endpointUri, this._devicesPath, 'GET') 
                        .then((devices) => {
                            return this._providerSchemaToPlatformSchema(devices, expand, endpointUri);
                        }));
                });
                
                return Promise.all(endpointPromises)
                   .then((hubResults) => {
                       // merge all platforms from hubs.
                       var allPlatforms = [];
                       hubResults.forEach((hub) => {
                           allPlatforms = allPlatforms.concat(hub.platforms);
                       });
                       return {
                           schema: "org.opent2t.sample.hub.superpopular",
                           platforms: allPlatforms
                       };
                   });
            });
        }
    }

    /**
     * Get the name of the hub.  Ties to the n property from oic.core
     */
    getN() {
        return this._name;
    }

    /**
     * Gets device details (all fields)
     */
    getDeviceDetailsAsync(endpointUri, deviceId) {
        return this._makeRequest(endpointUri, this._devicesPath + '/' + deviceId, 'GET')
            .then((device) => {
                var returnDevice = device;
                returnDevice.endpointUri = endpointUri;
                return returnDevice;
            });
    }

    /**
     * Puts device details (all fields) payload
     */
    putDeviceDetailsAsync(endpointUri, deviceId, putPayload) {
        var putPayloadString = JSON.stringify(putPayload);
        return this._makeRequest(endpointUri, this._updatePath + '/' + deviceId, 'PUT', putPayloadString)
            .then((result) => {
                if (result === "succeed") {
                    return this.getDeviceDetailsAsync(endpointUri, deviceId);
                }
                return undefined;
            });
    }

    /* eslint no-unused-vars: "off" */
    /**
     * Refreshes the OAuth token for the hub: Since SmartThings access token lasts for 50 years, simply return the input access token.
     */
    refreshAuthToken(authInfo) {
        return this._authTokens;
    }
    /* eslint no-unused-vars: "warn" */

    /**
     * Subscribe to notifications for a platform.
     * This function is intended to be called by the platform translator for initial subscription,
     * and on the hub translator (this) for verification.
     */
    _subscribe(subscriptionInfo) {
        var requestPath = '/subscription/' + subscriptionInfo.controlId;
        return this._makeRequest(subscriptionInfo.endpointUri, requestPath, 'POST', '');
    }

    /**
     * Unsubscribe from a platform subscription.
     * This function is intended to be called by a platform translator
     */
    _unsubscribe(subscriptionInfo) {
        var requestPath = '/subscription/' + subscriptionInfo.controlId;
        return this._makeRequest(subscriptionInfo.endpointUri, requestPath, 'DELETE');
    }

    /**
     * Translates an array of provider schemas into an opent2t/OCF representations
     */
    _providerSchemaToPlatformSchema(providerSchemas, expand, endpointUri) {
        var platformPromises = [];

        // Ensure that we have an array of provider schemas, even if a single object was given.
        var devices = [].concat(providerSchemas);

        devices.forEach((smartThingsDevice) => {
            // get the opent2t schema and translator for the SmartThings device
            var opent2tInfo = this._getOpent2tInfo(smartThingsDevice.deviceType);

            if (typeof opent2tInfo !== 'undefined') // we support the device                    
            {
                /// set the opent2t info for the SmartThings device
                var deviceInfo = {};
                deviceInfo.opent2t = {};
                deviceInfo.opent2t.controlId = smartThingsDevice.id;
                deviceInfo.opent2t.endpointURI = endpointUri;

                // Create a translator for this device and get the platform information, possibly expanded
                platformPromises.push(OpenT2T.createTranslatorAsync(opent2tInfo.translator, { 'deviceInfo': deviceInfo, 'hub': this })
                    .then((translator) => {

                        var deviceData = smartThingsDevice;
                        deviceData.endpointUri = endpointUri;

                        // Use get to translate the SmartThings formatted device that we already got in the previous request.
                        // We already have this data, so no need to make an unnecesary request over the wire.
                        return OpenT2T.invokeMethodAsync(translator, opent2tInfo.schema, 'get', [expand, deviceData])
                            .then((platformResponse) => {
                                return platformResponse;
                            });
                    }).bind(this) //Pass in the context via bind() to use instance variables
                    .catch((err) => {
                        this.ConsoleLogger.warn('warning: OpenT2T.createTranslatorAsync error - ', err);
                        return Promise.resolve(undefined);
                    }).bind(this)); //Pass in the context via bind() to use instance variables
            }
        });

        return Promise.all(platformPromises)
            .then((platforms) => {

                var toReturn = {};
                toReturn.schema = "org.opent2t.sample.hub.superpopular";
                toReturn.platforms = [];
                for (var i = 0; i < platforms.length; i++) {
                    if (platforms[i] !== undefined) {
                        toReturn.platforms.push(platforms[i]);
                    }
                }

                return toReturn;
            });
    }

    /** 
     * Given the hub specific device, returns the opent2t schema and translator
     */
    _getOpent2tInfo(deviceType) {
        switch (deviceType) {
            case "dimmerSwitch":
            case "light":
                return {
                    "schema": 'org.opent2t.sample.lamp.superpopular',
                    "translator": 'opent2t-translator-com-smartthings-lightbulb'
                };
            case "switch":
                return {
                    "schema": 'org.opent2t.sample.binaryswitch.superpopular',
                    "translator": 'opent2t-translator-com-smartthings-binaryswitch'
                };
            case "thermostat":
                return {
                    "schema": 'org.opent2t.sample.thermostat.superpopular',
                    "translator": 'opent2t-translator-com-smartthings-thermostat'
                };
            default:
                return undefined;
        }
    }

    /**
     * Get all endpointUri URIs associated to the account
     */
    _getEndpoints() {
        var endpointUrl = 'https://graph.api.smartthings.com/api/smartapps/endpoints/' + this._authTokens['access'].client_id + '?access_token=' + this._authTokens['access'].token;

        return this._makeRequest("", endpointUrl, 'GET').then((responses) => {
            var endpoints = [];
            responses.forEach((response) => {
                endpoints.push(response.uri);
            });
            return Promise.resolve(endpoints);
        });
    }

    /**
     * Internal helper method which makes the actual request to the hue service
     */
    _makeRequest(endpointUri, path, method, content) {

        // build request URI
        var requestUri = endpointUri + path;

        // Set the headers
        var headers = {
            'Authorization': 'Bearer ' + this._authTokens['access'].token,
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

                if (method === 'PUT' || method === 'DELETE') {
                    // TODO: Why is this check below in the first place? 
                    // It seems very weird to check 0 length body
                    if (body.length === 0) {
                        return "succeed";
                    } else {
                        let errorMsg = "Non-zero length body for PUT/DELETE call to SmartThings";
                        this.ConsoleLogger.warn(errorMsg);
                        return errorMsg;
                    }
                } else {
                    return JSON.parse(body);
                }                
            }.bind(this));
    }
}

module.exports = Translator;