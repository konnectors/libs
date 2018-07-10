import { format, parse } from 'date-fns'
import frLocale from 'date-fns/locale/fr'

const serialize = formData => {
  const res = {}
  for (let k of formData) {
    res[k[0]] = k[1]
  }
  return res
}

function formatDate(d) {
  return `<span class='date'>${format(parse(d), 'D MMM YYYY', { locale: frLocale })}</span>`
}

const comp = fn => {
  return function (a, b) {
    const resa = fn(a)
    const resb = fn(b)
    if (resa == resb) { return 0 }
    if (resa < resb) { return -1 }
    if (resa > resb) { return 1  }
  }
}

const renderText = results => {
  const operations = {}
  let nLinks = 0
  Object.entries(results).forEach(([k, v]) => {
    if (v.debitOperation) {
      const dId = v.debitOperation._id
      operations[dId] = operations[dId] || { operation: v.debitOperation, bills: [] }
      operations[dId].bills.push(v.bill)
      nLinks++
    }
    if (v.creditOperation) {
      const dId = v.creditOperation._id
      operations[dId] = operations[dId] || { operation: v.creditOperation, bills: [] }
      operations[dId].bills.push(v.bill)
      nLinks++
    }
  })

  const byDate = comp(([k, v]) => v.operation.date)
  return `<div>Found ${nLinks} links</div>` + Object.entries(operations).sort(byDate).reverse().map(([k, v]) => {
    const { operation, bills } = v
    return `<div class='operation'>
      <b>${operation.label}</b> le ${formatDate(operation.date)}<br/>
      Montant: ${operation.amount}<br/>
      Factures:
        <ul>
          ${bills.slice().sort(comp(x => x.date)).map(bill =>
            `<li>${formatDate(bill.date)} : ${bill.vendor} ${bill.amount}</li>`
          ).join('\n')}
        </ul>
    </div>`
  }).join('\n\n')
}

const renderResults = function (results) {
  results = JSON.parse(results)
  const node = document.querySelector('#results')
  node.innerHTML = `${renderText(results)}`
}

document.querySelector('#form')
  .addEventListener('submit', ev => {
    ev.preventDefault()
    const form = ev.target
    const submitBtn = form.querySelector('[type="submit"]')
    const txt = submitBtn.innerText
    submitBtn.innerText = 'Loading...'
    const data = serialize(new FormData(form));
    saveFormData(data)
    const sendDate = new Date()
    fetch('http://localhost:3000/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }).then(res => res.text())
      .then(res => {
        console.log(new Date() - sendDate)
        submitBtn.innerText = txt
        renderResults(res)
      })
  })

const saveFormData = (data) => {
  Object.entries(data).forEach(([k, v]) => {
    localStorage.setItem(`form__${k}`, v)
  })
}

const setSavedFormData = () => {
  for (let name of ['identifiers', 'minDateDelta', 'maxDateDelta', 'amountDelta']) {
    const input = document.querySelector(`[name=${name}]`)
    const value = localStorage.getItem(`form__${name}`)
    input.value = value
  }
}

setSavedFormData()
