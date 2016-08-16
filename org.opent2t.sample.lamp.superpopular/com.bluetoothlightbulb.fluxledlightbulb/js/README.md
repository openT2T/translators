# Flux Smart LED Light Bulb

Translator for the Flux Smart LED Light bulb: http://bluetoothlightbulb.com/

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
node node_modules/opent2t-onboarding-bluetoothle/test.js -n 'Flux Smart LED' -f '(LEDBlue|FluxBlue)'
```

The -f parameter is a regular expression to identify this lightbulb by matching its advertisement local name. Some versions of the Flux Smart
LED Bulb advertize the local name "LEDBlue" while others advertize "FluxBlue"

If there is a Flux Smart LED Light Bulb nearby, you should see output similar to:

```bash
Onboarding device            : LED Blue Light
advertisementLocalNameFilter : (LEDBlue|FluxBlue)
found peripheral: {"id":"d3026b5699424729b0910945a7761833","address":"b4:99:4c:5d:8f:c1","addressType":"unknown","connectable":true,"advertisement":{"localName":"LEDBlue-4C5D8FC1","serviceData":[],"serviceUuids":["fff0","ffe5","ffe0"]},"rssi":-45,"state":"disconnected"}
Found peripheral matching filter with ID: d3026b5699424729b0910945a7761833
```

Copy the ID of the bulb that was discovered, and use that to run the translator test file:

```bash
node test -i d3026b5699424729b0910945a7761833
```

If the same bulb with the specified ID is nearby, you should see it turn on/off and change brightness per
the commands in the test file. You should also see output similar to:

```bash
Javascript initialized.
  device.name          : LED Blue Light (Test)
  device.props         :  { "id": "d3026b5699424729b0910945a7761833" }
connected
paired
setBrightness called with value: 100
brightness changed
turnOn called.
turnOn done
setBrightness called with value: 80
brightness changed
setBrightness called with value: 60
brightness changed
setBrightness called with value: 40
brightness changed
setBrightness called with value: 20
brightness changed
setBrightness called with value: 0
brightness changed
turnOff called.
turnOff done
disconnect called.
  device.name          : LED Blue Light (Test)
  device.props         :  { "id": "d3026b5699424729b0910945a7761833" }
device disconnected
```

Let's step through what's going on here. The manifest.xml for this translator documents the onboarding type
for this translator is org.opent2t.onboarding.bluetoothle. This basically just describes what sort of setup, pairing or
auth information is required to interact with the device. In the case of this onboarding type, success means you get
an ID parameter. This parameter needs to be provided to the translator for it to work.
