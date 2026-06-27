const DEFAULT_CURRENCY = {
  symbol: '฿',
  locale: 'th-TH',
  code: 'THB'
}

let currentCurrency = { ...DEFAULT_CURRENCY }

export function setCurrency(currency) {
  currentCurrency = { ...DEFAULT_CURRENCY, ...currency }
}

export function getCurrency() {
  return { ...currentCurrency }
}

export function formatCurrency(amount, options = {}) {
  const { showSign = false, compact = false } = options
  const absAmount = Math.abs(amount)
  
  let formatted
  if (compact && absAmount >= 1000000) {
    formatted = (absAmount / 1000000).toFixed(1) + 'M'
  } else if (compact && absAmount >= 1000) {
    formatted = (absAmount / 1000).toFixed(1) + 'K'
  } else {
    formatted = absAmount.toLocaleString(currentCurrency.locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })
  }
  
  const sign = showSign && amount > 0 ? '+' : (amount < 0 ? '-' : '')
  return `${sign}${currentCurrency.symbol}${formatted}`
}

export function parseCurrencyInput(value) {
  const cleaned = value.replace(/[^0-9.]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}
