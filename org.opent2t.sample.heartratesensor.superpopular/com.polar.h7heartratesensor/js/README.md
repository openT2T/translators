# Polar H7 Heart Rate Sensor

Translator for the Polar H7 Heart Rate Sensor: http://www.polar.com/H7


## Setup Your Hardware

This translator depends on the noble node package. Follow the instructions for your platform from this site:
[https://www.npmjs.com/package/noble](https://www.npmjs.com/package/noble)

You can use a bluetooth dongle, or the built-in bluetooth on your device. Noble currently works for Node in the Windows and OSX command line but not for Windows UWP and Android apps in the bridge.

> <b>Note</b>: If running on Windows, when you run the Zadig program the drop down may be empty. In this case use Options - List all devices to populate it.
> Select the device that matches your Bluetooth dongle.

## Installing Dependencies
To install dependencies for this translator, run:

```bash
npm install
```

## Test Device
After everything is installed, run:

```bash
node node_modules/opent2t-onboarding-bluetoothle/test.js -n "Polar H7" -f "^Polar H7*"
```

The -f parameter is a regular expression to identify this sensor by matching its advertisement local name.

If there is a Polar H7 nearby, you should see output similar to:

```bash
$ node node_modules/opent2t-onboarding-bluetoothle/test.js -n "Polar H7" -f "^Polar H7*"
Onboarding device            : Polar H7
advertisementLocalNameFilter : ^Polar H7*
found peripheral: {"id":"73338e0d8bcd43378736f146f1c3773c","address":"00:22:d0:41:9b:2f","addressType":"unknown","connectable":true,"advertisement":{"localName":"Polar H7 419B2F1B","txPowerLevel":0,"manufacturerData":{"type":"Buffer","data":[107,0,63,0,0,0]},"serviceData":[],"serviceUuids":["180d"]},"rssi":-36,"state":"disconnected"}
  id           : 73338e0d8bcd43378736f146f1c3773c
  message      : All done. Happy coding!
```

Copy the ID of the Polar H7 that was discovered, and use that to run the translator test file:

```bash
node test -i 73338e0d8bcd43378736f146f1c3773c
```

If the same Polar H7 with the specified ID is nearby, you should be able to read data from it per
the commands in the test file. You should also see output similar to:

```bash
Make sure both metal pads are in contact with skin
Found sensor
discovered, now connecting...
Javascript initialized.
  device.name          : Polar H7 (Test)
  device.props         :  { "id": "73338e0d8bcd43378736f146f1c3773c" }
getBeatsPerMinute called.
service found
characteristic found
Read value: 20 bpm
disconnect called.
  device.name          : Polar H7 (Test)
  device.props         :  { "id": "73338e0d8bcd43378736f146f1c3773c" }
device disconnected
```

Let's step through what's going on here. The manifest.xml for this translator documents the onboarding type
for this translator is org.opent2t.onboarding.bluetoothle. This basically just describes what sort of setup, pairing or
auth information is required to interact with the device. In the case of this onboarding type, success means you get
an ID parameter. This parameter needs to be provided to the translator for it to work.
