[![Travis build status shield](https://img.shields.io/travis/konnectors/libs/master.svg)](https://travis-ci.org/konnectors/libs)
[![NPM Licence shield](https://img.shields.io/npm/l/cozy-konnector-libs.svg)](https://github.com/konnectors/libs/blob/master/LICENSE)

| cozy-konnector-libs | cozy-jobs-cli | cozy-logger | renovate-config-cozy-konnector |
|---|---|---|---|
| [![NPM release cozy-konnector-libs](https://img.shields.io/npm/v/cozy-konnector-libs.svg)](https://www.npmjs.com/package/cozy-konnector-libs) | [![NPM release cozy-jobs-cli](https://img.shields.io/npm/v/cozy-jobs-cli.svg)](https://www.npmjs.com/package/cozy-jobs-cli) | [![NPM release cozy-logger](https://img.shields.io/npm/v/cozy-logger.svg)](https://www.npmjs.com/package/cozy-logger) | [![NPM release renovate-config-cozy-konnector](https://img.shields.io/npm/v/renovate-config-cozy-konnector.svg)](https://www.npmjs.com/package/renovate-config-cozy-konnector) |


[Cozy] Konnector monorepo
=====================

This package contains all the shared libs which can help the creation of a connector and also the CLI tools to run a connector outside a cozy.

1. View the [interactive tutorial](https://tech.io/playgrounds/1482/cozy-connector-tutorial/save-cats).

2. Check out [SFR mobile connector](https://github.com/cozy/cozy-konnector-sfrmobile.git) for a real life konnector

3. Read the docs

  * [API](packages/cozy-konnector-libs/docs/api.md)
  * [CLI](packages/cozy-konnector-libs/docs/cli.md)

4. Read the list of [existing connectors](packages/cozy-konnector-libs/konnectors.md)

### Contributing

If you want to work on Cozy Konnector Libs and submit code modifications, feel free to open pull-requests! See the [contributing guide][contribute] for more information about how to properly open pull-requests.

#### Lerna

This repository is organized as a [lerna] monorepo. It facilitates developing
focused packages that rely on each other.

* `cozy-konnector-libs` has tools to scrape and save data to your cozy
* `cozy-jobs-cli` lets your run a konnector/service while being authenticated to a cozy
* `cozy-logger` logs message in a human friendly way while developing and logs in JSON when in production. It can be used by konnector and services alike.
* `renovate-config-cozy-konnector` is the [Renovate preset] for cozy konnectors.

To start developing :

```
$ git clone git@github.com:konnectors/libs.git cozy-konnector-libs
$ cd cozy-konnector-libs
$ yarn
$ yarn bootstrap # executes lerna under the hood and symlinks repositories
```

To publish a new version, those are the commands that can be used :

```
$ lerna updated # check if some packages need to be published
$ lerna publish # publish all packages in interactive mode, will ask for patch/minor/major
$ lerna publish --scope cozy-konnector-libs # only publish cozy-konnector-libs
$ lerna publish --scope cozy-konnector-libs --npm-tag next # use the npm dist tag next
```

Useful documentation : https://github.com/lerna/lerna#publish

### What's Cozy?

![Cozy Logo](https://cdn.rawgit.com/cozy/cozy-guidelines/master/templates/cozy_logo_small.svg)

[Cozy] is a platform that brings all your web services in the same private space.  With it, your webapps and your devices can share data easily, providing you with a new experience. You can install Cozy on your own hardware where no one's tracking you.

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
[twitter]: https://twitter.com/cozycloud
[lerna]: https://lernajs.io
[Renovate preset]: https://renovateapp.com/docs/configuration-reference/config-presets
