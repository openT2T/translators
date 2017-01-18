// This code uses ES2015 syntax that requires at least Node.js v4.
// For Node.js ES2015 support details, reference http://node.green/

"use strict";
var OpenT2T = require('opent2t').OpenT2T;
var Firebase = require("firebase");

/**
* This translator class implements the "Hub" interface.
*/
class Translator {
    constructor(accessToken) {
        this._accessToken = accessToken;
        this._baseUrl = "https://developer-api.nest.com";
        this._devicesPath = 'devices/';
        this._structPath = 'structures/';
        this._name = "Nest Hub";
        this._firebaseRef = new Firebase(this._baseUrl);
        this._firebaseRef.authWithCustomToken(this._accessToken.accessToken);
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
        if(payload !== undefined){
            return this._providerSchemaToPlatformSchema( payload, expand );
        } else {
            return this._firebaseRef.child(this._devicesPath).once('value').then((snapshot) => {
                return this._providerSchemaToPlatformSchema(snapshot.val(), expand);
            });
        }
    }

    /* eslint no-unused-vars: "off" */

    /**
     * Refreshes the OAuth token for the hub by returning the existing access token. 
     * does not support refresh tokens, because Nest access tokens are effectively non-expiring (about 10 years)
     * https://developers.nest.com/documentation/cloud/authorization-reference
     */
    refreshAuthToken(authInfo) {
        return this._accessToken;
    }


    /**
     * Subscribe to notifications for a platform.
     * This function is intended to be called by the platform translator for initial subscription,
     * and on the hub translator (this) for verification.

     */
    _subscribe(subscriptionInfo) {
        // Error case: waiting for design decision
        throw new Error("Not implemented");
    }

    /**
     * Unsubscribe from a platform subscription.
     * This function is intended to be called by a platform translator
     */
    _unsubscribe(subscriptionInfo) {
        // Error case: waiting for design decision
        throw new Error("Not implemented");
    }
    /* eslint no-unused-vars: "warn" */

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
                        // Use get to translate the Nest formatted device that we already got in the previous request.
                        // We already have this data, so no need to make an unnecesary request over the wire.
                        var deviceSchema = providerSchemas.thermostats[nestThermostatId];
                        return this._getAwayStatus(deviceSchema['structure_id']).then((result) => {
                            deviceSchema.away = result;
                            return OpenT2T.invokeMethodAsync(translator, opent2tInfo.schema, 'get', [expand, deviceSchema ])
                                .then((platformResponse) => {
                                    return platformResponse;
                                });
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
        return this._firebaseRef.child(this._devicesPath + deviceType + '/' +deviceId).once('value').then((snapshot) => {
            var deviceSchema = snapshot.val();
            return this._getAwayStatus(deviceSchema['structure_id']).then((result) => {
                deviceSchema.away = result;
                return deviceSchema;
            });
        });
    }

    /**
     * Puts device details (all fields) payload formatted per nest api
     */
    putDeviceDetailsAsync(deviceType, deviceId, putPayload) {
        var propertyName = Object.keys(putPayload);
        var path = this._devicesPath + deviceType + '/' + deviceId + '/' + propertyName[0];
        return this._firebaseRef.child(path).set(putPayload[propertyName[0]]).then((response) => {
            if (response === undefined) { //success
                var result = {
                    device_id:deviceId
                };
                result[propertyName] = putPayload[propertyName[0]];
                
                //get temperature scale
                if (propertyName[0].includes('_temperature_')) {
                    result['temperature_scale'] = propertyName[0].charAt(propertyName[0].length -1);
                }
                return result;
            }
        }).catch(function (err) {
            var str = err.toString();
            var startInd = str.indexOf('{');
            var endInd = str.lastIndexOf('}');
            var errorMsg = JSON.parse(str.substring(startInd, endInd + 1));
            throw new Error(errorMsg.error);
        });
    }
    
    /**
     * Internal Helper function to get the away status for structure with structureId
     */
    _getAwayStatus(structureId) {
        return this._firebaseRef.child(this._structPath + structureId + '/away').once('value').then((snapshot) => {
            return snapshot.val();
        });
    }
}

module.exports = Translator;