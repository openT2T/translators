# SmartThings Hub translator
Translator for SmartThings hub (https://smartthings.com)

## Setup Your Hardware
Follow instructions in the SmartThings app to set up your SmartThings account. This is a pre-requisite
before using this translator to interact with your hub.

## SmartApp
This SmartThings translator is impletemented based the REST API exposed by a specific SmartApp. You may copy the source code
at SmartApp.groovy under the "groovy" folder to create your matching SmartApp. Remember to replace the place holder values 
to those of your own developer account. You may search for the "PLACEHOLDER" keyword to find the values you need to replace.
Please see the README under the "groovy" folder for details.

## Installing Dependencies
To install dependencies for this translator, run:

```bash
npm install
```

## Running Test Automation
This translator comes with some automated tests. Here's how you can run them:

### 1. Run onboarding to get credentials

**Using OpenT2T CLI**

Using the opent2t-cli, following its README to setup and perform onboarding, you perform onboarding with this commmand:

```bash
node index.js -o opent2t-translator-com-smartthings-hub
```
The user will be asked for their SmartThings API key information, and will navigate to the SmartThings page to opt in to the app created above and then save the access_token to a json file.

Let's step through what's going on here. The manifest.xml for this translator documents the onboarding type
for this translator to be org.opent2t.onboarding.smartthings. This basically just describes what sort of setup, pairing or
auth information is required to interact with the device. In the case of this onboarding type, success means you get
an access token. These parameters are provided to the translator for it to work.

**Running the Unit Test**

Follow the instruction on runnning the unit test in the README for [Onboarding SmartThings](https://github.com/openT2T/onboarding/tree/master/org.opent2t.onboarding.smartthings/js/README.md#running-the-unit-test) to get the credentials to access to hub.

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
