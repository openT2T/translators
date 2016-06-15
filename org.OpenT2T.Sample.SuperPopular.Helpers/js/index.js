'use strict';

var https = require('https');
var q = require('q');

//this is our base, we refactor this options in each method
 var options = 
 {
        protocol: 'https:',
        host: 'api.wink.com'     
 };
    
var  accessToken;  //we will need this when creating the headers
      
module.exports = 
{
    //get the initial parameters to build our target endpoint
   initWinkApi: function(apiEndpoint, deviceID, token)
   {
       options.path = '/' + apiEndpoint + '/' + deviceID;
       accessToken = token; //the specific token
        
   },
 
   sendDesiredStateCommand: function(apiField,value,callback) 
   {
       
    //build our desired state object where the apiField is the target value
    options.postData = {'desired_state':{}}; //we will add the field in this object
    options.postData.desired_state[apiField] = value;
    
    var deferred = q.defer();   // q will help us with returning a promise
    
    //the headers to make our call
    options.headers = 
    {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-length':  JSON.stringify(options.postData).length
    }
    
    options.method = 'PUT'; //the type of request to make
   
    //our HTTPS call 
    var req = https.request(options, (res) => {
        res.setEncoding('utf8');
        res.on('data', (chunk) => 
        {
             deferred.resolve('The ' + apiField + ' changed to ' + value);
        });
        res.on('end', () => 
        {
             deferred.resolve('ended call');
        });
        res.on('error', (e) => {
            deferred.reject(e.message);
        }); });


    req.on('error', (e) => {
        console.log('problem with request:');
        deferred.reject(e.message);
    });

    req.write(JSON.stringify(options.postData));
    req.end();   

    //make our Promise and give it back to the caller
    deferred.promise.nodeify(callback);
    return deferred.promise;
    
   },
   
   getLastReading: function(apiField,callback)
   {
    
    var deferred = q.defer();   // q will help us with returning a promise
    
    //the headers to make our call
    options.headers = 
    {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json', 
    }
     
    //our HTTPS call 
    var req = https.get(options, (res) => {
     
       var body = ' '; //holds the chunks of data
        res.on('data', (chunk) => 
        {
          body += chunk; });
        res.on('end', () => 
        {
            //parse the JSON response and look for the apiField we want in the JSON body
             var results = JSON.parse(body.toString());
             var valueToGet = results.data.last_reading[apiField];
             deferred.resolve(valueToGet);
        });
        res.on('error', (e) => {
            deferred.reject(e.message);
        }); });

    req.on('error', (e) => {
        console.log('problem with request:');
        deferred.reject(e.message);
    });
    
    
    req.end();   
    //make our Promise and give it back to the caller
    deferred.promise.nodeify(callback);
    return deferred.promise;
    
   },
   
   getValueOfDesiredState: function(apiField,callback) 
   {
       
    var deferred = q.defer();   // q will help us with returning a promise
    
    
    //the headers to make our call
    options.headers = 
    {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json', 
    }
     
    //our HTTPS call 
    var req = https.get(options, (res) => {

       var body = ' '; //holds the chunks of data
        res.on('data', (chunk) => 
        {
          body += chunk; });
        res.on('end', () => 
        {
            //parse the JSON response and look for the apiField we want in the JSON body
             var results = JSON.parse(body.toString());
             var valueToGet = results.data.desired_state[apiField];
             deferred.resolve(valueToGet);
        });
        res.on('error', (e) => {
            deferred.reject(e.message);
        }); });

    req.on('error', (e) => {
        console.log('problem with request:');
        deferred.reject(e.message);
    });
    
    req.end();   

    //make our Promise and give it back to the caller
    deferred.promise.nodeify(callback);
    return deferred.promise;
    
   }   
   
       
}
    

 

