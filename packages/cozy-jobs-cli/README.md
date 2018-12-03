`cozy-jobs-cli` provides binaries to launch konnectors or processes with
environment variables that are used to connect to a cozy. Use this when
you want a program to connect to a cozy.

<!-- MarkdownTOC autolink=true -->

- [`cozy-run-dev`](#cozy-run-dev)
- [`cozy-konnector-dev`](#cozy-konnector-dev)

<!-- /MarkdownTOC -->


### `cozy-run-dev`

- Provides `COZY_CREDENTIALS` to the underlying process

You can use `COZY_URL` to connect to another cozy.

### `cozy-konnector-dev`

- Provides `COZY_CREDENTIALS` to the underlying process
- Creates automatically `konnector-dev-config.json` and `importedData.json`

You can use `COZY_URL` to connect to another cozy.
