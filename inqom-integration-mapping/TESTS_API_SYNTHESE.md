# Synthèse des Tests API Inqom - Simple Comme Ca

**Date:** 3 décembre 2025
**Environnement:** Production
**Dossier de test:** TEST SCC (Id: 80548)

---

## 1. Structure Hiérarchique Inqom

```
Company (Cabinet/PME)
    │
    ├── Id: 28118
    │
    └── AccountingFolders (Dossiers comptables)
            │
            ├── TEST SCC (Id: 80548) ◄── Dossier de test
            ├── SIMPLE COMME CA (Id: 29703)
            ├── HAPTE (Id: 28288)
            ├── FIDUCIAIRE BONIATZIS (Id: 29002)
            └── TECNICA MUSICA (Id: 28119)
```

---

## 2. Authentification

### Endpoint
```
POST https://auth.inqom.com/identity/connect/token
```

### Paramètres (x-www-form-urlencoded)
| Paramètre | Valeur |
|-----------|--------|
| username | new@simplecommeca.io |
| password | scN@RN8Kx7GjSz?4 |
| grant_type | password |
| scope | apidata openid |
| client_id | simplecommecav2 |
| client_secret | DBjTzLWLFE94jSt6Cix9 |

### Réponse
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIs...",
  "expires_in": 31104000,  // ~1 an
  "token_type": "Bearer",
  "scope": "apidata openid"
}
```

### Note importante
- **Pas de refresh_token** - Inqom utilise ROPC (Resource Owner Password Credentials)
- Le token expire dans ~1 an (31104000 secondes)
- Stratégie: renouveler proactivement avant expiration

---

## 3. Base URLs des APIs

| API | URL Production |
|-----|---------------|
| **Accounting Services** | https://wa-fred-accounting-services-prod.azurewebsites.net |
| **Accounting Documents** | https://wa-fred-accounting-documents-prod.azurewebsites.net |
| **Banking** | https://wa-fred-banking-prod.azurewebsites.net |

---

## 4. Endpoints Testés et Validés

### 4.1 Provisioning - Liste des dossiers comptables
```http
GET /provisioning/companies/{companyId}/accounting-folders
Authorization: Bearer {token}
```

**Exemple:**
```
GET /provisioning/companies/28118/accounting-folders
```

**Réponse:** Liste des dossiers avec Id, Name, Siren, Status, etc.

---

### 4.2 Exercices Comptables
```http
GET /v1/dossiers/{dossierId}/accounting-periods
Authorization: Bearer {token}
```

**Exemple pour TEST SCC:**
```json
[
  {
    "Id": 240810,
    "DossierId": 80548,
    "BeginDate": "2024-01-01T00:00:00Z",
    "EndDate": "2024-12-31T00:00:00Z",
    "Locked": false,
    "Name": "2024-12"
  },
  {
    "Id": 289438,
    "DossierId": 80548,
    "BeginDate": "2025-01-01T00:00:00Z",
    "EndDate": "2025-12-31T00:00:00Z",
    "Locked": false,
    "Name": "2025-12"
  }
]
```

---

### 4.3 Journaux Comptables
```http
GET /v1/dossiers/{dossierId}/journals
Authorization: Bearer {token}
```

**Journaux disponibles dans TEST SCC:**

**⚠️ ATTENTION:** Les attributs JSON sont `Name` (pas `Code`) et `Type` (pas `TypeDescription`)

| Id | Name | Description | Type |
|----|------|-------------|------|
| 948155 | HA | Achat | Buy |
| 948156 | VT | Vente | Sell |
| 948157 | BQ | Banque | Bank |
| 948158 | OD | Opérations Diverses | Misc |
| 948159 | SA | Salaire | Salary |
| 948160 | AN | A Nouveaux | ANouveaux |
| 948161 | IM | Dotation aux amortissements | Depreciation |
| 948162 | SIT | Situations | Situation |
| 948163 | CO | Cut-off | CutOff |
| 948164 | EM | Emprunts | Loan |
| 948165 | CB | Crédits-baux | Lease |
| 1163754 | REV | Révision | Revision |
| 1394522 | STO | Stock | Stock |

---

### 4.4 Comptes (Plan Comptable)

#### Lecture des comptes
```http
GET /v1/dossiers/{dossierId}/accounts?accountNumberPrefix={prefix}&accountType=All
Authorization: Bearer {token}
```

**Exemple - Comptes fournisseurs:**
```
GET /v1/dossiers/80548/accounts?accountNumberPrefix=401&accountType=All
```

#### Création d'un compte auxiliaire
```http
POST /v1/dossiers/{dossierId}/accounts
Authorization: Bearer {token}
Content-Type: application/json

{
  "AccountNumber": "4011TESTMARC",
  "Name": "FOURNISSEUR TEST MARC",
  "Auxiliarize": true
}
```

**Réponse:** `"4011TESTMARC"` (le numéro de compte créé)

#### Note importante
- **Pas de suppression via API** - Les comptes doivent être supprimés via l'interface Inqom
- Chemin dans Inqom: États comptables → Balance → Filtrer → Supprimer

---

### 4.5 Écritures Comptables

#### Création d'écritures
```http
POST /v1/dossiers/{dossierId}/entries
Authorization: Bearer {token}
Content-Type: application/json
```

**Corps de la requête (array de max 50 écritures):**
```json
[
  {
    "JournalId": 948155,
    "Date": "2025-12-03",
    "Document": {
      "Reference": "FACT-MARC-001",
      "Date": "2025-12-03"
    },
    "ExternalId": "SCC-TEST-001",
    "Lines": [
      {
        "Label": "Fournitures bureau - Test Marc",
        "DebitAmount": 100.00,
        "CreditAmount": 0,
        "Currency": "EUR",
        "AccountNumber": "6064"
      },
      {
        "Label": "TVA deductible 20%",
        "DebitAmount": 20.00,
        "CreditAmount": 0,
        "Currency": "EUR",
        "AccountNumber": "44566"
      },
      {
        "Label": "Fournisseur Test Marc",
        "DebitAmount": 0,
        "CreditAmount": 120.00,
        "Currency": "EUR",
        "AccountNumber": "4011TESTMARC"
      }
    ]
  }
]
```

**Réponse:**
```json
[
  {
    "Id": 570817716,
    "ExternalId": "SCC-TEST-001",
    "Lines": [
      {"Id": 2105484453, "Label": "FOURNITURES BUREAU - TEST MARC", "DebitAmount": 100.00, "AccountNumber": "6064"},
      {"Id": 2105484454, "Label": "TVA DEDUCTIBLE 20%", "DebitAmount": 20.00, "AccountNumber": "44566"},
      {"Id": 2105484455, "Label": "FOURNISSEUR TEST MARC", "CreditAmount": 120.00, "AccountNumber": "4011TESTMARC"}
    ]
  }
]
```

#### Lecture des lignes d'écritures
```http
GET /v1/dossiers/{dossierId}/entry-lines?startDate={date}&endDate={date}&pageNumber=1
Authorization: Bearer {token}
```

#### Suivi des modifications (pour synchronisation)
```http
GET /v1/dossiers/{dossierId}/entry-lines/changes?startDate={date}&endDate={date}&changedAfter={datetime}
Authorization: Bearer {token}
```

---

## 5. Récapitulatif des Tests

| Endpoint | Méthode | Status |
|----------|---------|--------|
| Authentification | POST /token | ✅ OK |
| Liste dossiers comptables | GET /accounting-folders | ✅ OK |
| Exercices comptables | GET /accounting-periods | ✅ OK |
| Journaux | GET /journals | ✅ OK |
| Comptes - Lecture | GET /accounts | ✅ OK |
| Comptes - Création | POST /accounts | ✅ OK |
| Comptes - Suppression | DELETE /accounts | ❌ Non disponible |
| Écritures - Création | POST /entries | ✅ OK |
| Écritures - Lecture | GET /entry-lines | ✅ OK |
| Écritures - Sync incrémentale | GET /entry-lines/changes | ✅ OK (retourne vide si pas de modif serveur) |
| Documents - Liste | GET /Documents | ✅ OK |
| Documents - Upload | POST /Documents | ✅ OK (format multipart/form-data) |
| Lettrage | POST /letterings | ✅ OK |

---

## 6. Données de Test Créées

### Compte fournisseur
- **Numéro:** 4011TESTMARC
- **Nom:** FOURNISSEUR TEST MARC
- **Dossier:** TEST SCC (80548)

### Écriture comptable #1 (Facture)
- **Entry Id:** 570817716
- **ExternalId:** SCC-TEST-001
- **Référence pièce:** FACT-MARC-001
- **Date:** 03/12/2025
- **Journal:** HA (Achats)
- **Montant TTC:** 120,00 €
- **Lignes:**
  - Id 2105484453: 6064 (Fournitures) - Débit 100,00 €
  - Id 2105484454: 44566 (TVA) - Débit 20,00 €
  - Id 2105484455: 4011TESTMARC (Fournisseur) - Crédit 120,00 €

### Écriture comptable #2 (Règlement)
- **Entry Id:** 570859689
- **ExternalId:** SCC-REGLEMENT-001
- **Référence pièce:** REG-MARC-001
- **Date:** 03/12/2025
- **Journal:** BQ (Banque)
- **Montant:** 120,00 €
- **Lignes:**
  - Id 2105616480: 4011TESTMARC (Fournisseur) - Débit 120,00 €
  - Id 2105616481: 5121 (Banque) - Crédit 120,00 €

### Lettrage
- **Lettrage Id:** 136341101
- **Lignes lettrées:** 2105484455 (facture) + 2105616480 (règlement)
- **Compte:** 4011TESTMARC

---

## 7. Endpoints Testés - Détails

### 7.1 GET /entry-lines (Lecture des écritures)

```http
GET /v1/dossiers/80548/entry-lines?startDate=2025-01-01&endDate=2025-12-31&pageNumber=1
```

**Paramètres optionnels:**
- `accountNumber`: Filtrer par compte (ex: 4011TESTMARC)
- `pageNumber`: Pagination

**Réponse (extrait):**
```json
{
  "EntryLines": [
    {
      "TypeOfChange": "Update",
      "Id": 2105484455,
      "Label": "FOURNISSEUR TEST MARC",
      "DebitAmount": 0.0,
      "CreditAmount": 120.00,
      "Currency": "EUR",
      "Entry": {"Id": 570817716, "Date": "2025-12-03T00:00:00Z"},
      "AccountNumber": "4011TESTMARC",
      "Journal": {"Id": 948155, "Code": "HA"},
      "AccountingDocument": {"Reference": "FACT-MARC-001"}
    }
  ],
  "CurrentPage": 1
}
```

### 7.2 POST /letterings (Lettrage)

```http
POST /v1/dossiers/80548/letterings
Content-Type: application/json

{
  "CreateLetterringCommands": [
    {
      "EntryLineIds": [2105484455, 2105616480]
    }
  ]
}
```

**Réponse:**
```json
{
  "CreatedLetterings": [
    {
      "Id": 136341101,
      "EntryLineIds": [2105484455, 2105616480]
    }
  ]
}
```

**Note:** Les lignes doivent être sur le même compte et s'équilibrer (débit = crédit).

### 7.3 GET /Documents (Liste des documents)

```http
GET /api/accounting-documents/accounting-folders/80548/Documents
```

**Réponse (extrait):**
```json
[
  {
    "Id": 40877030,
    "AccountingFolderId": 80548,
    "Name": "F25110015.pdf",
    "Type": "Others",
    "Status": "Done",
    "DocRef": "F-25-11-0015",
    "Source": "Api",
    "FileUrl": "https://fredprodstorage.blob.core.windows.net/..."
  }
]
```

**Types de documents:**
| Type | Description |
|------|-------------|
| Client | Facture client |
| Supplier | Facture fournisseur |
| ExpenseReport | Note de frais |
| Others | Autres |

**Statuts:**
| Status | Description |
|--------|-------------|
| Received | Reçu |
| Processing | OCR en cours |
| ToReview | À vérifier |
| Done | Traité |
| Duplicate | Doublon |

---

## 8. Prochaines Étapes

1. [x] ~~Tester l'upload de documents (factures PDF)~~
2. [x] ~~Tester la lecture des écritures (GET /entry-lines)~~
3. [x] ~~Tester le lettrage automatique~~
4. [x] ~~Tester la synchronisation incrémentale (changes endpoint)~~
5. [x] ~~Documenter le mapping Chift → Inqom pour chaque type de donnée~~

**Tous les tests essentiels ont été validés !**

---

## 8. Notes Importantes pour l'Implémentation Bubble

### Headers requis pour chaque appel
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

### Gestion des erreurs
| Code | Signification | Action |
|------|--------------|--------|
| 200 | OK | - |
| 400 | Bad Request | Vérifier format requête |
| 401 | Unauthorized | Renouveler token |
| 403 | Forbidden | Vérifier permissions |
| 404 | Not Found | Vérifier IDs |
| 500 | Server Error | Réessayer / Contacter Inqom |

### Limites
- **Écritures:** Max 50 par appel POST
- **Entry-lines:** 100 lignes par page (paginé)
- **Changes:** 1000 lignes par page (paginé)
