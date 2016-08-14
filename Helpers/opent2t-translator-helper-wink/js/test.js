

var wh = require('./index');

wh.initWinkApi("endpointHere","deviceID","accesstoken");

wh.sendDesiredStateCommand('apiField', value).then(result => {
   console.log(result);
}).catch (error => {
    console.log(error.message);
}); //for logging

wh.getLastReading('apiFieldtoRead').then(result => {
   console.log(result);
}).catch (error => {
    console.log(error.message);
}); //for logging

wh.getValueOfDesiredState('apiFieldtoRead').then(result => {
   console.log(result);
}).catch (error => {
    console.log(error.message);
}); //for logging

