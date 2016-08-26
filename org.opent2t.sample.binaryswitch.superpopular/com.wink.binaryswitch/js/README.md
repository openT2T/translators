# Wink Binary Switch Translator
Translator for Wink Binary Switch (https://wink.com)

## Setup Your Hardware
Follow instructions in the Wink app to set up your binary switch with Wink. This is a pre-requisite
before using this translator to interact with your binary switch.

## Installing Dependencies
To install dependencies for this translator, run:

```bash
npm install
```

> **Note:** At the time of writing some packages are not published to npm. If you get errors, 
  Here's how you can install them from local paths via `npm link`.

```bash
pushd '../../../Helpers/opent2t-translator-helper-wink/js/'
npm link
popd
npm link opent2t-translator-helper-wink
```

Run `npm install` again after installing from local paths and confirm there are no errors before proceeding.

## Running Test Automation
This translator comes with some automated tests. Here's how you can run them:

### 1. Run onboarding to get credentials

After dependencies are installed, cd to the translator root directory (i.e. the directory where
this `README.md` and the `thingTranslator.js` exists).

```bash
node node_modules/opent2t-onboarding-winkhub/test.js -n 'Wink Binary Switch' -f 'binary_switch_id'
```

The -f parameter is a regular expression to identify this device type by matching its ID field name. In this case, we are looking
for binary switches.

The user will be asked for their Wink credentials (plus API key information) and then the onboarding module will enumerate devices
connected to the Wink hub. If there is a Wink hub correctly set up and the user chooses a device, you should see output similar to:

```bash
Onboarding device  : Wink Binary Switch
idKeyFilter        : binary_switch_id

Please enter credentials for the Wink API:

? Wink API Client ID:  --MASKED (get this from Wink)--
? Wink API Client Secret:  --MASKED (get this from Wink)--
? Wink User Name (create this in the Wink app):  --MASKED--
? Wink Password (create this in the Wink app):  --MASKED--

Thanks! Signing you in to Wink.
Signed in to WINK.
? Which device do you want to onboard? Living Room Lamp Switch (137418)
  access_token : ACCESS_TOKEN
  id           : DEVICE_ID
  message      : All done. Happy coding!
```

Note the `access_token` and `id` of the device that was discovered. You will need it later to run the test automation.

Let's step through what's going on here. The manifest.xml for this translator documents the onboarding type
for this translator is org.opent2t.onboarding.winkhub. This basically just describes what sort of setup, pairing or
auth information is required to interact with the device. In the case of this onboarding type, success means you get
an ID parameter and an access token. These parameters are provided to the translator for it to work.

### 2. Create the `tests/testConfig.json` file
This is where you can put credentials/config to drive this test (this file is added to .gitignore
to prevent inadvertent check-in). Use the following contents to start this file:

   ```json
    {
        "Device" : {
            "name": "Wink Binary Switch.",
            "props": { 
                "id": "<id>", 
                "access_token": "<access-token>" 
            }
        }
    }
   ```

### 3. Modify testConfig.json with Test Configuration
Populate `<id>` and `<access_token>` in `tests/testconfig.json`. You can get these values by running
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

