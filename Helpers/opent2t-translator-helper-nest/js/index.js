'use strict';
var https = require('follow-redirects').https;
var q = require('q');

var  accessToken, deviceId, deviceCategory;
// module exports, implementing the schema
module.exports = {

   init: function(category, id, token)
   {
       deviceCategory = category;
       deviceId = id;
       accessToken = token; //the specific token
   },

    getProperty : function(name) {
        var deferred = q.defer();   // Take a deferral

        var options = {
            protocol: 'https:',
            host: 'developer-api.nest.com',
            path: '/devices/'+ deviceCategory + '/' + deviceId,
            headers: {
                'Authorization': 'Bearer ' + accessToken
            },
            method: 'GET'
        };

        var httpsRequest = https.get(options, function(getRes) {
            var body = '';
            getRes.setEncoding('utf8');
            getRes.on('data', function(data) {
                body += data;
            });

            getRes.on('end', function() {
                if (getRes.statusCode != 200) {
                    deferred.reject(new Error("Error Code:" + getRes.statusCode));
                }
                else
                {
                    var data = JSON.parse(body);
                    deferred.resolve(data[name]);
                }
            });

            getRes.on('error', function(e) {
                deferred.reject(e);
            });
        });
        httpsRequest.end();

        return deferred.promise; // return the promise
    },
    
    setProperty : function(command) {
        var deferred = q.defer();   // Take a deferral

        var postData = JSON.stringify(command);

        var options = {
            protocol: 'https:',
            host: 'developer-api.nest.com',
            path: '/devices/thermostats/' + deviceId,
            headers: {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Content-length': Buffer.byteLength(postData),
            },
            method: 'PUT',
        };

        var httpsRequest = https.request(options, (getRes) => {
            var body = '';
            getRes.setEncoding('utf8');
            getRes.on('data', (data) => {
                body += data;
            });

            getRes.on('end', () => {
                if (getRes.statusCode != 200) {
                    deferred.reject(new Error("Error Code:" + getRes.statusCode));
                }
                else
                {
                    deferred.resolve();
                }
            });

            getRes.on('error', (e) => {
                deferred.reject(e);
            });
        });
        httpsRequest.write(postData);
        httpsRequest.end();

        return deferred.promise; // return the promise
    },
}
