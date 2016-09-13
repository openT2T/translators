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

Using the opent2t-cli, following its readme to setup and perform onboarding and enumerate devices, you perform onboarding with this commmand:

```bash
node index.js -o opent2t-translator-com-nest-hub
```
The user will be asked for their Nest API key information, and will navigate to the Nest page to opt in to the app created above and then save the access_token to a json file.

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

