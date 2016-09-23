/* jshint esversion: 6 */
/* jshint node: true */
/* jshint sub:true */
// This code uses ES2015 syntax that requires at least Node.js v4.
// For Node.js ES2015 support details, reference http://node.green/

"use strict";
var request = require('request-promise');

// Wink uses a single PubNub subscription with a channel for each device for
// realtime notifications
var PubNub = require('pubnub');

/**
* This translator class implements the "Hub" interface.
*/
class Translator {
    constructor(accessToken) {
        this._accessToken = accessToken;

        this._baseUrl = "https://api.wink.com";
        this._userPath = '/users/me';
        this._devicesPath = '/users/me/wink_devices';

        this._name = "Wink Hub"; // TODO: Can be pulled from OpenT2T global constants. This information is not available, at least, on wink hub.
    }

    /**
     * Get the list of devices discovered through the hub.
     */
    getHubResURI() {
        return this._makeRequest(this._devicesPath, 'GET').then((response) => {
            var toReturn = {};
            var devices = response.data;

            var filteredDevices = [];
            devices.forEach((winkDevice) => {
                // get the opent2t schema and translator for the wink device
                var opent2tInfo = this._getOpent2tInfo(winkDevice);
                if (opent2tInfo != undefined && winkDevice.model_name !== 'HUB') { 
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
     * Gets device details (all fields), response formatted per http://docs.winkapiv2.apiary.io/
     */
    getDeviceDetailsAsync(deviceType, deviceId) {

        // build request URI
        var requestPath = '/' + deviceType + '/' + deviceId;

        // Make the async request
        return this._makeRequest(requestPath, 'GET');
    }

    /**
     * Puts device details (all fields) payload formatted per http://docs.winkapiv2.apiary.io/
    */
    putDeviceDetailsAsync(deviceType, deviceId, putPayload) {

        // build request path and body
        var requestPath = '/' + deviceType + '/' + deviceId;
        var putPayloadString = JSON.stringify(putPayload);

        // Make the async request
        return this._makeRequest(requestPath, 'PUT', putPayloadString);
    }

    /**
     * Subscribes to realtime notifications for this provider.
     * 
     * callback is the function that will be called with the JSON ocf representation of the changed device
     */
    subscribe(callback) {
        this._eventCallback = callback;
        var pubnubChannels = [];

        // This function needs to make 2 GET calls, one for the user account, and another
        // to get all devices.  These are done in serial to get the subscribe_key before 
        // subscribing to the channels.  The subscribe_key will be the same for all
        // devices on an account (even non Wink)
        return this._makeRequest(this._userPath, 'GET').then((response) => {
            this._pubnub = new PubNub({
                subscribeKey: response.data.subscription.pubnub.subscribe_key
            });

            this._pubnub.addListener({
                message: this._translateEvent.bind(this)
            });

            // Subscribe to the user channel for device discovery
            pubnubChannels.push(response.data.subscription.pubnub.channel)

            // Get all of the devices attached to this provider
            // This can include non-Wink devices that have been connected to a Wink account
            // such as a Nest Thermostat, though they will still be translated into a Wink representation
            // by the Wink API.
            return this._makeRequest(this._devicesPath, 'GET').then((response) => {
                response.data.forEach((winkDevice) => {
                    var opent2tInfo = this._getOpent2tInfo(winkDevice);

                    // SKip any devices that do not have an opent2t definition
                    if (opent2tInfo != undefined) {
                        if (winkDevice.subscription != undefined) {
                            pubnubChannels.push(winkDevice.subscription.pubnub.channel);
                        }
                    }
                });

                // Subscribe to all of the channels
                this._pubnub.subscribe({ channels: pubnubChannels });
            });
        });
    }

    /**
     * Translates realtime notifications from the appropriate Wink device schema to OCF and calls the
     * registered callback function
     */
    _translateEvent(event) {
        if (this._eventCallback !== undefined) {
            var deviceData = JSON.parse(event.message);
            var opent2tinfo = this._getOpent2tInfo(deviceData);

            // Find the translator for this device
            if (opent2tinfo !== undefined) {
                var deviceInfo = {
                    hub: this,
                    deviceInfo: { id: 0 } // Device identifier isn't needed as the translator will not be used to
                                          // communicate with an API endpoint.
                };

                // TODO: There must be a better way of doing this that escapes me at the moment
                // We're not truly creating a translator, I just want access to the 'deviceSchemaToTranslatorSchema'
                // function
                var translatorName = opent2tinfo.translator.replace(/opent2t-translator-/gi, "").replace(/-/g, ".");
                var translatorPath = require('path').join(__dirname, '../../..', opent2tinfo.schema, translatorName, "js", "thingTranslator.js");

                console.log("Using: " + translatorPath);

                var Translator = require(translatorPath);
                var translator = new Translator(deviceInfo);
                var translatedDeviceData = translator.deviceSchemaToTranslatorSchema(deviceData);
                
                // Execute the callback
                this._eventCallback(translatedDeviceData);  
            }
        }
    }

    /** 
     * Given the hub specific device, returns the opent2t schema and translator
    */
    _getOpent2tInfo(winkDevice) {
        if (winkDevice.thermostat_id) {
            return { 
                "schema": 'org.opent2t.sample.thermostat.superpopular',
                "translator": "opent2t-translator-com-wink-thermostat"
            };
        }
        else if (winkDevice.binary_switch_id) {
            return { 
                "schema": 'org.opent2t.sample.binaryswitch.superpopular',
                "translator": "opent2t-translator-com-wink-binaryswitch"
            };
        }
        else if (winkDevice.light_bulb_id) {
            return { 
                "schema": 'org.opent2t.sample.lamp.superpopular',
                "translator": "opent2t-translator-com-wink-lightbulb"
            };
        }
        else if (winkDevice.binary_switch_id) {
            return {
                "schema": 'org.opent2t.sample.binaryswitch.superpopular',
                "translator": "opent2t-translator-com-wink-binaryswitch"
            }
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

    /**
     * Wink has a semi-complicated way of getting the actual device id of a device.
     */
    _getDeviceId(winkDevice) {
        // get the device id
        var deviceId = winkDevice.light_bulb_id ||
            winkDevice.air_conditioner_id ||
            winkDevice.binary_switch_id ||
            winkDevice.shade_id ||
            winkDevice.camera_id ||
            winkDevice.doorbell_id ||
            winkDevice.eggtray_id ||
            winkDevice.garage_door_id ||
            winkDevice.cloud_clock_id ||
            winkDevice.lock_id ||
            winkDevice.dial_id ||
            winkDevice.alarm_id ||
            winkDevice.power_strip_id ||
            winkDevice.outlet_id ||
            winkDevice.piggy_bank_id ||
            winkDevice.deposit_id ||
            winkDevice.refrigerator_id ||
            winkDevice.propane_tank_id ||
            winkDevice.remote_id ||
            winkDevice.sensor_pod_id ||
            winkDevice.siren_id ||
            winkDevice.smoke_detector_id ||
            winkDevice.sprinkler_id ||
            winkDevice.thermostat_id ||
            winkDevice.water_heater_id ||
            winkDevice.scene_id ||
            winkDevice.condition_id ||
            winkDevice.robot_id;

        return deviceId;
    }
}

module.exports = Translator;