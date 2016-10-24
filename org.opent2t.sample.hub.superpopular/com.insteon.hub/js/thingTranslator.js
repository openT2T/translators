// This code uses ES2015 syntax that requires at least Node.js v4.
// For Node.js ES2015 support details, reference http://node.green/

"use strict";
var request = require('request-promise');
const sleep = require('es6-sleep').promise;

/**
* This translator class implements the "Hub" interface.
*/
class Translator {
    constructor(accessToken) {
        this._accessToken = accessToken;
        this._baseUrl = 'https://connect.insteon.com/api/v2/';
        this._subCatMap = { lightBulbs:[ '3A', '3B', '3C', '49', '4A', '4B', '4C', '4D', '4E', '4F', '51']};
        this._devicesPath = 'devices';
        this._commandPath = 'commands';
        this._name = "Insteon Hub"; // TODO: Can be pulled from OpenT2T global constants. This information is not available, at least, on insteon hub.
    }

    /**
     * Get the list of devices discovered through the hub.
     */
    getHubResURI() {
        return this._makeRequest(this._devicesPath, 'GET').then((response) => {

            var toReturn = {};
            var devices = response.DeviceList;

            var filteredDevices = [];
            var promises = [];
            devices.forEach((insteonDevice) => {
                
                var promise = this._makeRequest(this._devicesPath + '/' + insteonDevice.DeviceID, 'GET')
                    .then((details) => {

                        // get the opent2t schema and translator for the insteon device
                        var opent2tInfo = this._getOpent2tInfo(details.DevCat, details.SubCat.toString(16).toUpperCase());

                        if (opent2tInfo != undefined) // we support the device
                        {
                            var device = {};

                            // we only need to return certain properties back
                            device.name = details.DeviceName;

                            // set the specific device object id to be the id
                            device.id = details.DeviceID;

                            // set the opent2t info for the insteon device
                            device.openT2T = opent2tInfo;
                            
                            return Promise.resolve(device);
                        }
                        return Promise.resolve(undefined);
                    });

                promises.push(promise);
            });

            return Promise.all(promises).then((results) => {
                for (var i = 0; i < results.length ; i++) {
                    if(results[i] !== undefined){
                        filteredDevices.push(results[i]);
                    }
                }

                toReturn.devices = filteredDevices;
                return Promise.resolve(toReturn);
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
     * Gets device details (all fields), response formatted per http://docs.insteon.apiary.io/#reference/devices
     */
    getDeviceDetailsAsync(deviceId) {

        // Make the async request
        return this._makeRequest(this._devicesPath + '/' + deviceId, 'GET')
            .then((details) => {

                var device = details;

                var postPaylaod =
                {
                    command: 'get_status',
                    device_id: deviceId
                };

                return this._makeRequest(this._commandPath, 'POST', JSON.stringify(postPaylaod))
                    .then((response) => {                       
                        return this._getCommandResponse(response.id, 3) // get device status
                            .then((deviceStatus) => {

                                if (deviceStatus !== undefined && deviceStatus.status == 'succeeded') {   
                                    device['Level'] = deviceStatus.response.level;
                                    if (deviceStatus.response.level == 0) {
                                        device['Power'] = 'off';
                                    } else {
                                        device['Power'] = 'on';
                                    }
                                }
                                return Promise.resolve(device);
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

        var translatorCopy = new Translator(this._accessToken);
        var promises = [];

        if (Object.keys(statusChanges).length > 0) {
            var statePromise = this._makeRequest(this._commandPath, 'POST', JSON.stringify(statusChanges))
                    .then(function (response) {
                        return translatorCopy._getCommandResponse(response.id, 3) // get command status
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
                    if (responses[i].command !== undefined)
                    {
                        if( responses[i].command.level !== undefined) {
                            device['Level'] = responses[i].command.level;
                        }

                        if (responses[i].command !== undefined && responses[i].command.command !== undefined) {
                            device['Power'] = responses[i].command.command;
                        }
                    }

                    if (responses[i].content !== undefined) {
                        for (var item in responses[i].content) {
                            device[item] = responses[i].content[item];
                        }
                    }
                }
            }
            
            if(device.length === 0 ) return Promise.resolve(undefined);
            return Promise.resolve(device);
        });

    }

    /** 
     * Given the hub specific device, returns the opent2t schema and translator
     * devCat: Insteon device category
     * subCat: Insteon device sub-category.
     * We can identify the device using those two value based on the table at
     * https://insteon.atlassian.net/wiki/display/IKB/Insteon+Device+Categories+and+Sub-Categories#InsteonDeviceCategoriesandSub-Categories-devcat-subcat
     */

    _getOpent2tInfo(devCat, subCat) {
        switch (devCat) {
            case 1:
                if (this._subCatMap.lightBulbs.indexOf(subCat) >= 0)
                {
                    return {
                        "schema": 'org.opent2t.sample.lamp.superpopular',
                        "translator": "opent2t-translator-com-insteon-lightbulb"
                    };
                }
                return undefined;
            default:
                return undefined;
        }
    }
    
    _isDeviceStatus(propertyName){
        switch (propertyName) {
            case "command":
            case "level":
                return true;
            default:
                return false;
        }
    }

    _getCommandResponse(commandId, count){

        return sleep(1000).then(() => {
            return this._makeRequest(this._commandPath + '/' + commandId, 'GET')
                .then( (response) => {
                    if(response.status === 'pending')
                    {
                        if(count > 1){
                            return this._getCommandResponse(commandId, --count)
                        } else {
                            return undefined;
                        }
                    }
                    else return response;
                })
                .catch((err) => { console.log(err); });
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
            'Authorization': 'Bearer ' + this._accessToken.accessToken,
            'Authentication': 'APIKey ' + this._accessToken.apiKey,
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