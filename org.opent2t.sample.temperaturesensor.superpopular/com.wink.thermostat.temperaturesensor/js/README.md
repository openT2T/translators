# Wink Light Bulb

Translator for thermostats connected to the Wink hub: http://wink.com. Only the temperature sensor in the thermostat is maped to the schema
at this time.

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
node node_modules/opent2t-onboarding-winkhub/test.js -n "Wink Thermostat Temperature Sensor" -f "thermostat_id"
```

The -f parameter is a regular expression to identify this device type by matching its ID field name. In this case, we are looking
for thermostats.

The user will be asked for their Wink credentials (plus API key information) and then the onboarding module will enumerate devices
connected to the Wink hub. If there is a Wink hub correctly set up and the user chooses a device, you should see output similar to:

```bash
Onboarding device  : Wink Thermostat Temperature Sensor
idKeyFilter        : thermostat_id

Please enter credentials for the Wink API:

? Wink API Client ID:  --MASKED (get this from Wink)--
? Wink API Client Secret:  --MASKED (get this from Wink)--
? Wink User Name (create this in the Wink app):  --MASKED--
? Wink Password (create this in the Wink app):  --MASKED--

Thanks! Signing you in to Wink.
Signed in to WINK.
? Which device do you want to onboard?
 Office (130433)
>Hallway (130435)
 Bedroom (130436)
  access_token : abcc2f4ds55asd531ec78cc08b236gd
  id           : 130435
  message      : All done. Happy coding!
```

Copy the access token and id of the device that was discovered, and use that to run the translator test file:

```bash
$ node test -i 130435 -a abcc2f4ds55asd531ec78cc08b236gd

```

If the device is on and connected to the Wink hub, you should see a temperature readout per
the commands in the test file. You should also see output similar to:

```bash
Javascript initialized.
  device.name          : Wink Temperature Sensor (Test)
  device.props         :  { "id": "130435", "access_token": "abcc2f4ds55asd531ec78cc08b236gd" }
getCurrentTemperature called.
25C
disconnect called.
  device.name          : Wink Temperature Sensor (Test)
  device.props         :  { "id": "130435", "access_token": "abcc2f4ds55asd531ec78cc08b236gd" }
```

Let's step through what's going on here. The manifest.xml for this translator documents the onboarding type
for this translator is org.opent2t.onboarding.winkhub. This basically just describes what sort of setup, pairing or
auth information is required to interact with the device. In the case of this onboarding type, success means you get
an ID parameter and an access token. These parameters needs to be provided to the translator for it to work.
