# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]

### Changed
- none yet

### Fixed
- none yet

### Added
- none yet

### Removed
- none yet

### Deprecated
- none yet

### Security
- none yet


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


[Unreleased]: https://github.com/cozy/cozy-konnector-libs/compare/v3.2.5...HEAD
[3.2.4]: https://github.com/cozy/cozy-konnector-libs/compare/v3.2.4...v3.2.5
[3.2.4]: https://github.com/cozy/cozy-konnector-libs/compare/v3.2.3...v3.2.4
[3.2.3]: https://github.com/cozy/cozy-konnector-libs/compare/v3.2.2...v3.2.3
[3.2.2]: https://github.com/cozy/cozy-konnector-libs/compare/v3.2.1...v3.2.2
[3.2.1]: https://github.com/cozy/cozy-konnector-libs/compare/v3.2.0...v3.2.1
[3.2.0]: https://github.com/cozy/cozy-konnector-libs/compare/v3.1.6...v3.2.0
[3.1.6]: https://github.com/cozy/cozy-konnector-libs/compare/176b49b...v3.1.6
[3.1.5]: https://github.com/cozy/cozy-konnector-libs/compare/8b00eda...176b49b
