# Somfy motorized window coverings (ZWave)

Translator for the Somfy motorized window coverings : https://www.somfysystems.com/products/controls-integration/z-wave

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
  
The following hardware is required:
	1. A Somfy motorized window shade
	2. A Z-Wave to Radio Technology Somfy Interface device (https://www.somfysystems.com/products/controls-integration/z-wave -- Cat No. 1811265)
	3. A ZWave USB dongle, such as http://aeotec.com/z-wave-usb-stick

Follow the instructions with the Somfy Zwave interface device for pairing the Somfy window shade.

## Installing Dependencies
To install dependencies for this translator, run:

```bash
npm install
```

## Test Device
After everything is installed, run:

```bash
node node_modules/opent2t-onboarding-zwave/test.js -n 'Somfy' -f '^Somfy*'
```

The -f parameter is a regular expression to identify the window shade by matching its manufacturer name.

If there is an Somfy window shade nearby, you should see output similar to:

```bash
Onboarding device            : Somfy
advertisementLocalNameFilter : ^Somfy*
found peripheral: {"homeId":25478028,"nodeId":3}
Found peripheral matching filter with ID: d3026b5699424729b0910945a7761833
```

Copy the ID of the window shade that was discovered, and use that to run the translator test file:

```bash
node test -i d3026b5699424729b0910945a7761833
```

You should see the window shade move up and down. You should also see output similar to:

```bash
Initialising OpenZWave 1.4.78 binary addon for Node.JS.
        OpenZWave Security API is ENABLED
        ZWave device db    : C:/src/open-zwave/config
        User settings path : C:\src\OT2T\translators\view1\org.OpenT2T.Sample.SuperPopular.WindowTreatment\Somfy\js\node_modules\openzwave-shared\build\Release/../../
        Option Overrides : --ConsoleOutput false
connecting to COM3
close
open
close
open
```

Let's step through what's going on here. The manifest.xml for this translator documents the onboarding type
for this translator is org.OpenT2T.Onboarding.ZWave. This basically just describes what sort of setup, pairing or
auth information is required to interact with the device. In the case of this onboarding type, success means you get
an ID parameter. This parameter needs to be provided to the translator for it to work.
