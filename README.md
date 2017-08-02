[![Travis build status shield](https://img.shields.io/travis/cozy/cozy-konnector-libs/master.svg)](https://travis-ci.org/cozy/cozy-konnector-libs)
[![NPM release version shield](https://img.shields.io/npm/v/cozy-konnector-libs.svg)](https://www.npmjs.com/package/cozy-konnector-libs)
[![Github Release version shield](https://img.shields.io/github/tag/cozy/cozy-konnector-libs.svg)](https://github.com/cozy/cozy-konnector-libs/releases)
[![NPM Licence shield](https://img.shields.io/npm/l/cozy-konnector-libs.svg)](https://github.com/cozy/cozy-konnector-libs/blob/master/LICENSE)


[Cozy] Konnector Libs
=====================


What's Cozy?
------------

![Cozy Logo](https://cdn.rawgit.com/cozy/cozy-guidelines/master/templates/cozy_logo_small.svg)

[Cozy] is a platform that brings all your web services in the same private space.  With it, your webapps and your devices can share data easily, providing you with a new experience. You can install Cozy on your own hardware where no one's tracking you.


What's Cozy Konnector Libs?
---------------------------

This package contains all the shared libs which can help the creation of a connector and also the
cli tools to run a connector outside a cozy.

Here is the list of libs available at the moment :

- `BaseKonnector` : the class from which all the connectors must inherit
- `log` : the konnector internal logger
- `cozyClient`: this is a [cozy-client-js](https://cozy.github.io/cozy-client-js/) instance already initialized and ready to use
- `request`: this is a function which returns an instance of [request-promise](https://www.npmjs.com/package/request-promise) initialized with
defaults often used in connector development
- `retry`: this is a shortcut the the [bluebird-retry](https://www.npmjs.com/package/bluebird-retry)
- `saveFiles`: a function which saves a list files in the cozy checking already existing
  files
- `filterData`: a function which filters out already existing records according to a given list of
  keys
- `addData`: a function which creates records in the given doctype
- `linkBankOperations`: a function which adds a link to a files in a list of bank operations
- `saveBills`: a function which combines the features of `saveFiles`, `filterData`, `addData` and
  `linkBankOperations` and specialized to Bills


Please note that some permissions are required to use some of those classes:

- `io.cozy.accounts` for the `BaseKonnector` class (`GET` only)
- `io.cozy.files` to allow the connector to save files
- `io.cozy.bills` to allow the connector to save bills data in this doctype
- `io.cozy.bank.operations` for the `linkBankOperation` function

### How to use it?

We will take the example of `BaseKonnector` and `saveBills`

```javascript
const {BaseKonnector, saveBills} = require('cozy-konnector-libs')
```

You can also find a working example with the SFR mobile connector: https://github.com/cozy/cozy-konnector-sfrmobile.git

### CLI

cozy-konnector-libs also comes with some cli tools which allow to run your connector in standalone
or development mode

#### cozy-konnector-standalone

If you just want to test your connector without any cozy available. Just add the following code in
the `scripts` section of your package.json file

```javascript
  scripts: {
    standalone: "cozy-konnector-standalone"
  }
```

and run:

```sh
npm run standalone
```

The requests to the cozy-stack will be stubbed using the [./fixture.json] file as source of data
and when cozy-client-js is asked to create or update data, the data will be output to the console.
The bills (or any file) will be saved in the . directory.

#### cozy-konnector-dev

If you want to run your connector linked to a cozy-stack, even remotely. Just add the follwing code
in the `scripts` section of your package.json file:

```javascript
  scripts: {
    dev: "cozy-konnector-dev"
  }
```

and run:

```sh
npm run dev
```

This command will register your konnector as an OAuth application to the cozy-stack. By default,
the cozy-stack is supposed to be located in http://cozy.tools:8080. If this is not your case, just
update the COZY_URL field in [./konnector-dev-config.json].

After that, your konnector is running but should not work since you did not specify any credentials to
the target service. You can do this also in [./konnector-dev-config.json] in the "fields" section

The files are saved in the root directory of your cozy by default.

### Open a Pull-Request

If you want to work on Cozy Konnector Libs and submit code modifications, feel free to open pull-requests! See the [contributing guide][contribute] for more information about how to properly open pull-requests.


Community
---------

### Maintainer

The lead maintainer for Cozy Konnector Libs is [doubleface](https://github.com/doubleface), send him a :beers: to say hello!

### Get in touch

You can reach the Cozy Community by:

- Chatting with us on IRC [#cozycloud on Freenode][freenode]
- Posting on our [Forum][forum]
- Posting issues on the [Github repos][github]
- Say Hi! on [Twitter][twitter]


License
-------

Cozy Konnector Libs is developed by Cozy Cloud and distributed under the [MIT license][mit].


[cozy]: https://cozy.io "Cozy Cloud"
[mit]: LICENSE.md
[contribute]: CONTRIBUTING.md
[freenode]: http://webchat.freenode.net/?randomnick=1&channels=%23cozycloud&uio=d4
[forum]: https://forum.cozy.io/
[github]: https://github.com/cozy/
[twitter]: https://twitter.com/mycozycloud
