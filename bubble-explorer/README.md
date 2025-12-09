# Bubble Application Explorer

Outil automatisé d'exploration d'applications Bubble.io avec Playwright.

## Fonctionnalités

- **Exploration automatique des pages** : Détecte et visite toutes les pages accessibles
- **Capture d'écran complète** : Screenshots full-page de chaque page et interaction
- **Test des éléments interactifs** : Clique sur boutons, liens, menus, etc.
- **Détection des états UI** : Modals, popups, dropdowns, changements d'onglets
- **Mapping structuré** : Génère JSON + Markdown documentant toute l'application
- **Analyse automatique** : Rapport d'analyse des patterns UI et navigation

## Installation

```bash
cd bubble-explorer
npm install
npx playwright install chromium
```

## Utilisation

### 1. Explorer une application

```bash
# Mode headless (par défaut)
npm run explore -- https://votre-app.bubbleapps.io

# Mode visible (pour voir le navigateur)
set HEADLESS=false && npm run explore -- https://votre-app.bubbleapps.io
```

### 2. Analyser les résultats

```bash
npm run analyze
```

## Structure des outputs

```
exploration-results/
├── app-map.json              # Données structurées complètes
├── exploration-report.md     # Rapport lisible
├── analysis-report.md        # Analyse des patterns
├── summary.txt               # Résumé rapide
└── screenshots/
    ├── pages/                # Captures full-page
    ├── interactions/         # Avant/après chaque clic
    └── states/               # Modals, popups, etc.
```

## Format du mapping (app-map.json)

```json
{
  "metadata": {
    "baseUrl": "https://app.bubbleapps.io",
    "explorationDate": "2025-12-05T...",
    "totalPages": 12,
    "totalInteractions": 156,
    "totalScreenshots": 324
  },
  "pages": {
    "https://app.bubbleapps.io/home": {
      "title": "Home",
      "path": "/home",
      "elements": ["button_Save_...", "link_Settings_..."],
      "screenshot": "screenshots/pages/0001_page_home.png"
    }
  },
  "navigation": {
    "graph": {
      "/home": [
        { "to": "/settings", "trigger": "button_Settings", "elementText": "Settings" }
      ]
    }
  },
  "elements": {
    "button_Save_...": {
      "tagName": "button",
      "text": "Save",
      "selector": "#save-btn",
      "position": { "x": 100, "y": 200 },
      "interactions": [
        {
          "beforeScreenshot": "...",
          "afterScreenshot": "...",
          "stateChange": { "type": "modal" }
        }
      ]
    }
  },
  "states": {
    "modals": [...],
    "dropdowns": [...],
    "popups": [...]
  }
}
```

## Configuration

Modifier les constantes dans `explorer.js` :

```javascript
const CONFIG = {
  baseUrl: 'https://your-app.bubbleapps.io',

  // Timeouts (ms)
  navigationTimeout: 30000,
  actionTimeout: 5000,
  waitAfterClick: 1500,

  // Limites
  maxPages: 50,              // Nombre max de pages à explorer
  maxInteractionsPerPage: 100, // Interactions max par page
  maxDepth: 5,               // Profondeur max de navigation

  // Options
  headless: true,
  viewport: { width: 1920, height: 1080 }
};
```

## Cas d'usage

### Authentification requise

Si l'application nécessite une connexion, modifier `explorer.js` :

```javascript
async init() {
  // ... après création de la page

  // Aller sur la page de login
  await this.page.goto('https://app.bubbleapps.io/login');

  // Remplir le formulaire
  await this.page.fill('input[type="email"]', 'user@example.com');
  await this.page.fill('input[type="password"]', 'password');
  await this.page.click('button[type="submit"]');

  // Attendre la redirection
  await this.page.waitForNavigation();
}
```

### Explorer une partie spécifique

```bash
npm run explore -- https://app.bubbleapps.io/admin
```

### Exclure certains éléments

Ajouter au `CONFIG.ignoreSelectors` :

```javascript
ignoreSelectors: [
  '[class*="bubble-r-"]',
  '.footer',
  '.header-fixed',
  // Ajouter vos sélecteurs ici
]
```

## Limitations

- Ne gère pas les authentifications OAuth externes
- Les iframes ne sont pas explorées
- Les éléments chargés dynamiquement après scroll peuvent être manqués
- Les tests sont séquentiels (pas de parallélisation)

## Troubleshooting

### "Browser not found"
```bash
npx playwright install chromium
```

### Timeouts fréquents
Augmenter `navigationTimeout` et `waitAfterClick` dans la config.

### Trop d'éléments détectés
Réduire `maxInteractionsPerPage` ou affiner `interactiveSelectors`.

## License

MIT
