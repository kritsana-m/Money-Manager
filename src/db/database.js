import { openDB } from 'idb'

const DB_NAME = 'money-manager'
const DB_VERSION = 1

let dbPromise = null

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Transactions store
        if (!db.objectStoreNames.contains('transactions')) {
          const txStore = db.createObjectStore('transactions', {
            keyPath: 'id',
            autoIncrement: true
          })
          txStore.createIndex('date', 'date')
          txStore.createIndex('type', 'type')
          txStore.createIndex('category', 'category')
          txStore.createIndex('monthKey', 'monthKey')
        }

        // Subscriptions store
        if (!db.objectStoreNames.contains('subscriptions')) {
          db.createObjectStore('subscriptions', {
            keyPath: 'id',
            autoIncrement: true
          })
        }

        // Subscription payments store (tracks paid/unpaid per month)
        if (!db.objectStoreNames.contains('subscriptionPayments')) {
          const payStore = db.createObjectStore('subscriptionPayments', {
            keyPath: 'id',
            autoIncrement: true
          })
          payStore.createIndex('subscriptionId', 'subscriptionId')
          payStore.createIndex('monthKey', 'monthKey')
          payStore.createIndex('subMonth', ['subscriptionId', 'monthKey'])
        }
      }
    })
  }
  return dbPromise
}

export async function clearAllData() {
  const db = await getDB()
  const tx = db.transaction(['transactions', 'subscriptions', 'subscriptionPayments'], 'readwrite')
  await Promise.all([
    tx.objectStore('transactions').clear(),
    tx.objectStore('subscriptions').clear(),
    tx.objectStore('subscriptionPayments').clear(),
    tx.done
  ])
}
