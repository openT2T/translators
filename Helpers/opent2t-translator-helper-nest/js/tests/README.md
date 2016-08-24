# Running Tests

## 1. Create the `testConfig.json` file
This is where you can put credentials/config to drive this test (this file is added to .gitignore
to prevent inadvertent check-in). Use the following contents to start this file:

   ```json
    {
        "accessToken": "<access_token>",
        "deviceType": "<device type, e.g. thermostats>",
        "deviceId": "<device_id>"
    }
   ```

## 2. Modify `testConfig.json` with Test Configuration
Populate `<device_id>` and `<access_token>` in `testconfig.json`. You can get these values by running
onboarding. You also need to specify `deviceType` which identifies the type of device at the given `device_id`.

## 3. Run Tests

```bash
node test
```