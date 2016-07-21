
/// <reference path="./typings/index.d.ts"/>

// Note there are no type definitions for node-hue-api, so it is required instead of imported.
var hue = require('node-hue-api'),
    HueApi = hue.HueApi,
    lightState = hue.lightState;

export class Device {
    name: string;
    props: string;
}

export class DeviceProps {
    ipAddress: string;
    userId: string;
    uniqueId: string;
}

var device: Device;
var deviceProps: DeviceProps;
var api: any;


// logs device state
function logDeviceState(device: Device) {
    if (typeof (device) !== 'undefined') {
        console.log('  device.name          : ' + device.name);
        console.log('  device.props         : ' + device.props);
    } else {
        console.log('device is undefined');
    }
};

// gets a light index, given a unique id for a light
async function getLightIndexFromId(uniqueId: string): Promise<string> {
    var lightsResult = await api.lights();
    var light = lightsResult.lights.find((l: any) => l.uniqueid == uniqueId);
    if (light) {
        return light.id;
    }
    throw new Error('Light not found: ' + uniqueId);
}


// simple argument validation for the exported methods below
function validateArgumentType(arg: any, argName: string, expectedType: string) {
    if (typeof arg === 'undefined') {
        throw new Error('Missing argument: ' + argName + '. ' +
            'Expected type: ' + expectedType + '.');
    } else if (typeof arg !== expectedType) {
        throw new Error('Invalid argument: ' + argName + '. ' +
            'Expected type: ' + expectedType + ', got: ' + (typeof arg));
    }
}


// module exports, implementing the schema

export function initDevice(dev: Device): void {
    console.log('Initializing device.');

    device = dev;
    validateArgumentType(device, 'device', 'object');
    validateArgumentType(device.props, 'device.props', 'string');

    deviceProps = JSON.parse(device.props);
    validateArgumentType(deviceProps.ipAddress, 'device.props.ipAddress', 'string');
    validateArgumentType(deviceProps.userId, 'device.props.userId', 'string');
    validateArgumentType(deviceProps.uniqueId, 'device.props.uniqueId', 'string');

    api = new HueApi(deviceProps.ipAddress, deviceProps.userId);
}

export async function turnOn(): Promise<void> {
    console.log('turnOn called.');
    var index = await getLightIndexFromId(deviceProps.uniqueId);
    var state = lightState.create().on();
    await api.setLightState(index, state);
}

export async function turnOff(): Promise<void> {
    console.log('turnOff called.');
    var index = await getLightIndexFromId(deviceProps.uniqueId);
    var state = lightState.create().off();
    await api.setLightState(index, state);
}

export async function setBrightness(brightness: number): Promise<void> {
    console.log('setBrightness(' + brightness + ') called.');
    validateArgumentType(brightness, 'brightness', 'number');
    var index = await getLightIndexFromId(deviceProps.uniqueId);
    var state = lightState.create().brightness(brightness);
    await api.setLightState(index, state);
}

export function disconnect(): void {
    console.log('disconnect called.');
    logDeviceState(device);
}