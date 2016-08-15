# Wink Light Bulb

Translator for lights connected to the Wink hub: http://wink.com

## Setup Your Hardware

Follow instructions on the Wink site: http://wink.com 

## Installing Dependencies
To install dependencies for this translator, run:

```bash
npm install
```

## Test Device
After everything is installed, run:

```bash
node node_modules/opent2t-onboarding-winkhub/test.js -n "Wink Light Bulb" -f "light_bulb_id"
```

The -f parameter is a regular expression to identify this device type by matching its ID field name. In this case, we are looking
for light bulbs.

The user will be asked for their Wink credentials (plus API key information) and then the onboarding module will enumerate devices
connected to the Wink hub. If there is a Wink hub correctly set up and the user chooses a device, you should see output similar to:

```bash
Onboarding device  : Wink Light Bulb
idKeyFilter        : light_bulb_id

Please enter credentials for the Wink API:

? Wink API Client ID:  --MASKED (get this from Wink)--
? Wink API Client Secret:  --MASKED (get this from Wink)--
? Wink User Name (create this in the Wink app):  --MASKED--
? Wink Password (create this in the Wink app):  --MASKED--

Thanks! Signing you in to Wink.
Signed in to WINK.
? Which device do you want to onboard?
 GE Link Bulb (1559737)
>GE Link Bulb (3559678)
 GE Link Bulb (5523425)
  access_token : abcc2f4ds55asd531ec78cc08b236gd
  id           : 3559678
  message      : All done. Happy coding!
```

Copy the access token and id of the device that was discovered, and use that to run the translator test file:

```bash
$ node test -i 3559678 -a abcc2f4ds55asd531ec78cc08b236gd

```

If the device is on and connected to the Wink hub, you should see it turn on/off and change brightness per
the commands in the test file. You should also see output similar to:

```bash
Javascript initialized.
  device.name          : Wink Light Bulb (Test)
  device.props         :  { "id": "3559678", "access_token": "abcc2f4ds55asd531ec78cc08b236gd" }
turnOn called.
turnOff called.
disconnect called.
  device.name          : Wink Light Bulb (Test)
  device.props         :  { "id": "3559678", "access_token": "abcc2f4ds55asd531ec78cc08b236gd" }
```

Let's step through what's going on here. The manifest.xml for this translator documents the onboarding type
for this translator is org.OpenT2T.Onboarding.WinkHub. This basically just describes what sort of setup, pairing or
auth information is required to interact with the device. In the case of this onboarding type, success means you get
an ID parameter and an access token. These parameters needs to be provided to the translator for it to work.
