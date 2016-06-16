
/// <reference path="./typings/index.d.ts"/>

import * as translator from './thingTranslator';
import * as q from 'q';
import * as optimist from 'optimist';

var argv = optimist
    .usage('Usage: $0 -a [ip address of hue bridge] -u [hue user id] -i [hue light unique id]')
    .demand(['a'])
    .demand(['u'])
    .demand(['i'])
    .argv;

test({
    name: "Hue Light (Test)",
    props: JSON.stringify({ ipAddress: argv.a, userId: argv.u, uniqueId: argv.i })
});

async function test(device: translator.Device): Promise<void> {
    console.log("Testing lamp: " + device.props);

    // initialize the translator for testing purposes (this is normally called by the runtime)
    translator.initDevice(device);

    // Go through a sequence of test operations for the translator.

    await q.delay(1000);
    await translator.turnOn();
    await q.delay(5000);
    await translator.turnOff();
    await q.delay(2000);
    await translator.turnOn();
    await q.delay(2000);
    await translator.turnOff();
    await q.delay(2000);
    await translator.turnOn();
    await q.delay(2000);
    await translator.turnOff();
}
