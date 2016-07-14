# Osram Lightify Light Bulb

Translator for lights connected to the Osram Lightify hub: http://www.osram.com/osram_com/products/led-technology/lightify/index.jsp

## Setup Your Hardware

Follow instructions on the Osram Lightify site: http://www.osram.com/osram_com/products/led-technology/lightify/index.jsp

## Installing Dependencies
To install dependencies for this translator, run:

```bash
npm install
```

## Test Device
After everything is installed, run:

```bash
node node_modules/opent2t-onboarding-lightifyhub/test.js -f "Light"
```

The -f parameter is a text expression to identify this device type supported. In this case, we are looking
for lights. See the onboarding readme for more types that are acceptable here.

The user will be asked for their Osram Lightify credentials and serial number of their device and then the onboarding module will enumerate devices connected to the Osram Lightify hub. If there is a Osram Lightify hub correctly set up and the user chooses a device, you should see output similar to:

```bash
deviceTypeFilter   : light

Please enter credentials for the Osram Lightify API:

? Osram Lightify Device Serial Number (alpha-numeric without trailing -XX):  --MASKED
? Osram Lightify User Name (create this in the Osram Lightify app):  --MASKED
? Osram Lightify Password (create this in the Osram Lightify app):  *********

Thanks! Signing you in to Osram Lightify.
? Which device do you want to onboard? (Use arrow keys)
> BR30 TW 65 01 (1)
  BR30 TW 65 02 (2)

  securityToken : 234234-3029340294asdfas
  deviceId      : 1
  message       : All done, happy coding!
```


Copy the security token and deviceId of the device that was discovered, and use that to run the translator test file:

```bash
$ node test -i <device id> -a <securityToken>

```

If the device is on and connected to the Osram Lightify hub, you should see it turn on/off and change brightness per
the commands in the test file. You should also see output similar to:

```bash
Javascript initialized.
  device.name          : Lightify Light Bulb (Test)
  device.props         :  { "id": "2", "security_token": "116368-a3rkWPVxulJhlOUFBM8V" }
[2] turnOn called.
[2] setBrightness called with value: 100
[2] setBrightness called with value: 20
[2] turnOff called.
disconnect called.
```

Let's step through what's going on here. The manifest.xml for this translator documents the onboarding type
for this translator is org.OpenT2T.Onboarding.VeraHub. This basically just describes what sort of setup, pairing or
auth information is required to interact with the device. In the case of this onboarding type, success means you get
a device ID parameter, session token and a relay server. These parameters in addition to the hub serial number needs to be provided to the translator for it to work.
