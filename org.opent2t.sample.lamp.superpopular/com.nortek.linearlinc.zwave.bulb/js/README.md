# LinearLinc Bulbz

Translator for Z-Wave light bulb from LinearLinc.

Product web page: [http://www.gocontrol.com/detail.php?productId=7](http://www.gocontrol.com/detail.php?productId=7 "http://www.gocontrol.com/detail.php?productId=7")

## Setup Your Hardware

This translator depends on the openzwave-shared node package. 

For non-Windows platforms, follow the instructions for your platform from this site: [https://github.com/OpenZWave/node-openzwave-shared] 

For Windows do the following:
  1. npm install openzwave-shared  (this will fail)
  1. install open-zwave (https://github.com/OpenZWave/open-zwave)
  2. modify bynding.gyp to point to the openzwave source. For instance:
			['OS=="win"', {
				"variables": {
					"OZW_HOME": "C:/src/open-zwave"
				},
				"include_dirs": [
					"<!(node -e \"require('nan')\")",
					"<(OZW_HOME)/cpp/src",
					"<(OZW_HOME)/cpp/src/value_classes"
				],
				"defines": [
					"OPENZWAVE_ETC=<(OZW_HOME)/config",
					"OPENZWAVE_SECURITY=1"
				],
				'msvs_settings': {
					'VCLinkerTool': {
						'AdditionalDependencies': ['setupapi.lib', '<(OZW_HOME)/cpp/build/windows/vs2010/x64/Release/OpenZWave.lib']
					}
				}
			}]
  3. Build the zwave VS2010 project in cpp\build\windows\vs2010. Select the x64\Release target.
  4. Rebuild the openzwave-shared node module
  
Follow the instructions with the LinearLinc Bulbz device for pairing the light to your Z-Wave stick.

## Installing Dependencies
To install dependencies for this translator, run:

```bash
npm install
```

## Test Device
After everything is installed, run:

```bash
node node_modules/opent2t-onboarding-zwave/test.js -n "LinearLinc" -f "^Linear*"
```

The -f parameter is a regular expression to identify this device type by matching its ID field name. In this case, we are looking
for Linear.

If there is an Linear device nearby, you should see output similar to:

```bash
Onboarding device  : LinearLinc Bulbz
advertisementLocalNameFilter : ^Linear*
found peripheral: {"homeId":25478028,"nodeId":3}

Copy the ID of the device that was discovered, and use that to run the translator test file:

```bash
node test -c COM3 -a "{\"homeId\":25478028,\"nodeId\":3}"
```

If the device is on and connected to the Z-Wave hub, you should see it turn on/off and change brightness per
the commands in the test file. You should also see output similar to:

```bash
Initialising OpenZWave 1.4.78 binary addon for Node.JS.
        OpenZWave Security API is ENABLED
        ZWave device db    : C:/src/open-zwave/config
        User settings path : C:\src\OT2T\translators\view1\org.opent2t.sample.lamp.superpopular\LinearLinc Bulbz\js\node_modules\openzwave-shared\build\Release/../../
        Option Overrides : --ConsoleOutput false
connecting to \\.\COM3
turnOn called.
setBrightness called with value: 10
turnOff called.
disconnect called.
```

Let's step through what's going on here. The manifest.xml for this translator documents the onboarding type
for this translator is org.opent2t.onboarding.zwave. This basically just describes what sort of setup, pairing or
auth information is required to interact with the device. In the case of this onboarding type, success means you get
an ID parameter. This parameter needs to be provided to the translator for it to work.
