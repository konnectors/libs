# Categorization dashboard

To check that the banking categorization works well, we have tests that generate a dashboard showing global and local models performances based on sanitized datasets.


## Download and decrypt data

Since these tests are executed on real data, it is kept encrypted. To be able to run the tests, you first have to decrypt it (you need the encryption passphrase):

```
yarn decrypt-banking-tests
```

You now have two new directories in the dashboard:

* `fixtures`: the actual operations with the categories information.
* `__snapshots__`: snapshot of the categorization results.

The global categorization model tests also needs the current and latest model parameters. These parameters should be downloaded:

```
yarn download-banking-tests
```

Now you have everything to run the tests.

## Run the tests

There are two tests files :

* `services-global-fixtures.spec.js`: only test the global model.
* `services-fixtures.spec.js`: test both the global and local models.

Each test will categorize all the operations and check if it matches the snapshot. To run it:

```
env BACKUP_DIR=/path/to/dir LOG_LEVEL=error yarn jest src/libs/categorization/dashboard/services-fixtures.spec.js
```

* `BACKUP_DIR` environment variable is the path to the directory in which you want to write the result of the tes. Default is `/tmp`
* `LOG_LEVEL` environment variable is the log level used by [cozy-logger](https://github.com/cozy/cozy-libs/tree/master/packages/cozy-logger). As the tests can be quite verbose, using the error level avoids unecessary information.
* You can add  `--watch` to run the tests in watch mode to avoid running everything each time.
* Adding `IT_IS_A_TEST=true` will run the tests on a reduced dataset, as the whole tests can take a long time to complete.

## Update the tests

To update the snapshots of the tests:
```
yarn jest src/libs/categorization/dashboard/ -u
```

Then, to save the results with a new encrypted archive (you need the encryption passphrase):
```
yarn encrypt-banking-tests
```
