# SmartApp
The SmartApp for the OpenT2T SmartThings hub translator https://github.com/openT2T/translators/tree/dev/org.opent2t.sample.hub.superpopular/com.smartthings.hub/js

## Your Developer Account
Set up your developer account at  to create your SmartApp. This is a pre-requisite before using this translator to interact with your hub.

**If you do NOT have the SmartThings account**

You can register for an account by visiting https://graph.api.smartthings.com/register and access the SmartThings developer tools at https://graph.api.smartthings.com.

**If you already have the SmartThings account**

You can access your developer account at https://graph.api.smartthings.com, using the same email and password.

## Setup Your SmartApp

### 1. Create a SmartApp
1. Log into SmartThings developer portal through https://graph.api.smartthings.com and click on **My SmartApps** on the navigation bar on the top.
2. Click on the green **New SmartApp** button on the top-right corner of the page. This will bring you a new app setup page.
3. Under the **Definition** section in the **From Form** tab, fill out the information of your SmartApp.
[SmartApp Setup Form](/img/SmartAppSetup.png)
3. Scroll down to the **OAuth** section and click on the **Enable OAuth in Smart App** button.
[SmartApp Enable OAuth Button](/img/SmartAppOauthSetup1.png)
4. A new table will appaer with the OAuth information (**Client ID** and **Client Secret**) of your own app.
[SmartApp OAuth Properties](/img/SmartAppOauthSetup2.png)
5. You may fill other optional fiels like Display Name. We recommend to leave Redirect URL blank if your want it to be dynamic.
6. Click on **Create** button ar the button of the page to create your SmartApp.
[SmartApp Create Button](/img/SmartAppCreate.png)
7. You should be automatically redirected your SmartApp IDE. Please follow the next section to continue.

### 2. Get your SmartApp Definitions
1. In your SmartApp IDE, you will see some existing code including the definition of the App.
[SmartApp Definition](/img/SmartAppDefinition.png)
2. Save your SmartApp definition in separate text file.
3. Copy and paste the code from SmartApp.groovy to replace the existing code in your SmartApp IDE.
4. Replace the SmartApp definition with that of your own.

### 3. Define your notification callback URL
1. Go to `def initialize()` method, find the line that defines your notification callback URL.
```
    state.endpointURL = "<PLACEHOLDER: Your HTTP endpoint to receive udpate notification>"
``` 
2. Replace the string with the double qoutes with your notification callback URL.

### 4. Put in the display app name at the OAuth page.
1. Go to `preference` section, find the following string:
```
    "Allow <PLACEHOLDER: Your App Name> to control these things..."
``` 
2. Replace <PLACEHOLDER: Your App Name> with your SmartApp's display name.

### 5. Publish your SmartApp
1. At the top-right corner of your SmartApp IDE, you will see a **Publish** button.
2. Select **For Me** to publish your SmartApp to be used only for your account and not be visible for everyone in the SmartThings community. Please visit http://docs.smartthings.com/en/latest/getting-started/first-smartapp.html#publishing-and-installing for more information on publishing your SmartApp.

## REST APIs
This SmartApp exposes several REST APIs for you to interact with.
### List all device details
Method: `GET`

URL: `/devices`

Response:
```
  [ 
    { 
      name: 'Outlet',
      id: 'e7a7c755-647e-4b69-8853-d66af047be4c',
      deviceType: 'switch',
      attributes: 
      {
        switch: 'on', 
        power: 0, 
        checkInterval: null 
      } 
    },
    { 
      name: 'Lightbulb',
      id: '1a386dce-84f6-415a-8e5e-f547ddf41a23',
      deviceType: 'light',
      attributes:
     { 
       switch: 'off',
       level: 20,
       hue: 0,
       saturation: 0,
       color: null,
       colorTemperature: 2703,
       checkInterval: null,
       colorName: 'Soft White' 
      } 
    },
    {
      name: 'Motion Sensor',
      id: 'f3e5136a-c457-4ce0-b386-6b871643ed87',
      deviceType: 'motionSensor',
      attributes:
      {
        temperature: 24,
        battery: 100,
        motion: 'inactive',
        checkInterval: null
      } 
    }
  ]
 ``` 
### Retrieve a specific device 
Method: `GET`

URL: `/devices/<device_id>`

Response:
```
  { 
    name: 'Arrival Sensor',
    id: 'cca0aef5-1237-4994-9be4-f564c03c18r7',
    deviceType: 'presenceSensor',
    attributes: 
    { 
      battery: 50, 
      presence: 'present', 
      lqi: 100, 
      rssi: -46 
    } 
  }
```
### Update a device
Method: `PUT`

URL: `/update/<device_id>`

Body
```
  {
    "<attribute>": "<desired_value>"
  }
```
Response: No Response.

### Update notification callback 
Method: `PUT`

URL: `/subscriptionURL/<callback_url>`

Response: No Response.
