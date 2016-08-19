# Nest Thermostat
Translator for Nest thermostat (https://developers.nest.com)

## Setup Your Hardware
Follow instructions on the Nest site: (https://developers.nest.com)

## Installing Dependencies
To install dependencies for this translator, run:

```bash
npm install
```

> **Note:** At the time of writing some packages are not published to npm. If you get errors, 
  Here's how you can install them from local paths via `npm link`. We assume that you have already 
  cloned the https://github.com/opent2t/opent2t repo locally, and have a local path to it.

```bash
pushd '../../../Helpers/opent2t-translator-helper-nest/js/'
npm link
popd
npm link opent2t-translator-helper-nest
pushd LOCAL-PATH-TO-OPENT2T-REPO/node/
npm link
popd
npm link opent2t
```

Run `npm install` again after installing form local paths and confirm there are no errors before proceeding.

## Running Test Automation
This translator comes with some automated tests. Here's how you can run them:

### 1. Run onboarding to get credentials

After dependencies are installed, cd to the translator root directory (i.e. the directory where
this `README.md` and the `thingTranslator.js` exists).

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
  access_token : <access_token>
  expires_in   : 315360000
  device_id    : <device_id>
  message      : All done. Happy coding!

```

Note the `access_token` and `device_id` of the device that was discovered. You will need it later to run the test automation.

Let's step through what's going on here. The manifest.xml for this translator documents the onboarding type
for this translator is org.opent2t.onboarding.nest. This basically just describes what sort of setup, pairing or
auth information is required to interact with the device. In the case of this onboarding type, success means you get
an ID parameter and an access token. These parameters are provided to the translator for it to work.

### 2. Create the `tests/testConfig.json` file
This is where you can put credentials/config to drive this test (this file is added to .gitignore
to prevent inadvertent check-in). Use the following contents to start this file:

   ```json
    {
        "Device" : {
            "name": "Nest Thermostat.",
            "props": { 
                "id": "<device_id>", 
                "access_token": "<access-token>" 
            }
        }
    }
   ```

### 3. Modify testConfig.json with Test Configuration
Populate `<device_id>` and `<access_token>` in `tests/testconfig.json`. You can get these values by running
the onboarding script (see above).

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

