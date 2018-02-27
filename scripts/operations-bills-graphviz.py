"""
Used to debug linkBankOperations.

Save result of linkBankOperations during a konnector run with the
environment variable `LINK_RESULTS_FILENAME`:

```bash
env LINK_RESULTS_FILENAME=/tmp/result-link-bills.json yarn dev
```

```
python operations-bills-graphviz.py /tmp/results-link-bills.json \
  | dot -Grankdir=LR  -Tpng -o output.png; and open output.png
```
"""

import json
from graphviz import Digraph

def format_date(d):
    return d[:10]

def get_op_label(op):
    return '%s\n%s\n%s' % (format_date(op['date']), op['label'], op['amount'])

def get_bill_label(bill):
    return '%s\n%s\n%s' % (
        format_date(bill['date']),
        '%s %s\n%s' % (bill['vendor'], bill.get('beneficiary', ''), bill.get('subtype', '')),
        bill['amount']
    )

def output_graphviz(linkbill_result):
    dot = Digraph()
    with open(linkbill_result) as f:
        data = json.load(f)
    for item in sorted(data.values(), key=lambda x: x['bill']['date']):
        debit = item.get('debitOperation')
        credit = item.get('creditOperation')
        bill = item.get('bill')
        dot.node(bill['_id'], get_bill_label(bill), color='green' if bill['isRefund'] else 'red')
        if debit:
            dot.node(debit['_id'], get_op_label(debit), color='red', shape='rect')
            dot.edge(bill['_id'], debit['_id'], label='paid by')
        if credit:
            dot.node(credit['_id'], get_op_label(credit), color='green', shape='rect')
            dot.edge(bill['_id'], credit['_id'], label='reimbursed by')
    print(dot.source)

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('filename')
    args = parser.parse_args()
    output_graphviz(args.filename)
