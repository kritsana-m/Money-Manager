const NOTE_MAX_LENGTH = 100
const BUDDHIST_YEAR_OFFSET = 543
const BUDDHIST_YEAR_THRESHOLD = 2400

function pad2(n) {
  return String(n).padStart(2, '0')
}

// DD/MM/YYYY, Buddhist year (>2400) converted to CE. Returns YYYY-MM-DD or null.
export function parseImportDate(str) {
  const m = String(str || '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return null
  let day = parseInt(m[1], 10)
  let month = parseInt(m[2], 10)
  let year = parseInt(m[3], 10)
  if (year > BUDDHIST_YEAR_THRESHOLD) year -= BUDDHIST_YEAR_OFFSET
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  const d = new Date(year, month - 1, day)
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null
  return `${year}-${pad2(month)}-${pad2(day)}`
}

export function parseImportAmount(str) {
  const n = parseFloat(String(str || '').replace(/,/g, '').trim())
  if (!Number.isFinite(n) || n <= 0) return null
  return n
}

function parseBlock(lines, blockIndex) {
  const fields = {}
  for (const line of lines) {
    const m = line.match(/^(Date|Type|Amount|Description)\s*:\s*(.*)$/i)
    if (m) fields[m[1].toLowerCase()] = m[2].trim()
  }
  if (!fields.date || !fields.type || !fields.amount) {
    return { error: `Block ${blockIndex + 1}: missing Date/Type/Amount` }
  }
  const date = parseImportDate(fields.date)
  if (!date) return { error: `Block ${blockIndex + 1}: invalid date "${fields.date}"` }
  const type = fields.type.toLowerCase()
  if (type !== 'expense' && type !== 'income') {
    return { error: `Block ${blockIndex + 1}: invalid type "${fields.type}" (use EXPENSE or INCOME)` }
  }
  const amount = parseImportAmount(fields.amount)
  if (amount === null) return { error: `Block ${blockIndex + 1}: invalid amount "${fields.amount}"` }
  return {
    item: {
      type,
      amount,
      category: 'other',
      note: (fields.description || '').trim().slice(0, NOTE_MAX_LENGTH),
      date
    }
  }
}

// Each record starts at a "Date:" line and runs until the next "Date:" line.
// Field order inside a record does not matter; Description is optional.
export function parseTransactionFile(text) {
  const transactions = []
  const errors = []
  if (!text || !text.trim()) return { transactions, errors }

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0)
  const blocks = []
  for (const line of lines) {
    if (/^date\s*:/i.test(line) && blocks.length > 0 && blocks[blocks.length - 1].length > 0) {
      blocks.push([])
    }
    if (blocks.length === 0) blocks.push([])
    blocks[blocks.length - 1].push(line)
  }
  let recordNo = 0
  blocks.forEach((block) => {
    if (!/^date\s*:/i.test(block[0])) {
      errors.push(`Lines before first "Date:" were skipped (${block.length} line(s))`)
      return
    }
    const { item, error } = parseBlock(block, recordNo)
    recordNo++
    if (item) transactions.push(item)
    else errors.push(error)
  })
  return { transactions, errors }
}

export function dedupeTransactions(parsed, existing) {
  const seen = new Set(
    (existing || []).map(t => `${t.date}|${t.amount}|${t.type}|${(t.note || '').trim()}`)
  )
  const items = []
  let duplicates = 0
  for (const t of parsed) {
    const key = `${t.date}|${t.amount}|${t.type}|${(t.note || '').trim()}`
    if (seen.has(key)) {
      duplicates++
    } else {
      seen.add(key)
      items.push(t)
    }
  }
  return { items, duplicates }
}

export function summarizeImport(items) {
  return {
    count: items.length,
    totalIncome: items.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    totalExpense: items.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  }
}
