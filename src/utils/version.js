export const APP_VERSION = '1.0.2'

export const CHANGELOG = [
  {
    version: '1.0.2',
    date: '2026-06-29',
    changes: [
      'Added JSON export/import for data backup and restore',
      'Manual backup and restore functionality in Sync tab',
      'New "Sync" tab in the bottom navigation bar',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-06-28',
    changes: [
      'Initial release',
      'Track income and expenses with daily breakdown',
      'Manage subscriptions with monthly payment tracking',
      'Visual charts for spending by category',
      'Installment plan support for subscriptions',
    ],
  },
]

export function getLastSeenVersion() {
  try {
    return localStorage.getItem('money-manager-version') || ''
  } catch {
    return ''
  }
}

export function setLastSeenVersion(version) {
  try {
    localStorage.setItem('money-manager-version', version)
  } catch {
    // localStorage not available
  }
}

export function hasNewVersion() {
  const lastSeen = getLastSeenVersion()
  return lastSeen !== APP_VERSION
}

export function getNewChangelogs() {
  const lastSeen = getLastSeenVersion()
  if (!lastSeen) return CHANGELOG
  return CHANGELOG.filter(entry => {
    return entry.version !== lastSeen
  })
}
