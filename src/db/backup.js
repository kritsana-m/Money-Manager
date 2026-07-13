import { getDB } from './database'

export async function exportData() {
  const db = await getDB()
  const transactions = await db.getAll('transactions')
  const subscriptions = await db.getAll('subscriptions')
  const subscriptionPayments = await db.getAll('subscriptionPayments')
  
  return {
    transactions,
    subscriptions,
    subscriptionPayments,
    exportedAt: new Date().toISOString(),
    version: 1
  }
}

const REQUIRED_TRANSACTION_FIELDS = ['amount', 'type', 'category', 'date']
const REQUIRED_SUBSCRIPTION_FIELDS = ['name', 'amount', 'cycle', 'dueDay', 'category']
const REQUIRED_PAYMENT_FIELDS = ['subscriptionId', 'monthKey']

function hasRequiredFields(obj, fields) {
  return fields.every(f => obj[f] !== undefined && obj[f] !== null)
}

export function validateImportData(data) {
  const errors = []

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Not a valid JSON object'], summary: null }
  }

  if (!Array.isArray(data.transactions)) {
    errors.push('"transactions" must be an array')
  }
  if (!Array.isArray(data.subscriptions)) {
    errors.push('"subscriptions" must be an array')
  }
  if (!Array.isArray(data.subscriptionPayments)) {
    errors.push('"subscriptionPayments" must be an array')
  }

  if (errors.length > 0) {
    return { valid: false, errors, summary: null }
  }

  const validTypes = ['income', 'expense']
  const validCycles = ['monthly', 'yearly']

  data.transactions.forEach((t, i) => {
    if (!hasRequiredFields(t, REQUIRED_TRANSACTION_FIELDS)) {
      errors.push(`Transaction #${i + 1}: missing required fields (amount, type, category, date)`)
    }
    if (typeof t.amount !== 'number' || t.amount <= 0) {
      errors.push(`Transaction #${i + 1}: amount must be a positive number`)
    }
    if (!validTypes.includes(t.type)) {
      errors.push(`Transaction #${i + 1}: type must be "income" or "expense"`)
    }
  })

  data.subscriptions.forEach((s, i) => {
    if (!hasRequiredFields(s, REQUIRED_SUBSCRIPTION_FIELDS)) {
      errors.push(`Subscription #${i + 1}: missing required fields (name, amount, cycle, dueDay, category)`)
    }
    if (typeof s.amount !== 'number' || s.amount <= 0) {
      errors.push(`Subscription #${i + 1}: amount must be a positive number`)
    }
    if (!validCycles.includes(s.cycle)) {
      errors.push(`Subscription #${i + 1}: cycle must be "monthly" or "yearly"`)
    }
    if (typeof s.dueDay !== 'number' || s.dueDay < 1 || s.dueDay > 31) {
      errors.push(`Subscription #${i + 1}: dueDay must be between 1 and 31`)
    }
  })

  data.subscriptionPayments.forEach((p, i) => {
    if (!hasRequiredFields(p, REQUIRED_PAYMENT_FIELDS)) {
      errors.push(`Payment #${i + 1}: missing required fields (subscriptionId, monthKey)`)
    }
  })

  if (errors.length > 0) {
    return { valid: false, errors, summary: null }
  }

  const amounts = data.transactions.reduce((acc, t) => {
    if (t.type === 'income') acc.income += t.amount
    else acc.expense += t.amount
    return acc
  }, { income: 0, expense: 0 })

  const dates = data.transactions.map(t => t.date).filter(Boolean).sort()
  const dateRange = dates.length > 0
    ? dates[0] + ' — ' + dates[dates.length - 1]
    : null

  return {
    valid: true,
    errors: [],
    summary: {
      transactions: data.transactions.length,
      subscriptions: data.subscriptions.length,
      payments: data.subscriptionPayments.length,
      totalIncome: amounts.income,
      totalExpense: amounts.expense,
      dateRange
    }
  }
}

export async function importData(data) {
  if (!data || !data.transactions || !data.subscriptions || !data.subscriptionPayments) {
    throw new Error('Invalid backup data format')
  }

  const db = await getDB()
  const tx = db.transaction(['transactions', 'subscriptions', 'subscriptionPayments'], 'readwrite')
  
  await tx.objectStore('transactions').clear()
  await tx.objectStore('subscriptions').clear()
  await tx.objectStore('subscriptionPayments').clear()
  
  for (const item of data.transactions) {
    await tx.objectStore('transactions').add(item)
  }
  for (const item of data.subscriptions) {
    await tx.objectStore('subscriptions').add(item)
  }
  for (const item of data.subscriptionPayments) {
    await tx.objectStore('subscriptionPayments').add(item)
  }
  
  await tx.done
}
