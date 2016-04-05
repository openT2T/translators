# Test Thermostat Translator

> <b>Note</b>: This translator is only for testing, and does not correspond to any real device. It just does
> some console logging.

To install dependencies for this translator, run:

```bash
npm install
```

After dependencies are installed, you can run this translator with some test onboarding data:

```bash
node test -t abc
```

You should see output that looks like:

```bash
Javascript initialized.
  device.name          : Test
  device.props         :  { "id": "abc" }
getCurrentTemperature called.
returning random temperature: 70
getTemperatureTrend called.
returning random temperature trend: -0.23426573426573427
disconnect called.
  device.name          : Test
  device.props         :  { "id": "abc" }
```

Let's step through what's going on here. The manifest.xml for this translator documents the onboarding type
for this translator is org.OpenT2T.Onboarding.Manual. This basically just describes what sort of setup, pairing or
auth information is required to interact with the device. In the case of this onboarding type, success means you get
a token parameter. This token parameter needs to be provided to the translator for it to work.
