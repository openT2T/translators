# Rachio Iro Smart Sprinkler

Translator for the Rachio Iro Smart Sprinkler: http://rachio.com/

## Setup Your Hardware and Rachio Account

First, you have to set up your sprinkler system (physically). If you already have an
existing old sprinkler controller, you can just replace it with the Rachio. If you don't
have an existing sprinkler system, you obviously need to get that installed first.

Once you have the Rachio set up and wired to your sprinkler system you need to create an
account with Rachio and get an access token. See instructions here on how to
get your access token (in the Authorization section): http://rachio.readme.io. This is required
to use this translator.

## Installing Dependencies
To install dependencies for this translator, run:

```bash
npm install
```

## Test Device
After everything is installed, run:

```bash
node test -a <access token>
```

You should see your sprinklers come on for 1 minute (see test script for details).
You should also see output similar to:

```bash
Javascript initialized.
  device.name          : Rachio Iro Sprinkler
  device.props         :  { "token": "<access token>" }
Discovered device Id: 012374c6-513b-125f-1234-e53034580eae
Discovered zone Id: e9022d4f-ed13-4d48-952c-bc1fd5d83f5f
start called for duration: 60
stop called
```
