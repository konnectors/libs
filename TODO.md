TODO before the first release
=============================

 - [ ] Do not use debug package and enhance the internal logger
  - [X] Remove the debug package
  - [ ] Display json logs in production and colored one line logs in standalone and dev mode
 - [ ] Allow the connectors to retry seamlessly
 - [ ] use node-replay npm package to save and replay the http requests
 - [ ] Add an updateOrAddData method
 - [ ] Some shortcut, still to be defined, for most common scrapping use cases
      - get the token with a jquery selector and pass it in a form
      - get the token and passit as a Bearer in the header
 - [X] Propose a new method to fetch information from the account and to save information in the
   account, to be able to save a developper token or the id of the last fetched element or anything
   else.
 - [X] Add a access to a request-promise instance which is initialized with usefull options :
    - request-debug
    - firefox header
    - json : true if needed
    - jar : true
    - body initialized with cheerio
