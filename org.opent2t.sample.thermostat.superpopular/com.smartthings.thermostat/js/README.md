# SmartThings Thermostat Translator
Translator for SmartThings thermostat (https://smartthings.com)

## Setup Your Hardware
Follow instructions in the SmartThings app to set up your thermostat with SmartThings. This is a pre-requisite
before using this translator to interact with your thermostat.

## Installing Dependencies
To install dependencies for this translator, run:

```bash
npm install
```

## Running Automated Unit tests
Unit tests do not require a physical or simulated device.
Once dependencies have been installed simply run:

```bash
npm run unittest
```

## Running Automated Integration tests

### 1. Run onboarding to get credentials

Using the opent2t-cli, following its readme to setup and perform onboarding and enumerate devices, you perform onboarding with this commmand:

```bash
node index.js -o opent2t-translator-com-smartthings-hub
```
The user will be asked for their SmartThings credentials (plus API key information) and then save the access_token to a json file.

### 2. Create the `tests/testConfig.json` file
This is where you can put credentials/config to drive this test (this file is added to .gitignore
to prevent inadvertent check-in). Copy the generated json blob from Step 1 to the testConfig.json file.

### 3. Run the tests

To run all the tests, run:

```bash
ava test.js
```

To run a specific test, run:

```bash
ava <test file path> <options>
```

```

