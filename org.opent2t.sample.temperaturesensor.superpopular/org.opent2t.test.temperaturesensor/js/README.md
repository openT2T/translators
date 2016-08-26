# Test Temperature Sensor Translator

> <b>Note</b>: This translator is only for testing, and does not correspond to any real device. It just does
> some console logging.


## Installing Dependencies
To install dependencies for this translator, run:

```bash
npm install
```

## Running Test Automation
This translator comes with some automated tests. Here's how you can run them:

### 1. Understand the Structure of the Translator
Let's step through what's going on here. The manifest.xml for this translator documents the onboarding type
for this translator is org.opent2t.onboarding.manual. This basically just describes what sort of setup, pairing or
auth information is required to interact with the device. In the case of this onboarding type, success means you get
a token parameter. This parameter is provided to the translator for it to work.

### 2. Create the `tests/testConfig.json` file
This is where you can put credentials/config to drive this test (this file is added to .gitignore
to prevent inadvertent check-in). Use the following contents to start this file:

   ```json
    {
        "Device": {
            "name": "Test Temperature Sensor.",
            "props": {
                "token": "some_test_token"
            }
        }
    }
   ```

> **Note:** This is a test translator and it does not actually use the token so you can specify whatever you
wish for that.

### 3. Install Test Dependencies:

```bash
npm install -g ava
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

