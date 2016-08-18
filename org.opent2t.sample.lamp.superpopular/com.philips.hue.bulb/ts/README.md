# Hue Light Bulb

Translator for lights connected to the Hue hub: http://www.meethue.com

## Setup Your Hardware

Follow instructions on the Hue site: http://www2.meethue.com/en-us/about-hue/get-started/

## Installing Dependencies
To install dependencies for this translator, run:

```bash
npm install
```

The npm install process also automatically compiles the TypeScript code to JavaScript.

## Test Device
After everything is installed, run:

```bash
node node_modules/opent2t-onboarding-huehub/test.js
```

With the Hue installed on the local network, the user will be asked to press the button on the top of the Hue and then the onboarding module will enumerate devices
connected to the Hue hub. If there is a Hue hub correctly set up , you should see output similar to:

```bash
Onboarding device:
Found Hue bridge at 192.168.1.4
Important! Press the button on the top of the Hue.
Then press Enter here within 30 seconds...
Created user: 71143d957508f24e355f833c51d2247d
? Which light do you want to onboard? (Use arrow keys)
> {"uniqueid":"00:17:88:01:10:57:ec:f4-0b","name":"My Hue Lamp 1"}
  {"uniqueid":"00:17:88:01:10:57:ec:40-0b","name":"My Hue Lamp 2"}
  ...
  ipAddress : 192.168.1.4
  userId    : s06A0pNjNaLkHHFpJHmkYLV4HI84mZ7D-9P-V5r3
  uniqueId  : 00:17:88:01:10:57:ec:f4-0b
  message   : All done. Happy coding!
```

Copy the displayed IP address, user ID, and device unique ID and use that to run the translator test:

```bash
$ node test -a '192.168.1.4' -u 's06A0pNjNaLkHHFpJHmkYLV4HI84mZ7D-9P-V5r3' -i '00:17:88:01:10:57:ec:f4-0b'
```

If the device is on and connected to the Hue hub, you should see it turn on/off per
the commands in the test file. You should also see output similar to:

```bash
Initializing device.
turnOn called.
turnOff called.
turnOn called.
turnOff called.
turnOn called.
turnOff called.
```

Let's step through what's going on here. The manifest.xml for this translator documents the onboarding type
for this translator is org.opent2t.onboarding.huehub. This basically just describes what sort of setup, pairing or
auth information is required to interact with the device. In the case of this onboarding type, success means you get
a userid parameter and a uniqueid of the light. These parameters needs to be provided to the translator for it to work.
opent2t-onboarding-zwave