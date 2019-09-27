# Categorization dashboard

To check that the categorization works well, we have tests that generate a dashboard showing global and local models performances.

## Run tests

Since these tests are executed on real data, the data is encrypted. To be able to run the tests, you have to decrypt it:

```
yarn decrypt-banking-tests
```

The global categorization model tests also needs the current and latest model parameters. These parameters should be downloaded:

```
yarn download-banking-tests
```

Now you have everything to run the tests.

```
env BACKUP_DIR=/path/to/dir yarn jest src/ducks/categorization/services-fixtures.spec.js
```

* `BACKUP_DIR` environment variable is the path to the directory in which you want to write the result of the tests (csv and txt files)
* You can add the jest flags you need: `-u` to update snapshots and `--watch` to run the tests in watch mode, for example
