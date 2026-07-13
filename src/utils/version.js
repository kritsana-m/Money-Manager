export const APP_VERSION = '1.0.1'

export const CHANGELOG = [
  {
    version: '1.0.1',
    date: '2026-06-29',
    changes: [
      'Added Google Drive Sync & Backup feature',
      'Implemented OAuth 2.0 PKCE for secure client-side authentication',
      'Uses drive.appdata scope to keep backups private to the app',
      'Added manual backup and restore functionality',
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
