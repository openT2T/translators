// This code uses ES2015 syntax that requires at least Node.js v4.
// For Node.js ES2015 support details, reference http://node.green/

"use strict";
var request = require('request-promise');
var Firebase = require("firebase");

/**
* This translator class implements the "Hub" interface.
*/
class Translator {
    constructor(accessToken) {
        this._accessToken = accessToken;
        this._baseUrl = "https://developer-api.nest.com";
        this._devicesPath = '/devices';
        this._name = "Nest Hub";
        this._ref = new Firebase(this._baseUrl);
        this._ref.authWithCustomToken(this._accessToken.accessToken);
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
        return this._ref.once('value').then( (snapshot) => {
            var postsData = snapshot.val();
            var devices = postsData.devices
            return this._providerSchemaToPlatformSchema(postsData.devices, expand);
        });
    }

    /**
     * Translates an array of provider schemas into an opent2t/OCF representations
     */
    _providerSchemaToPlatformSchema(providerSchemas, expand) {
        var platformPromises = [];

        if(providerSchemas.thermostats !== undefined){

            // get the opent2t schema and translator for Nest thermostat
            var opent2tInfo = { 
                "schema": 'org.opent2t.sample.thermostat.superpopular',
                "translator": "opent2t-translator-com-nest-thermostat"
            };

            var nestThermostatIds = Object.keys(providerSchemas.thermostats);
            nestThermostatIds.forEach((nestThermostatId) => {
                // set the opent2t info for the Nest Device
                var deviceInfo = {};
                deviceInfo.opent2t = {};
                deviceInfo.opent2t.controlId = nestThermostatId;

                // Create a translator for this device and get the platform information, possibly expanded
                platformPromises.push(OpenT2T.createTranslatorAsync(opent2tInfo.translator, { 'deviceInfo': deviceInfo, 'hub': this })
                    .then((translator) => {
                        // Use get to translate the SmartThings formatted device that we already got in the previous request.
                        // We already have this data, so no need to make an unnecesary request over the wire.
                        return OpenT2T.invokeMethodAsync(translator, opent2tInfo.schema, 'get', [expand, providerSchemas.thermostats[nestThermostatId]])
                            .then((platformResponse) => {
                                return platformResponse;
                            });
                    }));
            });
        }

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
     * Gets device details (all fields), response formatted per nest api
     */
    getDeviceDetailsAsync(deviceType, deviceId) {

        return this._ref.once('value').then((snapshot) => {
            var postsData = snapshot.val();
            var device = postsData.devices[deviceType].deviceId;
            return this._providerSchemaToPlatformSchema({[deviceType]: {[deviceId]: device}}, expand);
        });
    }

    /**
     * Puts device details (all fields) payload formatted per nest api
    */
    putDeviceDetailsAsync(deviceType, deviceId, putPayload) {

        // build request path and body
        var requestPath = this._devicesPath + '/' + deviceType + '/' + deviceId;
        var putPayloadString = JSON.stringify(putPayload);

        // Make the async request
        return this._makeRequest(requestPath, 'PUT', putPayloadString);
    }

    /**
     * Internal helper method which makes the actual request to the nest service
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