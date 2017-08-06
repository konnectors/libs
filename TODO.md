TODO before the first release
=============================

 - [ ] Add an updateOrAddData method
 - [ ] linkBankOperations optimizations
      * at first run, get all the entries from db and try to link it all
      * and then, for the other runs, try to link entries with date to today - maxDateDelta
      * the first run or not data can be saved in the account
 - [X] use node-replay npm package to save and replay the http requests
 - [X] add the possibility to get the custom bank identifier from fields (generic)
 - [X] logger: use it like the debug module with a space name with label
 - [X] Add automatic opening of token url in the browser like ACH
