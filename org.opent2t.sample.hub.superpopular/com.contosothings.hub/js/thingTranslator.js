"use strict";
var request = require('request-promise');
var OpenT2T = require('opent2t').OpenT2T;
var OpenT2TError = require('opent2t').OpenT2TError;
var OpenT2TConstants = require('opent2t').OpenT2TConstants;

/**
* This translator class implements the "Hub" interface.
*/
class Translator {
    constructor(logger, deviceInfo) {
        this._hubId = deviceInfo[0].hubId;
        this._contosoPassword = deviceInfo[1].contosoPassword;

        this._baseUrl = deviceInfo[1].contosoUrl;
        this._devicesPath = '/api/hubsApi/' + this._hubId;

        this._name = "ContosoThings Hub";
        this.logger = logger; 
        this.opent2t = new OpenT2T(logger);
    }

    /**
     * Get the hub definition and devices
     */
    get(expand) {
        return this.getPlatforms(expand);
    } 

    /**
     * Get the list of devices discovered through the hub.
     */
    getPlatforms(expand) {
        return this._makeRequest(this._devicesPath, 'GET').then((response) => {
            var devices = response.Things;

            var platformPromises = [];
            devices.forEach((ctDevice) => {
                // get the opent2t schema and translator for the ` device
                var opent2tInfo = this._getOpent2tInfo(ctDevice);

                if (typeof opent2tInfo !== 'undefined')
                {
                    // set the opent2t info for the device
                    var deviceInfo = {};
                    deviceInfo.opent2t = {};
                    deviceInfo.opent2t.controlId = ctDevice.Id;
                    
                    // Create a translator for this device and get the platform information, possibly expanded
                    platformPromises.push(this.opent2t.createTranslatorAsync(opent2tInfo.translator, {'deviceInfo': deviceInfo, 'hub': this})
                                    .then((translator) => {

                                        // Use get to translate the contosothings formatted device that we already got in the previous request.
                                        // We already have this data, so no need to make an unnecesary request over the wire.
                                        return this.opent2t.invokeMethodAsync(translator, opent2tInfo.schema, 'get', [expand, ctDevice])
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
        });
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
    getDeviceDetailsAsync(deviceType, deviceId) {

        // build request URI
        var requestPath = this._devicesPath + '?deviceId=' + deviceId;

        // Make the async request
        return this._makeRequest(requestPath, 'GET');
    }

    /**
     * Puts device details (all fields) payload
    */
    putDeviceDetailsAsync(deviceType, deviceId, putPayload) {
        putPayload.id = this._hubId;
        // build request path and body
        var requestPath = '/api/hubsApi/';
        var putPayloadString = JSON.stringify(putPayload);

        // Make the async request
        return this._makeRequest(requestPath, 'POST', putPayloadString);
    }
    
    /**
     * Subscribes, not implemented.
     * 
     * @param {string} deviceType - Device Type (e.g. 'thermostats')
     * @param {string|number} deviceId - Id for the specific device
     * @param {string} callbackUrl - Callback url for feed postbacks
     * @param {HttpRequest} verificationRequest - GET request received by the server at a previously subscribed
     *      callback URL.  This completes the verification half of the subscription.
     * @param {HttpResponse} verificationResponseContent - Content that should be provided in the response to the
     *      verification request as {'Content-Type': 'text/plain'}.  All responses should use code 200 unless an
     *      error is caught.
     * @returns {number} Object containing the subscription expiration time, and any content that
     *      needs to be included in a response to the original request.
     */
    _subscribe(deviceType, deviceId, callbackUrl, verificationRequest) {
        // fix lint error
        console.log(deviceType + deviceId + callbackUrl + verificationRequest);
        throw new OpenT2TError(501, OpenT2TConstants.NotImplemented);
    }

    /**
     * Unsubscribes, not implemented.
     * 
     * @param {string} deviceType - Device Type (e.g. 'thermostats')
     * @param {string|number} deviceId - Id for the specific device
     * @param {string} callbackUrl - URL that will be unsubscribed
     * @returns {request} Promise that supplies the server response
     * 
     */
    _unsubscribe(deviceType, deviceId, callbackUrl) {
        // fix lint error
        console.log(deviceType + deviceId + callbackUrl);
        throw new OpenT2TError(501, OpenT2TConstants.NotImplemented);
    }

    /**
     * Gets all subscriptions for a device, not implemented.
     * 
     * @param {string} deviceType - Device Type (e.g. 'thermostats')
     * @param {string|number} deviceId - Id for the specific device
     * @returns {request} Promise that supplies the list of subscriptions
     * 
     * This is just a helper for tests and verification.
     */
    _getSubscriptions(deviceType, deviceId) {
        // fix lint error
        console.log(deviceType + deviceId);
        throw new OpenT2TError(501, OpenT2TConstants.NotImplemented);
    }

    /** 
     * Given the hub specific device, returns the opent2t schema and translator
    */
    _getOpent2tInfo(ctDevice) {
        // if (ctDevice.ThingsType == 3) {
        //     return { 
        //         "schema": 'opent2t.p.thermostat',
        //         "translator": "opent2t-translator-com-contosothings-thermostat"
        //     };
        // }
        if (ctDevice.ThingsType == 0) {
            return { 
                "schema": 'opent2t.p.switch.binary',
                "translator": "opent2t-translator-com-contosothings-binaryswitch"
            };
        }
        else if (ctDevice.ThingsType == 1 || ctDevice.ThingsType == 2) {
            return { 
                "schema": 'opent2t.p.light',
                "translator": "opent2t-translator-com-contosothings-lightbulb"
            };
        }
        
        return undefined;
    }
    
    /**
     * Internal helper method which makes the actual request to contosothings service
     */
    _makeRequest(path, method, content) {
        // build request URI
        var requestUri = this._baseUrl + path;

        // Set the headers
        var headers = {
            'Authorization': this._contosoPassword
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
                console.log("---------------------------------------------");
                throw err;
            });
    }

}

module.exports = Translator;