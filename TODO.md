TODO before the first release
=============================

 - [ ] Propose a new method to fetch information from the account and to save information in the
   account, to be able to save a developper token or the id of the last fetched element or anything
   else.
 - [ ] Add an updateOrAddData method
 - [ ] Add a access to a request-promise instance which is initialized with usefull options :
    - request-debug
    - firefox header
    - json : true if needed
    - jar : true
    - body initialized with cheerio
 - [ ] Some shortcut, still to be defined, for most common scrapping use cases
      - get the token with a jquery selector and pass it in a form
      - get the token and passit as a Bearer in the header
 - [ ] use node-replay npm package to save and replay the http requests
