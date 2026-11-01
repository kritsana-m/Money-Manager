# Google Sheets Sync (Apps Script)

A tiny no-server backend that lets the Money Manager PWA and iPhone
Shortcuts read/write a Google Sheet over plain HTTP.

```
iPhone Shortcut (bank noti)
    │  POST text block (Date:/Type:/Amount:/Description:)
    ▼
Apps Script web app (doPost) ──► appends row ──► Google Sheet tab "Transactions"
    ▲
    │  GET (doGet) → JSON
Money Manager PWA: Data tab ▸ Google Sheet ▸ Pull
```

The PWA only **pulls** (read-only). Shortcuts only **push**. No conflicts,
no overwrites. The app deduplicates on every pull via `dedupeTransactions`.

---

## 1. Set up Google Sheets

1. Create a Google Sheet (or reuse one).
2. From the address bar copy the **Spreadsheet ID** — the long id in
   `https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit`.

If you prefer, write the header row yourself on a tab named `Transactions`:

```
Date | Type | Amount | Note | Source | CreatedAt
```

(If the tab is missing the script creates it automatically. `CreatedAt` is
written as local Bangkok time, `+07:00`, in `YYYY-MM-DD HH:mm:ss` format.)

## 2. Set up Apps Script

1. In the sheet: **Extensions ▸ Apps Script**.
2. Delete the default code, paste the whole contents of `code.gs`, save
   (name the project anything, e.g. `money-manager-sync`).
3. In Apps Script: **Project Settings ▸ Script Properties ▸ Add property**:
   - `SHEET_ID` = the Spreadsheet ID from step 1
   - `TOKEN` = any secret string you choose (leave it out for no token,
     but don't)

## 3. Deploy as a Web App

1. **Deploy ▸ New deployment ▸ type "Web app"**.
2. Settings:
   - **Execute as**: Me
   - **Who has access**: Anyone
3. Deploy. Copy the **Web app URL** (ends in `/exec`).
4. **Every time you edit `code.gs` re-deploy**: Deploy ▸ Manage
   deployments ▸ ⋮ ▸ Edit ▸ **Version: New version** ▸ Deploy. The URL
   stays the same.

## 4. Test it

Open the `/exec` URL in a browser, appending your token:

```
https://script.google.com/macros/s/<...>/exec?key=YOUR_TOKEN
```

You should see `{"ok":true,"count":0,"transactions":[]}`.

To push a test row (from a terminal / Shortcuts "Get Contents of URL"):

```
POST <web-app-url>?key=YOUR_TOKEN
Content-Type: text/plain

Date: 31/10/2026
Type: expense
Amount: 250
Description: Coffee at the mall
```

Response: `{"ok":true,"added":1,"skipped":0,"errors":[]}`.

## 5. Connect the PWA

1. Open the Money Manager app ▸ **Data** tab.
2. Open **Google Sheet** ▸ **Configure**.
3. Paste the `/exec` Web App URL and the same `TOKEN`.
4. Tap **Pull**. New rows appear in the preview; confirm to add them to
   the app (duplicates are skipped automatically).

## 6. iPhone Shortcut (optional, replaces txt file)

Make the Shortcut build the same text block it already writes to the txt
file, but instead of "Save File" use **Get Contents of URL**:

- Method: `POST`
- Headers: `none` (body is plain text)
- Request Body: `Text` → the block
- URL: `<web-app-url>?key=YOUR_TOKEN`

Now tapping the shortcut appends straight to your sheet, and the next
app pull picks it up. You can keep the existing Save File + manual
import as a fallback.

---

## Security notes (read before trusting this)

- The PWA is a static site on GitHub Pages — it has no login. The web
  app must be "Anyone" so the browser can read it, and the token lives
  in the app's local storage/bundle.
- So **anyone who learns the URL + token can read all your
  transactions**. The token only stops random link-guessing, it is not
  a password. Do not reuse a password as the token.
- The `Transactions` sheet is a plain Google Sheet: use a throwaway
  Google account or keep it private and never share the sheet link.

## API reference

| Method | Params | Returns |
| --- | --- | --- |
| `GET` | `?key=<token>` | `{ ok, count, transactions: [{date, type, amount, note, source}] }` |
| `POST` text block | body = one or more `Date:/Type:/Amount:/Description:` blocks, `?key=<token>` | `{ ok, added, skipped, errors }` |
| `POST` structured | form fields `date,type,amount,note` (DD/MM/YYYY or YYYY-MM-DD dates), `?key=<token>` | `{ ok, added, skipped, errors }` |
