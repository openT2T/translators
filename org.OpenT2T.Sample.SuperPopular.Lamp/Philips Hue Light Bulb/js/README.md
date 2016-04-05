# Hue Light Bulb

Translator for lights connected to the Hue hub: http://www.meethue.com

## Setup Your Hardware

Follow instructions on the Hue site: http://www2.meethue.com/en-us/about-hue/get-started/ 

## Installing Dependencies
To install dependencies for this translator, run:

```bash
npm install
```

## Test Device
After everything is installed, run:

```bash
node node_modules/opent2t-onboarding-huehub/test.js -n "Hue Light Bulb" -f "light_bulb_id"
```

The -f parameter is a regular expression to identify this device type by matching its ID field name. In this case, we are looking
for light bulbs.

With the Hue installed on the local network, the user will be asked to press the button on the top of the Hue and then the onboarding module will enumerate devices
connected to the Hue hub. If there is a Hue hub correctly set up , you should see output similar to:

```bash
Onboarding device  : 'Hue
idKeyFilter        : 'light_bulb_id'
Found Hue bridge at 192.168.1.4
Important!  Press and hold the button on the top of the Hue.
Now hit the return key while still holding the button on the Hue...
Created user: 71143d957508f24e355f833c51d2247d
light 1 = {"hueaddress":"192.168.1.4","userid":"71143d957508f24e355f833c51d2247d","uniqueid":"00:17:88:01:10:57:ec:f4-0b"}

Copy the JSON of the device that was discovered, and use that to run the translator test file:

```bash
$ node test -a {\"hueaddress\":\"192.168.1.4\",\"userid\":\"71143d957508f24e355f833c51d2247d\",\"uniqueid\":\"00:17:88:01:10:57:ec:f4-0b\"}

```

If the device is on and connected to the Wink hub, you should see it turn on/off per
the commands in the test file. You should also see output similar to:

```bash
Javascript initialized.
turnOn called.
turnOff called.
turnOn called.
turnOff called.
turnOn called.
turnOff called.
```

Let's step through what's going on here. The manifest.xml for this translator documents the onboarding type
for this translator is org.OpenT2T.Onboarding.HueHub. This basically just describes what sort of setup, pairing or
auth information is required to interact with the device. In the case of this onboarding type, success means you get
a userid parameter and a uniqueid of the light. These parameters needs to be provided to the translator for it to work.
