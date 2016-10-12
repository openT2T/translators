# SmartThings Hub translator
Translator for SmartThings hub (https://www.meetsmartthings.com)

## Setup Your Hardware
Follow instructions in the SmartThings app to set up your SmartThings account. This is a pre-requisite
before using this translator to interact with your hub.

## Installing Dependencies
To install dependencies for this translator, run:

```bash
npm install
```

## Running Test Automation
This translator comes with some automated tests. Here's how you can run them:

### 1. Run onboarding to get credentials

Using the opent2t-cli, following its readme to setup and perform onboarding, you perform onboarding with this commmand:

```bash
node index.js -o opent2t-translator-com-smartthings-hub
```
The user will be asked for their SmartThings API key information, and will navigate to the SmartThings page to opt in to the app created above and then save the access_token to a json file.

Let's step through what's going on here. The manifest.xml for this translator documents the onboarding type
for this translator to be org.opent2t.onboarding.smartthings. This basically just describes what sort of setup, pairing or
auth information is required to interact with the device. In the case of this onboarding type, success means you get
an access token. These parameters are provided to the translator for it to work.

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
