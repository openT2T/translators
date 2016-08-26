# Wink Hub translator
Translator for Wink hub (https://wink.com)

## Setup Your Hardware
Follow instructions in the Wink app to set up your Wink account. This is a pre-requisite
before using this translator to interact with your hub.

## Installing Dependencies
To install dependencies for this translator, run:

```bash
npm install
```

## Running Test Automation
This translator comes with some automated tests. Here's how you can run them:

### 1. Run onboarding to get credentials

After dependencies are installed, cd to the translator root directory (i.e. the directory where
this `README.md` and the `thingTranslator.js` exists).

```bash
node node_modules/opent2t-onboarding-winkhub/test.js
```

The user will be asked for their Wink credentials (plus API key information) and then the onboarding module will enumerate devices
connected to the Wink hub. If there is a Wink hub correctly set up and the user chooses a device (any device), you should see output similar to:

```bash
Onboarding device  : device name
idKeyFilter        : thermostat_id

Please enter credentials for the Wink API:

? Wink API Client ID:  --MASKED (get this from Wink)--
? Wink API Client Secret:  --MASKED (get this from Wink)--
? Wink User Name (create this in the Wink app):  --MASKED--
? Wink Password (create this in the Wink app):  --MASKED--

Thanks! Signing you in to Wink.
Signed in to WINK.
? Which device do you want to onboard? Home Entryway Thermostat (123456)
  access_token : <access token, refreshToken, tokenType, scopes>
  id           : <device id>
  message      : All done. Happy coding!
```

Note the `access_token` that was discovered. You will need it later to run the test automation.

Let's step through what's going on here. The manifest.xml for this translator documents the onboarding type
for this translator is org.opent2t.onboarding.winkhub. This basically just describes what sort of setup, pairing or
auth information is required to interact with the device. In the case of this onboarding type, success means you get
an access token. These parameters are provided to the translator for it to work.

### 2. Create the `tests/testConfig.json` file
This is where you can put credentials/config to drive this test (this file is added to .gitignore
to prevent inadvertent check-in). Use the following contents to start this file:

   ```json
    { 
        "accessToken": "<accessToken value>",
        "refreshToken": "<refreshToken value>",
        "tokenType": "bearer",
        "scopes": "full_access"
    }
   ```

### 3. Modify testConfig.json with Test Configuration
Populate `<accessToken>` and `<refreshToken>` in `tests/testconfig.json`. 

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

