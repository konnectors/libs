# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.23.0](https://github.com/konnectors/libs/compare/cozy-clisk@0.22.3...cozy-clisk@0.23.0) (2023-08-28)


### Features

* Allow launcher to fetch debug data from the worker ([2675c28](https://github.com/konnectors/libs/commit/2675c289e30ce410917cee39f1344f594a773daf))





## [0.22.3](https://github.com/konnectors/libs/compare/cozy-clisk@0.22.2...cozy-clisk@0.22.3) (2023-08-25)


### Bug Fixes

* Remove allowed log level check ([6bc33e6](https://github.com/konnectors/libs/commit/6bc33e61f59198781be82ab840764bfa1639b64b))





## [0.22.2](https://github.com/konnectors/libs/compare/cozy-clisk@0.22.1...cozy-clisk@0.22.2) (2023-08-21)


### Bug Fixes

* Regression on regular file download ([f4cce5d](https://github.com/konnectors/libs/commit/f4cce5d9a86a907f0c308e9443fe7a8e966820e8))





## [0.22.1](https://github.com/konnectors/libs/compare/cozy-clisk@0.22.0...cozy-clisk@0.22.1) (2023-08-04)


### Bug Fixes

* Add specfic error message when file is empty in saveFiles ([2268e00](https://github.com/konnectors/libs/commit/2268e0069d778e419cf5fd8ebaae819283bf0f00))
* SaveFiles now converts entries with dataUri to ArrayBuffer ([a261b80](https://github.com/konnectors/libs/commit/a261b80ccd7ee8e6cf506e5a3e6835f86936aac4))





# [0.22.0](https://github.com/konnectors/libs/compare/cozy-clisk@0.21.1...cozy-clisk@0.22.0) (2023-07-31)


### Features

* **clisk:** Force log timestamp to milliseconds ([9bca920](https://github.com/konnectors/libs/commit/9bca9204c1a1a7aec11929a5d866fc2749467ee2))





## [0.21.1](https://github.com/konnectors/libs/compare/cozy-clisk@0.21.0...cozy-clisk@0.21.1) (2023-07-28)


### Bug Fixes

* Declare waitForNotAuthenticated ([7c035d7](https://github.com/konnectors/libs/commit/7c035d7b670999fcd2a09f25c1ce26664c9dab7e))
* Default value for waitForAuthenticated* methods ([c85b8ba](https://github.com/konnectors/libs/commit/c85b8bae944876f2f614197a99f1362ced3ea0c4))
* waitForNotAuthenticated result ([835e139](https://github.com/konnectors/libs/commit/835e139bf02a24be71cb1338735a826f75c87197))





# [0.21.0](https://github.com/konnectors/libs/compare/cozy-clisk@0.20.3...cozy-clisk@0.21.0) (2023-07-28)


### Features

* Add waitForNotAuthenticated shortcut method to ContentScript ([58efb8d](https://github.com/konnectors/libs/commit/58efb8de025d66a82517f12300e00d012acd2012))





## [0.20.3](https://github.com/konnectors/libs/compare/cozy-clisk@0.20.2...cozy-clisk@0.20.3) (2023-07-25)


### Bug Fixes

* Do not send page message on ContentScript file import ([dc76c78](https://github.com/konnectors/libs/commit/dc76c7819747f472ae62f7057d51199fa778b6df))





## [0.20.2](https://github.com/konnectors/libs/compare/cozy-clisk@0.20.1...cozy-clisk@0.20.2) (2023-07-05)


### Bug Fixes

* Duplicated identities ([5039e4e](https://github.com/konnectors/libs/commit/5039e4e63b1db8bbf8bde6924761e43bb654c431))





## [0.20.1](https://github.com/konnectors/libs/compare/cozy-clisk@0.20.0...cozy-clisk@0.20.1) (2023-07-05)

**Note:** Version bump only for package cozy-clisk





# [0.20.0](https://github.com/konnectors/libs/compare/cozy-clisk@0.19.0...cozy-clisk@0.20.0) (2023-07-04)


### Features

* Add blockWorkerInteractions command in content script ([b082997](https://github.com/konnectors/libs/commit/b082997b04182a609141285470a6863eba20d311))
* Add queryAll method to content script ([5436082](https://github.com/konnectors/libs/commit/5436082e18648eac20301ab0c496a173f2a912ed))





# [0.19.0](https://github.com/konnectors/libs/compare/cozy-clisk@0.18.0...cozy-clisk@0.19.0) (2023-06-30)


### Features

* Add sourceAccountIdentifer in addData ([6e905c0](https://github.com/konnectors/libs/commit/6e905c049c5c0689d2e3aa870406e68e7a2c533a))





# [0.18.0](https://github.com/konnectors/libs/compare/cozy-clisk@0.17.0...cozy-clisk@0.18.0) (2023-06-29)


### Features

* Add a onWorkerReady callback to the content script ([2d94b0e](https://github.com/konnectors/libs/commit/2d94b0ef7d5a57f98477719e2934d2e6a1c274a9))





# [0.17.0](https://github.com/konnectors/libs/compare/cozy-clisk@0.16.1...cozy-clisk@0.17.0) (2023-06-28)


### Features

* Add evaluateInWorker method ([5ce1d6e](https://github.com/konnectors/libs/commit/5ce1d6e9d47f011edd43b5bb9d2f0d362f55b5b6))





## [0.16.1](https://github.com/konnectors/libs/compare/cozy-clisk@0.16.0...cozy-clisk@0.16.1) (2023-06-26)


### Bug Fixes

* Enhance timeout error message in waitForAuthenticated ([0a96f0b](https://github.com/konnectors/libs/commit/0a96f0bbece6963103b93bc319e6ed52c10566bd))





# [0.16.0](https://github.com/konnectors/libs/compare/cozy-clisk@0.15.0...cozy-clisk@0.16.0) (2023-06-23)


### Features

* Allow waitForElementInWorker to set its own timeout ([0e8fbda](https://github.com/konnectors/libs/commit/0e8fbdaca635c6c33ae9ade6fc4dbbbe07986551))





# [0.15.0](https://github.com/konnectors/libs/compare/cozy-clisk@0.14.1...cozy-clisk@0.15.0) (2023-06-23)


### Features

* Add qualification label handling ([90916e3](https://github.com/konnectors/libs/commit/90916e388129d9d2bfcd4548f35e6a500fa09b07))
* Be more restrictive on mandatory fields ([3a21067](https://github.com/konnectors/libs/commit/3a2106751e84fb03722011aab8350ef09d7c40eb))
* Download files progressively only when needed ([238b1f0](https://github.com/konnectors/libs/commit/238b1f0f5cc72dc1c4df9e808b99ac4e321447c9))


### BREAKING CHANGES

* Metadata attributes are now mandatory

File metadata attributes were not mandatory to allow progressive
migration to file metadata deduplication for node konnector.

Here all clisk konnectors use metadata deduplication. I think it is
better to remove this unneeded complexity in the code

Now we throw an error directly if any metadata attributes are missing.





## [0.14.1](https://github.com/konnectors/libs/compare/cozy-clisk@0.14.0...cozy-clisk@0.14.1) (2023-06-09)


### Bug Fixes

* Add forgotten declaration for checkForElement ([82f92c6](https://github.com/konnectors/libs/commit/82f92c62755753e6de91b9c329b97e1f05137b68))





# [0.14.0](https://github.com/konnectors/libs/compare/cozy-clisk@0.13.0...cozy-clisk@0.14.0) (2023-06-09)


### Features

* Add a function to check if element is present in the worker ([f90e787](https://github.com/konnectors/libs/commit/f90e78795a7a28244e4ad3b4d7bf5870f642192b))





# [0.13.0](https://github.com/konnectors/libs/compare/cozy-clisk@0.12.2...cozy-clisk@0.13.0) (2023-06-01)


### Features

* Handle sub path in launcher saveFiles ([0b47e17](https://github.com/konnectors/libs/commit/0b47e173544c4c3edb519fa659a78d217a794383))





## [0.12.2](https://github.com/konnectors/libs/compare/cozy-clisk@0.12.1...cozy-clisk@0.12.2) (2023-05-23)


### Bug Fixes

* Deduplicate identities on createdByApp ([f9d8fbe](https://github.com/konnectors/libs/commit/f9d8fbec5736ae4f14144c2fdb213f6953ecfe63))





## [0.12.1](https://github.com/konnectors/libs/compare/cozy-clisk@0.12.0...cozy-clisk@0.12.1) (2023-04-24)


### Bug Fixes

* **deps:** pin dependencies ([dee699e](https://github.com/konnectors/libs/commit/dee699e0b532447c68f986997a6668bdee8be659))





# [0.12.0](https://github.com/konnectors/libs/compare/cozy-clisk@0.11.0...cozy-clisk@0.12.0) (2023-04-24)


### Bug Fixes

* ignore p-timeout and p-wait-for in jest transforms ([4db2b09](https://github.com/konnectors/libs/commit/4db2b091e6f828faf22b59cc6088e0f30e867106))


### Features

* Enhance timeout error messages ([00e7b7b](https://github.com/konnectors/libs/commit/00e7b7b76bd7742f742d0dbf0f8e763843479b51))





# [0.11.0](https://github.com/konnectors/libs/compare/cozy-clisk@0.10.0...cozy-clisk@0.11.0) (2023-03-28)


### Features

* Add getCliskVersion method ([5f39898](https://github.com/konnectors/libs/commit/5f398989a487525413659e80807b75f12b6aa4f6))





# [0.10.0](https://github.com/konnectors/libs/compare/cozy-clisk@0.9.4...cozy-clisk@0.10.0) (2023-03-22)


### Bug Fixes

* Lint warning ([d8db88d](https://github.com/konnectors/libs/commit/d8db88d17c851685ba58a59832df2c3dbf55b3f5))


### Features

* Add ensureNotAuthenticated method ([f9ffdd9](https://github.com/konnectors/libs/commit/f9ffdd95d7552d4317f2f147767e6294500d4638))





## [0.9.4](https://github.com/konnectors/libs/compare/cozy-clisk@0.9.3...cozy-clisk@0.9.4) (2023-03-21)


### Bug Fixes

* Not intercepted worker errors ([1182a96](https://github.com/konnectors/libs/commit/1182a96bda4bf157a326ea779ff2ab5f8da3c2f5))





## [0.9.3](https://github.com/konnectors/libs/compare/cozy-clisk@0.9.2...cozy-clisk@0.9.3) (2023-03-21)


### Bug Fixes

* **clisk:** Fix deduplication on metadata ([f454d26](https://github.com/konnectors/libs/commit/f454d26ec08118f05c3c7088e4788795a5363ea1))





## [0.9.2](https://github.com/konnectors/libs/compare/cozy-clisk@0.9.1...cozy-clisk@0.9.2) (2023-03-16)


### Bug Fixes

* Remove cozy-client-js dependency in cozy-clisk ([cfc9a77](https://github.com/konnectors/libs/commit/cfc9a77072c537b6176ddaa21396dee3b76b48a6))





## [0.9.1](https://github.com/konnectors/libs/compare/cozy-clisk@0.9.0...cozy-clisk@0.9.1) (2023-03-16)


### Bug Fixes

* Allows cozy-clisk to be embedded in other envs (react-native, jest) ([a22d045](https://github.com/konnectors/libs/commit/a22d045e3e877d0fd840c31041389586dd5c369c))





# [0.9.0](https://github.com/konnectors/libs/compare/cozy-clisk@0.8.1...cozy-clisk@0.9.0) (2023-03-16)


### Bug Fixes

* Change some logs from info to debug ([920aaed](https://github.com/konnectors/libs/commit/920aaed1620ffff0b1702d186a40ff83e306a61d))


### Features

* Add wrapTimer function ([8155ef7](https://github.com/konnectors/libs/commit/8155ef7fcbd6894cf127100ec8a8dc7c21f4f71a))
* Send more page events to the launcher ([9b4b44c](https://github.com/konnectors/libs/commit/9b4b44cdc5ff6afdea0bde8f9d04a1d1bade5e62))
* Wrap ContentScript methods with wrapTimer ([3331647](https://github.com/konnectors/libs/commit/33316473f021443ad5564f5db645d625341e02f7))





## [0.8.1](https://github.com/konnectors/libs/compare/cozy-clisk@0.8.0...cozy-clisk@0.8.1) (2023-03-16)


### Bug Fixes

* Babel transpilation ([951fcad](https://github.com/konnectors/libs/commit/951fcad16fa81c75ea826ac2171432e340572647))





# [0.8.0](https://github.com/konnectors/libs/compare/cozy-clisk@0.7.1...cozy-clisk@0.8.0) (2023-03-09)


### Bug Fixes

* Fix some JSdoc ([319b163](https://github.com/konnectors/libs/commit/319b163daad6cca5a7eba250a799b4c10a25f652))


### Features

* Implement downloadFileInWorker and remove filtering logic ([836cdf7](https://github.com/konnectors/libs/commit/836cdf737bf25ab373f283dce3ff6caabe444626))





## [0.7.1](https://github.com/konnectors/libs/compare/cozy-clisk@0.7.0...cozy-clisk@0.7.1) (2023-02-23)


### Bug Fixes

* convert date string to date object in saveBills ([af08200](https://github.com/konnectors/libs/commit/af0820051a5dddf5ea8d9d26fd5a5345ad61cbad))





# [0.7.0](https://github.com/konnectors/libs/compare/cozy-clisk@0.6.0...cozy-clisk@0.7.0) (2023-02-14)


### Bug Fixes

* Make option.args optionnal in runInWorkerUntilTrue ([bb9c4cd](https://github.com/konnectors/libs/commit/bb9c4cdf5d2d138ff27ad084a1de946d44b5bd24))


### Features

* **cozy-clisk:** Add a single entry point ([ce3c1ad](https://github.com/konnectors/libs/commit/ce3c1ad70ab567fa59c66ea7b105b017bd135c1a))


### BREAKING CHANGES

* **cozy-clisk:** In konnector import from 'cozy-clisk/contentscript' should be replace to 'cozy-clisk'





# [0.6.0](https://github.com/konnectors/libs/compare/cozy-clisk@0.5.0...cozy-clisk@0.6.0) (2023-02-10)


### Bug Fixes

* Replace import for JSDoc ([97b60d1](https://github.com/konnectors/libs/commit/97b60d1adf5eef38fbbb34a15741272f1125ba61))


### Features

* Add typescript to devDep ([78b1a8f](https://github.com/konnectors/libs/commit/78b1a8f5bce297012312bf2ac234e4c2f21ac04b))





# [0.5.0](https://github.com/konnectors/libs/compare/cozy-clisk@0.4.1...cozy-clisk@0.5.0) (2023-02-07)


### Features

* Adding log level to the log function in ContentScript ([7b59fca](https://github.com/konnectors/libs/commit/7b59fcaf2a9e246ca0a5ab22300006d7a85950ee))


### BREAKING CHANGES

* All logs with only one argument in connectors will be silent





## [0.4.1](https://github.com/konnectors/libs/compare/cozy-clisk@0.4.0...cozy-clisk@0.4.1) (2023-02-06)


### Bug Fixes

* expose different entry points as documented ([2de975b](https://github.com/konnectors/libs/commit/2de975be091e50e4c3556df58fb3d13dbfcbf180))
* publish built version of cozy-ccc-libs ([6a93784](https://github.com/konnectors/libs/commit/6a93784c9efc3dc7c5627a032658a7846dfc3392))





# 0.4.0 (2023-02-03)


### Features

* Rename clisk to cozy-clisk ([4bd7edf](https://github.com/konnectors/libs/commit/4bd7edf6462ed759b37ee73a0db6bdf309dbe7b9))





# 0.3.0 (2023-02-03)


### Features

* Rename cozy-ccc-libs to clisk ([89a724d](https://github.com/konnectors/libs/commit/89a724d27d701ba7fdd320a11794179dd98c869a))





## [0.2.1](https://github.com/konnectors/libs/compare/cozy-ccc-libs@0.2.0...cozy-ccc-libs@0.2.1) (2023-02-03)

**Note:** Version bump only for package cozy-ccc-libs





# 0.2.0 (2023-01-23)


### Bug Fixes

* auto fixable lints ([1e87a35](https://github.com/konnectors/libs/commit/1e87a356b7e2100568a2b9361e72eeca1425b87c))
* lint + ts-check ([869d0cf](https://github.com/konnectors/libs/commit/869d0cfb4be815f98b87a524cf9a06999996785c))


### Features

* Build package with babel ([1754662](https://github.com/konnectors/libs/commit/1754662e0fd403e1abf95ff4354dab8bfacda324))
* copy from flagship application + package init ([72502ec](https://github.com/konnectors/libs/commit/72502ec55a9d26f091531348245276010d7092b3))
* Make unit tests runnable ([5b98643](https://github.com/konnectors/libs/commit/5b98643b859577104d4d9f938223a96e83e365e8))
* Place contentscript, launcher and bridge libs at the same level ([1716c1f](https://github.com/konnectors/libs/commit/1716c1fcfc6c7a895ef97ae47f7fd4e130c939d2))
* Remove kyScraper ([bd9d6ff](https://github.com/konnectors/libs/commit/bd9d6ffa7950793bfea3f5ea9d087634f52cf5dd))
