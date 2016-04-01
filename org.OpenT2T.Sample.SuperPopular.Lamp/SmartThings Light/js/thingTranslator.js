global.initDevice = initDevice;
global.TurnOn = turnOn;
global.TurnOff = turnOff;
global.SetBrightness = setBrightness;

var http = require('http');
var https = require('https');
var querystring = require('querystring');

function initDevice(device) {
    console.log("Javascript initialized with device id: " + device.name + ", " + device.controlString + ", " + device.controlId);
}

function turnOn() {
    console.log('TurnOn called for light ' + device.name);
    sendSwitchCommandToDevice(true, device);
}

function turnOff() {
    sendSwitchCommandToDevice(false, device);
    console.log('TurnOff called for light ' + device.name);
}

function setBrightness(brightness) {
    // TODO: Implement brightness
    console.log('Setting brightness ' + device.name + ' to ' + brightness);
}

function sendSwitchCommandToDevice(switchState, device) {
    var options = {
        protocol: 'https:',
        host: 'graph.api.smartthings.com',
        path: '/api/smartapps/installations/' + device.controlId + device.controlString,
        headers: {
            'Authorization': 'Bearer ' + device.accessToken,
            'Content-Type': 'application/json'
        },
        method: 'PUT'
    };

    console.log("options = " + JSON.stringify(options));

    var switchStateString = 'off';
    if (switchState) {
        switchStateString = 'on';
    }

    var postData = JSON.stringify({
        'value': switchStateString
    });

    console.log("post data = " + postData);

    var req = https.request(options, (res) => {
        console.log('STATUS:' + res.statusCode);
        console.log('HEADERS:' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            console.log('BODY:' + chunk);
        });
        res.on('end', () => {
            console.log('No more data in response.')
        })
    });

    req.on('error', (e) => {
        console.log('problem with request:' + e.message);
    });

    req.write(postData);
    req.end();
}
