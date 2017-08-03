TODO before the first release
=============================

 - [ ] use node-replay npm package to save and replay the http requests
 - [ ] Add an updateOrAddData method
 - [ ] linkBankOperations optimizations
      * at first run, get all the entries from db and try to link it all
      * and then, for the other runs, try to link entries with date to today - maxDateDelta
      * the first run or not data can be saved in the account
