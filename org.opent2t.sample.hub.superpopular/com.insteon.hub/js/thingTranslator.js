// This code uses ES2015 syntax that requires at least Node.js v4.
// For Node.js ES2015 support details, reference http://node.green/

"use strict";
var request = require('request-promise');
var OpenT2T = require('opent2t').OpenT2T;
var OpenT2TConstants = require('opent2t').OpenT2TConstants;
var OpenT2TError = require('opent2t').OpenT2TError;
/* eslint no-unused-vars: "off" */
var InsteonConstants = require('./constants');
/* eslint no-unused-vars: "warn" */
var sleep = require('es6-sleep').promise;
var promiseReflect = require('promise-reflect'); // Allows Promise.all to wait for all promises to complete 

/**
* This translator class implements the "Hub" interface.
*/
class Translator {
    constructor(authTokens, logger) {
        this.name = "opent2t-translator-com-insteon-hub";
        this._authTokens = authTokens;
        this._baseUrl = 'https://connect.insteon.com/api/v2/';
        this._devicesPath = 'devices';
        this._commandPath = 'commands';
        this._name = "Insteon Hub";
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
     * @param {Object} payload - device lists in provider schema
     */
    getPlatforms(expand, payload) {
        if (payload !== undefined) {
            return this._providerSchemaToPlatformSchema(payload, expand);
        } else {
            return this._makeRequest(this._devicesPath, 'GET').then((response) => {
                return this._providerSchemaToPlatformSchema(response.DeviceList, expand);
            });
        }
    }

    /**
     * Translates an array of provider schemas into an opent2t/OCF representations
     */
    _providerSchemaToPlatformSchema(providerSchemas, expand) {
        var platformPromises = [];
        var toReturn = {
            schema: "org.opent2t.sample.hub.superpopular",
            platforms: [],
            errors: []
        }

        providerSchemas.forEach((insteonDevice) => {
            //query detail device data    
            var promise = this._makeRequest(this._devicesPath + '/' + insteonDevice.DeviceID, 'GET')
                .then((data) => {

                    var deviceData = data;

                    // get the opent2t schema and translator for the insteon device
                    var opent2tInfo = this._getOpent2tInfo(deviceData);
                    if (opent2tInfo !== undefined) // we support the device
                    {
                        // set the opent2t info for the wink device
                        var deviceInfo = {};
                        deviceInfo.opent2t = {};
                        deviceInfo.opent2t.controlId = insteonDevice.DeviceID;

                        //Get device properties
                        var postPaylaod = {
                                command: 'get_status',
                                device_id: insteonDevice.DeviceID
                            };

                        return this._makeRequest(this._commandPath, 'POST', JSON.stringify(postPaylaod))
                            .then((response) => {
                                return this._getCommandResponse(response.id) // get device status
                                    .then((deviceStatus) => {
                                        if (deviceStatus !== undefined && deviceStatus.status === 'succeeded') {
                                            
                                            deviceData['Reachable'] = true;

                                            switch (opent2tInfo.schema) {
                                                case 'org.opent2t.sample.thermostat.superpopular':
                                                    for (var status in deviceStatus.response) {
                                                        deviceData[status] = deviceStatus.response[status];
                                                    }
                                                    break;
                                                default:
                                                    deviceData['Level'] = deviceStatus.response.level;
                                                    if (deviceStatus.response.level == 0) {
                                                        deviceData['Power'] = 'off';
                                                    } else {
                                                        deviceData['Power'] = 'on';
                                                    }
                                                    break;
                                            }

                                        } else if (deviceStatus.status === 'failed') {
                                            deviceData['Reachable'] = false;
                                        }
                                        
                                        // Create a translator for this device and get the platform information, possibly expanded
                                        return this.opent2t.createTranslatorAsync(opent2tInfo.translator, { 'deviceInfo': deviceInfo, 'hub': this })
                                            .then((translator) => {
                                                // Use get to translate the Insteon formatted device that we already got in the previous request.
                                                // We already have this data, so no need to make an unnecesary request over the wire.
                                                return this.opent2t.invokeMethodAsync(translator, opent2tInfo.schema, 'get', [expand, deviceData])
                                                    .then((platformResponse) => {
                                                        return Promise.resolve(platformResponse);
                                                    });
                                            }).catch((err) => {
                                                // Being logged in HubController already
                                                return Promise.resolve(undefined);
                                            });
                                        
                                    }).catch((err) => { 
                                        return Promise.reject(err);
                                    });
                            });
                    } else {
                        // Platforms without translators should be recorded as errors, but can be safely ignored.
                        toReturn.errors.push(new OpenT2TError(404, `${OpenT2TConstants.UnknownPlatform}: ${insteonDevice.DeviceID}`));
                    }
                }).catch((err) => {
                    return Promise.reject(err);
                });

            platformPromises.push(promise);
        });

        // Return a promise for all platform translations
        // Mapping to promiseReflect will allow all promises to complete, regardless of resolution/rejection
        // Rejections will be converted to OpenT2TErrors and returned along with any valid platform translations.
        return Promise.all(platformPromises.map(promiseReflect))
            .then((values) => {
                // Resolved promises will be succesfully translated platforms
                toReturn.platforms = values.filter(v => v.status == 'resolved' && v.data != undefined).map(p => { return p.data; });
                toReturn.errors = toReturn.errors.concat(values.filter(v => v.status === 'rejected').map(r => {
                    return r.error.name !== 'OpenT2TError' ? new OpenT2TError(500, r.error) : r.error;
                }));
                return toReturn;
            });
    }

    /**
     * Refreshes the OAuth token for the hub by sending a refresh POST to the wink provider
     */
    refreshAuthToken(authInfo) {
        // We expect the original authInfo object used in the onboarding flow
        // not defining a brand new type for the Refresh() contract and re-using
        // what is defined for Onboarding()
        if (authInfo == undefined || authInfo == null || authInfo.length !== 2) {
            throw new OpenT2TError(401, OpenT2TConstants.InvalidAuthInfoInput);
        }

        var options = {
            url: 'https://connect.insteon.com/api/v2/oauth2/token',
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'grant_type=refresh_token&refresh_token=' + this._authTokens['refresh'].token + '&client_id=' + authInfo[0].client_id
        };

        return request(options).then((body) => {
                var tokenInfo = JSON.parse(body); // This includes refresh token, scope etc..

                // 'expires_in is in minutes', according to http://docs.insteon.apiary.io/#reference/authorization/authorization-grant
                var expiration = Math.floor((new Date().getTime() / 1000) + (tokenInfo.expires_in * 60));

                this._authTokens['refresh'].token = tokenInfo.refresh_token;
                this._authTokens['refresh'].expiration = expiration

                this._authTokens['access'].token = tokenInfo.access_token;
                this._authTokens['access'].expiration = expiration
                this._authTokens['access'].client_id = authInfo[0].client_id;

                return this._authTokens;
                
            });
    }

    /**
     * Get the name of the hub.  Ties to the n property from oic.core
     */
    getN() {
        return this._name;
    }

    /**
     * Gets the subscription modes supported by this provider and translator
     */
    getSubscribe() {
        return {
            supportedModes: ['polling']
        }
    }

    /* eslint no-unused-vars: "off" */
     /**
     * Subscribe to notifications for a platform.
     * This function is intended to be called by the platform translator for initial subscription,
     * and on the hub translator (this) for verification.
     */
    postSubscribe(subscriptionInfo) {
        // Error case: waiting for design decision
        throw new OpenT2TError(501, OpenT2TConstants.NotImplemented);
    }

    /**
     * Unsubscribe from a platform subscription.
     * This function is intended to be called by a platform translator
     */
    _unsubscribe(subscriptionInfo) {
        // Error case: waiting for design decision
        throw new OpenT2TError(501, OpenT2TConstants.NotImplemented);
    }
    /* eslint no-unused-vars: "warn" */


    /**
     * Gets device details (all fields), response formatted per http://docs.insteon.apiary.io/#reference/devices
     */
    getDeviceDetailsAsync(deviceId) {
        // Make the async request
        return this._makeRequest(this._devicesPath + '/' + deviceId, 'GET')
            .then((data) => {

                var deviceData = data;
                var opent2tInfo = this._getOpent2tInfo(deviceData);
                var postPaylaod = {
                    command: 'get_status',
                    device_id: deviceId
                };

                return this._makeRequest(this._commandPath, 'POST', JSON.stringify(postPaylaod))
                    .then((response) => {                       
                        return this._getCommandResponse(response.id) // get device status
                            .then((deviceStatus) => {  
                                if (deviceStatus !== undefined && deviceStatus.status === 'succeeded') {

                                    deviceData['Reachable'] = true;

                                    switch (opent2tInfo.schema) {
                                        case 'org.opent2t.sample.thermostat.superpopular':
                                            for (var status in deviceStatus.response) {
                                                deviceData[status] = deviceStatus.response[status];
                                            }
                                            break;
                                        default:
                                            deviceData['Level'] = deviceStatus.response.level;
                                            if (deviceStatus.response.level == 0) {
                                                deviceData['Power'] = 'off';
                                            } else {
                                                deviceData['Power'] = 'on';
                                            }
                                            break;
                                    }
                                } else if (deviceStatus.status === 'failed') {
                                    deviceData['Reachable'] = false;
                                } else {
                                    throw new OpenT2TError(500, JSON.stringify(deviceStatus, null, 2));
                                }
                                return deviceData;
                            });
                    });
            });
    }

    /**
     * Puts device details (all fields) payload formatted per http://docs.insteon.apiary.io/#reference/devices
     */
    putDeviceDetailsAsync(deviceId, putPayload) {

        // build request path and body
        var statusChanges = { device_id: deviceId };
        var nonStatusChanges = {};
        
        for(var item in putPayload){
            if(this._isDeviceStatus(item)){
                statusChanges[item] = putPayload[item];
            } else {
                nonStatusChanges[item] = putPayload[item];
            }
        }

        var promises = [];

        if (Object.keys(statusChanges).length > 0) {
            var statePromise = this._makeRequest(this._commandPath, 'POST', JSON.stringify(statusChanges))
                .then((response) => {
                    return this._getCommandResponse(response.id) // get command status
                        .then((commandResult) => {
                            return Promise.resolve(commandResult);
                        });
                });
            promises.push(statePromise);
        }

        if (Object.keys(nonStatusChanges).length > 0) {
            var nonStatePromise = this._makeRequest(this._devicesPath + '/' + deviceId, 'GET')
                .then((details) => {
                    for (var item in nonStatusChanges) {
                        details[item] = nonStatusChanges[item];
                    }
                    return this._makeRequest(this._devicesPath + '/' + deviceId, 'PUT', JSON.stringify(details))
                            .then(function (response) {
                                return Promise.resolve(response);
                            });
                });
            promises.push(nonStatePromise);
        }


        // Merge Responses
        var device = {};
        return Promise.all(promises).then(function (responses) {
            
            for (var i = 0; i < responses.length ; i++) {
                if ( responses[i] !== undefined && responses[i].status == 'succeeded') {
                    if (responses[i].command !== undefined) {
                        if (responses[i].command !== undefined ) {
                            switch(responses[i].command.command) {
                                case 'on':
                                case 'off':
                                    device['Power'] = responses[i].command.command;
                                    break;
                                case 'cool':
                                case 'heat':
                                case 'auto':
                                case 'all_off':
                                    device['mode'] = responses[i].command.command;
                                    break;
                                case 'fan_on':
                                case 'fan_auto':
                                    device['fan'] = responses[i].command.command;
                                    break;
                                case 'set_cool_to':
                                    device['cool_point'] = responses[i].command.temp;
                                    break;
                                case 'set_heat_to':
                                    device['heat_point'] = responses[i].command.temp;
                                    break;
                                default:
                                    break;
                            }
                        }
                        
                        if( responses[i].command.level !== undefined) {
                            device['Level'] = responses[i].command.level;
                        }
                    }

                    if (responses[i].content !== undefined) {
                        for (var item in responses[i].content) {
                            device[item] = responses[i].content[item];
                        }
                    }
                }
            }

            if (device.length === 0) {
                // TODO: This doesnt quite seem right; Will need to investigate
                return Promise.resolve(undefined);
            }
            device['DeviceID'] = deviceId;
            return Promise.resolve(device);
        });
    }

    /** 
     * Given the hub specific device, returns the opent2t schema and translator
     * devCat: Insteon device category
     * We can identify the device using those two value based on the table at
     * https://insteon.atlassian.net/wiki/display/IKB/Insteon+Device+Categories+and+Sub-Categories#InsteonDeviceCategoriesandSub-Categories-devcat-subcat
     */
    _getOpent2tInfo(deviceData) {

        var devCat = deviceData.DevCat
        switch (devCat) {
            case 1:
                return {
                    "schema": 'org.opent2t.sample.lamp.superpopular',
                    "translator": "opent2t-translator-com-insteon-lightbulb"
                };
            case 2:
                return {
                    "schema": 'org.opent2t.sample.binaryswitch.superpopular',
                    "translator": "opent2t-translator-com-insteon-binaryswitch"
                };
            case 5:
                return {
                    "schema": 'org.opent2t.sample.thermostat.superpopular',
                    "translator": "opent2t-translator-com-insteon-thermostat"
                };
            default:
                return undefined;
        }
    }
    

    /**
     *  Internal helper method to determine if a property name belongs to device status or not.
     */
    _isDeviceStatus(propertyName){
        switch (propertyName) {
            case 'DeviceName':
                return false;
            default:
                return true;
        }
    }

    /**
     *  Internal helper method which get the results of an Insteon commands.
     *  Count specifies the number of time we try to retrieve the command result before we identify the result as timeout.
     *  
     *  Per Insteon's recommendation at http://docs.insteon.apiary.io/#reference/commands/commands-collection, in Usage, 
     *  it suggested us to wait for 1 second for the call to complete its roundtrip from the client to the hub, to the 
     *  device and back to the client.
     */
    _getCommandResponse(commandId) {
        return sleep(1000).then(() => {
            return this._makeRequest(this._commandPath + '/' + commandId, 'GET')
                .then( (response) => {
                    switch(response.status){
                        case 'pending':
                            return this._getCommandResponse(commandId);
                        case 'failed':
                        case 'succeeded':
                            return Promise.resolve(response);
                        default:
                            if( response.command.device_id !== undefined){
                                this._throwError( 'Internal Error - Insteon command failed for deviceId ' + response.command.device_id + '.');
                            } else {
                                this._throwError('Internal Error - Insteon command timeout.');
                            }
                    }
                })
                .catch((err) => { 
                    Promise.reject(err); 
                });
            });
        }
    
    /**
     * Internal helper method which makes the actual request to the insteon service
     */
    _makeRequest(path, method, content) {
        // build request URI
        var requestUri = this._baseUrl + path;

        // Set the headers
        var headers = {
            'Authorization': 'Bearer ' + this._authTokens['access'].token,
            'Authentication': 'APIKey ' + this._authTokens['access'].client_id,
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
                if (method === 'PUT' && path.startsWith('devices')) {
                    var response = {
                        status: 'succeeded',
                        content: JSON.parse(content)
                    }
                    return response;
                } else {
                    return JSON.parse(body);
                }
            });
    }
}

module.exports = Translator;