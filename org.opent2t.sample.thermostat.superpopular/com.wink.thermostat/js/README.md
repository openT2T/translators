# Wink Thermostat translator
Translator for Wink thermostat (https://wink.com)

## Setup Your Hardware
Follow instructions in the Wink app to set up your thermostat with Wink. This is a pre-requisite
before using this translator to interact with your thermostat.

## Installing Dependencies
To install dependencies for this translator, run:

```bash
npm install
```

> **Note:** At the time of writing some packages are not published to npm. If you get errors, 
  Here's how you can install them from local paths. We assume that you have already cloned the
  https://github.com/opent2t/opent2t repo locally, and have a local path to it.

```bash
npm install ../../../Helpers/opent2t-translator-helper-wink/js/
npm install 'LOCAL-PATH-TO-OPENT2T-REPO/node/*'
```

## Running Test Automation
This translator comes with some automated tests. Here's how you can run them:

### 1. Create the `tests/testConfig.json` file
This is where you can put credentials/config to drive this test (this file is added to .gitignore
to prevent inadvertent check-in). Use the following contents to start this file:

   ```json
    {
        "Device" : {
            "name": "WINK Thermostat.",
            "props": { 
                "id": "<device-id>", 
                "access_token": "<access-token>" 
            }
        }
    }
   ```

### 2. Modify `tests/testconfig.json` with Test Configuration
Populate <device-id> and <access-token> in `testConfig.json`. You can get these values by running
the onboarding script (see above).

### 3. Install Test Dependencies:

```bash
npm install -g typescript@beta
npm install --global ava
```

### 4. Run the tests

To run all the tests, run:

```bash
npm test
```

To run a specific test, run:

```bash
ava <test file path> <options>
```

