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
        this._baseUrl = '';
        this._devicesPath = '/devices';
        this._updatePath = '/update';
        this._name = "SmartThings hub"; // TODO: Can be pulled from OpenT2T global constants. This information is not available, at least, on hub hub.
    }

    /**
     * Get the list of devices discovered through the hub.
     */
    getHubResURI() {
        
        return this._hasValidEndpoint().then((isValid) => {
            if(isValid == false) return undefined;
            
            var toReturn = {};
            var filteredDevices = [];

            return this._makeRequest(this._devicesPath, 'GET')
                .then((devices) => {

                    for (var i = 0; i < devices.length ; i++) {
                        var smartThingsDevice = devices[i];
                        
                        // get the opent2t schema and translator for the SmartThings device
                        var opent2tInfo = this._getOpent2tInfo(smartThingsDevice.deviceType);

                        if (opent2tInfo != undefined) // we support the device                    
                        {
                            // we only need to return certain properties back
                            var device = {};
                            device.name = smartThingsDevice.name;

                            // set the specific device object id to be the id
                            device.id = smartThingsDevice.id;

                            // set the opent2t info for the hue device
                            device.openT2T = opent2tInfo;

                            filteredDevices.push(device);
                        }
                    }

                    toReturn.devices = filteredDevices;
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
     * Gets device details (all fields), response formatted per http://www.developers.meethue.com/documentation/lights-api
     */
    getDeviceDetailsAsync(deviceId) {

        return this._hasValidEndpoint().then((isValid) => {
            if(isValid == false) return undefined;
            
            return this._makeRequest(this._devicesPath + '/' + deviceId , 'GET')
                .then((device) => {
                    return device;
                });
        });
    }

    /**
     * Puts device details (all fields) payload formatted per http://www.developers.meethue.com/documentation/lights-api
     */
    putDeviceDetailsAsync(deviceId, putPayload) {
        return this._hasValidEndpoint().then((isValid) => {
            if(isValid == false) return undefined;
            
            var putPayloadString = JSON.stringify(putPayload);
            console.log("Updateing device:")
            console.log(putPayloadString);
            return this._makeRequest(this._updatePath + '/' + deviceId, 'PUT', putPayloadString)
                .then((result) => {
                    if(result === "succeed")
                    {
                        return this.getDeviceDetailsAsync(deviceId);
                    }
                    return undefined;
                });
        });
    }

    /** 
     * Given the hub specific device, returns the opent2t schema and translator
     */
    _getOpent2tInfo(deviceType) {
        switch(deviceType){
            case "light":
                return { 
                    "schema": 'org.opent2t.sample.lamp.superpopular',
                    "translator": 'opent2t-translator-com-smartthings-lightbulb'
                };
            default:
                return undefined;
        }
    }

    /**
     * Get the endpoint URI associated to the account
     */
    _getEndpoint() {
        var endpointUrl = 'https://graph.api.smartthings.com/api/smartapps/endpoints/' + this._accessToken.clientId + '?access_token=' + this._accessToken.accessToken;

        return this._makeRequest(endpointUrl, 'GET').then((responses) => {
            if (responses.length !== 0 && responses[0].uri !== undefined) {
                return Promise.resolve(responses[0].uri);
            }
            return Promise.resolve(undefined);
        });
    }

    /**
     * Get all OpenT2T-supported devices from the based (endpoint) URI
     */
    _hasValidEndpoint() {
        if (this._baseUrl === '') {
            return this._getEndpoint().then((endpointURI) => {
                if(endpointURI === undefined) return Promise.resolve(false);
                this._baseUrl = endpointURI;
                return Promise.resolve(true)
            });
        } else {
            return Promise.resolve(true);
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
                if(method === 'PUT'){
                    if(body.length === 0) return "succeed";
                    return "Unkown error";
                }
                return JSON.parse(body);
            })
            .catch(function (err) {
                console.log("Request failed to: " + options.method + " - " + options.url);
                console.log("Error            : " + err);
                //console.log("Error            : " + err.statusCode + " - " + err.response.statusMessage);
                // todo auto refresh in specific cases, issue 74
                throw err;
            });
    }
}

module.exports = Translator;