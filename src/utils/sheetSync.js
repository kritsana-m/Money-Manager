// Google Sheets sync (pull-only). Reads transactions written to a Google
// Sheet by the Apps Script web app in /google-apps-script.
const CONFIG_KEY = 'money-manager-sheet-config'

export function getSheetConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setSheetConfig(config) {
  localStorage.setItem(
    CONFIG_KEY,
    JSON.stringify({ url: (config?.url || '').trim(), token: (config?.token || '').trim() })
  )
}

export function clearSheetConfig() {
  localStorage.removeItem(CONFIG_KEY)
}

// Append the optional secret token to the /exec web app URL.
export function buildSheetUrl(base, token) {
  const trimmed = (base || '').trim()
  if (!trimmed) return ''
  const tokenValue = (token || '').trim()
  if (!tokenValue) return trimmed
  try {
    const u = new URL(trimmed)
    const p = new URLSearchParams(u.search)
    p.set('key', tokenValue)
    u.search = p.toString()
    return u.toString()
  } catch {
    return trimmed + (trimmed.includes('?') ? '&' : '?') + 'key=' + encodeURIComponent(tokenValue)
  }
}

// GET the ledger from the Apps Script web app.
export async function fetchSheetTransactions(config) {
  const target = buildSheetUrl(config?.url, config?.token)
  if (!target) throw new Error('Missing Google Sheets web app URL')

  const res = await fetch(target)
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`)

  let data
  try {
    data = await res.json()
  } catch {
    throw new Error('Response was not valid JSON — check the web app URL and that it ends with /exec')
  }
  if (!data || data.ok !== true) {
    throw new Error((data && data.error) || 'Google Sheet returned an error')
  }
  return data
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

function isValidIsoDate(str) {
  const m = ISO_DATE.exec(String(str || '').trim())
  if (!m) return false
  const y = Number(m[1]); const mo = Number(m[2]); const d = Number(m[3])
  const dt = new Date(y, mo - 1, d)
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d
}

// Normalise raw sheet rows into app transaction items (category defaults to
// 'other', same as the txt importer). Invalid rows become errors instead of
// silently importing junk.
export function sheetRowsToItems(rows) {
  const items = []
  const errors = []

  for (const row of rows || []) {
    const date = String(row?.date || '').trim()
    const type = String(row?.type || '').trim().toLowerCase()
    const rawAmount = row?.amount
    const amount = typeof rawAmount === 'number'
      ? rawAmount
      : parseFloat(String(rawAmount || '').replace(/,/g, ''))
    const note = String(row?.note || '').trim()

    const empty = !date && !type && (rawAmount === undefined || rawAmount === null || String(rawAmount).trim() === '')
    if (empty) continue // blank row in the sheet

    if (!isValidIsoDate(date)) { errors.push(`Row: invalid date "${date || '(empty)'}"`); continue }
    if (type !== 'income' && type !== 'expense') { errors.push(`${date}: invalid type "${type}"`); continue }
    if (!Number.isFinite(amount) || amount <= 0) { errors.push(`${date}: invalid amount "${rawAmount}"`); continue }

    items.push({ date, type, amount, category: 'other', note: note.slice(0, 100) })
  }

  return { items, errors }
}
