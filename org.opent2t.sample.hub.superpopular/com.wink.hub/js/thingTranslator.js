/* jshint esversion: 6 */
/* jshint node: true */
/* jshint sub:true */
// This code uses ES2015 syntax that requires at least Node.js v4.
// For Node.js ES2015 support details, reference http://node.green/

"use strict";
var request = require('request-promise');
var PubNub = require('pubnub');
var EventEmitter = require('events');

/**
* This translator class implements the "Hub" interface.
*/
class Translator extends EventEmitter {
    constructor(accessToken) {
        super();

        this._accessToken = accessToken;

        this._baseUrl = "https://api.wink.com";
        this._userPath = '/users/me';
        this._devicesPath = '/users/me/wink_devices';

        this._name = "Wink Hub"; // TODO: Can be pulled from OpenT2T global constants. This information is not available, at least, on wink hub.

        this._eventTranslators = {};
    }

    /**
     * Get the list of devices discovered through the hub.
     */
    getHubResURI() {
        return this._makeRequest(this._userPath, 'GET').then((response) => {
            // Subscribe to the user feed for device discovery
            // TODO: This doesn't work, at least for non-wink devices like Nest thermostats
            // May need to contact Wink.
            this._subscribe(response.data.subscription.pubnub);

            return this._makeRequest(this._devicesPath, 'GET').then((response) => {
                this._pubNubChannels = [];
                this._pubNubSubscribeKey;

                var toReturn = {};
                var devices = response.data;

                //console.log(JSON.stringify(response, null, 2));

                var filteredDevices = [];
                devices.forEach((winkDevice) => {
                    // get the opent2t schema and translator for the wink device
                    var opent2tInfo = this._getOpent2tInfo(winkDevice);
                    if (opent2tInfo != undefined) { // We support the device
                        
                        if (winkDevice.subscription != undefined) {
                            this._subscribe(winkDevice.subscription.pubnub);
                        }
                        
                        // Skip hub itself. (WINK specific check, of course!)
                        if (winkDevice.model_name !== 'HUB') { 
                            // we only need to return certain properties back
                            var device = {};
                            device.name = winkDevice.name;

                            // set the specific device object id to be the id
                            device.id = this._getDeviceId(winkDevice);

                            // set the opent2t info for the wink device
                            device.openT2T = opent2tInfo;
                            
                            filteredDevices.push(device);
                        }
                    }
                });

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
     * Subscribes to changes for devices on this provider
     *
     * options {
     * channel: <channel id>,
     * subscribe_key: <subscribe_id>
     * } 
     *
    */
    _subscribe(subscriptionOptions) {

        console.log('Subscribing to: ');
        console.log(subscriptionOptions.subscribe_key);
        console.log(subscriptionOptions.channel);

        // Create the pubnub subscription on demand if needed
        if (this._pubnub === undefined) {
            console.log('Creating pubnub subscription');

            this._pubnub = new PubNub({
                subscribeKey: subscriptionOptions.subscribe_key
            });

            this._pubnub.addListener({
                message: function(message) {;
                    var opent2tinfo = this._getOpent2tInfo(JSON.parse(message.message));

                    if (opent2tinfo !== undefined) {
                        console.log("Received a change event for ", opent2tinfo.translator);

                        // TODO:
                        // Create an instance of the translator, or do whatever
                        // needs to be done to get the OCF representation of the device
                        // I do not need to get the state of the translator, since I already have it 
                        // I just need a method to convert the deviceSchema to the translatorSchema.
                        // Wink translators provide this functionality, but it isn't accessible from here.

                        this.emit('change', opent2tinfo);
                        // TODO: handle add and remove device
                    }
                }.bind(this),
                status: function(status) {
                    console.log(status);
                }.bind(this)
            });
        }

        this._pubnub.subscribe({
            channels: [subscriptionOptions.channel]
        });
    }


    _unsubscribe(channel) {
        if (this._pubnub !== undefined) {
            this._pubnub.unsubscribe({
                channels: [channel]
            });
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