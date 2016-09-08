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
    constructor(accessToken) {
        this._accessToken = accessToken;

        this._baseUrl = "https://developer-api.nest.com";
        this._devicesPath = '/devices';

        this._name = "Nest Hub"; // TODO: Can be pulled from OpenT2T global constants. This information is not available, at least, on wink hub.
    }

    /**
     * Get the list of devices discovered through the hub.
     */
    getHubResURI() {
        return this._makeRequest(this._devicesPath, 'GET').then((nestDevices) => {

            console.log(JSON.stringify(nestDevices, null, 2));

            var toReturn = {};
            
            // get all nest sub device collections 
            var nestThermostats = nestDevices.thermostats;
            // unused at the moment, but setup for future
            var nestCameras = nestDevices.cameras; 
            var nestSmokeAlarms = nestDevices.smoke_co_alarms;

            var filteredDevices = [];

            // load thermostats
            var nestThermostatIds = Object.keys(nestThermostats);
            nestThermostatIds.forEach((nestThermostatId) => {
                var nestDevice = nestThermostats[nestThermostatId];

                // get the opent2t schema and translator for the wink device
                var opent2tInfo = this._getOpent2tInfo("thermostats");

                // we only need to return certain properties back
                var device = {};
                device.name = nestDevice.name;

                // set the specific device object id to be the id
                device.id = nestThermostatId;

                // set the opent2t info for the wink device
                device.openT2T = opent2tInfo;
                
                filteredDevices.push(device);
            });

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
     * Gets device details (all fields), response formatted per http://docs.winkapiv2.apiary.io/
     */
    getDeviceDetailsAsync(deviceType, deviceId) {

        // build request URI
        var requestPath = this._devicesPath + '/' + deviceType + '/' + deviceId;

        // Make the async request
        return this._makeRequest(requestPath, 'GET');
    }

    /**
     * Puts device details (all fields) payload formatted per http://docs.winkapiv2.apiary.io/
    */
    putDeviceDetailsAsync(deviceType, deviceId, putPayload) {

        // build request path and body
        var requestPath = this._devicesPath + '/' + deviceType + '/' + deviceId;
        var putPayloadString = JSON.stringify(putPayload);

        // Make the async request
        return this._makeRequest(requestPath, 'PUT', putPayloadString);
    }

    /** 
     * Given the hub specific device, returns the opent2t schema and translator
    */
    _getOpent2tInfo(nestDeviceType) {
        if (nestDeviceType === "thermostats") {
            return { 
                "schema": 'org.opent2t.sample.thermostat.superpopular',
                "translator": "opent2t-translator-com-nest-thermostat"
            };
        }
        
        return undefined;
    }

    /**
     * Internal helper method which makes the actual request to the wink service
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