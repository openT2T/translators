# SmartThings Binary Switch Translator
Translator for SmartThings Binary Switch (https://smartthings.com)

## Setup Your Hardware
Follow instructions in the SmartThings app to set up your binary switch with SmartThings. This is a pre-requisite
before using this translator to interact with your binary switch.

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
This translator comes with some automated tests. Here's how you can run them:

### 1. Run onboarding to get credentials

**Using OpenT2T CLI**
Using the opent2t-cli, following its readme to setup and perform onboarding and enumerate devices, you perform onboarding with this commmand:

```bash
node index.js -o opent2t-translator-com-smartthings-hub
```
The user will be asked for their SmartThings credentials (plus API key information) and then save the access_token to a json file.

**Running the Unit Test**
Follow the instructon to run the unit test in the README for [Onboarding SmartThings](https://github.com/openT2T/onboarding/tree/master/org.opent2t.onboarding.smartthings/js/README.md#running-the-unit-test) to get the credentials to access to hub.

### 2. Create the `tests/testConfig.json` file
This is where you can put credentials/config to drive this test (this file is added to .gitignore
to prevent inadvertent check-in). Copy the generated json file as the testConfig.json.

### 3. Run the tests

To run all the tests, run:

```bash
ava test.js
```

To run a specific test, run:

```bash
ava <test file path> <options>
```