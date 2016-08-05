# WINK Thermostat translator

## Creating and running the wink thermostat transaltor with new design
(https://github.com/openT2T/opent2t/pull/2)

### How to run all the tests
Create  test javascript file(s) under 'tests' sub directory.

* Modify deviceconfig.js to populate <device-id> and <device-id>.
* global install typescript 2.0 
    npm install -g typescript@beta
* global install ava test runner.
    npm install --global ava
* npm install ..\..\..\Helpers\OpenT2T-Wink-Helper\js ('*required until the library is published *')
* clone https://github.com/openT2T/opent2t (in say '*c:\projects\opent2t\opent2t*')
* npm install '*c:\projects\opent2t\opent2t\node*' ('*required until opent2t libraries are published *')
* npm install
* run '*npm test*' or '*npm run test*'

 To run specific test, run 'ava <test file path> <options>'

