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
        this._name = "SmartThings hub"; // TODO: Can be pulled from OpenT2T global constants. This information is not available, at least, on hub hub.
    }

    /**
     * Get the list of devices discovered through the hub.
     */
    getHubResURI() {
        if (this._baseUrl == '') {
            var endpointPromise = this._getEndpoint();

            return Promise.resolve(endpointPromise).then((endpointURI) => {
                this._baseUrl = endpointURI;
                return this._getAllDevices();
            });
        } else {
            return this._getAllDevices();
        }
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
    getDeviceDetailsAsync(deviceType, deviceId) {

        return this._getEndpointList().then((endpointList) => {

            var toReturn = {};
            var filteredDevices = [];
            var promises = [];
            for (var endpoint in endpointLists) {
                var endpointQuery = this._makeRequest(endpoint + this._devicesPath, 'GET');
                promises.push(endpointQuery);
            }

            return Promise.all(promises).then((responses) => {
                console.loge(responses);
                return responses;
            });
        });
    }

    /**
     * Puts device details (all fields) payload formatted per http://www.developers.meethue.com/documentation/lights-api
    */
    putDeviceDetailsAsync(deviceType, deviceId, putPayload) {

        return '';
    }

    /** 
     * Given the hub specific device, returns the opent2t schema and translator
    */
    _getOpent2tInfo(deviceType) {
        switch(deviceType){
            case "light":
                return { 
                    "schema": 'org.opent2t.sample.lamp.superpopular',
                    "translator": "opent2t-translator-com-hue-bulb"
                };
            default:
                return undefined;
        }
    }

    /**
     * Get the endpoint URI associated to the account
     */
    _getEndpoint()
    {
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
    _getAllDevices() {
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