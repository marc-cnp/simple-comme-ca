/**
 * Bubble Application Explorer
 *
 * Automated exploration of Bubble.io applications
 * Captures screenshots, maps navigation, and documents all interactive elements
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // URL de l'application (passée en argument ou définie ici)
  baseUrl: process.argv[2] || 'https://your-app.bubbleapps.io',

  // Credentials pour l'authentification (optionnel)
  auth: {
    enabled: true,
    email: 'marc+admin@evodev.co',
    password: 'Azerty123***'
  },

  // Dossier de sortie
  outputDir: './exploration-results',

  // Timeouts
  navigationTimeout: 30000,
  actionTimeout: 5000,
  waitAfterClick: 1500,

  // Limites
  maxPages: 50,
  maxInteractionsPerPage: 100,
  maxDepth: 5,

  // Options
  headless: process.env.HEADLESS !== 'false',
  viewport: { width: 1920, height: 1080 },

  // Sélecteurs à ignorer (éléments système Bubble)
  ignoreSelectors: [
    '[class*="bubble-r-"]', // Éléments Bubble internes
    'iframe',
    'script',
    'style',
    'noscript'
  ],

  // Sélecteurs d'éléments interactifs
  interactiveSelectors: [
    'a[href]',
    'button',
    '[role="button"]',
    '[onclick]',
    '[class*="clickable"]',
    '[class*="button"]',
    '[class*="btn"]',
    '[class*="link"]',
    '[class*="tab"]',
    '[class*="menu"]',
    '[class*="dropdown"]',
    '[class*="toggle"]',
    '[class*="icon"]',
    'input[type="submit"]',
    'input[type="button"]',
    '[tabindex="0"]',
    '[data-action]',
    '.bubble-element[class*="Group"]'
  ]
};

// Structure de données pour le mapping
const appMap = {
  metadata: {
    baseUrl: CONFIG.baseUrl,
    explorationDate: new Date().toISOString(),
    totalPages: 0,
    totalInteractions: 0,
    totalScreenshots: 0
  },
  pages: {},
  navigation: {
    graph: {},
    paths: []
  },
  elements: {},
  states: {
    popups: [],
    modals: [],
    dropdowns: [],
    tabs: []
  },
  errors: []
};

// État de l'exploration
const explorationState = {
  visitedUrls: new Set(),
  visitedElements: new Set(),
  pendingUrls: [],
  currentDepth: 0
};

// Utilitaires
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function sanitizeFilename(name) {
  return name.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
}

function generateElementId(element) {
  return `${element.tagName}_${element.text?.substring(0, 20) || ''}_${element.selector}`.replace(/[^a-z0-9]/gi, '_');
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Classe principale d'exploration
class BubbleExplorer {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.screenshotCounter = 0;
  }

  async init() {
    console.log('🚀 Initializing Bubble Explorer...');
    console.log(`📍 Target URL: ${CONFIG.baseUrl}`);

    ensureDir(CONFIG.outputDir);
    ensureDir(path.join(CONFIG.outputDir, 'screenshots'));
    ensureDir(path.join(CONFIG.outputDir, 'screenshots', 'pages'));
    ensureDir(path.join(CONFIG.outputDir, 'screenshots', 'interactions'));
    ensureDir(path.join(CONFIG.outputDir, 'screenshots', 'states'));

    this.browser = await chromium.launch({
      headless: CONFIG.headless,
      args: ['--disable-web-security', '--disable-features=IsolateOrigins,site-per-process']
    });

    this.context = await this.browser.newContext({
      viewport: CONFIG.viewport,
      ignoreHTTPSErrors: true,
      permissions: ['geolocation', 'notifications']
    });

    this.page = await this.context.newPage();
    this.page.setDefaultTimeout(CONFIG.navigationTimeout);

    // Intercepter les erreurs console
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        appMap.errors.push({
          type: 'console',
          message: msg.text(),
          timestamp: new Date().toISOString()
        });
      }
    });

    // Intercepter les erreurs de page
    this.page.on('pageerror', error => {
      appMap.errors.push({
        type: 'page',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    });

    console.log('✅ Browser initialized');

    // Authentification si configurée
    if (CONFIG.auth.enabled) {
      await this.authenticate();
    }
  }

  async authenticate() {
    console.log('🔐 Authenticating...');

    try {
      await this.page.goto(CONFIG.baseUrl, { waitUntil: 'networkidle', timeout: CONFIG.navigationTimeout });
      await sleep(3000); // Attendre le chargement Bubble

      // Chercher le champ email
      const emailInput = await this.page.$('input[type="email"], input[placeholder*="mail"], input[placeholder*="Email"]');
      if (emailInput) {
        await emailInput.fill(CONFIG.auth.email);
        console.log('   ✓ Email entered');
      }

      // Chercher le champ password
      const passwordInput = await this.page.$('input[type="password"]');
      if (passwordInput) {
        await passwordInput.fill(CONFIG.auth.password);
        console.log('   ✓ Password entered');
      }

      // Chercher le bouton de connexion
      const loginButton = await this.page.$('button:has-text("Se connecter"), button:has-text("Connexion"), button:has-text("Login"), [class*="button"]:has-text("connecter")');
      if (loginButton) {
        await loginButton.click();
        console.log('   ✓ Login button clicked');
      }

      // Attendre la navigation post-login
      await sleep(5000);
      await this.page.waitForLoadState('networkidle');

      const currentUrl = this.page.url();
      console.log(`✅ Authenticated! Current URL: ${currentUrl}`);

      // Screenshot de l'état post-login
      await this.takeScreenshot('post_login', 'pages');

    } catch (error) {
      console.log(`⚠️ Authentication error: ${error.message}`);
      appMap.errors.push({ type: 'auth', message: error.message });
    }
  }

  async takeScreenshot(name, type = 'pages') {
    const filename = `${String(this.screenshotCounter++).padStart(4, '0')}_${sanitizeFilename(name)}.png`;
    const filepath = path.join(CONFIG.outputDir, 'screenshots', type, filename);

    await this.page.screenshot({
      path: filepath,
      fullPage: true
    });

    appMap.metadata.totalScreenshots++;
    return filepath;
  }

  async getPageInfo() {
    return await this.page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        path: window.location.pathname,
        hash: window.location.hash,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          scrollHeight: document.documentElement.scrollHeight
        }
      };
    });
  }

  async detectInteractiveElements() {
    const elements = [];

    for (const selector of CONFIG.interactiveSelectors) {
      try {
        const found = await this.page.$$(selector);

        for (let i = 0; i < found.length && elements.length < CONFIG.maxInteractionsPerPage; i++) {
          const el = found[i];

          try {
            const isVisible = await el.isVisible();
            if (!isVisible) continue;

            const box = await el.boundingBox();
            if (!box || box.width < 5 || box.height < 5) continue;

            const info = await el.evaluate((node) => {
              const rect = node.getBoundingClientRect();
              const styles = window.getComputedStyle(node);

              return {
                tagName: node.tagName.toLowerCase(),
                id: node.id || null,
                className: node.className || null,
                text: (node.innerText || node.textContent || '').trim().substring(0, 100),
                href: node.href || null,
                type: node.type || null,
                role: node.getAttribute('role'),
                ariaLabel: node.getAttribute('aria-label'),
                dataAttributes: Object.fromEntries(
                  Array.from(node.attributes)
                    .filter(a => a.name.startsWith('data-'))
                    .map(a => [a.name, a.value])
                ),
                position: {
                  x: rect.x,
                  y: rect.y,
                  width: rect.width,
                  height: rect.height
                },
                styles: {
                  cursor: styles.cursor,
                  pointerEvents: styles.pointerEvents,
                  visibility: styles.visibility,
                  display: styles.display
                }
              };
            });

            // Générer un sélecteur unique
            const uniqueSelector = await el.evaluate((node) => {
              if (node.id) return `#${node.id}`;

              const path = [];
              let current = node;

              while (current && current.nodeType === Node.ELEMENT_NODE) {
                let selector = current.tagName.toLowerCase();

                if (current.id) {
                  selector = `#${current.id}`;
                  path.unshift(selector);
                  break;
                }

                if (current.className && typeof current.className === 'string') {
                  const classes = current.className.trim().split(/\s+/).slice(0, 2).join('.');
                  if (classes) selector += `.${classes}`;
                }

                const parent = current.parentElement;
                if (parent) {
                  const siblings = Array.from(parent.children).filter(c => c.tagName === current.tagName);
                  if (siblings.length > 1) {
                    const index = siblings.indexOf(current) + 1;
                    selector += `:nth-of-type(${index})`;
                  }
                }

                path.unshift(selector);
                current = current.parentElement;
              }

              return path.join(' > ');
            });

            elements.push({
              ...info,
              selector: uniqueSelector,
              originalSelector: selector,
              elementIndex: i
            });

          } catch (e) {
            // Élément probablement détaché du DOM
          }
        }
      } catch (e) {
        // Sélecteur invalide ou erreur
      }
    }

    // Dédupliquer par position
    const unique = [];
    const positions = new Set();

    for (const el of elements) {
      const posKey = `${Math.round(el.position.x)}_${Math.round(el.position.y)}`;
      if (!positions.has(posKey)) {
        positions.add(posKey);
        unique.push(el);
      }
    }

    return unique;
  }

  async detectStateChange(beforeState, afterState) {
    const changes = {
      urlChanged: beforeState.url !== afterState.url,
      titleChanged: beforeState.title !== afterState.title,
      scrollHeightChanged: beforeState.scrollHeight !== afterState.scrollHeight,
      newElements: [],
      removedElements: [],
      type: 'none'
    };

    // Détecter les popups/modals
    const modals = await this.page.$$('[class*="modal"], [class*="popup"], [class*="dialog"], [role="dialog"]');
    if (modals.length > 0) {
      changes.type = 'modal';
      for (const modal of modals) {
        try {
          const isVisible = await modal.isVisible();
          if (isVisible) {
            const info = await modal.evaluate(node => ({
              className: node.className,
              id: node.id,
              text: (node.innerText || '').substring(0, 200)
            }));
            changes.newElements.push(info);
          }
        } catch (e) {}
      }
    }

    // Détecter les dropdowns
    const dropdowns = await this.page.$$('[class*="dropdown"][style*="visible"], [class*="dropdown"][style*="block"], [class*="menu"][style*="visible"]');
    if (dropdowns.length > 0) {
      changes.type = 'dropdown';
    }

    // Détecter changement d'onglet
    const activeTab = await this.page.$('[class*="tab"][class*="active"], [aria-selected="true"]');
    if (activeTab) {
      changes.type = 'tab';
    }

    if (changes.urlChanged) {
      changes.type = 'navigation';
    }

    return changes;
  }

  async getCurrentState() {
    return await this.page.evaluate(() => ({
      url: window.location.href,
      title: document.title,
      scrollHeight: document.documentElement.scrollHeight,
      visibleElements: document.querySelectorAll('*:not(script):not(style)').length
    }));
  }

  async explorePage(url, depth = 0) {
    if (depth > CONFIG.maxDepth) {
      console.log(`⚠️ Max depth reached for ${url}`);
      return;
    }

    if (explorationState.visitedUrls.has(url)) {
      return;
    }

    if (Object.keys(appMap.pages).length >= CONFIG.maxPages) {
      console.log('⚠️ Max pages limit reached');
      return;
    }

    console.log(`\n📄 Exploring page: ${url} (depth: ${depth})`);
    explorationState.visitedUrls.add(url);

    try {
      await this.page.goto(url, { waitUntil: 'networkidle', timeout: CONFIG.navigationTimeout });
      await sleep(2000); // Attendre le chargement complet Bubble

    } catch (e) {
      console.log(`❌ Failed to load ${url}: ${e.message}`);
      appMap.errors.push({ type: 'navigation', url, message: e.message });
      return;
    }

    const pageInfo = await this.getPageInfo();
    const pageName = sanitizeFilename(pageInfo.path || 'home');

    // Screenshot de la page
    const pageScreenshot = await this.takeScreenshot(`page_${pageName}`, 'pages');

    // Détecter les éléments interactifs
    console.log('🔍 Scanning interactive elements...');
    const elements = await this.detectInteractiveElements();
    console.log(`   Found ${elements.length} interactive elements`);

    // Enregistrer la page
    appMap.pages[url] = {
      ...pageInfo,
      screenshot: pageScreenshot,
      elements: elements.map(e => generateElementId(e)),
      exploredAt: new Date().toISOString(),
      depth
    };
    appMap.metadata.totalPages++;

    // Enregistrer les éléments
    for (const element of elements) {
      const elementId = generateElementId(element);
      appMap.elements[elementId] = {
        ...element,
        foundOnPages: [url],
        interactions: []
      };
    }

    // Explorer les éléments interactifs
    console.log('🖱️ Testing interactions...');
    let interactionCount = 0;

    for (const element of elements) {
      if (interactionCount >= CONFIG.maxInteractionsPerPage) break;

      const elementId = generateElementId(element);

      // Éviter les éléments déjà testés avec le même comportement
      if (explorationState.visitedElements.has(elementId)) continue;
      explorationState.visitedElements.add(elementId);

      try {
        // État avant le clic
        const beforeState = await this.getCurrentState();
        const beforeScreenshot = await this.takeScreenshot(
          `before_${pageName}_${sanitizeFilename(element.text || element.tagName)}`,
          'interactions'
        );

        // Essayer de cliquer
        const el = await this.page.$(element.selector);
        if (!el) continue;

        const isVisible = await el.isVisible().catch(() => false);
        if (!isVisible) continue;

        console.log(`   → Clicking: ${element.text?.substring(0, 30) || element.tagName}`);

        await el.click({ timeout: CONFIG.actionTimeout }).catch(() => {});
        await sleep(CONFIG.waitAfterClick);

        // État après le clic
        const afterState = await this.getCurrentState();
        const afterScreenshot = await this.takeScreenshot(
          `after_${pageName}_${sanitizeFilename(element.text || element.tagName)}`,
          'interactions'
        );

        // Analyser les changements
        const stateChange = await this.detectStateChange(beforeState, afterState);

        // Enregistrer l'interaction
        const interaction = {
          elementId,
          beforeScreenshot,
          afterScreenshot,
          beforeState,
          afterState,
          stateChange,
          timestamp: new Date().toISOString()
        };

        appMap.elements[elementId].interactions.push(interaction);
        appMap.metadata.totalInteractions++;
        interactionCount++;

        // Si nouvelle page découverte, l'ajouter à la liste
        if (stateChange.urlChanged && !explorationState.visitedUrls.has(afterState.url)) {
          const newUrl = afterState.url;
          if (newUrl.startsWith(CONFIG.baseUrl) || newUrl.includes(new URL(CONFIG.baseUrl).hostname)) {
            explorationState.pendingUrls.push({ url: newUrl, depth: depth + 1 });

            // Enregistrer la navigation
            if (!appMap.navigation.graph[url]) {
              appMap.navigation.graph[url] = [];
            }
            appMap.navigation.graph[url].push({
              to: newUrl,
              trigger: elementId,
              elementText: element.text
            });
          }

          // Revenir à la page originale
          await this.page.goto(url, { waitUntil: 'networkidle' });
          await sleep(1000);
        }

        // Si modal/popup, le documenter et le fermer
        if (stateChange.type === 'modal' || stateChange.type === 'dropdown') {
          appMap.states[stateChange.type === 'modal' ? 'modals' : 'dropdowns'].push({
            trigger: elementId,
            triggerText: element.text,
            page: url,
            screenshot: afterScreenshot,
            content: stateChange.newElements
          });

          // Essayer de fermer le modal
          await this.page.keyboard.press('Escape');
          await sleep(500);
        }

      } catch (e) {
        // Ignorer les erreurs d'interaction
      }
    }

    // Collecter les nouveaux liens pour exploration
    const links = await this.page.$$eval('a[href]', anchors =>
      anchors.map(a => a.href).filter(href => href && !href.startsWith('javascript:'))
    );

    for (const link of links) {
      if (!explorationState.visitedUrls.has(link)) {
        const linkUrl = new URL(link, CONFIG.baseUrl);
        if (linkUrl.hostname === new URL(CONFIG.baseUrl).hostname) {
          explorationState.pendingUrls.push({ url: link, depth: depth + 1 });
        }
      }
    }

    console.log(`✅ Page explored: ${interactionCount} interactions tested`);
  }

  async explore() {
    console.log('\n🔬 Starting exploration...\n');

    // Explorer la page d'accueil
    await this.explorePage(CONFIG.baseUrl, 0);

    // Explorer les pages découvertes
    while (explorationState.pendingUrls.length > 0) {
      const { url, depth } = explorationState.pendingUrls.shift();
      await this.explorePage(url, depth);
    }

    console.log('\n✅ Exploration complete!');
  }

  async generateReport() {
    console.log('\n📝 Generating report...');

    // Sauvegarder le JSON complet
    const jsonPath = path.join(CONFIG.outputDir, 'app-map.json');
    fs.writeFileSync(jsonPath, JSON.stringify(appMap, null, 2));
    console.log(`   JSON saved: ${jsonPath}`);

    // Générer le rapport Markdown
    const markdown = this.generateMarkdownReport();
    const mdPath = path.join(CONFIG.outputDir, 'exploration-report.md');
    fs.writeFileSync(mdPath, markdown);
    console.log(`   Markdown saved: ${mdPath}`);

    // Générer un résumé
    const summary = this.generateSummary();
    const summaryPath = path.join(CONFIG.outputDir, 'summary.txt');
    fs.writeFileSync(summaryPath, summary);
    console.log(`   Summary saved: ${summaryPath}`);

    return { jsonPath, mdPath, summaryPath };
  }

  generateMarkdownReport() {
    let md = `# Bubble Application Exploration Report

**URL:** ${appMap.metadata.baseUrl}
**Date:** ${appMap.metadata.explorationDate}
**Total Pages:** ${appMap.metadata.totalPages}
**Total Interactions:** ${appMap.metadata.totalInteractions}
**Total Screenshots:** ${appMap.metadata.totalScreenshots}

---

## Table of Contents

1. [Pages](#pages)
2. [Navigation Graph](#navigation-graph)
3. [Interactive Elements](#interactive-elements)
4. [UI States (Modals, Popups, Dropdowns)](#ui-states)
5. [Errors](#errors)

---

## Pages

`;

    for (const [url, page] of Object.entries(appMap.pages)) {
      md += `### ${page.title || page.path || 'Untitled'}\n\n`;
      md += `- **URL:** ${url}\n`;
      md += `- **Path:** ${page.path}\n`;
      md += `- **Depth:** ${page.depth}\n`;
      md += `- **Elements:** ${page.elements.length}\n`;
      md += `- **Screenshot:** [View](${page.screenshot})\n\n`;
    }

    md += `---

## Navigation Graph

\`\`\`
`;

    for (const [from, links] of Object.entries(appMap.navigation.graph)) {
      md += `${from}\n`;
      for (const link of links) {
        md += `  └── ${link.elementText || 'click'} → ${link.to}\n`;
      }
    }

    md += `\`\`\`

---

## Interactive Elements

| Element | Type | Text | Pages | Interactions |
|---------|------|------|-------|--------------|
`;

    for (const [id, element] of Object.entries(appMap.elements)) {
      md += `| ${id.substring(0, 30)} | ${element.tagName} | ${(element.text || '').substring(0, 30)} | ${element.foundOnPages.length} | ${element.interactions.length} |\n`;
    }

    md += `
---

## UI States

### Modals (${appMap.states.modals.length})

`;

    for (const modal of appMap.states.modals) {
      md += `- **Trigger:** ${modal.triggerText || modal.trigger}\n`;
      md += `  - Page: ${modal.page}\n`;
      md += `  - Screenshot: [View](${modal.screenshot})\n\n`;
    }

    md += `### Dropdowns (${appMap.states.dropdowns.length})

`;

    for (const dropdown of appMap.states.dropdowns) {
      md += `- **Trigger:** ${dropdown.triggerText || dropdown.trigger}\n`;
      md += `  - Page: ${dropdown.page}\n\n`;
    }

    md += `---

## Errors (${appMap.errors.length})

`;

    for (const error of appMap.errors) {
      md += `- [${error.type}] ${error.message}\n`;
    }

    return md;
  }

  generateSummary() {
    return `
╔══════════════════════════════════════════════════════════════╗
║              BUBBLE APP EXPLORATION SUMMARY                   ║
╠══════════════════════════════════════════════════════════════╣
║                                                               ║
║  Application: ${CONFIG.baseUrl.substring(0, 45).padEnd(45)}║
║  Date:        ${appMap.metadata.explorationDate.substring(0, 45).padEnd(45)}║
║                                                               ║
╠══════════════════════════════════════════════════════════════╣
║  STATISTICS                                                   ║
╠══════════════════════════════════════════════════════════════╣
║                                                               ║
║  Pages discovered:      ${String(appMap.metadata.totalPages).padStart(5)}                              ║
║  Interactive elements:  ${String(Object.keys(appMap.elements).length).padStart(5)}                              ║
║  Interactions tested:   ${String(appMap.metadata.totalInteractions).padStart(5)}                              ║
║  Screenshots captured:  ${String(appMap.metadata.totalScreenshots).padStart(5)}                              ║
║  Modals/Popups found:   ${String(appMap.states.modals.length).padStart(5)}                              ║
║  Dropdowns found:       ${String(appMap.states.dropdowns.length).padStart(5)}                              ║
║  Errors logged:         ${String(appMap.errors.length).padStart(5)}                              ║
║                                                               ║
╠══════════════════════════════════════════════════════════════╣
║  OUTPUT FILES                                                 ║
╠══════════════════════════════════════════════════════════════╣
║                                                               ║
║  • app-map.json          (Full structured data)              ║
║  • exploration-report.md (Human-readable report)             ║
║  • screenshots/          (All captured screens)              ║
║    ├── pages/            (Full page captures)                ║
║    ├── interactions/     (Before/after clicks)               ║
║    └── states/           (Modals, popups, etc.)              ║
║                                                               ║
╚══════════════════════════════════════════════════════════════╝
`;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
    console.log('\n🧹 Browser closed');
  }
}

// Point d'entrée
async function main() {
  const explorer = new BubbleExplorer();

  try {
    await explorer.init();
    await explorer.explore();
    await explorer.generateReport();
  } catch (error) {
    console.error('❌ Fatal error:', error);
    appMap.errors.push({ type: 'fatal', message: error.message });
  } finally {
    await explorer.cleanup();
  }

  console.log('\n🎉 Done! Check the exploration-results folder for outputs.\n');
}

main();
