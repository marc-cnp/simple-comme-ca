/**
 * Analyze Exploration Results
 *
 * Generates insights and patterns from the exploration data
 */

const fs = require('fs');
const path = require('path');

const RESULTS_DIR = './exploration-results';

function loadAppMap() {
  const jsonPath = path.join(RESULTS_DIR, 'app-map.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('❌ app-map.json not found. Run exploration first.');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
}

function analyzeNavigation(appMap) {
  const analysis = {
    entryPoints: [],
    deadEnds: [],
    hubs: [],
    orphanPages: [],
    navigationDepth: {}
  };

  const pages = Object.keys(appMap.pages);
  const graph = appMap.navigation.graph;

  // Trouver les points d'entrée (pages sans lien entrant)
  const hasIncoming = new Set();
  for (const links of Object.values(graph)) {
    for (const link of links) {
      hasIncoming.add(link.to);
    }
  }

  for (const page of pages) {
    if (!hasIncoming.has(page)) {
      analysis.entryPoints.push(page);
    }
  }

  // Trouver les culs-de-sac (pages sans lien sortant)
  for (const page of pages) {
    if (!graph[page] || graph[page].length === 0) {
      analysis.deadEnds.push(page);
    }
  }

  // Trouver les hubs (pages avec beaucoup de liens sortants)
  for (const [page, links] of Object.entries(graph)) {
    if (links.length >= 3) {
      analysis.hubs.push({ page, linkCount: links.length });
    }
  }

  // Analyser la profondeur
  for (const [url, page] of Object.entries(appMap.pages)) {
    const depth = page.depth;
    if (!analysis.navigationDepth[depth]) {
      analysis.navigationDepth[depth] = [];
    }
    analysis.navigationDepth[depth].push(url);
  }

  return analysis;
}

function analyzeElements(appMap) {
  const analysis = {
    byType: {},
    mostCommon: [],
    interactive: {
      buttons: 0,
      links: 0,
      dropdowns: 0,
      tabs: 0,
      other: 0
    },
    withInteractions: [],
    noInteractions: []
  };

  for (const [id, element] of Object.entries(appMap.elements)) {
    // Par type de tag
    const tag = element.tagName;
    if (!analysis.byType[tag]) {
      analysis.byType[tag] = 0;
    }
    analysis.byType[tag]++;

    // Catégorisation
    const className = (element.className || '').toLowerCase();
    const text = (element.text || '').toLowerCase();

    if (tag === 'button' || className.includes('button') || className.includes('btn')) {
      analysis.interactive.buttons++;
    } else if (tag === 'a' || className.includes('link')) {
      analysis.interactive.links++;
    } else if (className.includes('dropdown') || className.includes('select')) {
      analysis.interactive.dropdowns++;
    } else if (className.includes('tab')) {
      analysis.interactive.tabs++;
    } else {
      analysis.interactive.other++;
    }

    // Avec/sans interactions
    if (element.interactions && element.interactions.length > 0) {
      analysis.withInteractions.push({
        id,
        text: element.text,
        interactionCount: element.interactions.length,
        stateChanges: element.interactions.filter(i => i.stateChange.type !== 'none').length
      });
    } else {
      analysis.noInteractions.push({ id, text: element.text });
    }
  }

  // Trier par fréquence
  analysis.mostCommon = Object.entries(analysis.byType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return analysis;
}

function analyzeUIPatterns(appMap) {
  const patterns = {
    modals: {
      count: appMap.states.modals.length,
      triggers: appMap.states.modals.map(m => m.triggerText).filter(Boolean)
    },
    dropdowns: {
      count: appMap.states.dropdowns.length,
      triggers: appMap.states.dropdowns.map(d => d.triggerText).filter(Boolean)
    },
    commonActions: [],
    formElements: [],
    navigationElements: []
  };

  // Identifier les patterns d'action communs
  const actionWords = ['save', 'submit', 'cancel', 'delete', 'edit', 'add', 'create', 'update', 'close', 'open'];
  const navigationWords = ['menu', 'nav', 'home', 'back', 'next', 'previous', 'tab'];
  const formWords = ['input', 'form', 'field', 'checkbox', 'radio', 'select'];

  for (const [id, element] of Object.entries(appMap.elements)) {
    const text = (element.text || '').toLowerCase();
    const className = (element.className || '').toLowerCase();

    for (const word of actionWords) {
      if (text.includes(word) || className.includes(word)) {
        patterns.commonActions.push({ id, text: element.text, action: word });
        break;
      }
    }

    for (const word of navigationWords) {
      if (className.includes(word)) {
        patterns.navigationElements.push({ id, text: element.text, type: word });
        break;
      }
    }

    for (const word of formWords) {
      if (element.tagName === 'input' || className.includes(word)) {
        patterns.formElements.push({ id, text: element.text, type: element.type || word });
        break;
      }
    }
  }

  return patterns;
}

function generateAnalysisReport(appMap) {
  const navigation = analyzeNavigation(appMap);
  const elements = analyzeElements(appMap);
  const patterns = analyzeUIPatterns(appMap);

  const report = `# Application Analysis Report

## Executive Summary

- **Total Pages:** ${Object.keys(appMap.pages).length}
- **Total Interactive Elements:** ${Object.keys(appMap.elements).length}
- **UI Patterns Detected:** ${patterns.modals.count} modals, ${patterns.dropdowns.count} dropdowns

---

## Navigation Analysis

### Entry Points (${navigation.entryPoints.length})
${navigation.entryPoints.map(p => `- ${p}`).join('\n')}

### Dead Ends (${navigation.deadEnds.length})
${navigation.deadEnds.map(p => `- ${p}`).join('\n')}

### Navigation Hubs
${navigation.hubs.map(h => `- ${h.page} (${h.linkCount} outgoing links)`).join('\n')}

### Pages by Depth Level
${Object.entries(navigation.navigationDepth).map(([depth, pages]) => `- **Depth ${depth}:** ${pages.length} pages`).join('\n')}

---

## Element Analysis

### Elements by Type
${elements.mostCommon.map(([type, count]) => `- **${type}:** ${count}`).join('\n')}

### Interactive Element Categories
- **Buttons:** ${elements.interactive.buttons}
- **Links:** ${elements.interactive.links}
- **Dropdowns:** ${elements.interactive.dropdowns}
- **Tabs:** ${elements.interactive.tabs}
- **Other:** ${elements.interactive.other}

### Elements with State Changes
${elements.withInteractions
  .filter(e => e.stateChanges > 0)
  .slice(0, 20)
  .map(e => `- "${e.text || 'unnamed'}" - ${e.stateChanges} state changes`)
  .join('\n')}

---

## UI Patterns

### Modal/Popup Triggers
${patterns.modals.triggers.slice(0, 10).map(t => `- ${t}`).join('\n') || 'None detected'}

### Common Action Buttons
${patterns.commonActions.slice(0, 15).map(a => `- ${a.text} (${a.action})`).join('\n') || 'None detected'}

### Navigation Elements
${patterns.navigationElements.slice(0, 10).map(n => `- ${n.text || n.id} (${n.type})`).join('\n') || 'None detected'}

### Form Elements
${patterns.formElements.slice(0, 10).map(f => `- ${f.text || f.id} (${f.type})`).join('\n') || 'None detected'}

---

## Recommendations

### Accessibility
${elements.noInteractions.length > 20 ? '⚠️ Many elements have no detected interactions - verify they are properly labeled' : '✅ Element interactions well mapped'}

### Navigation
${navigation.deadEnds.length > 5 ? '⚠️ Several dead-end pages detected - consider adding navigation options' : '✅ Navigation flow appears complete'}

### UI Consistency
${patterns.commonActions.length > 0 ? '✅ Consistent action patterns detected' : '⚠️ No common action patterns found - consider standardizing UI'}

---

## Raw Data

Full data available in \`app-map.json\`
`;

  return report;
}

// Main
function main() {
  console.log('📊 Analyzing exploration results...\n');

  const appMap = loadAppMap();
  const report = generateAnalysisReport(appMap);

  const reportPath = path.join(RESULTS_DIR, 'analysis-report.md');
  fs.writeFileSync(reportPath, report);

  console.log('✅ Analysis complete!');
  console.log(`📄 Report saved to: ${reportPath}\n`);

  // Afficher le résumé
  console.log('='.repeat(60));
  console.log('QUICK SUMMARY');
  console.log('='.repeat(60));
  console.log(`Pages: ${Object.keys(appMap.pages).length}`);
  console.log(`Elements: ${Object.keys(appMap.elements).length}`);
  console.log(`Modals: ${appMap.states.modals.length}`);
  console.log(`Errors: ${appMap.errors.length}`);
  console.log('='.repeat(60));
}

main();
