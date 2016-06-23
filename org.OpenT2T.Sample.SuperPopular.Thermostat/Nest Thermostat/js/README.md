# Nest Thermostat
Translator for Nest thermostat (https://developers.nest.com)

## Setup Your Hardware
Follow instructions on the Nest site: (https://developers.nest.com)

## Installing Dependencies
To install dependencies for this translator, run:

```bash
npm install
```

## Test Device
After everything is installed, run:

```bash
node node_modules/opent2t-onboarding-nest/test.js -n  -n 'Nest Thermostat' -f 'thermostats'
```

The -f parameter is a regular expression to identify this device type by matching its ID field name. In this case, we are looking
for thermostats.

The user will be asked for product Id (client Id) and secret for onboarding the device.

```bash
Onboarding device  : Nest Thermostat
deviceTypeFilter        : thermostats

Please enter credentials for the Nest API (from developer.nest.com):

? Nest API Client ID:  <Product GUID>
? Nest API Client Secret:  <Product Secret>

Thanks! Initiating Nest sign-in.
Server running on port 8080
Signed in to Nest!
? Which device do you want to onboard? Basement (VHB1) (WIoTQV105WnaOA4-gcROVFQLiwepexno)
  access_token : <token>
  expires_in   : 315360000
  device_id    : WIoTQV105WnaOA4-gcROVFQLiwepexno
  message      : All done. Happy coding!

```

Copy the access token and id of the device that was discovered, and use that to run the translator test file:

```bash
$ node test -i WIoTQV105WnaOA4-gcROVFQLiwepexno -a <access_token>

```

If the device is on and connected to the Wink hub, you should see a temperature readout per
the commands in the test file. You should also see output similar to:

```bash
Javascript initialized.
javascript initialized.
  device.name          : Nest Thermostat (Test)
  device.props         :  { "id": "WIoTQV105WnaOA4-gcROVFQLiwepexno", "access_token": "..." }
getAmbientTemperature called.
disconnect called.
  device.name          : Nest Thermostat (Test)
  device.props         :  { "id": "WIoTQV105WnaOA4-gcROVFQLiwepexno", "access_token": "..." }
38
setTargetTemperature called.
disconnect called.
  device.name          : Nest Thermostat (Test)
  device.props         :  { "id": "WIoTQV105WnaOA4-gcROVFQLiwepexno", "access_token": "..." }
getTargetTemperature called.
Desired target temperature is as expected: 75-F
disconnect called.
  device.name          : Nest Thermostat (Test)
  device.props         :  { "id": "WIoTQV105WnaOA4-gcROVFQLiwepexno", "access_token": "..." }
```

Let's step through what's going on here. The manifest.xml for this translator documents the onboarding type
for this translator is org.OpenT2T.Onboarding.Nest. This basically just describes what sort of setup, pairing or
auth information is required to interact with the device. In the case of this onboarding type, success means you get
an ID parameter and an access token. These parameters needs to be provided to the translator for it to work.
