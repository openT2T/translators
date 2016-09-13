# Nest Thermostat
Translator for Nest thermostat (https://developers.nest.com)

## Setup Your Hardware
Follow instructions on the Nest site: (https://developers.nest.com)

## Installing Dependencies
To install dependencies for this translator, run:

```bash
npm install
```

## Running Test Automation
This translator comes with some automated tests. Here's how you can run them:

### 1. Setup product and device

Create a new Cloud Product, with the following properties:
    Redirect URI: http://localhost:8080/success
    Permissions: Include at least Thermostat read/write

This will create a product ID and secret to use when running the tests.

You will also either need a physical device or simulated device attached the same developer account.  Set up
the Nest Home simulator following the instructions on the Nest site (https://developers.nest.com/documentation/cloud/home-simulator).

### 2. Run onboarding to get credentials

After dependencies are installed, cd to the translator root directory (i.e. the directory where
this `README.md` and the `thingTranslator.js` exists).

```bash
node node_modules/opent2t-onboarding-nest/test.js -n "Nest Thermostat" -f "thermostats"
```

The -f parameter is a regular expression to identify this device type by matching its ID field name. In this case, we are looking
for thermostats.

The user will be asked for product Id (client Id) and secret for onboarding the device.

```bash
Onboarding device  : Nest Thermostat
deviceTypeFilter        : thermostats

Please enter credentials for the Nest API (from http://developers.nest.com):

? Nest API Product ID:  <Product GUID>
? Nest API Product Secret:  <Product Secret>

Thanks! Initiating Nest sign-in.
Server running on port 8080
Signed in to Nest!
? Which device do you want to onboard? Basement (VHB1)
  access_token : ACCESS_TOKEN
  expires_in   : EXPIRATION_DURATION
  device_id    : DEVICE_ID
  message      : All done. Happy coding!

```

Note the `access_token` and `device_id` of the device that was discovered. You will need it later to run the test automation.

Let's step through what's going on here. The manifest.xml for this translator documents the onboarding type
for this translator is org.opent2t.onboarding.nest. This basically just describes what sort of setup, pairing or
auth information is required to interact with the device. In the case of this onboarding type, success means you get
an ID parameter and an access token. These parameters are provided to the translator for it to work.

### 3. Create the `tests/testConfig.json` file
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

### 4. Modify testConfig.json with Test Configuration
Populate `<device_id>` and `<access_token>` in `tests/testconfig.json`. You can get these values by running
the onboarding script (see above).

### 5. Install Test Dependencies:

```bash
npm install -g ava
```

### 6. Run the tests

If using the Nest Simulator, ensure that it is in "Heat/Cool" mode.

To run all the tests, run:

```bash
npm test
```

To run a specific test, run:

```bash
ava <test file path> <options>
```

### 5. Verify javascript passes linting

To lint all javascript files in this directory, run:

```bash
npm run-script lint .
```

To lint a specific file, run:

```bash
npm run-script lint <source file path>
```

