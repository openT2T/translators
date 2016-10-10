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

        this._baseUrl = "https://api.wink.com";

        this._name = "Wink Hub"; // TODO: Can be pulled from OpenT2T global constants. This information is not available, at least, on wink hub.
    }

    /**
     * Get the list of devices discovered through the hub.
     */
    getHubResURI() {
        // vera defined fixed port number
        var path = '/relay/relay/relay/device/' + this._accessToken.pkDevice + '/port_3480/data_request?id=user_data&output_format=json';
        return this.makeVeraRequest(this._accessToken.relayServer, path, this._accessToken.relaySessionToken, true, false).then((response) => {

            var toReturn = {};
            var devices = response.data;

            var filteredDevices = [];
            devices.forEach((winkDevice) => {
                // get the opent2t schema and translator for the wink device
                var opent2tInfo = this._getOpent2tInfo(winkDevice);

                if ((winkDevice.model_name !== 'HUB')  &&  // Skip hub itself. (WINK specific check, of course!)
                    opent2tInfo != undefined) // we support the device
                {
                    // we only need to return certain properties back
                    var device = {};
                    device.name = winkDevice.name;

                    // set the specific device object id to be the id
                    device.id = this._getDeviceId(winkDevice);

                    // set the opent2t info for the wink device
                    device.openT2T = opent2tInfo;
                    
                    filteredDevices.push(device);
                }
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
     * Gets device details 
     */
    getDeviceDetailsAsync(deviceType, deviceId) {

    }

    /**
     * Puts device details 
    */
    putDeviceDetailsAsync(deviceType, deviceId, putPayload) {

    }
    
    /** 
     * Given the hub specific device, returns the opent2t schema and translator
    */
    _getOpent2tInfo(veraDevice) {
        if (veraDevice.thermostat_id) {
            return { 
                "schema": 'org.opent2t.sample.thermostat.superpopular',
                "translator": "opent2t-translator-com-wink-thermostat"
            };
        }
        else if (veraDevice.binary_switch_id) {
            return { 
                "schema": 'org.opent2t.sample.binaryswitch.superpopular',
                "translator": "opent2t-translator-com-wink-binaryswitch"
            };
        }
        else if (veraDevice.light_bulb_id) {
            return { 
                "schema": 'org.opent2t.sample.lamp.superpopular',
                "translator": "opent2t-translator-com-wink-lightbulb"
            };
        }
        
        return undefined;
    }
    
    /**
     * Internal helper method which makes the actual request
     */
    makeVeraRequest(url, path, sessionToken, keepAlive, mmsInfo, returnRawBody) {
        console.log("[VeraHub] -------------------------")
        console.log("[VeraHub] makeVeraRequest: " + url)
        console.log("[VeraHub] path           : " + path);
        console.log("[VeraHub] sessionToken   : " + sessionToken);
        console.log("[VeraHub] keepAlive      : " + keepAlive);
        console.log("[VeraHub] mmsInfo        : " + mmsInfo);
        console.log("[VeraHub] returnRawBody  : " + returnRawBody);

        var completeUrl = "https://" + url + path;

        var options = {
            url: completeUrl,
            method: 'GET'
        };

        if (sessionToken) {
            options.headers = { 'MMSSession': sessionToken };
        }
        else if (mmsInfo) {
            options.headers = {
                'MMSAuth': mmsInfo.Identity,
                'MMSAuthSig': mmsInfo.IdentitySignature
            };
        }

        if (keepAlive) {
            var keepAliveAgent = new https.Agent({keepAlive: true});
            options.agent = keepAliveAgent;
        }

        return request(options)
            .then(function (body) {
                if (returnRawBody) {
                    return body;
                }
                else {
                    return JSON.parse(body);
                }
            });
    }
}

module.exports = Translator;