# Texas Instruments SensorTag Temperature Sensor

Translator for the Texas Instruments SensorTag Temperature Sensor: http://www.ti.com/sensortag

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
node node_modules/opent2t-onboarding-bluetoothle/test.js -n 'TI SensorTag' -f 'SensorTag'
```

The -f parameter is a regular expression to identify this sensor by matching its advertisement local name.

If there is a TI SensorTag nearby, you should see output similar to:

```bash
Onboarding device            : TI SensorTag
advertisementLocalNameFilter : SensorTag
found peripheral: {"id":"8f0b918386904ca29eed05a18e5f3027","address":"unknown","addressType":"unknown","connectable":true,"advertisement":{"localName":"SensorTag","txPowerLevel":0,"serviceData":[],"serviceUuids":[]},"rssi":-40,"state":"disconnected"}
Found peripheral matching filter with ID: : 8f0b918386904ca29eed05a18e5f3027
```

Copy the ID of the SensorTag that was discovered, and use that to run the translator test file:

```bash
node test -i 8f0b918386904ca29eed05a18e5f3027
```

If the same SensorTag with the specified ID is nearby, you should be able to read data from it per
the commands in the test file. You should also see output similar to:

```bash
Press the button on the sensor tag. (wake sensor)
Javascript initialized.
  device.name          : SensorTag (Test)
  device.props         :  { "id": "8f0b918386904ca29eed05a18e5f3027" }
discovered
connected
getCurrentTemperature called.
22.90625C
disconnect called.
  device.name          : SensorTag (Test)
  device.props         :  { "id": "8f0b918386904ca29eed05a18e5f3027" }
```

Let's step through what's going on here. The manifest.xml for this translator documents the onboarding type
for this translator is org.OpenT2T.Onboarding.BluetoothLE. This basically just describes what sort of setup, pairing or
auth information is required to interact with the device. In the case of this onboarding type, success means you get
an ID parameter. This parameter needs to be provided to the translator for it to work.
