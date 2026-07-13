# Google Drive Backup Implementation Plan (OAuth 2.0 PKCE & App Data Folder)

This document outlines the plan to implement a secure, client-side Google Drive backup solution for the Money Manager application using the OAuth 2.0 PKCE flow and the Google Drive `appDataFolder`.

## 1. Objectives
- Enable users to back up and restore their financial data to/from Google Drive.
- Ensure security by using OAuth 2.0 with PKCE (Proof Key for Code Exchange) for client-side authentication.
- Maintain privacy by using the `appDataFolder` (restricted to the application only).
- Implement a pure client-side solution without requiring a custom backend.

## 2. Technical Components

### A. OAuth 2.0 with PKCE
Since this is a client-side application (Single Page App or Mobile), PKCE is the recommended security standard to prevent authorization code injection.
1. **Code Verifier**: Generate a high-entropy cryptographic random string.
2. **Code Challenge**: Create a SHA-256 hash of the verifier and Base64URL encode it.
3. **Authorization Request**: Redirect the user to Google's OAuth endpoint with `code_challenge` and `code_challenge_method=S256`.
4. **Token Exchange**: After redirect back, exchange the `code` for an `access_token` and `refresh_token` by providing the original `code_verifier`.

### B. Google Drive App Data Folder
- **Scope**: Use the `https://www.googleapis.com/auth/drive.appdata` scope.
- **Privacy**: Files in this folder are hidden from the user's main Drive view and cannot be accessed by other apps.
- **Usage**: Perfect for storing configuration files, database exports, or application-specific backups.

## 3. Implementation Steps

### Phase 1: Google Cloud Project Setup
1. Create a project in the [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the **Google Drive API**.
3. Configure the **OAuth Consent Screen** (External, add the `drive.appdata` scope).
4. Create **OAuth 2.0 Client IDs** (Application type: Web or Android/iOS).
5. Add authorized redirect URIs (e.g., `http://localhost:3000` for development).

### Phase 2: Authentication Flow
1. Implement the PKCE generation logic (Verifier and Challenge).
2. Store the `code_verifier` in `sessionStorage` or secure local storage before redirection.
3. Handle the OAuth callback:
   - Extract the `code` from the URL.
   - Exchange it for tokens via `POST https://oauth2.googleapis.com/token`.
   - Store `access_token` (short-lived) and `refresh_token` (long-lived) securely.

### Phase 3: Backup/Restore Logic
1. **Discovery**: Check if a backup file exists in the `appDataFolder` using `GET https://www.googleapis.com/drive/v3/files?spaces=appDataFolder`.
2. **Upload (Backup)**:
   - To create: `POST https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`.
   - To update: `PATCH https://www.googleapis.com/upload/drive/v3/files/FILE_ID?uploadType=media`.
3. **Download (Restore)**:
   - `GET https://www.googleapis.com/drive/v3/files/FILE_ID?alt=media`.

## 4. Security Considerations
- **Refresh Token Storage**: Use secure storage mechanisms. For web, consider encrypted local storage or encrypted cookies.
- **Token Expiry**: Implement logic to use the `refresh_token` when the `access_token` expires.
- **Minimal Scopes**: Only request `drive.appdata`, never full `drive` access.

## 5. User Experience
- Provide a "Connect to Google Drive" button in the settings.
- Show the last backup timestamp.
- Include a manual "Backup Now" and "Restore" button.
- Optional: Implement auto-backup on app close or significant changes.
