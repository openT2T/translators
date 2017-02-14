/* jshint esversion: 6 */
/* jshint node: true */
/* jshint sub:true */
// This code uses ES2015 syntax that requires at least Node.js v4.
// For Node.js ES2015 support details, reference http://node.green/

"use strict";
var request = require('request-promise');
var OpenT2T = require('opent2t').OpenT2T;
var OpenT2TErrorClass = require('opent2t').OpenT2TError;
var Crypto = require('crypto');
var accessTokenInfo = require('./common').accessTokenInfo;

/**
* This translator class implements the "Hub" interface.
*/
class Translator {
    constructor(accessToken) {
        this._accessToken = accessToken;

        this._baseUrl = "https://api.wink.com";
        this._devicesPath = '/users/me/wink_devices';
        this._oAuthPath = '/oauth2/token';

        this._name = "Wink Hub"; // TODO: Can be pulled from OpenT2T global constants. This information is not available, at least, on wink hub.
    }

    /**
     * Get the hub definition and devices
     */
    get(expand, payload, verification) {
        return this.getPlatforms(expand, payload, verification);
    }

    /**
     * Get the list of devices discovered through the hub.
     * 
     * @param {bool} expand - True to include the current state of the resources.
     * @param {Buffer} payload - POST content for a subscribed notification
     * @param {Object} verification - Information used to authenticate that the post is valid
     * @param {Array} verification.header - Header information that came with the payload POST.
     *      Should include X-Hub-Signature
     * @param {verification} verification.key - Secret key used to hash the payload (provided to Wink on subscribe)
     */
    getPlatforms(expand, payload, verification) {

        // Payload can contain one or more platforms defined using the provider schema.  This should return those platforms
        // converted to the opent2t/ocf representation.
        if (payload !== undefined) {
            // Calculate the HMAC for the payload using the secret
            if (verification !== undefined && verification.key !== undefined) {
                var hashFromWink = verification.header["X-Hub-Signature"];
                if (!this._verifyHmac(hashFromWink, verification.key, payload)) {
                    throw new OpenT2TErrorClass(400, "Payload signature doesn't match.");
                }
            }

            // Return the verified payload 
            return this._providerSchemaToPlatformSchema(payload, expand);
        }
        else {
            return this._makeRequest(this._devicesPath, 'GET').then((response) => {
                return this._providerSchemaToPlatformSchema(response.data, expand);
            });
        }
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
     * Refreshes the OAuth token for the hub by sending a refresh POST to the wink provider
     */
    refreshAuthToken(authInfo) {
        var invalidAuthErrorMessage = "Invalid authInfo object.Please provide the existing authInfo object  with clientId + client_secret to allow the oAuth token to be refreshed";
        
        if (authInfo === undefined || authInfo == null){
            throw new OpenT2TErrorClass(400, invalidAuthErrorMessage); 
        }

        if (authInfo.length !== 2)
        {
            // We expect the original authInfo object used in the onboarding flow
            // not defining a brand new type for the Refresh() contract and re-using
            // what is defined for Onboarding()
            throw new OpenT2TErrorClass(400, invalidAuthErrorMessage);
        }

        // POST oauth2/token
        var postPayloadString = JSON.stringify({
            'client_id': authInfo[1].client_id,
            'client_secret': authInfo[1].client_secret,
            'grant_type': 'refresh_token',
            'refresh_token': this._accessToken.refreshToken,
        });

        return this._makeRequest(this._oAuthPath, "POST", postPayloadString, false).then((body)=>
        {
            // _makeRequest() already returns a JSON representation of the POST response body
            // return the auth properties out in our own response back
             return new accessTokenInfo(
                    body.access_token,
                    body.refresh_token,
                    body.token_type,
                    body.scopes
                );
            // there isn't a 'scopes' property returned as a result of this request according to
            // http://docs.wink.apiary.io/#reference/oauth/obtain-access-token/sign-in-as-user,-or-refresh-user's-expired-access-token
            // so am assuming the caller of this API will expect nulls
        });
    }

    /**
     * Translates an array of provider schemas into an opent2t/OCF representations
     */
    _providerSchemaToPlatformSchema(providerSchemas, expand) {
        var platformPromises = [];

        // Ensure that we have an array of provider schemas, even if a single object was given.
        var winkDevices = [].concat(providerSchemas);

        winkDevices.forEach((winkDevice) => {
            // get the opent2t schema and translator for the wink device
            var opent2tInfo = this._getOpent2tInfo(winkDevice);
            
            // Do not return the physical hub device, nor any devices for which there are not translators.
            // Additionally, do not return devices that have been marked as hidden by Wink (hidden_at is a number)
            // This state is used by third party devices (such as a Nest Thermostat) that were connected to a
            // Wink account and then removed.  Wink keeps the connection, but marks them as hidden.
            if ((winkDevice.model_name !== 'HUB')  && 
                typeof opent2tInfo !== 'undefined' &&
                (winkDevice.hidden_at == undefined || winkDevice.hidden_at == null))
            {
                // set the opent2t info for the wink device
                var deviceInfo = {};
                deviceInfo.opent2t = {};
                deviceInfo.opent2t.controlId = this._getDeviceId(winkDevice);
                
                // Create a translator for this device and get the platform information, possibly expanded
                platformPromises.push(OpenT2T.createTranslatorAsync(opent2tInfo.translator, {'deviceInfo': deviceInfo, 'hub': this})
                    .then((translator) => {

                        // Use get to translate the Wink formatted device that we already got in the previous request.
                        // We already have this data, so no need to make an unnecesary request over the wire.
                        return OpenT2T.invokeMethodAsync(translator, opent2tInfo.schema, 'get', [expand, winkDevice])
                            .then((platformResponse) => {
                                return platformResponse; 
                            });
                    }));
            }
        });

        // Return a promise for all platform translations.
        return Promise.all(platformPromises)
            .then((platforms) => {
                var toReturn = {};
                toReturn.schema = "org.opent2t.sample.hub.superpopular";
                toReturn.platforms = platforms;
                return toReturn;
            });
    }

    /**
     * Subscribes to a Wink pubsubhubbub feed.  This function is designed to be called twice.
     * The first call will contain just the callbackUrl, which will be subscribed for postbacks
     * from the Wink cloud service.
     * The second call will contain the request, and response for a GET to the callbackUrl that was
     * provided in order to complete the verification of the subscription.
     * 
     * The expected sequence is as follows:
     * - Call subscribe with a callback url, get a response.
     * - Http server running at the callback url receives a GET request, this request and a response string
     *      are passed to a 2nd call to subscribe() (callbackUrl is ignored in this case)
     * - Http server responds to the GET with the verificationResponseContent that was populated by subscribe
     * - Future POST calls to the callback url are passed to the device translator get*Uri function
     * 
     * All calls to subscribe will return the expiration time of the subscription.  For Wink, this is
     * currently 24 hours.  Subsequent calls to subscribe will refresh the expiration time, and in the
     * case of Wink/Pubsubhubbub will not require verification.
     * 
     * @typedef {Object} SubscriptionResponse
     * @property {number} expiration - Expiration time for the subscription.
     * @property {string} response - Response payload for the verification request.
     * 
     * @param {string} deviceType - Device Type (e.g. 'thermostats')
     * @param {string|number} deviceId - Id for the specific device
     * @param {Object} subscriptionInfo - Subscription information
     * @param {string} subscriptionInfo.callbackUrl - Web callback postback endpoint. This URL will receive verification, and updates.
     * @param {string} subscriptionInfo.key - (optional) Secret used to compute an HMAC to verify messages sent to the callbackUrl  
     * @param {string} subscriptionInfo.deviceType - The Wink device type for the platorm being subscribed to (not required for verification)
     * @param {string} subscriptionInfo.deviceId - The unique Wink device Id for the platform being subscribed to (not required for verification)
     * @param {Object} subscriptionInfo.verificationRequest - The contents of a verification request made to the callbackURl, if 
     *      verification is being used.
     * @returns {SubscriptionResponse} - Object containing the subscription expiration time, and any content that
     *      needs to be included in a response to the original request. Content that should be provided in the response to the
     *      verification request as {'Content-Type': 'text/plain'}.
     */
    postSubscribe(subscriptionInfo) {
        if (subscriptionInfo.verificationRequest) {
            // Verify a subscription request by constructing the appropriate response

            var params = require('url').parse(subscriptionInfo.verificationRequest.url, true, true);
        
            switch(params.query['hub.mode']) {
                case "denied":
                    // The subscription cannot be completed, access was denied.
                    // This is likely due to a bad access token.
                    throw new OpenT2TErrorClass(403, "Access denied");
                case "unsubscribe":
                    // Wink doesn't actually use hub.mode unsubscribe, and instead uses DELETE to perform the action
                    // with no verification.
                    return {
                        expiration: 0,
                        response: ""
                    }
                case "subscribe":
                    // Successful subscription/unsubscription requires a response to contain the same
                    // challenge that was included in the request.
                    return {
                        expiration: params.query['hub.lease_seconds'],
                        response: params.query['hub.challenge']
                    }
                default:
                    // Hub mode is unknown.
                    throw new OpenT2TErrorClass(400, "Unknown request");
            }
        }
        else if (subscriptionInfo.callbackUrl) {
            // If a callbackUrl is provided without a verification request, then it is a new subscription or a refresh.

            var requestPath = "";

            if (subscriptionInfo.deviceType && subscriptionInfo.deviceId) {
                // Platform level subscription
                requestPath = '/' + subscriptionInfo.deviceType + '/' + subscriptionInfo.deviceId + '/subscriptions';
            }
            else {
                // Provider/Hub level subscription
                // Subscribing to Wink as a provider (to receive notification of device add/delete etc.) will likely be
                // possible in the future.  This should just require a different request path, but for now it's an error
                throw new OpenT2TErrorClass(400, "Must subscribe to a device.");
            }

            // Winks implementation of PubSubHubbub differs from the standard in that we do not need to provide
            // the topic, or mode on this request.  Topic is implicit from the URL (deviceType/deviceId), and
            // separate requests exist for mode (subscribe and unsubscribe vis POST/DELETE).

            // Additionally, subscriptions will expire after 24 hours (for now), and need to be refreshed
            // with another call to this function.

            var postPayload = {
                callback: subscriptionInfo.callbackUrl
            }

            // Secret provided for computing HMAC verification of the payload
            // this is optional to Wink
            if (subscriptionInfo.key) {
                postPayload.secret = subscriptionInfo.key;
            }

            var postPayloadString = JSON.stringify(postPayload);

            return this._makeRequest(requestPath, 'POST', postPayloadString).then((response) => {
                // Return the expiration time for the subscription
                return {
                    expiration: response.data.expires_at
                };
            })
        } 
    }

    /**
     * Unsubscribes from an existing Wink pubsubhubbub feed.  The subscription id for a
     * topic is not cached, so this results in 2 web calls:
     * - GET to return a list of subscriptions
     * - DELETE to remove the existing subscriptions.
     * 
     * Wink's pubsubhubbub is slightly different than standard as it uses DELETE along
     * with a subscriptionID rather than another GET with a hub.mode of 'unsubscribe'
     * 
     * @param {Object} subscriptionInfo - Subscription information
     * @param {string} subscriptionInfo.callbackUrl - Web callback postback endpoint.
     * @param {string} subscriptionInfo.deviceType - The Wink device type for the platorm being subscribed to
     * @param {string} subscriptionInfo.deviceId - The unique Wink device Id for the platform being subscribed to
     * @returns {Object} Expiration of the subscription (expired)
     */
     _unsubscribe(subscriptionInfo) {
        var subscriptionsToDelete = [];
        // Find the subscription ID for this callback URL
        return this._getSubscriptions(subscriptionInfo.deviceType, subscriptionInfo.deviceId).then((subscriptions) => {
            subscriptions.forEach((sub) => {
                // Find the subscription id for this callback URL and device
                if (sub.callback == subscriptionInfo.callbackUrl &&
                    sub.topic.endsWith(subscriptionInfo.deviceType + '/' + subscriptionInfo.deviceId)) {
                    var requestPath = '/' + subscriptionInfo.deviceType + '/' + subscriptionInfo.deviceId + '/subscriptions/' + sub.subscription_id;

                    // Do the actual unsubscribe
                    subscriptionsToDelete.push(this._makeRequest(requestPath, 'DELETE'));
                }
            });

            // Return all delete requests.
            return Promise.all(subscriptionsToDelete).then(() => {
                return {
                    expiration: 0
                }
            });
        });
    }

    /**
     * Gets all subscriptions for a device.
     * 
     * @param {string} deviceType - Device Type (e.g. 'thermostats')
     * @param {string|number} deviceId - Id for the specific device
     * @returns {request} Promise that supplies the list of subscriptions
     * 
     * This is just a helper for tests and verification.
     */
    _getSubscriptions(deviceType, deviceId) {
        // GET /<deviceType>/<device Id>/subscriptions
        var requestPath = '/' + deviceType + '/' + deviceId + '/subscriptions';

        return this._makeRequest(requestPath, 'GET').then((response) => {
            return response.data;
        });
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
    _makeRequest(path, method, content, includeBearerHeader) {
       
        includeBearerHeader = (includeBearerHeader !== undefined) ?  includeBearerHeader : true;

        // build request URI
        var requestUri = this._baseUrl + path;

        var headers = [];

        // Set the headers
        if (includeBearerHeader) {
            headers['Authorization'] = 'Bearer ' + this._accessToken.accessToken;
            headers['Accept'] = 'application/json';
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
            .catch((err) => {
                console.log("Request failed to: " + options.method + " - " + options.url);
                request.reject(err);
                return;
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

    /** 
     * Calculates a new hash of contents using key, and compares it to the master hash.
     * Returns true is the contents can be verified.
     */
    _verifyHmac(hash, key, contents) {
        var hmac = Crypto.createHmac("sha1", key);
        hmac.update(contents.toString());
        var crypted = hmac.digest("hex");

        return (crypted == hash);
    }
}

module.exports = Translator;