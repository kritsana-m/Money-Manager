# Money Manager PWA

🔗 [Live App](https://kritsana-m.github.io/Money-Manager/)

A mobile-first, offline-capable Progressive Web App for personal finance and money management. Built using React 19, Vite, and IndexedDB.

## Features
- **Offline First**: All data is persisted locally in IndexedDB (via the lightweight `idb` wrapper).
- **Transactions & Subscriptions**: Track monthly income, expenses, and installment-style or ongoing subscriptions.
- **Claude Design Aesthetic**: Cream backgrounds, soft clay/sage tones, rounded borders, and clean typography.
- **Progressive Web App**: Fully installable on iOS, Android, and Desktop platforms.

---

## Getting Started

### Installation
```bash
npm install
```

### Run Locally (Development)
```bash
npm run dev
```

---

## Deployment to GitHub Pages

### Manual Deployment
You can manually deploy the built PWA to GitHub Pages using the configured deploy script:

1. Build and push the static site to the `gh-pages` branch:
   ```bash
   npm run deploy
   ```
2. Navigate to your repository on GitHub.
3. Go to **Settings > Pages**.
4. Under **Build and deployment**, ensure the source is set to **Deploy from a branch**.
5. Select the `gh-pages` branch and set the folder to `/` (root), then click **Save**.

### Automatic Deployment (CI/CD)
A GitHub Actions workflow is pre-configured in `.github/workflows/deploy.yml`. 
Every time you push changes to the `main` branch, it will automatically build the app and deploy it to the `gh-pages` branch.

