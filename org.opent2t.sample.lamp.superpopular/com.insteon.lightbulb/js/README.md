#Insteon Light Translator
Translator for Insteon Light (http://www.insteon.com)

## Setup Your Hardware
Follow instructions in the Insteon app to set up your light with Insteon. This is a pre-requisite
before using this translator to interact with your light.

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
node index.js -o opent2t-translator-com-insteon-hub
```
The user will be asked for their Insteon credentials (plus API key information) and then save the access_token to a json file.

### 2. Create the `tests/testConfig.json` file
This is where you can put credentials/config to drive this test (this file is added to .gitignore to prevent in advertent check-in).
Copy the generated json file as the testConfig.json.

### 3. Run the tests

To run all the tests, run:

```bash
ava test.js
```

To run a specific test, run:

```bash
ava <test file path> <options>
```