### CLI

`cozy-konnector-libs` also comes with some cli tools which allow to run your connector in standalone
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
yarn standalone
```

The requests to the cozy-stack will be stubbed using the [./fixture.json] file as source of data
and when cozy-client-js is asked to create or update data, the data will be output to the console.
The bills (or any file) will be saved in the . directory.

It is also possible to add an argument to this command which tells which file to run. Default is
./index.js

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
yarn dev
```

This command will register your konnector as an OAuth application to the cozy-stack and then set the `COZY_CREDENTIALS` and `COZY_FIELDS` environment variable. By default,
the cozy-stack is supposed to be located in http://cozy.tools:8080. If this is not your case, just
update the COZY_URL field in [./konnector-dev-config.json].

After that, your konnector is running but should not work since you did not specify any credentials to
the target service. You can do this also in [./konnector-dev-config.json] in the "fields" section.

The files are saved in the root directory of your cozy by default.

##### Arguments

```
$ cozy-konnector-dev <file> [-t token.json] [-m manifest.webapp]
```

As for the `standalone` command, you can specify which file to run. Default is `./index.js`.

- `-t`, `--token` : Specify where the token should be saved
- `-m`, `--manifest` : Specify the manifest.path that should be used for the permissions
