// This code uses ES2015 syntax that requires at least Node.js v4.
// For Node.js ES2015 support details, reference http://node.green/

"use strict";
var Crypto = require('crypto');
var request = require('request-promise');
var OpenT2T = require('opent2t').OpenT2T;
var OpenT2TConstants = require('opent2t').OpenT2TConstants;
var OpenT2TError = require('opent2t').OpenT2TError;
var promiseReflect = require('promise-reflect'); // Allows Promise.all to wait for all promises to complete

/**
* This translator class implements the "Hub" interface.
*/
class Translator {
    constructor(authTokens, logger) {
        this.name = "opent2t-translator-com-smartthings-hub";
        this._authTokens = authTokens;
        this._baseUrl = '';
        this._devicesPath = '/devices';
        this._updatePath = '/update';
        this._deviceChangeSubscriptionPath = '/deviceSubscription';
        this._deviceGraphSubscriptionPath = '/locationSubscription';        
        this._name = "SmartThings Hub"; // TODO: Can be pulled from OpenT2T global constants.
        this.logger = logger; 
        this.opent2t = new OpenT2T(logger);
    }

    /**
     * Get the hub definition and devices
     */
    get(expand, payload) {
         return this.getPlatforms(expand, payload);
    }

    /**
      * Get the list of devices discovered through the hub.
     * 
     * @param {bool} expand - True to include the current state of the resources.
     * @param {Buffer} payload - POST content for a subscribed notification
     * @param {Object} verification - Information used to authenticate that the post is valid
     * @param {Array} verification.header - Header information that came with the payload POST.
     *                                      Includes hubSignature.
     * @param {verification} verification.key - Secret key used to hash the payload (provided to Wink on subscribe)
     */
    getPlatforms(expand, payload, verification) {
        if (payload === undefined) {
            return this._getEndpoints().then((endpoints) => {
                return this._getPlatformsByEndpointList(expand, endpoints);
            });
        } else {
            this.logger.verbose("Subscription Payload: " + JSON.stringify(payload, null, 2));
            
            //HMAC verification
            var payloadAsString = typeof payload === 'object' ? JSON.stringify(payload) : payload;

            // Calculate the HMAC for the payload using the secret
            if (verification !== undefined && verification.key !== undefined) {
                var hashFromSmartThings = verification.header.Signature;
                var hashFromPayload = this._generateHmac(verification.key, payloadAsString);

                if (hashFromSmartThings !== hashFromPayload) {
                    throw new OpenT2TError(401, OpenT2TConstants.HMacSignatureVerificationFailed);
                }

            }
            
            if(payload.eventType){
                //SmartThings device graph event: device added/removed
                return this._getEndpointByLocationId(payload.locationId).then((endpoints) => {
                    return this._getPlatformsByEndpointList(expand, endpoints);
                });
            }else{
                //SmartThings device change event
                return this._getEndpointByLocationId(payload.locationId).then((endpoints) => {
                    if (endpoints.length === 0) return undefined;
                    
                    return this._providerSchemaToPlatformSchema(payload, expand, endpoints[0]);
                });
            }
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
                if (result[0] === 'succeed') {
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

    /**
     * Gets the subscription modes supported by this provider and translator
     */
    getSubscribe() {
        return {
            supportedModes: ['postbackUrl', 'polling']
        }
    }

    /* eslint no-unused-vars: "warn" */

    /**
     * Subscribe to notifications for a platform.
     * This function is intended to be called by the platform translator for initial subscription,
     * and on the hub translator (this) for verification.
     */
    postSubscribe(subscriptionInfo) {
        if (subscriptionInfo.callbackUrl){
            var requestPath = "";
            if(subscriptionInfo.controlId){
                //subscribe to paltform change
                requestPath = this._deviceChangeSubscriptionPath + '?deviceId=' + subscriptionInfo.controlId 
                                                + '&subscriptionURL=' + subscriptionInfo.callbackUrl;
            } else {
                //subscribe to device graph (hub-level change)
                requestPath = this._deviceGraphSubscriptionPath + '?subscriptionURL=' + subscriptionInfo.callbackUrl;
            }

            if(subscriptionInfo.key){
                requestPath += "&key=" + subscriptionInfo.key;
            }
            
            if(subscriptionInfo.endpointUri){
                return this._makeRequest(subscriptionInfo.endpointUri, requestPath, 'POST', '');
            } else {
                return this._getEndpoints().then((endpoints) => {
                    return this._makeRequest(endpoints, requestPath, 'POST', '');
                });
            }
        }
    }

    /**
     * Unsubscribe from a platform subscription.
     * This function is intended to be called by a platform translator
     */
    _unsubscribe(subscriptionInfo) {
        if(subscriptionInfo.endpointUri){
            if(subscriptionInfo.controlId){
                //unsubscribe to paltform change
                var requestPath = this._deviceChangeSubscriptionPath + '?deviceId=' + subscriptionInfo.controlId 
                                                + '&subscriptionURL=' + subscriptionInfo.callbackUrl;
                return this._makeRequest(subscriptionInfo.endpointUri, requestPath, 'DELETE');
            }
        } else {
            //unsubscribe from device graph (hub-level change)
            requestPath = this._deviceGraphSubscriptionPath + '?subscriptionURL=' + subscriptionInfo.callbackUrl;
            return this._getEndpoints().then((endpoints) => {
                return this._makeRequest(endpoints, requestPath, 'DELETE');
            });
        }
    }


    /**
     * Get all platforms from a list of SmartThings endpoints
     */
    _getPlatformsByEndpointList(expand, endpoints) {

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
                var allErrors = [];
                hubResults.forEach((hub) => {
                    allPlatforms = allPlatforms.concat(hub.platforms);
                    allErrors = allErrors.concat(hub.errors);
                });
                return {
                    schema: "org.opent2t.sample.hub.superpopular",
                    platforms: allPlatforms,
                    errors: allErrors
                };
            });
    }

    /**
     * Translates an array of provider schemas into an opent2t/OCF representations
     */
    _providerSchemaToPlatformSchema(providerSchemas, expand, endpointUri) {
        var platformPromises = [];
        var toReturn = {
            schema: "org.opent2t.sample.hub.superpopular",
            platforms: [],
            errors: []
        };

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
                platformPromises.push(this.opent2t.createTranslatorAsync(opent2tInfo.translator, { 'deviceInfo': deviceInfo, 'hub': this })
                    .then((translator) => {

                        var deviceData = smartThingsDevice;
                        deviceData.endpointUri = endpointUri;

                        // Use get to translate the SmartThings formatted device that we already got in the previous request.
                        // We already have this data, so no need to make an unnecesary request over the wire.
                        return this.opent2t.invokeMethodAsync(translator, opent2tInfo.schema, 'get', [expand, deviceData])
                            .then((platformResponse) => {
                                return Promise.resolve(platformResponse);
                            });
                    }).catch((err) => {
                        return Promise.reject(err);
                    }));
            } else {
                // Platforms without translators should be recorded as errors, but can be safely ignored.
                toReturn.errors.push(new OpenT2TError(404, `${OpenT2TConstants.UnknownPlatform}: ${smartThingsDevice.deviceType}`));
            }
        });

        // Return a promise for all platform translations
        // Mapping to promiseReflect will allow all promises to complete, regardless of resolution/rejection
        // Rejections will be converted to OpenT2TErrors and returned along with any valid platform translations.
        return Promise.all(platformPromises.map(promiseReflect))
            .then((values) => {
                // Resolved promises will be succesfully translated platforms
                toReturn.platforms = values.filter(v => v.status == 'resolved').map(p => { return p.data; });
                toReturn.errors = toReturn.errors.concat(values.filter(v => v.status === 'rejected').map(r => {
                    return r.error.name !== 'OpenT2TError' ? new OpenT2TError(500, r.error) : r.error;
                }));
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
            case "contactSensor":
            case "motionSensor":
            case "presenceSensor":
            case "waterSensor":
            case "genericSensor":
                return {
                    "schema": 'org.opent2t.sample.multisensor.superpopular',
                    "translator": 'opent2t-translator-com-smartthings-sensorpod'
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
            var endpoints = responses.map(p => { return p.uri; });
            return Promise.resolve(endpoints);
        });
    }
    
    /**
     * Get all endpointUri URIs of the location 
     */
    _getEndpointByLocationId(locationId) {
        var endpointUrl = 'https://graph.api.smartthings.com/api/smartapps/endpoints/' + this._authTokens['access'].client_id + '?access_token=' + this._authTokens['access'].token;

        return this._makeRequest("", endpointUrl, 'GET').then((responses) => {
            var endpoints = responses.filter(r => r.location.id === locationId).map(p => { return p.uri; });
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

                //Since PUT and DELETE does not return with "success" status in its response payload,
                //we assume 0-length body is success. Otherwise a error would thrown.
                //http://docs.smartthings.com/en/latest/smartapp-web-services-developers-guide/smartapp.html#defaults 
                if (method === 'PUT' || method === 'DELETE') {
                    if (body.length === 0) {
                        return ["succeed"];
                    } else {
                        let errorMsg = "Non-zero length body for PUT/DELETE call to SmartThings";
                        this.logger.warn(errorMsg);
                        return errorMsg;
                    }
                } else {
                    return JSON.parse(body);
                }                
            }.bind(this));
    }

    /** 
     * Calculates a new hash of contents using key.
     */
    _generateHmac(key, contents) {
        var hmac = Crypto.createHmac("sha1", key);
        hmac.update(contents.toString());
        return hmac.digest("hex");
    }
}

module.exports = Translator;