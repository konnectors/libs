Linking bank operations
=======================

When bills are saved via saveBills, we try to find a bank operation
that matches it.

Criterias for matching :

* Label : the label of the operation must match an identifier provided in the
konnector

For example, for SFR mobile, the identifiers that we try to find in the label is
"sfr mobile". For SFR box, we try to find "sfr fixe" and "sfr adsl". We try to
find without the case.

* Date : the date of the banking operation must be +- 15 days of the bill

* Amount : the amount of the banking operation must be +-0.001 of the original
bill amount

Those criterias can be changed by the konnector themselves.
