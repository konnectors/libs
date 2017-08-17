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

This package contains all the libs shared by the konnectors. Most of the previous libs in the `libs` directory of the [cozy-labs/konnectors](https://github.com/cozy-labs/konnectors) repository are ported.

Here is the list available at the moment with their equivalent in the old repository:

```
baseKonnector -> libs/base_konnector
fetcher -> libs/fetcher
filterExisting -> libs/filter_existing
linkBankOperation -> libs/link_bank_operation
naming -> libs/naming
saveDataAndFile -> libs/save_data_and_file
models.bill -> models/bill
models.file -> models/file
models.folder -> models/folder
```

Please note that some permissions are required to use some of those classes:

- `io.cozy.accounts` for the `baseKonnector` class (`GET` only)
- `io.cozy.files` for the `File` and `Folder` models
- `io.cozy.bills` for the `Bill` model
- `io.cozy.bank.operations` for the `linkBankOperation` function, and its `BankOperation` model

### How to use it?

We will take the example of `baseKonnector` and `models.bill`

```javascript
const {baseKonnector, models} = require('cozy-konnector-libs')
```

Be carefull, the name baseKonnector and models must be exactly the same as expected by cozy-konnector-libs. Another way to use it, which may be clearer:

```javascript
const konnectorLibs = require('cozy-konnector-libs')
konnectorLibs.models.file
```

You can also find a working example with the Bouygues Telecom konnector: https://github.com/cozy/cozy-konnector-bouyguestelecom.git


### About 2FA tokens

The lib contains a way to wrap common errors. Those messages and methods are located under the `errors` namespace.

If your konnector needs a 2FA token, we recommend that you call the `errors.requireTwoFactor` method in your code. This way, the stack and the Cozy-Collect app will be notified that the user needs to supply its token.

The `requireTwoFactor` method allow you to pass a JS Object as argument. This object will be serialized when the 2FA notification will be passed to the Cozy-Collect app. When your user will supply its token, this object will be deserialized and passed as regular fields to your konnector. You'll so be able to continue the auth process. Common fields that can be passed are `SESSIONID` and `_csrf` tokens.


### Open a Pull-Request

If you want to work on Cozy Konnector Libs and submit code modifications, feel free to open pull-requests! See the [contributing guide][contribute] for more information about how to properly open pull-requests.


Community
---------

### Maintainer

The lead maintainer for Cozy Konnector Libs is [doubleface](https://github.com/doubleface), send him/her a :beers: to say hello!


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
[yarn]: https://yarnpkg.com/
[mit]: LICENSE.md
[contribute]: CONTRIBUTING.md
[freenode]: http://webchat.freenode.net/?randomnick=1&channels=%23cozycloud&uio=d4
[forum]: https://forum.cozy.io/
[github]: https://github.com/cozy/
[twitter]: https://twitter.com/mycozycloud
