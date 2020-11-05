# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [4.36.0](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.35.0...cozy-konnector-libs@4.36.0) (2020-11-05)


### Bug Fixes

* avoid date-fns error when built with webpack ([112d82b](https://github.com/cozy/cozy-konnector-libs/commit/112d82b3a8acc1bc6c20bddb627e15a97412fc1f))


### Features

* upgrade cozy-client to 16.1.1 for security warnings ([e29c75e](https://github.com/cozy/cozy-konnector-libs/commit/e29c75e8e807bbd029980f3d2afa1184ea48bd0f))
* upgrade cozy-doctypes ([98c569c](https://github.com/cozy/cozy-konnector-libs/commit/98c569c2ed0140c90b841177ef7cb4b8dd04a794))





# [4.35.0](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.34.5...cozy-konnector-libs@4.35.0) (2020-10-22)


### Features

* **solveCaptcha:** add hcaptcha solving ([70ea67c](https://github.com/cozy/cozy-konnector-libs/commit/70ea67ce62e927a114c39a0fc5a5a1884a42bb01))





## [4.34.5](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.34.4...cozy-konnector-libs@4.34.5) (2020-07-16)


### Bug Fixes

* regressions after upgrade of date-fns to version 2 ([c5cc903](https://github.com/cozy/cozy-konnector-libs/commit/c5cc9033366b5889e4fdf9f7ea6ff8415c613351))





## [4.34.4](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.34.3...cozy-konnector-libs@4.34.4) (2020-05-29)


### Bug Fixes

* **cozy-client-js-stub:** get proper file size for a filestream ([ea08a65](https://github.com/cozy/cozy-konnector-libs/commit/ea08a65ac5e2150c441a4cd79aba1f3ffd1c9042))
* **saveBills:** do not try to clone a filestream ([08eba00](https://github.com/cozy/cozy-konnector-libs/commit/08eba00d52132bc2db6e0927084eb5382c65ba29))
* Do not register client in library ([e8d1d9a](https://github.com/cozy/cozy-konnector-libs/commit/e8d1d9a5002a4305dffb361f3c36a2e97a83e8f7))





## [4.34.3](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.34.2...cozy-konnector-libs@4.34.3) (2020-05-14)


### Bug Fixes

* Window issue on fetch ([d7d8ca1](https://github.com/cozy/cozy-konnector-libs/commit/d7d8ca1e6dacda18ec4981b0de085fbc21e845fd))





## [4.34.2](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.34.0...cozy-konnector-libs@4.34.2) (2020-04-28)


### Bug Fixes

* cozy-client-js-stub file encoding ([9accd04](https://github.com/cozy/cozy-konnector-libs/commit/9accd0424322787a0fc63cf6459707551a3187d3))





## [4.34.1](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.34.0...cozy-konnector-libs@4.34.1) (2020-04-28)


### Bug Fixes

* cozy-client-js-stub file encoding ([9accd04](https://github.com/cozy/cozy-konnector-libs/commit/9accd0424322787a0fc63cf6459707551a3187d3))





# [4.34.0](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.33.0...cozy-konnector-libs@4.34.0) (2020-03-17)


### Bug Fixes

* **request:** allow to override user agent in cheerio mode ([fd0e737](https://github.com/cozy/cozy-konnector-libs/commit/fd0e737a9b591f66fd98396121d26ed95f403e20))


### Features

* now use cozy-client's createClientInteractive ([6d46874](https://github.com/cozy/cozy-konnector-libs/commit/6d46874c62d5c871bb2616314d51ec7d2b09a929))
* use more explicit time notation ([3715afd](https://github.com/cozy/cozy-konnector-libs/commit/3715afd5e4151792b686e809ed788b8732e5f7f8))





# [4.33.0](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.32.5...cozy-konnector-libs@4.33.0) (2020-02-20)


### Bug Fixes

* avoid pdfjs warning on bad api usage ([1de4561](https://github.com/cozy/cozy-konnector-libs/commit/1de4561d7b158a6d9a8cc318639ab4cd488f9859))


### Features

* **saveBills:** allow processPdf to associate multiple bills to one file ([1a6a69b](https://github.com/cozy/cozy-konnector-libs/commit/1a6a69b730682e9e32a1b519554c7ed3d83e8b9c))
* **saveFiles:** add the fetchFile option to allow a connector to give it's own file retrieving function which will be run only when needed. ([88bda03](https://github.com/cozy/cozy-konnector-libs/commit/88bda03fc226e7093bccefad5198e61abeb416be))





## [4.32.5](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.32.4...cozy-konnector-libs@4.32.5) (2020-02-11)


### Bug Fixes

* **saveFiles:** fix validateFileContentOption ([05648aa](https://github.com/cozy/cozy-konnector-libs/commit/05648aafe8cd8234bea3ace1b4f510da9d8205fc))





## [4.32.4](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.32.3...cozy-konnector-libs@4.32.4) (2020-01-29)

**Note:** Version bump only for package cozy-konnector-libs





## [4.32.3](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.32.2...cozy-konnector-libs@4.32.3) (2020-01-29)


### Bug Fixes

* **saveFiles:** allow file renaming to works in standalone mode ([7428900](https://github.com/cozy/cozy-konnector-libs/commit/7428900b9fea5b18ca6a40b9824827f3ebe0ffad))
* do not log a warning when no folder_to_save ([93cbed9](https://github.com/cozy/cozy-konnector-libs/commit/93cbed9517a28aab03aa735b70ac5c0a0b365143))





## [4.32.2](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.32.1...cozy-konnector-libs@4.32.2) (2019-12-11)


### Bug Fixes

* allow cozy-client-js stub to work better with file metadata deduplication ([85c4387](https://github.com/cozy/cozy-konnector-libs/commit/85c438719ce687342b5efcb1367694ebda987d3f))
* more cozy-client-js-stub fix about files ([586f707](https://github.com/cozy/cozy-konnector-libs/commit/586f7073e084be2381f1c0848d024e677a8a05be))


### Features

* **BaseKonnector:** add notifySuccessfulLogin option to the signin method ([acce06c](https://github.com/cozy/cozy-konnector-libs/commit/acce06c60c48b9dc85751c5af7a806e5dcac9be1))





## [4.32.1](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.32.0...cozy-konnector-libs@4.32.1) (2019-12-04)


### Bug Fixes

* allow cozy-client-js-stub to work with file meta ids ([b7bf40a](https://github.com/cozy/cozy-konnector-libs/commit/b7bf40a5d3430d21783eb0be7c7d7bacd7fe7762))


### Features

* **BaseKonnector:** make this._account a secret ([b83cc3c](https://github.com/cozy/cozy-konnector-libs/commit/b83cc3c3d8f97888ee073f2af9d48a125792b8f6))





# [4.32.0](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.31.0...cozy-konnector-libs@4.32.0) (2019-11-20)


### Features

* **saveBills:** ignore bills for unprocessable pdf ([4763ee9](https://github.com/cozy/cozy-konnector-libs/commit/4763ee9eb4f4f3d35860c5cd6c4e218be155fcf5))





# [4.31.0](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.30.2...cozy-konnector-libs@4.31.0) (2019-11-12)


### Bug Fixes

* Less verbose BaseKonnector ([39a7ab7](https://github.com/cozy/cozy-konnector-libs/commit/39a7ab7b3f0304b546b84864f36b192b136b7fd3))
* **deps:** update dependency parcel to v1.12.4 ([1f5abdd](https://github.com/cozy/cozy-konnector-libs/commit/1f5abddc06a50bcfdc468db2574fdbfe9f2e895a))
* **deps:** update dependency parcel to v1.12.4 ([#619](https://github.com/cozy/cozy-konnector-libs/issues/619)) ([71036f0](https://github.com/cozy/cozy-konnector-libs/commit/71036f05d65765b1c74e64917ca75d0fa91eaee7))


### Features

* Add contractId and contractLabel for bills ([fee079f](https://github.com/cozy/cozy-konnector-libs/commit/fee079f03d03558492779a355dafabba57a95600))
* Add contractId and contractLabel for bills ([#605](https://github.com/cozy/cozy-konnector-libs/issues/605)) ([bcde9f2](https://github.com/cozy/cozy-konnector-libs/commit/bcde9f2d42a005c7ecdce6dfc44a398a62bebf5d))





## [4.30.2](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.30.1...cozy-konnector-libs@4.30.2) (2019-10-22)


### Bug Fixes

* Require pdfjs deps inside try/catch ([4f6260c](https://github.com/cozy/cozy-konnector-libs/commit/4f6260c))





## [4.30.1](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.30.0...cozy-konnector-libs@4.30.1) (2019-10-22)


### Bug Fixes

* Typo in README ([e12361a](https://github.com/cozy/cozy-konnector-libs/commit/e12361a))





# [4.30.0](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.29.0...cozy-konnector-libs@4.30.0) (2019-10-22)


### Bug Fixes

* Default value for backup dir ([1082551](https://github.com/cozy/cozy-konnector-libs/commit/1082551))
* display only one warning for no metadata deduplication ([41b8fc3](https://github.com/cozy/cozy-konnector-libs/commit/41b8fc3))
* display only one warning for no metadata deduplication ([#603](https://github.com/cozy/cozy-konnector-libs/issues/603)) ([d175977](https://github.com/cozy/cozy-konnector-libs/commit/d175977))


### Features

* More logs in BaseKonnector ([57bd97c](https://github.com/cozy/cozy-konnector-libs/commit/57bd97c))
* Use removeEventListener instead of off ([0052fef](https://github.com/cozy/cozy-konnector-libs/commit/0052fef))
* **saveFiles:** add subPath option ([a779572](https://github.com/cozy/cozy-konnector-libs/commit/a779572))





# [4.29.0](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.28.2...cozy-konnector-libs@4.29.0) (2019-10-07)


### Bug Fixes

* properly handle headers ([aa78147](https://github.com/cozy/cozy-konnector-libs/commit/aa78147))


### Features

* add zombie browser simulator ([f9da2df](https://github.com/cozy/cozy-konnector-libs/commit/f9da2df))
* make pdfjs dependencies optionnal ([03fb254](https://github.com/cozy/cozy-konnector-libs/commit/03fb254))
* make pdfjs dependencies optionnal ([#598](https://github.com/cozy/cozy-konnector-libs/issues/598)) ([dcedea7](https://github.com/cozy/cozy-konnector-libs/commit/dcedea7))





## [4.28.2](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.28.1...cozy-konnector-libs@4.28.2) (2019-09-16)

**Note:** Version bump only for package cozy-konnector-libs





## [4.28.1](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.28.0...cozy-konnector-libs@4.28.1) (2019-09-16)


### Bug Fixes

* keep other metadata when saving a file ([042a7fb](https://github.com/cozy/cozy-konnector-libs/commit/042a7fb))
* remove to many log messages in libs ([3c4e442](https://github.com/cozy/cozy-konnector-libs/commit/3c4e442))
* **deps:** update dependency cozy-logger to v1.6.0 ([#582](https://github.com/cozy/cozy-konnector-libs/issues/582)) ([3f37103](https://github.com/cozy/cozy-konnector-libs/commit/3f37103))
* remove to many log messages in libs ([a1211c5](https://github.com/cozy/cozy-konnector-libs/commit/a1211c5))
* **deps:** update dependency cozy-logger to v1.6.0 ([4ba564b](https://github.com/cozy/cozy-konnector-libs/commit/4ba564b))





# [4.28.0](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.27.0...cozy-konnector-libs@4.28.0) (2019-09-10)


### Bug Fixes

* cozy-jobs-cli lint config ([f93295d](https://github.com/cozy/cozy-konnector-libs/commit/f93295d))


### Features

* add autologin handling to the signin function ([4a4cd09](https://github.com/cozy/cozy-konnector-libs/commit/4a4cd09))
* add autologin handling to the signin function ([#580](https://github.com/cozy/cozy-konnector-libs/issues/580)) ([24dba41](https://github.com/cozy/cozy-konnector-libs/commit/24dba41))





# [4.27.0](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.25.0...cozy-konnector-libs@4.27.0) (2019-09-10)


### Bug Fixes

* **cozy-client-js-stub:** handle file metadata ([0b04723](https://github.com/cozy/cozy-konnector-libs/commit/0b04723))
* **cozy-client-js-stub:** handle file metadata ([#578](https://github.com/cozy/cozy-konnector-libs/issues/578)) ([eeef14a](https://github.com/cozy/cozy-konnector-libs/commit/eeef14a))
* Call fail or end when konnector finishes ([59f807b](https://github.com/cozy/cozy-konnector-libs/commit/59f807b))


### Features

* **BaseKonnector/2fa:** change timeout option to endTime ([43514bb](https://github.com/cozy/cozy-konnector-libs/commit/43514bb))
* **BaseKonnector/2fa:** change timeout option to endTime ([#574](https://github.com/cozy/cozy-konnector-libs/issues/574)) ([cbabb3c](https://github.com/cozy/cozy-konnector-libs/commit/cbabb3c))
* Extract fetch from run() so that it can be overrided ([9be5be9](https://github.com/cozy/cozy-konnector-libs/commit/9be5be9))





# [4.26.0](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.25.0...cozy-konnector-libs@4.26.0) (2019-09-02)


### Bug Fixes

* **cozy-client-js-stub:** handle file metadata ([0b04723](https://github.com/cozy/cozy-konnector-libs/commit/0b04723))
* **cozy-client-js-stub:** handle file metadata ([#578](https://github.com/cozy/cozy-konnector-libs/issues/578)) ([eeef14a](https://github.com/cozy/cozy-konnector-libs/commit/eeef14a))


### Features

* **BaseKonnector/2fa:** change timeout option to endTime ([43514bb](https://github.com/cozy/cozy-konnector-libs/commit/43514bb))
* **BaseKonnector/2fa:** change timeout option to endTime ([#574](https://github.com/cozy/cozy-konnector-libs/issues/574)) ([cbabb3c](https://github.com/cozy/cozy-konnector-libs/commit/cbabb3c))





# [4.25.0](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.24.2...cozy-konnector-libs@4.25.0) (2019-09-02)


### Bug Fixes

* **saveFiles:** shouldReplaceName, remove fatal error ([9409620](https://github.com/cozy/cozy-konnector-libs/commit/9409620)), closes [#569](https://github.com/cozy/cozy-konnector-libs/issues/569)
* unit can work with node 12 and node 8 like this ([6576300](https://github.com/cozy/cozy-konnector-libs/commit/6576300))
* unit tests can work with node 12 and node 8 like this ([#572](https://github.com/cozy/cozy-konnector-libs/issues/572)) ([9cfad3b](https://github.com/cozy/cozy-konnector-libs/commit/9cfad3b))


### Features

* Add notifySuccessfulLogin and deactivateAutoSuccessfulLogin methods ([bf9f2c7](https://github.com/cozy/cozy-konnector-libs/commit/bf9f2c7))
* deactivateAutoSuccessfulLogin does nothing after 1st call ([267b228](https://github.com/cozy/cozy-konnector-libs/commit/267b228))





## [4.24.2](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.24.0...cozy-konnector-libs@4.24.2) (2019-08-27)


### Bug Fixes

* bug if file with already an id detection ([abbf76f](https://github.com/cozy/cozy-konnector-libs/commit/abbf76f))
* give proper fields to the fetch function even when no destination folder is defined ([c6f4ce7](https://github.com/cozy/cozy-konnector-libs/commit/c6f4ce7))
* **saveFiles:** better criterias for files updates in metadata d… ([#567](https://github.com/cozy/cozy-konnector-libs/issues/567)) ([85f1fb9](https://github.com/cozy/cozy-konnector-libs/commit/85f1fb9))
* **saveFiles:** better criterias for files updates in metadata deduplication ([6bf9070](https://github.com/cozy/cozy-konnector-libs/commit/6bf9070))





## [4.24.1](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.24.0...cozy-konnector-libs@4.24.1) (2019-08-27)


### Bug Fixes

* bug if file with already an id detection ([abbf76f](https://github.com/cozy/cozy-konnector-libs/commit/abbf76f))
* give proper fields to the fetch function even when no destination folder is defined ([c6f4ce7](https://github.com/cozy/cozy-konnector-libs/commit/c6f4ce7))
* **saveFiles:** better criterias for files updates in metadata d… ([#567](https://github.com/cozy/cozy-konnector-libs/issues/567)) ([85f1fb9](https://github.com/cozy/cozy-konnector-libs/commit/85f1fb9))
* **saveFiles:** better criterias for files updates in metadata deduplication ([6bf9070](https://github.com/cozy/cozy-konnector-libs/commit/6bf9070))





# [4.24.0](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.23.0...cozy-konnector-libs@4.24.0) (2019-08-26)


### Bug Fixes

* update old files with new metadata ([c8df05f](https://github.com/cozy/cozy-konnector-libs/commit/c8df05f))


### Features

* do not use compiled version of cozy-client anymore ([bdf0ec8](https://github.com/cozy/cozy-konnector-libs/commit/bdf0ec8))
* Use JSDoc to document params ([28db3f9](https://github.com/cozy/cozy-konnector-libs/commit/28db3f9))





# [4.23.0](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.22.1...cozy-konnector-libs@4.23.0) (2019-08-23)


### Bug Fixes

* **deps:** update dependency cozy-logger to v1.5.1 ([a927747](https://github.com/cozy/cozy-konnector-libs/commit/a927747))
* **deps:** update dependency cozy-logger to v1.5.1 ([#561](https://github.com/cozy/cozy-konnector-libs/issues/561)) ([2216d07](https://github.com/cozy/cozy-konnector-libs/commit/2216d07))


### Features

* add metadata deduplication ([1f6d8b5](https://github.com/cozy/cozy-konnector-libs/commit/1f6d8b5))
* Add README to toc ([6722ff4](https://github.com/cozy/cozy-konnector-libs/commit/6722ff4))
* rename filePrimaryKeys to fileIdAttributes ([2a80db8](https://github.com/cozy/cozy-konnector-libs/commit/2a80db8))
* sort filePrimaryKeys ([e8109a0](https://github.com/cozy/cozy-konnector-libs/commit/e8109a0))





## [4.22.1](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.22.0...cozy-konnector-libs@4.22.1) (2019-08-21)


### Bug Fixes

* force cozy-logger until format error is solved ([420af5c](https://github.com/cozy/cozy-konnector-libs/commit/420af5c))





# [4.22.0](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.21.1...cozy-konnector-libs@4.22.0) (2019-08-20)


### Features

* use cozy-libs renovate rule ([a316259](https://github.com/cozy/cozy-konnector-libs/commit/a316259))
* **solveCaptcha:** add warning message detail about captcha creation task failure ([cc6e8fa](https://github.com/cozy/cozy-konnector-libs/commit/cc6e8fa))
* use cozy-libs renovate rule ([#554](https://github.com/cozy/cozy-konnector-libs/issues/554)) ([4082fff](https://github.com/cozy/cozy-konnector-libs/commit/4082fff))





## [4.21.1](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.21.0...cozy-konnector-libs@4.21.1) (2019-08-20)


### Bug Fixes

* **deps:** update dependency file-type to v12.2.0 ([7c509c5](https://github.com/cozy/cozy-konnector-libs/commit/7c509c5))
* Cookie connector init function signature ([c37b8bc](https://github.com/cozy/cozy-konnector-libs/commit/c37b8bc))
* Cookie connector init function signature ([#553](https://github.com/cozy/cozy-konnector-libs/issues/553)) ([b43da29](https://github.com/cozy/cozy-konnector-libs/commit/b43da29))





# [4.21.0](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.19.3...cozy-konnector-libs@4.21.0) (2019-08-20)


### Bug Fixes

* get account id in dev mode ([adac9f9](https://github.com/cozy/cozy-konnector-libs/commit/adac9f9))
* get account id in dev mode ([#549](https://github.com/cozy/cozy-konnector-libs/issues/549)) ([1c72876](https://github.com/cozy/cozy-konnector-libs/commit/1c72876))
* **cozyclient:** adapt the token to work in dev and production modes ([a723cc4](https://github.com/cozy/cozy-konnector-libs/commit/a723cc4))
* **deps:** update dependency cozy-client to v6.58.0 ([5d741af](https://github.com/cozy/cozy-konnector-libs/commit/5d741af))
* **deps:** update dependency cozy-client to v6.58.0 ([#550](https://github.com/cozy/cozy-konnector-libs/issues/550)) ([3c603aa](https://github.com/cozy/cozy-konnector-libs/commit/3c603aa))
* **deps:** update dependency cozy-doctypes to v1.62.0 ([0de49fe](https://github.com/cozy/cozy-konnector-libs/commit/0de49fe))
* **deps:** update dependency cozy-doctypes to v1.62.0 ([#548](https://github.com/cozy/cozy-konnector-libs/issues/548)) ([fca31ba](https://github.com/cozy/cozy-konnector-libs/commit/fca31ba))


### Features

* **solveCaptcha:** handle recaptcha v3 ([6c01f35](https://github.com/cozy/cozy-konnector-libs/commit/6c01f35))
* **solveCaptcha:** handle recaptcha v3 ([#546](https://github.com/cozy/cozy-konnector-libs/issues/546)) ([c41c0f9](https://github.com/cozy/cozy-konnector-libs/commit/c41c0f9))





# [4.20.0](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.19.3...cozy-konnector-libs@4.20.0) (2019-08-20)


### Bug Fixes

* get account id in dev mode ([adac9f9](https://github.com/cozy/cozy-konnector-libs/commit/adac9f9))
* get account id in dev mode ([#549](https://github.com/cozy/cozy-konnector-libs/issues/549)) ([1c72876](https://github.com/cozy/cozy-konnector-libs/commit/1c72876))
* **cozyclient:** adapt the token to work in dev and production modes ([a723cc4](https://github.com/cozy/cozy-konnector-libs/commit/a723cc4))
* **deps:** update dependency cozy-client to v6.58.0 ([5d741af](https://github.com/cozy/cozy-konnector-libs/commit/5d741af))
* **deps:** update dependency cozy-client to v6.58.0 ([#550](https://github.com/cozy/cozy-konnector-libs/issues/550)) ([3c603aa](https://github.com/cozy/cozy-konnector-libs/commit/3c603aa))
* **deps:** update dependency cozy-doctypes to v1.62.0 ([0de49fe](https://github.com/cozy/cozy-konnector-libs/commit/0de49fe))
* **deps:** update dependency cozy-doctypes to v1.62.0 ([#548](https://github.com/cozy/cozy-konnector-libs/issues/548)) ([fca31ba](https://github.com/cozy/cozy-konnector-libs/commit/fca31ba))


### Features

* **solveCaptcha:** handle recaptcha v3 ([6c01f35](https://github.com/cozy/cozy-konnector-libs/commit/6c01f35))
* **solveCaptcha:** handle recaptcha v3 ([#546](https://github.com/cozy/cozy-konnector-libs/issues/546)) ([c41c0f9](https://github.com/cozy/cozy-konnector-libs/commit/c41c0f9))





## [4.19.3](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.19.2...cozy-konnector-libs@4.19.3) (2019-08-14)


### Bug Fixes

* better cozy-client-js-stub for complex queries ([648aed5](https://github.com/cozy/cozy-konnector-libs/commit/648aed5))
* initalization of new cozy-client instance ([c8833f0](https://github.com/cozy/cozy-konnector-libs/commit/c8833f0))
* initalization of new cozy-client instance ([#543](https://github.com/cozy/cozy-konnector-libs/issues/543)) ([9d127bf](https://github.com/cozy/cozy-konnector-libs/commit/9d127bf))





## [4.19.2](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.19.1...cozy-konnector-libs@4.19.2) (2019-08-13)


### Bug Fixes

* use compiled version of cozy-doctypes ([06da027](https://github.com/cozy/cozy-konnector-libs/commit/06da027))





## [4.19.1](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.19.0...cozy-konnector-libs@4.19.1) (2019-08-13)

**Note:** Version bump only for package cozy-konnector-libs





# [4.19.0](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.18.7...cozy-konnector-libs@4.19.0) (2019-08-13)


### Bug Fixes

* add react to fix unit tests ([ea6a4b2](https://github.com/cozy/cozy-konnector-libs/commit/ea6a4b2))


### Features

* add cozy metadata in cozy-client init ([798cd55](https://github.com/cozy/cozy-konnector-libs/commit/798cd55))
* init a new cozy-client instance and make it available in cozy-konnector-libs ([a384229](https://github.com/cozy/cozy-konnector-libs/commit/a384229))





## [4.18.7](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.18.6...cozy-konnector-libs@4.18.7) (2019-08-09)


### Bug Fixes

* new cozy-logger breaks libs ([b0d7fec](https://github.com/cozy/cozy-konnector-libs/commit/b0d7fec))





## [4.18.6](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.18.5...cozy-konnector-libs@4.18.6) (2019-08-02)


### Bug Fixes

* **deps:** update dependency cozy-doctypes to v1.58.0 ([240219d](https://github.com/cozy/cozy-konnector-libs/commit/240219d))





## [4.18.5](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.18.4...cozy-konnector-libs@4.18.5) (2019-07-30)

**Note:** Version bump only for package cozy-konnector-libs





## [4.18.4](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.18.3...cozy-konnector-libs@4.18.4) (2019-07-29)


### Bug Fixes

* bad module.exports change caused unit tests to fail ([2d2347b](https://github.com/cozy/cozy-konnector-libs/commit/2d2347b))
* update cozy-doctypes with cozy-client as peerDependency ([a17d1e6](https://github.com/cozy/cozy-konnector-libs/commit/a17d1e6))
* update cozy-doctypes with cozy-client as peerDependency ([#528](https://github.com/cozy/cozy-konnector-libs/issues/528)) ([79e5e87](https://github.com/cozy/cozy-konnector-libs/commit/79e5e87))
* **deps:** update dependency cozy-doctypes to v1.57.1 ([db7b333](https://github.com/cozy/cozy-konnector-libs/commit/db7b333))
* **deps:** update dependency file-type to v12.1.0 ([6af6cb8](https://github.com/cozy/cozy-konnector-libs/commit/6af6cb8))
* **deps:** update dependency file-type to v12.1.0 ([#527](https://github.com/cozy/cozy-konnector-libs/issues/527)) ([756d85a](https://github.com/cozy/cozy-konnector-libs/commit/756d85a))





## [4.18.3](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.18.2...cozy-konnector-libs@4.18.3) (2019-07-22)


### Bug Fixes

* **deps:** update dependency file-type to v12 ([591d122](https://github.com/cozy/cozy-konnector-libs/commit/591d122))
* **deps:** update dependency file-type to v12 ([#496](https://github.com/cozy/cozy-konnector-libs/issues/496)) ([80886bc](https://github.com/cozy/cozy-konnector-libs/commit/80886bc))
* **deps:** update dependency pdfjs-dist to v2.1.266 ([6ff6f34](https://github.com/cozy/cozy-konnector-libs/commit/6ff6f34))
* **deps:** update dependency pdfjs-dist to v2.1.266 ([#514](https://github.com/cozy/cozy-konnector-libs/issues/514)) ([a1b4e2e](https://github.com/cozy/cozy-konnector-libs/commit/a1b4e2e))





## [4.18.2](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.18.1...cozy-konnector-libs@4.18.2) (2019-07-19)


### Bug Fixes

* do not try do download a file there is an error in shouldreplace ([5062adf](https://github.com/cozy/cozy-konnector-libs/commit/5062adf))
* Fix Tls test on chained self signed cert ([f5a47e5](https://github.com/cozy/cozy-konnector-libs/commit/f5a47e5))
* last cozy-doctypes make the tests fail ([e1fa77d](https://github.com/cozy/cozy-konnector-libs/commit/e1fa77d))
* remove console.log ([120fc77](https://github.com/cozy/cozy-konnector-libs/commit/120fc77))





## [4.18.1](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.18.0...cozy-konnector-libs@4.18.1) (2019-07-08)

**Note:** Version bump only for package cozy-konnector-libs





# [4.18.0](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.17.1...cozy-konnector-libs@4.18.0) (2019-06-27)


### Bug Fixes

* cut critical error messages to 32Ko to make their JSON version readable by the stack ([6595639](https://github.com/cozy/cozy-konnector-libs/commit/6595639))
* **deps:** update dependency raw-body to v2.4.1 ([39320b9](https://github.com/cozy/cozy-konnector-libs/commit/39320b9))


### Features

* replace files if we have metadata to add ([c1b0317](https://github.com/cozy/cozy-konnector-libs/commit/c1b0317))
* **saveFiles:** add io.cozy.files data in importedData.json fil… ([#511](https://github.com/cozy/cozy-konnector-libs/issues/511)) ([c2c1fb4](https://github.com/cozy/cozy-konnector-libs/commit/c2c1fb4))
* **saveFiles:** add io.cozy.files data in importedData.json file when in standalone mode ([dcbf23d](https://github.com/cozy/cozy-konnector-libs/commit/dcbf23d))
* replace files if we have metadata to add ([#513](https://github.com/cozy/cozy-konnector-libs/issues/513)) ([35eb9d9](https://github.com/cozy/cozy-konnector-libs/commit/35eb9d9))





## [4.17.1](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.17.0...cozy-konnector-libs@4.17.1) (2019-06-25)


### Bug Fixes

* remove identity log ([916a436](https://github.com/cozy/cozy-konnector-libs/commit/916a436))
* updateOrCreate:  do not change createAt metadata on update ([f420afb](https://github.com/cozy/cozy-konnector-libs/commit/f420afb))





# [4.17.0](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.16.0...cozy-konnector-libs@4.17.0) (2019-06-20)


### Bug Fixes

* Fix formating in saveIdentity for phone and address ([5269665](https://github.com/cozy/cozy-konnector-libs/commit/5269665))
* Fix formating in saveIdentity for phone and address ([#501](https://github.com/cozy/cozy-konnector-libs/issues/501)) ([2edb984](https://github.com/cozy/cozy-konnector-libs/commit/2edb984))


### Features

* add cozyMetadata feature to saveFiles ([dfa70ee](https://github.com/cozy/cozy-konnector-libs/commit/dfa70ee))
* add saveIdentity and updateOrCreate as BaseKonnector methods ([3acef7e](https://github.com/cozy/cozy-konnector-libs/commit/3acef7e))
* saveIdentity: move metadata handling to updateOrCreate ([d237474](https://github.com/cozy/cozy-konnector-libs/commit/d237474))





# [4.16.0](https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.15.17...cozy-konnector-libs@4.16.0) (2019-06-14)


### Features

* Add saveIdentity in cozy-konnector-libs ([d1078cb](https://github.com/cozy/cozy-konnector-libs/commit/d1078cb))
* Add saveIdentity in cozy-konnector-libs ([#497](https://github.com/cozy/cozy-konnector-libs/issues/497)) ([6cf6f35](https://github.com/cozy/cozy-konnector-libs/commit/6cf6f35))





# Changelog

## [Unreleased]

### Changed
- none yet

### Fixed
- none yet

### Added
- none yet

## cozy-jobs-cli@1.0.17, cozy-konnector-libs@4.1.7, cozy-logger@1.1.4 (2018-04-17)

#### :bug: Bug Fix
* `cozy-logger`
  * [#202](https://github.com/konnectors/libs/pull/202) fix: cannot assign from error to object. ([@ptbrowne](https://github.com/ptbrowne))

#### Committers: 1
- Patrick Browne ([ptbrowne](https://github.com/ptbrowne))

## cozy-konnector-libs@4.1.6 (2018-04-17)

#### :rocket: Enhancement
* `cozy-konnector-libs`
  * [#200](https://github.com/konnectors/libs/pull/200) fix: formatting of error is done in cozy-logger. ([@ptbrowne](https://github.com/ptbrowne))

## cozy-konnector-libs@4.1.2 (2018-04-10)

#### :bug: Bug Fix
* `cozy-konnector-libs`
  * [#180](https://github.com/konnectors/libs/pull/180) 🐝 fix: use target node 8 to remove the need for regeneratorRuntime. ([@ptbrowne](https://github.com/ptbrowne))


## [4.1.0] (2018-04-09)

#### :rocket: Enhancement
* Other
  * [#178](https://github.com/konnectors/libs/pull/178) ✨ feat: add lerna changelog. ([@ptbrowne](https://github.com/ptbrowne))
* `cozy-logger`
  * [#177](https://github.com/konnectors/libs/pull/177) feat: if message is an object, its properties are assigned to the log. ([@ptbrowne](https://github.com/ptbrowne))

#### :bug: Bug Fix
* `cozy-jobs-cli`
  * [#172](https://github.com/konnectors/libs/pull/172) fix: yarn dev now works without defining the file source. ([@doubleface](https://github.com/doubleface))

## [4.0.0] - 2018-04-06

### Changed

- `cozy-konnector-libs` : Changed linking mechanism to in-memory
- `cozy-konnector-libs`: `updateOrCreate` is no longer deprecated.
- `cozy-konnector-libs`: transpiled sources are shipped on npm

## [3.8.1] - 2018-03-29

### Fixed

- `cozy-konnector-libs` No longer has bin in package.json. Moved to cozy-konnector-libs.

## [3.8.0] - 2018-03-27

### Added
- `cozy-konnector-libs`: `signin` helper. Should make sign in process to websites easier [#138](https://github.com/cozy/cozy-konnector-libs/pull/138). Big thank you to @carrieje :+1: !
- `cozy-konnector-libs`: banking operation categorized as "health insurance" can be considered for linking with an health bill if its amount is greater than 0 (previously only operation categorized as "health expenses" were considered for linking)
- `cozy-konnector-libs`: bill matching logs are tinier
- `cozy-jobs-cli`: allow to parse an HTML file from the shell

## [3.7.0] - 2018-03-13

- Update cozy-client-js
- Use lerna

## [3.6.0] - 2018-03-12

### Added

- `scrape` function.

## [3.5.3] - 2018-03-08

### Added

- Document class
- saveFiles handles filestreams (Thanks [Jérémie](https://github.com/laedit) !)
- `fetch` function return value is checked to be a Promise

## [3.5.2] - 2018-02-28

### Fixed
- Banking operations cannot have reimbursements total amount be higher than their amount

## [3.5.1] - 2018-02-21

### Fixed

- Default log level is not "debug" instead of "info". The stack filters out
debug logs but "info" are kept.

### Added

- `shouldSave` and `shouldUpdate` functions  can be passed to hydrateAndFilter. It allows for finer grained control over what is saved/updated.

### Deprecated

- `updateOrCreate` is now deprecated. Prefer to use `shouldSave`/`shouldUpdate`.

## [3.3.0] - 2018-01-23

### Added
- Automatic exception handling via Sentry if `process.env.SENTRY_DSN` is set

### Fixed
- Correct status codes are used when exiting from an error
- Yarn dev

## [3.2.4] - 2018-01-23
### Changed
- Fixed linking of health bills to their credit operation when no debit operation found

## [3.2.4] - 2018-01-22
### Changed
- Fixed linking of health bills to operations
- More details when an error message is caught by the BaseKonnector

## [3.2.3] - 2018-01-19
### Changed
- Now by default, mathing bill operation check the range date with - 15 days + 29 days


## [3.2.1] - 2018-01-18
### Fixed
- Remove spread es6 syntax


## [3.2.0] - 2018-01-18
### Changed
- Refactoring of bills and transactions association

### Fixed
- operation.reimbursements can't have same reimbursement


## [3.1.6] - 2018-01-17
### Fixed
- Linking with bank operations also works on first run


## [3.1.5] - 2018-01-10
### Fixed
- Linking with bank operations now works even if the bill has already been fetched

## Details

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

[Unreleased]: https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.1.0...HEAD
[4.1.0]: https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@4.0.0...4.1.0
[4.0.0]: https://github.com/cozy/cozy-konnector-libs/compare/cozy-konnector-libs@3.8.2...cozy-konnector-libs@4.0.0
[3.8.2]: https://github.com/cozy/cozy-konnector-libs/compare/v3.8.1...v3.8.2
[3.8.1]: https://github.com/cozy/cozy-konnector-libs/compare/v3.8.0...v3.8.1
[3.8.0]: https://github.com/cozy/cozy-konnector-libs/compare/v3.7.0...v3.8.0
[3.7.0]: https://github.com/cozy/cozy-konnector-libs/compare/v3.6.0...v3.7.0
[3.6.0]: https://github.com/cozy/cozy-konnector-libs/compare/v3.5.3...v3.6.0
[3.5.3]: https://github.com/cozy/cozy-konnector-libs/compare/v3.5.2...v3.5.3
[3.5.2]: https://github.com/cozy/cozy-konnector-libs/compare/v3.5.1...v3.5.2
[3.5.1]: https://github.com/cozy/cozy-konnector-libs/compare/v3.3.0...v3.5.1
[3.3.0]: https://github.com/cozy/cozy-konnector-libs/compare/v3.2.5...v3.3.0
[3.2.5]: https://github.com/cozy/cozy-konnector-libs/compare/v3.2.4...v3.2.5
[3.2.4]: https://github.com/cozy/cozy-konnector-libs/compare/v3.2.3...v3.2.4
[3.2.3]: https://github.com/cozy/cozy-konnector-libs/compare/v3.2.2...v3.2.3
[3.2.2]: https://github.com/cozy/cozy-konnector-libs/compare/v3.2.1...v3.2.2
[3.2.1]: https://github.com/cozy/cozy-konnector-libs/compare/v3.2.0...v3.2.1
[3.2.0]: https://github.com/cozy/cozy-konnector-libs/compare/v3.1.6...v3.2.0
[3.1.6]: https://github.com/cozy/cozy-konnector-libs/compare/176b49b...v3.1.6
[3.1.5]: https://github.com/cozy/cozy-konnector-libs/compare/8b00eda...176b49b
