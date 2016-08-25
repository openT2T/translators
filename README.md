# Introduction
Repository for Open Translators to Things. Grouped by translators written for specific schemas. The schema names are uniquely namespaced.
The translator name is a unique string identifying a Thing.

This README will help get you started developing in this repo.

## Install Tools

Get your dev environment set up (PC or Mac):
* [Install Git](http://git-scm.com/downloads)
* [Install Node](https://nodejs.org/en/download/)
* Choose your favorite IDE, e.g. [Visual Studio Code](https://code.visualstudio.com/).

## Get the Source

Next, clone this repo to your local machine to get started. Navigate to the directory where you want to clone the repo
to locally, then run:

```bash
git clone https://github.com/openT2T/translators.git
```

## Create a New Translator

Follow our getting started guide at http://www.opentranslatorstothings.org.

## Create a Pull Request
Made any changes we should consider? Send us a pull request! Check out [this article](https://help.github.com/articles/creating-a-pull-request/)
on how to get started.

## Publish a Translator Package to NPM

A translator package includes one thing translator along with all the schemas
it references. Because those are not organized in the way `npm publish`
expects, the process of publishing a translator package uses a script from
the CLI repo.

1. Update the `version` property in the package.json file in the translator
directory. (Of cource any other metadata may be updated also, but a version
bump is required when publishing to npm, since you may not re-publish over an
existing version.)

2. Clone the CLI repo (or sync it as needed), and install its dependencies:

```
cd ..
git clone https://github.com/opent2t/cli
npm install
cd ../translators
```

3. Use the script to generate a package.json for the translator to be
published. Note the last parameter is a simple name of a translator,
not a directory path, which would include a schema name.

```
node ../cli/pack-translator.js com.wink.thermostat
```

4. Edit the package.json to include directories for referenced schemas in the
`files` collection at the end. Lines will include at least `"oic.core"` and
`"oic.baseresource"`; possibly others if the OCF schema .json file has `$ref`
references to others. ([Eventually the pack-translator.js script should add
these lines automatically.](https://github.com/openT2T/opent2t-cli/issues/7))

5. Ensure you're logged in to NPM under the **opent2t** account:

```
npm login
Username: opent2t
Password: *********
```

6. Publish the package to NPM:
```
npm publish
```


## Code of Conduct
This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
