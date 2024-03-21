### CLI

`cozy-jobs-cli` is a npm package providing CLI tools allowing to run your connector in different modes.

- standalone
- development
- or in dedicated REPL

You can install it in your connector as a dev dependency.

#### cozy-run-standalone

It can be handy to run a konnector without inserting the data in a cozy. This mode is called "standalone".
You can run your connector in standalone mode with :

```sh
$ cozy-run-standalone
```

If you want, you can add the following code in the `scripts` section of your package.json file:

```json
  "scripts": {
    "standalone": "cozy-run-standalone"
  }
```

It will then possible to do:

```sh
yarn standalone
```

The requests to the cozy-stack will be stubbed using the [./fixture.json] file as source of data
and when cozy-client-js is asked to create or update data, the data will be output to the console.
The bills (or any file) will be saved in the ./data directory.

It is possible to add an argument to this command which tells which file to run. Default is
defined in `package.json` `main` section or ./src/index.js

It is possible to record and replay the requests done by the standalone command using the
[replay](https://github.com/assaf/node-replay) module.

When your connector is run with this command, a global function is available in your connector :
`global.openInBrowser`, which can take an html string or a cheerio object as input and will show
the corresponding html page in your default browser.

##### Arguments

```
Usage: cozy-run-standalone [options] <file>


Options:

  --record  Record all the requests in the ./fixtures directory using the replay module
  --replay  Replay all the recorded requests
  --persist Do not empty ./data/importedData.json at each run
  -h, --help  output usage information
```


#### cozy-run-dev

If you want to run your connector linked to a cozy-stack, even remotely, the "dev" mode is for you.
Add the following code in the `scripts` section of your package.json file:

```patch
   "scripts": {
+    "dev": "cozy-run-dev"
   }
```

and run:

```sh
yarn dev
```

This command will register your konnector as an OAuth application to the cozy-stack and then set the `COZY_CREDENTIALS` and `COZY_FIELDS` environment variable. By default,
the cozy-stack is expected to run at http://cozy.tools:8080. If this is not your case, update the COZY_URL field in [./konnector-dev-config.json].

After that, your connector is running but will not work since credentials to
the target service are not configured. You can do this also in [./konnector-dev-config.json] in the "fields" section.

```patch
 "fields": {
+  "login": "homer.simpson@gmail.com",
+  "password": "maggieisthebest"
 }
```

Please note that the [./konnector-dev-config.json] file accepts javascript comments. They will be
stripped out when read by cozy-run commands.

The files are saved in the `/cozy-konnector-dev-root` directory of your cozy.

It is also possible to add an argument to this command which tells which file to run. Default is
defined in `package.json` `main` section or ./src/index.js

When your connector is run with this command, a global function is available in your connector :
`global.openInBrowser`, which can take an html string or a cheerio object as input and will show
the corresponding html page in your default browser.


##### Arguments

```
$ cozy-run-dev <file> [-t token.json] [-m manifest.webapp]
```

- `-t`, `--token` : Specify where the token should be saved
- `-m`, `--manifest` : Specify the manifest.path that should be used for the permissions

#### cozy-run-shell

When you are developping a connector, it is possible to get a REPL with all the cozy-konnector-libs
tools available and some enhancements.

```javascript
  scripts: {
    shell: "cozy-run-shell"
  }
```

and run:

```sh
yarn shell
```

In this REPL, all the cozy-konnector-libs tools are available as globals and a default global
request instance initialized with cheerio and cookie handling is available. For example run :

```javascript
request('http://quotes.toscrape.com/')
```

After running a request, a global $ object with a cheerio instance is available. Enter :

```js
$
```

A full global request-promise response object is also available.

If you always want the details of the request and the response to be displayed. Just run once:

```js
debug()
```

And you get a syntax colored html representation of the result of the request.
If you run :

```js
$('p')
```

You get an array of elements with for each element:
- the type of the element (p)
- the html of the element
- the cleaned text of the element

It is also possible to load a html file into the shell. Run :

```sh
yarn shell index.html
```

The html file will load and $ will be correctly initialized.

The `openInBrowser` is also available , which can take an html string or a cheerio object as input and will show
the corresponding html page in your default browser.

##### Arguments

```
$ cozy-run-shell [<file>]
```
