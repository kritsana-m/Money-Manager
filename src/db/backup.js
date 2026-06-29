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
