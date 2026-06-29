const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3/files'
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const REDIRECT_URI = window.location.origin + window.location.pathname
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata'

// PKCE Helpers
function generateRandomString(length) {
  const array = new Uint32Array(length)
  window.crypto.getRandomValues(array)
  return Array.from(array, dec => ('0' + dec.toString(16)).slice(-2)).join('')
}

async function sha256(plain) {
  const encoder = new TextEncoder()
  const data = encoder.encode(plain)
  return window.crypto.subtle.digest('SHA-256', data)
}

function base64urlencode(a) {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(a)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function initiateLogin() {
  const state = generateRandomString(16)
  const codeVerifier = generateRandomString(32)
  const codeChallenge = base64urlencode(await sha256(codeVerifier))

  localStorage.setItem('google_oauth_state', state)
  localStorage.setItem('google_oauth_verifier', codeVerifier)

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES,
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    prompt: 'consent',
    access_type: 'offline'
  })

  window.location.href = `${AUTH_URL}?${params.toString()}`
}

export async function handleCallback() {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  const state = params.get('state')
  const storedState = localStorage.getItem('google_oauth_state')
  const codeVerifier = localStorage.getItem('google_oauth_verifier')

  if (!code || state !== storedState) {
    throw new Error('Invalid OAuth state or missing code')
  }

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier
    })
  })

  const tokens = await response.json()
  if (tokens.error) throw new Error(tokens.error_description || tokens.error)

  saveTokens(tokens)
  
  // Clean up
  localStorage.removeItem('google_oauth_state')
  localStorage.removeItem('google_oauth_verifier')
  window.history.replaceState({}, document.title, window.location.pathname)
  
  return tokens
}

function saveTokens(tokens) {
  const expiry = Date.now() + (tokens.expires_in * 1000)
  localStorage.setItem('google_access_token', tokens.access_token)
  localStorage.setItem('google_token_expiry', expiry.toString())
  if (tokens.refresh_token) {
    localStorage.setItem('google_refresh_token', tokens.refresh_token)
  }
}

async function getAccessToken() {
  const expiry = parseInt(localStorage.getItem('google_token_expiry') || '0')
  const refreshToken = localStorage.getItem('google_refresh_token')

  if (Date.now() >= expiry - 60000 && refreshToken) {
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    })
    const tokens = await response.json()
    if (tokens.access_token) {
      saveTokens(tokens)
      return tokens.access_token
    }
  }
  return localStorage.getItem('google_access_token')
}

export async function findBackupFile() {
  const token = await getAccessToken()
  if (!token) return null

  const params = new URLSearchParams({
    spaces: 'appDataFolder',
    q: "name = 'money-manager-backup.json'",
    fields: 'files(id, name, modifiedTime)'
  })

  const response = await fetch(`${DRIVE_API_URL}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const data = await response.json()
  return data.files && data.files.length > 0 ? data.files[0] : null
}

export async function uploadBackup(jsonData) {
  const token = await getAccessToken()
  const existingFile = await findBackupFile()
  
  const metadata = {
    name: 'money-manager-backup.json',
    parents: ['appDataFolder']
  }

  const file = new Blob([JSON.stringify(jsonData)], { type: 'application/json' })
  const formData = new FormData()
  formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
  formData.append('file', file)

  let url = `${DRIVE_UPLOAD_URL}?uploadType=multipart`
  let method = 'POST'

  if (existingFile) {
    url = `${DRIVE_UPLOAD_URL}/${existingFile.id}?uploadType=media`
    method = 'PATCH'
    
    // For PATCH media, we just send the body
    const response = await fetch(url, {
      method,
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(jsonData)
    })
    return response.json()
  }

  const response = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  })
  return response.json()
}

export async function downloadBackup(fileId) {
  const token = await getAccessToken()
  const response = await fetch(`${DRIVE_API_URL}/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.json()
}

export function logout() {
  localStorage.removeItem('google_access_token')
  localStorage.removeItem('google_refresh_token')
  localStorage.removeItem('google_token_expiry')
}

export function isLoggedIn() {
  return !!localStorage.getItem('google_access_token')
}
