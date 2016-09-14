# Hue Light Translator
Translator for Hue Light (https://meethue.com)


## Installing Dependencies
To install dependencies for this translator, run:

```bash
npm install
```

## Running Test Automation
This translator comes with some automated tests. Here's how you can run them:

1. Create the `tests/testConfig.json` file
This is where you can put credentials/config to drive this test (this file is added to .gitignore
to prevent inadvertent check-in). Use the following contents to start this file:

   ```json
    {
        "Device" : {
            "name": "Hue Light.",
            "props": { 
                "access_token": "<access-token>",
                "device_type": "lights",
                "device_id": "<light-device-id>",
                "bridge_id": "<remote-bridge-id>",
                "whitelist_id": "<whitelist-id>" 
            }
        }
    }
   ```

### 2. Modify testConfig.json with Test Configuration
Populate `<whitelist_id>` ,`<bridge_id>` ,`<device_id>` and `<access_token>` in `tests/testconfig.json`. Noted that <whitelist_id> is also known as the app_username of the bridge.

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
