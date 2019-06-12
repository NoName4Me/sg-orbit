# Maintainers

EX doc: https://frint.js.org/docs/contributing/maintainers/

## Lerna

We use Lerna for managing our mono-repo. All our packages can be found in packages directory excepting the websites.

### yarn

yarn natively support mono-repo with the "workspace" feature. When Lerna is configured to use yarn it delegate all the packages installation and dependencies linking to yarn which result in an increase of performance and less bugs. The native integration between Lerna and yarn make it worthwill to switch from NPM to yarn for this repository.

yarn also natively support packages hoisting which results in less disk space consuption and faster installation.

## Installation

This repository use yarn workspace. Therefore, you must install yarn:

`choco install yarn` or `choco update yarn` to get the latest version.

For more options to install yarn, view https://yarnpkg.com/lang/en/docs/install/#windows-stable.

To install the packages and link all the workspace dependencies:

`yarn install`

## Add new packages

To install a new package:

`yarn ` will install the packages in every projects of the workspace.

## Add a yarn scripts

Think of scripts as atomic script. It means that a script should only do one thing, then you can have other scripts than compose those scripts.

Example:

Instead of doing

```
"scripts": {
    "build": rimraf dist && babel src -d dist 
}
```

Do

```
"scripts": {
    "build": "yarn delete && yarn transpile",
    "delete": "rimraf dist",
    "transpile": "babel src -d dist"
}
```

Every scripts should be executable from the root of the workspace. Make sure you add a script entry in the package.json located at the root event if your script is already define in a sub-project.

Every "Lerna" related scripts should be added in the the root package.json since Lerna is installed at the root of the workspace.

For example, take the react-components project, since we execute a babel compilation for all the individual components, we must define a `lerna exec` command, to call the babel CLI, therefore, we added this script in the root package.json

You can have scripts in sub project. Again, take the react-components project. A script is define in the actual project to start storybook since the workspace doesn't know about storybook, this is a dependency of react-components not of the whole workspace. Therefore, the scripts is define in the react-components project and a script entry has been added to the root package.json to call the script in the sub project.




