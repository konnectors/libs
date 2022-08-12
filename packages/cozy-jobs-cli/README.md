`cozy-jobs-cli` provides binaries to launch konnectors or processes with
environment variables that are used to connect to a cozy. Use this when
you want a program to connect to a cozy.

<!-- MarkdownTOC autolink=true -->

- [`cozy-run-dev`](#cozy-run-dev)
- [`cozy-konnector-dev`](#cozy-konnector-dev)
- [`cozy-konnector-standalone`](#cozy-konnector-standalone)

<!-- /MarkdownTOC -->

### `cozy-run-dev`

- Provides `COZY_CREDENTIALS` to the underlying process

You can use `COZY_URL` to connect to another cozy.

### `cozy-konnector-dev`

- Provides `COZY_CREDENTIALS` to the locally running connector from `konnector-dev-config.json` (which is created if it does not exist)
- A token will be generated (`.token.json`) the first time to grant access to `cozy-konnector-dev`, and you may need to delete it and regenerate it again if expired.
- Be aware that if you make a change in the application manifest, you must regenerate the token (deleting it if necessary) ([see the issue](https://github.com/konnectors/libs/issues/701)).

### `cozy-konnector-standalone`

- Provides `COZY_CREDENTIALS` to the locally running connector from `konnector-dev-config.json` (which is created if it does not exist)
- Does not save the data in a real cozy but instead dumps the data to `importedData.json`

You can use `COZY_URL` to connect to another cozy. The default one is `cozy.localhost:8080`.
