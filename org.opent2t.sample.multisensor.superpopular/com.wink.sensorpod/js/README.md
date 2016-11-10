# Wink Multisensor
Translator for Wink Multisensor (https://wink.com)

## Setup Your Hardware
Follow instructions in the Wink app to set up your multisensor with Wink. This is a pre-requisite
before using this translator to interact with your multisensor.

## Installing Dependencies
To install dependencies for this translator, run:

```bash
npm install
```

## Running Test Automation
This translator comes with some automated tests. Here's how you can run them:

### 1. Run onboarding to get credentials

Using the opent2t-cli, following its readme to setup and perform onboarding and enumerate devices, you perform onboarding with this commmand:

```bash
node index.js -o opent2t-translator-com-wink-hub
```
The user will be asked for their Wink credentials (plus API key information) and then save the access_token to a json file.

### 2. Create the `tests/testConfig.json` file
This is where you can put credentials/config to drive this test (this file is added to .gitignore
to prevent inadvertent check-in). Copy the generated json file as the testconfig.json.

### 3. Run the tests

To run all the tests, run:

```bash
ava test.js
```

To run a specific test, run:

```bash
ava <test file path> <options>
```