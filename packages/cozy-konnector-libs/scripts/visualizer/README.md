Link visualizer
===============

This is a small [express] server that serves a webpage meant to show
links that are found with `cozy-konnector-libs` between bills and
banking operations.

The server needs to have a valid `cozyClient` and for that it uses the
`cozyClient` from cozy-konnector-libs. This means that it should be run
with `cozy-jobs-cli` to have the right credentials passed as environment
variables.

To launch the server :

```
$ cozy-run-dev index.js
```

then you can go to http://localhost:3000.

There you have a minimal interface where you can trigger a search for links
between bills and operations.

[express]: https://expressjs.com/



