# Vera Light Bulb

Translator for lights connected to the Vera hub: http://getvera.com

## Setup Your Hardware

Follow instructions on the Vera site: http://getvera.com 

## Installing Dependencies
To install dependencies for this translator, run:

```bash
npm install
```

## Test Device
After everything is installed, run:

```bash
node node_modules/opent2t-onboarding-verahub/test.js -f "Dimmable"
```

The -f parameter is a text expression to identify this device type supported. In this case, we are looking
for dimmable bulbs. See the onboarding readme for more types that are acceptable here.

The user will be asked for their Vera credentials and serial number of their device and then the onboarding module will enumerate devices
connected to the Vera hub. If there is a Vera hub correctly set up and the user chooses a device, you should see output similar to:

```bash
deviceTypeFilter   : Dimmable

Please enter credentials for the Vera API:

? Vera Device Serial Number (8 digit numeric):  --MASKED
? Vera User Name (create this in the Vera app):  --MASKED
? Vera Password (create this in the Vera app):  *********

Thanks! Signing you in to Vera.
? Which device do you want to onboard? (Use arrow keys)
> Loft Lights (13)
  Master Lights (5)
  Lamp Left (6)

  sessionToken : 120389203980AS09283420
  relayServer  : vera-server-something.com
  deviceId     : 13
  message      : All done, happy coding!
```


Copy the session token, relayServer and deviceId of the device that was discovered, and use that to run the translator test file:

```bash
$ node test -i <device id> -a <token> -r <relay server> -p <hub serial number>

```

If the device is on and connected to the Vera hub, you should see it turn on/off and change brightness per
the commands in the test file. You should also see output similar to:

```bash
Javascript initialized.
  device.name          : Vera Light Bulb (Test)
  device.props         :  { "id": "13", "session_token": "token", "relay_server": "server", "pk_device": "number" }
turnOn called.
setBrightness called with value: 40
turnOff called.
disconnect called.
  device.name          : Vera Light Bulb (Test)
  device.props         :  { "id": "13", "session_token": "token", "relay_server": "server", "pk_device": "number" }
```

Let's step through what's going on here. The manifest.xml for this translator documents the onboarding type
for this translator is org.OpenT2T.Onboarding.VeraHub. This basically just describes what sort of setup, pairing or
auth information is required to interact with the device. In the case of this onboarding type, success means you get
a device ID parameter, session token and a relay server. These parameters in addition to the hub serial number needs to be provided to the translator for it to work.
