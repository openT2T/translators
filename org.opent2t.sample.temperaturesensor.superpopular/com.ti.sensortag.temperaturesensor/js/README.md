# Texas Instruments SensorTag Temperature Sensor

Translator for the Texas Instruments SensorTag Temperature Sensor: http://www.ti.com/sensortag

## Setup Your Hardware

This translator depends on the noble node package (indirectly, via the dependency on the sensortag node package). Follow
the instructions for your platform from this site: https://www.npmjs.com/package/noble.

You can use a bluetooth dongle, or the built-in bluetooth on your device. Noble currently works for Node in the Windows and OSX command line but not for Windows UWP and Android apps in the bridge.

> <b>Note</b>: If running on Windows, when you run the `Zadig` program per the noble instructions, the drop down may be empty. In this case use `Options - List all devices` to populate it and then 
select the device that matches your Bluetooth dongle.

## Installing Dependencies
To install dependencies for this translator, run:

```bash
npm install
```

## Running Test Automation
This translator comes with some automated tests. Here's how you can run them:

### 1. Run onboarding to get credentials

After dependencies are installed, cd to the translator root directory (i.e. the directory where
this `README.md` and the `thingTranslator.js` exists).

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

Note the `id` of the device that was discovered. You will need it later to run the test automation.

Let's step through what's going on here. The manifest.xml for this translator documents the onboarding type
for this translator is org.opent2t.onboarding.bluetoothle. This basically just describes what sort of setup, pairing or
auth information is required to interact with the device. In the case of this onboarding type, success means you get
an ID parameter. This parameter is provided to the translator for it to work.

### 2. Create the `tests/testConfig.json` file
This is where you can put credentials/config to drive this test (this file is added to .gitignore
to prevent inadvertent check-in). Use the following contents to start this file:

   ```json
    {
        "Device" : {
            "name": "TI SensorTag Temperature Sensor",
            "props": { 
                "id": "<id>"
            }
        }
    }
   ```

### 3. Modify testConfig.json with Test Configuration
Populate `<id>` in `tests/testconfig.json`. You can get this value by running the onboarding script (see above).

### 4. Install Test Dependencies:

```bash
npm install -g ava
```

### 5. Run the tests

To run all the tests, run:

```bash
npm test
```

To run a specific test, run:

```bash
ava <test file path> <options>
```

