# Guide Complet de Migration Chift vers Inqom

## Documentation technique pour les developpeurs Bubble.io

**Version:** 1.0
**Date:** 3 decembre 2025
**Projet:** Simple Comme Ca - Integration directe Inqom
**Environnement teste:** Production (TEST SCC - DossierId: 80548)

---

## Table des matieres

1. [Contexte metier](#1-contexte-metier)
2. [Architecture technique](#2-architecture-technique)
3. [Authentification](#3-authentification)
4. [Mapping detaille par fonctionnalite](#4-mapping-detaille-par-fonctionnalite)
5. [Codes de test valides](#5-codes-de-test-valides)
6. [Anomalies et recommandations](#6-anomalies-et-recommandations)

---

## 1. Contexte metier

### 1.1 Qu'est-ce que Simple Comme Ca ?

Simple Comme Ca est une plateforme de gestion pour PME/TPE qui permet :
- La facturation client (emission de factures de vente)
- La gestion des factures fournisseurs (achats)
- Le suivi des paiements
- La synchronisation avec le logiciel comptable

### 1.2 Pourquoi cette migration ?

| Avant | Apres |
|-------|-------|
| Bubble -> **Chift** -> Inqom | Bubble -> **Inqom** (direct) |

**Avantages de la migration directe :**
- Suppression d'un intermediaire (moins de latence)
- Controle total sur les appels API
- Reduction des couts de licence Chift
- Meilleure gestion des erreurs

### 1.3 Concepts comptables essentiels

| Terme | Explication simple |
|-------|-------------------|
| **Ecriture comptable** | Enregistrement d'une operation financiere avec au minimum 2 lignes (debit = credit) |
| **Journal** | Categorie d'ecritures (HA=achats, VT=ventes, BQ=banque) |
| **Compte auxiliaire** | Sous-compte lie a un tiers (401AMAZON = fournisseur Amazon, rattache au compte 401) |
| **Lettrage** | Rapprochement entre une facture et son reglement |
| **Exercice** | Periode comptable (generalement 1 an, ex: 01/01/2025 - 31/12/2025) |

---

## 2. Architecture technique

### 2.1 URLs de production

```
AUTH:      https://auth.inqom.com/identity/connect/token
API:       https://wa-fred-accounting-services-prod.azurewebsites.net
DOCUMENTS: https://wa-fred-accounting-documents-prod.azurewebsites.net
```

### 2.2 Identifiants API (Production)

| Parametre | Valeur |
|-----------|--------|
| client_id | simplecommecav2 |
| client_secret | DBjTzLWLFE94jSt6Cix9 |
| CompanyId | 28118 |
| grant_type | password |
| scope | openid apidata |

### 2.3 Hierarchie des entites Inqom

```
Company (28118 = Cabinet SCC)
    |
    +-- AccountingFolder (= Society dans Bubble)
            |
            +-- Dossier TEST SCC (80548)
            +-- Dossier SIMPLE COMME CA (29703)
            +-- Dossier HAPTE (28288)
            +-- ...
```

---

## 3. Authentification

### 3.1 Obtenir un token

**Endpoint:** `POST https://auth.inqom.com/identity/connect/token`
**Content-Type:** `application/x-www-form-urlencoded`

**Parametres:**
```
username=new@simplecommeca.io
password=scN@RN8Kx7GjSz?4
grant_type=password
scope=openid apidata
client_id=simplecommecav2
client_secret=DBjTzLWLFE94jSt6Cix9
```

**Reponse:**
```json
{
  "access_token": "eyJ0eXAi...",
  "expires_in": 31104000,
  "token_type": "Bearer",
  "scope": "apidata openid"
}
```

### 3.2 Utilisation du token

Toutes les requetes API doivent inclure ce header :
```
Authorization: Bearer {access_token}
```

### 3.3 Strategie de renouvellement

| Particularite Inqom | Strategie Bubble |
|---------------------|------------------|
| Token valide ~1 an | Stocker `Inqom_token_expiry` |
| Pas de refresh_token | Re-authentifier si 401/403 |
| ROPC (Resource Owner) | Stocker credentials cote backend |

**Champs Bubble recommandes (table User ou Society):**
- `Inqom_access_token` (text, prive)
- `Inqom_token_expiry` (date)

---

## 4. Mapping detaille par fonctionnalite

---

### 4.1 CONNEXION D'UNE SOCIETE

#### Contexte metier
Quand un utilisateur connecte sa societe a Inqom, on doit lier son `Society` Bubble a un `AccountingFolder` Inqom.

#### Chift (avant)
```
GET /consumers/{consumer_id}/accounting/folders
```

#### Inqom (apres)
```
GET /provisioning/companies/{companyId}/accounting-folders
```

#### Mapping des champs

| Bubble (ancien) | Bubble (nouveau) | Inqom JSON |
|-----------------|------------------|------------|
| Chift_consumer_ID | Inqom_company_ID | CompanyId (= 28118) |
| Chift_folder_ID | Inqom_folder_ID | Id |
| Chift_connection_state | Inqom_connection_state | Status |
| Current_connection_ID | *(supprimer)* | - |

#### Reponse Inqom (exemple)
```json
[
  {
    "Id": 80548,
    "Name": "TEST SCC",
    "Siren": "123456789",
    "Status": "Active",
    "AccountingType": "Engagement",
    "CompanyId": 28118
  }
]
```

#### Code Bubble (API Connector)
```
Method: GET
URL: https://wa-fred-accounting-services-prod.azurewebsites.net/provisioning/companies/28118/accounting-folders
Headers:
  Authorization: Bearer [Inqom_access_token]
  Content-Type: application/json
```

---

### 4.2 JOURNAUX COMPTABLES

#### Contexte metier
Les journaux categorisent les ecritures. Chaque facture doit etre enregistree dans le bon journal :
- **HA** (Achats) : factures fournisseurs
- **VT** (Ventes) : factures clients
- **BQ** (Banque) : mouvements bancaires

#### Chift (avant)
```
GET /consumers/{consumer_id}/accounting/journals
```

#### Inqom (apres)
```
GET /v1/dossiers/{dossierId}/journals
```

#### Mapping des champs

| Bubble (ancien) | Bubble (nouveau) | Inqom JSON |
|-----------------|------------------|------------|
| id_chift | Inqom_journal_ID | Id |
| Chift_folder_ID | Inqom_folder_ID | *(param URL)* |
| Nom | Nom | Description |
| Abreviation | Inqom_journal_code | Name |
| Type | Type | Type |

#### Reponse Inqom (TEST SCC - dossier 80548)
```json
[
  {"Id": 948155, "Name": "HA", "Description": "Achat", "Type": "Buy"},
  {"Id": 948156, "Name": "VT", "Description": "Vente", "Type": "Sell"},
  {"Id": 948157, "Name": "BQ", "Description": "Banque", "Type": "Bank"},
  {"Id": 948158, "Name": "OD", "Description": "Operations Diverses", "Type": "Misc"},
  {"Id": 948160, "Name": "AN", "Description": "A Nouveaux", "Type": "ANouveaux"}
]
```

#### Types de journaux Inqom
| Type | Usage |
|------|-------|
| Buy | Factures fournisseurs |
| Sell | Factures clients |
| Bank | Mouvements bancaires |
| Misc | Operations diverses |
| Cash | Caisse |
| Salary | Paie |

---

### 4.3 PLAN COMPTABLE (Comptes)

#### Contexte metier
Les comptes sont la base de la comptabilite. En France, on utilise le Plan Comptable General (PCG) :
- **401xxx** : Fournisseurs
- **411xxx** : Clients
- **512xxx** : Banque
- **6xxxx** : Charges
- **7xxxx** : Produits

#### Chift (avant)
```
GET /consumers/{consumer_id}/accounting/chart-of-accounts
```

#### Inqom (apres)
```
GET /v1/dossiers/{dossierId}/accounts?accountNumberPrefix={prefix}&accountType=All
```

#### Exemples d'utilisation

**Comptes fournisseurs (401) :**
```
GET /v1/dossiers/80548/accounts?accountNumberPrefix=401&accountType=All
```

**Comptes clients (411) :**
```
GET /v1/dossiers/80548/accounts?accountNumberPrefix=411&accountType=All
```

**Tous les comptes de charge (6) :**
```
GET /v1/dossiers/80548/accounts?accountNumberPrefix=6&accountType=All
```

#### Reponse Inqom
```json
[
  {
    "Number": "4011TESTMARC",
    "Name": "FOURNISSEUR TEST MARC",
    "IsImpactable": true,
    "ParentAccountNumber": "401"
  }
]
```

---

### 4.4 FOURNISSEURS

#### Contexte metier
Dans Chift, les fournisseurs sont des entites separees. Dans Inqom, **un fournisseur = un compte auxiliaire 401***.

#### Chift (avant)
```
POST /consumers/{consumer_id}/accounting/suppliers
GET  /consumers/{consumer_id}/accounting/suppliers
```

#### Inqom (apres)
```
POST /v1/dossiers/{dossierId}/accounts
GET  /v1/dossiers/{dossierId}/accounts?accountNumberPrefix=401&accountType=All
```

#### Mapping des champs

| Bubble Fournisseur | Bubble (nouveau) | Inqom JSON |
|-------------------|------------------|------------|
| chift_id | Inqom_account_number | Number (retour) |
| Chift_folder_ID | Inqom_folder_ID | *(param URL)* |
| name | name | Name |
| account_number | *(derive du nom)* | AccountNumber |

#### Creation d'un compte fournisseur

**Request:**
```json
POST /v1/dossiers/80548/accounts
{
  "AccountNumber": "401AMAZON",
  "Name": "AMAZON FRANCE",
  "Auxiliarize": true
}
```

**Response:**
```json
"4011AMAZON"
```

> **ATTENTION:** Inqom prefixe automatiquement les comptes auxiliaires.
> `401AMAZON` devient `4011AMAZON`

#### Workflow Bubble recommande

1. Verifier si le compte existe deja (GET avec prefix)
2. Si non, creer le compte (POST)
3. Stocker le numero retourne dans `Inqom_account_number`

---

### 4.5 CLIENTS

#### Contexte metier
Meme logique que les fournisseurs, mais avec le prefixe **411**.

#### Chift (avant)
```
POST /consumers/{consumer_id}/accounting/clients
GET  /consumers/{consumer_id}/accounting/clients
```

#### Inqom (apres)
```
POST /v1/dossiers/{dossierId}/accounts
GET  /v1/dossiers/{dossierId}/accounts?accountNumberPrefix=411&accountType=All
```

#### Mapping des champs

| Bubble Client | Bubble (nouveau) | Inqom JSON |
|--------------|------------------|------------|
| chift_id | Inqom_account_number | Number |
| Chift_folder_ID | Inqom_folder_ID | *(param URL)* |
| name | name | Name |
| company? | *(inchange)* | *(pas d'equivalent)* |

#### Creation d'un compte client

**Request:**
```json
POST /v1/dossiers/80548/accounts
{
  "AccountNumber": "411CLIENTXYZ",
  "Name": "CLIENT XYZ SARL",
  "Auxiliarize": true
}
```

**Response:**
```json
"4111CLIENTXYZ"
```

---

### 4.6 FACTURES FOURNISSEURS (Achats)

#### Contexte metier
Une facture fournisseur represente un achat. Elle doit etre enregistree dans le journal HA avec :
- Une ligne de charge (debit)
- Une ligne de TVA deductible (debit)
- Une ligne fournisseur (credit)

#### Chift (avant)
```
POST /consumers/{consumer_id}/accounting/invoices
GET  /consumers/{consumer_id}/accounting/invoices/type/supplier_invoice
```

#### Inqom (apres)
```
POST /v1/dossiers/{dossierId}/entries
GET  /v1/dossiers/{dossierId}/entry-lines?startDate=...&endDate=...
```

#### Mapping des champs

| Bubble Facture | Inqom JSON | Notes |
|----------------|------------|-------|
| chift_id | *(remplace par Entry.Id)* | - |
| chift_status | *(voir TypeOfChange)* | Creation, Update, Delete |
| chift_journal_id | JournalId | Utiliser 948155 pour HA |
| Chift_folder_ID | *(param URL: dossierId)* | - |
| invoice_number | Document.Reference | Max 256 chars |
| invoice_date | Date | Format YYYY-MM-DD |
| due_date | *(pas d'equivalent direct)* | - |
| untaxed_amount | Lines[].DebitAmount | Ligne de charge |
| tax_amount | Lines[].DebitAmount | Ligne TVA |
| total | Lines[].CreditAmount | Ligne fournisseur |
| _id (Bubble) | ExternalId | Pour tracabilite |

#### Creation d'une ecriture de facture fournisseur

**Request:**
```json
POST /v1/dossiers/80548/entries
[
  {
    "JournalId": 948155,
    "Date": "2025-12-03",
    "Document": {
      "Reference": "FACT-2025-001",
      "Date": "2025-12-03"
    },
    "ExternalId": "bubble_facture_xyz123",
    "Lines": [
      {
        "Label": "Fournitures bureau",
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
        "Label": "Fournisseur XYZ",
        "DebitAmount": 0,
        "CreditAmount": 120.00,
        "Currency": "EUR",
        "AccountNumber": "4011FOURNXYZ"
      }
    ]
  }
]
```

**Response:**
```json
[
  {
    "Id": 570817716,
    "ExternalId": "bubble_facture_xyz123",
    "Lines": [
      {"Id": 2105484453, "Label": "FOURNITURES BUREAU", "DebitAmount": 100.00, "AccountNumber": "6064"},
      {"Id": 2105484454, "Label": "TVA DEDUCTIBLE 20%", "DebitAmount": 20.00, "AccountNumber": "44566"},
      {"Id": 2105484455, "Label": "FOURNISSEUR XYZ", "CreditAmount": 120.00, "AccountNumber": "4011FOURNXYZ"}
    ]
  }
]
```

#### Comptes de charge courants

| Compte | Description | Exemple |
|--------|-------------|---------|
| 6064 | Fournitures administratives | Papeterie, fournitures bureau |
| 6063 | Fournitures d'entretien | Produits menagers |
| 6135 | Locations mobilieres | Logiciels SaaS |
| 607 | Achats de marchandises | Stock |
| 6241 | Transport sur achats | Frais de port |

---

### 4.7 FACTURES CLIENTS (Ventes)

#### Contexte metier
Une facture client represente une vente. Elle s'enregistre dans le journal VT avec :
- Une ligne client (debit)
- Une ligne de TVA collectee (credit)
- Une ligne de produit (credit)

#### Chift (avant)
```
POST /consumers/{consumer_id}/accounting/invoices
GET  /consumers/{consumer_id}/accounting/invoices/type/customer_invoice
```

#### Inqom (apres)
```
POST /v1/dossiers/{dossierId}/entries
GET  /v1/dossiers/{dossierId}/entry-lines
```

#### Creation d'une ecriture de facture client

**Request:**
```json
POST /v1/dossiers/80548/entries
[
  {
    "JournalId": 948156,
    "Date": "2025-12-03",
    "Document": {
      "Reference": "F-25-12-0001",
      "Date": "2025-12-03"
    },
    "ExternalId": "bubble_vente_abc456",
    "Lines": [
      {
        "Label": "Client ABC",
        "DebitAmount": 120.00,
        "CreditAmount": 0,
        "Currency": "EUR",
        "AccountNumber": "4111CLIENTABC"
      },
      {
        "Label": "TVA collectee 20%",
        "DebitAmount": 0,
        "CreditAmount": 20.00,
        "Currency": "EUR",
        "AccountNumber": "44571"
      },
      {
        "Label": "Prestation de service",
        "DebitAmount": 0,
        "CreditAmount": 100.00,
        "Currency": "EUR",
        "AccountNumber": "706"
      }
    ]
  }
]
```

#### Comptes de produit courants

| Compte | Description |
|--------|-------------|
| 704 | Travaux |
| 706 | Prestations de services |
| 706100 | Sous-compte de prestations |
| 707 | Ventes de marchandises |

---

### 4.8 AVOIRS (Refunds)

#### Contexte metier
Un avoir est une facture negative. Il s'enregistre de la meme maniere mais avec les debits/credits inverses.

#### Chift (avant)
```
GET /consumers/{consumer_id}/accounting/invoices/type/customer_refund
GET /consumers/{consumer_id}/accounting/invoices/type/supplier_refund
```

#### Inqom (apres)
Meme endpoint que les factures, mais avec les montants inverses.

#### Exemple d'avoir client

```json
POST /v1/dossiers/80548/entries
[
  {
    "JournalId": 948156,
    "Date": "2025-12-03",
    "Document": {
      "Reference": "AV-25-12-0001",
      "Date": "2025-12-03"
    },
    "ExternalId": "bubble_avoir_def789",
    "Lines": [
      {
        "Label": "Avoir Client ABC",
        "DebitAmount": 0,
        "CreditAmount": 120.00,
        "Currency": "EUR",
        "AccountNumber": "4111CLIENTABC"
      },
      {
        "Label": "TVA sur avoir",
        "DebitAmount": 20.00,
        "CreditAmount": 0,
        "Currency": "EUR",
        "AccountNumber": "44571"
      },
      {
        "Label": "Annulation prestation",
        "DebitAmount": 100.00,
        "CreditAmount": 0,
        "Currency": "EUR",
        "AccountNumber": "706"
      }
    ]
  }
]
```

---

### 4.9 REGLEMENTS ET LETTRAGE

#### Contexte metier
Le lettrage consiste a rapprocher une facture avec son reglement. Cela permet de savoir quelles factures sont payees.

#### Chift (avant)
```
POST /consumers/{consumer_id}/accounting/matching
```

#### Inqom (apres)
```
POST /v1/dossiers/{dossierId}/letterings
```

#### Workflow complet

**Etape 1 : Creer l'ecriture de reglement**
```json
POST /v1/dossiers/80548/entries
[
  {
    "JournalId": 948157,
    "Date": "2025-12-03",
    "Document": {
      "Reference": "REG-001",
      "Date": "2025-12-03"
    },
    "ExternalId": "bubble_reglement_001",
    "Lines": [
      {
        "Label": "Reglement Fournisseur XYZ",
        "DebitAmount": 120.00,
        "CreditAmount": 0,
        "Currency": "EUR",
        "AccountNumber": "4011FOURNXYZ"
      },
      {
        "Label": "Virement bancaire",
        "DebitAmount": 0,
        "CreditAmount": 120.00,
        "Currency": "EUR",
        "AccountNumber": "512"
      }
    ]
  }
]
```

**Reponse :**
```json
[
  {
    "Id": 570859689,
    "ExternalId": "bubble_reglement_001",
    "Lines": [
      {"Id": 2105616480, "AccountNumber": "4011FOURNXYZ", "DebitAmount": 120.00},
      {"Id": 2105616481, "AccountNumber": "5121", "CreditAmount": 120.00}
    ]
  }
]
```

**Etape 2 : Effectuer le lettrage**
```json
POST /v1/dossiers/80548/letterings
{
  "CreateLetterringCommands": [
    {
      "EntryLineIds": [2105484455, 2105616480]
    }
  ]
}
```

**Reponse :**
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

> **Note:** Les lignes lettrées doivent etre sur le meme compte (ici 4011FOURNXYZ) et avoir des montants qui s'equilibrent (un debit, un credit).

---

### 4.10 LECTURE DES ECRITURES

#### Contexte metier
Pour synchroniser les factures depuis Inqom vers Bubble (ex: factures creees depuis l'interface Inqom).

#### Chift (avant)
```
GET /consumers/{consumer_id}/accounting/invoices/type/{invoice_type}
```

#### Inqom (apres)
```
GET /v1/dossiers/{dossierId}/entry-lines?startDate=...&endDate=...&pageNumber=1
```

#### Parametres

| Parametre | Description | Exemple |
|-----------|-------------|---------|
| startDate | Date de debut | 2025-01-01 |
| endDate | Date de fin | 2025-12-31 |
| pageNumber | Page (pagination) | 1 |
| accountNumber | Filtrer par compte | 4011TESTMARC |

#### Reponse
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
      "Entry": {
        "Id": 570817716,
        "Date": "2025-12-03T00:00:00Z"
      },
      "AccountNumber": "4011TESTMARC",
      "Journal": {
        "Id": 948155,
        "Code": "HA"
      },
      "AccountingDocument": {
        "Reference": "FACT-MARC-001"
      }
    }
  ],
  "CurrentPage": 1
}
```

---

### 4.11 UPLOAD DE DOCUMENTS (Factures PDF)

#### Contexte metier
Inqom permet d'uploader les justificatifs (factures PDF) qui seront lies aux ecritures comptables.

#### Chift (avant)
```
POST /consumers/{consumer_id}/accounting/invoices/pdf/{invoice_id}
```

#### Inqom (apres)
```
POST /api/accounting-documents/accounting-folders/{dossierId}/Documents/
Content-Type: multipart/form-data
```

#### Parametres form-data

| Parametre | Type | Description |
|-----------|------|-------------|
| Document | File | Fichier PDF |
| TypeScan | String | Client, Supplier, Others |
| FileSource | String | Api |
| DocRef | String | Reference (ex: FACT-001) |
| SourceId | String | ID Bubble de la facture |
| DocumentName | String | Nom du fichier |
| WithoutWorkflow | String | "true" pour bypass OCR |

#### Types de documents

| TypeScan | Usage |
|----------|-------|
| Client | Facture de vente |
| Supplier | Facture fournisseur |
| ExpenseReport | Note de frais |
| Others | Autres |

#### Statuts du document

| Status | Description |
|--------|-------------|
| Received | Document recu |
| Processing | OCR en cours |
| ToReview | A verifier |
| Done | Traite |
| Duplicate | Doublon detecte |

---

### 4.12 EXERCICES COMPTABLES

#### Contexte metier
Les exercices definissent les periodes comptables. Les ecritures ne peuvent etre creees que dans un exercice ouvert.

#### Chift (avant)
```
GET /consumers/{consumer_id}/accounting/bookyears
```

#### Inqom (apres)
```
GET /v1/dossiers/{dossierId}/accounting-periods
```

#### Mapping des champs

| Bubble Exercice | Inqom JSON |
|-----------------|------------|
| Start_date | BeginDate |
| End_date | EndDate |
| Name | Name |
| *(nouveau)* Inqom_locked | Locked |
| *(nouveau)* Inqom_period_ID | Id |

#### Reponse (TEST SCC)
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

### 4.13 CODES TVA

#### Contexte metier
Les codes TVA dans Chift sont des references abstraites. Dans Inqom, on utilise directement les comptes TVA du PCG.

#### Chift (avant)
```
GET /consumers/{consumer_id}/accounting/vat-codes
```

#### Inqom (apres)
Pas d'equivalent direct. Utiliser les comptes TVA standards :

| Compte | Description | Utilisation |
|--------|-------------|-------------|
| 44566 | TVA deductible sur ABS | Achats (factures fournisseurs) |
| 44571 | TVA collectee | Ventes (factures clients) |
| 4457 | TVA collectee (general) | Alternative |

#### Impact sur Bubble

Le champ `vat_rate` dans les tables `Facture - Ligne` et `Article` qui reference `VAT Code Chift` devra etre adapte pour pointer vers les comptes TVA Inqom ou stocker directement le taux de TVA.

---

## 5. Codes de test valides

### 5.1 Donnees de test creees dans TEST SCC (80548)

| Element | Valeur | Description |
|---------|--------|-------------|
| Compte fournisseur | 4011TESTMARC | Cree pour test |
| Ecriture facture | 570817716 | ExternalId: SCC-TEST-001 |
| Ecriture reglement | 570859689 | ExternalId: SCC-REGLEMENT-001 |
| Lettrage | 136341101 | Entre 2105484455 et 2105616480 |

### 5.2 IDs des journaux (TEST SCC)

| Code | Id | Type |
|------|----|------|
| HA | 948155 | Buy (Achats) |
| VT | 948156 | Sell (Ventes) |
| BQ | 948157 | Bank |
| OD | 948158 | Misc |
| AN | 948160 | ANouveaux |

---

## 6. Anomalies et recommandations

### 6.1 Points d'attention

| Sujet | Observation | Recommandation |
|-------|-------------|----------------|
| **Suppression de comptes** | Pas d'endpoint DELETE /accounts | Supprimer manuellement via UI Inqom (Balance) |
| **Prefixe automatique** | 401ABC devient 4011ABC | Stocker le numero retourne, pas celui envoye |
| **Limite ecritures** | Max 50 par appel POST /entries | Batcher si plus de 50 factures |
| **Limite lettrage** | Max 100 par appel POST /letterings | Batcher si necessaire |
| **Token longue duree** | ~1 an (31104000 sec) | Gerer le renouvellement proactif |
| **Endpoint /changes** | Retourne vide si pas de modification serveur | Utiliser /entry-lines pour sync complete |

### 6.2 Differences conceptuelles Chift vs Inqom

| Concept | Chift | Inqom |
|---------|-------|-------|
| Fournisseurs | Entites separees | Comptes 401* |
| Clients | Entites separees | Comptes 411* |
| Factures | Objet "Invoice" | Ecriture comptable + Document |
| TVA | Codes TVA abstraits | Comptes 445* du PCG |
| Webhooks | Natifs | Non disponibles (polling) |

### 6.3 Champs Bubble a supprimer apres migration

| Table | Champs a supprimer |
|-------|-------------------|
| User | Chift_access_token, Chift_token_expiration_date |
| Society | Chift_consumer_ID, Chift_folder_ID, Chift_connection_state, Current_connection_ID |
| Facture | chift_id, chift_status, chift_journal_id, [??] chift_partner_id |
| Fournisseur | chift_id, Chift_folder_ID |
| Client | chift_id, Chift_folder_ID |
| Journal | id_chift, Chift_folder_ID |
| Compte | Chift_folder_ID |
| Facture - Ligne | Chift_folder_ID |
| Article | chift_chart_account_number |

### 6.4 Nouveaux champs Bubble a creer

| Table | Nouveau champ | Type | Description |
|-------|---------------|------|-------------|
| User | Inqom_access_token | text (prive) | Token JWT |
| User | Inqom_token_expiry | date | Expiration du token |
| Society | Inqom_company_ID | number | ID Company (28118) |
| Society | Inqom_folder_ID | number | ID AccountingFolder |
| Society | Inqom_connection_state | text | Active/Inactive |
| Facture | Inqom_entry_ID | number | ID de l'ecriture |
| Facture | Inqom_document_ID | number | ID du document PDF |
| Fournisseur | Inqom_account_number | text | Ex: 4011AMAZON |
| Client | Inqom_account_number | text | Ex: 4111CLIENTXYZ |
| Journal | Inqom_journal_ID | number | ID du journal |
| Exercice | Inqom_period_ID | number | ID de l'exercice |
| Exercice | Inqom_locked | boolean | Exercice verrouille |

---

## Checklist de migration

### Phase 1 : Preparation
- [ ] Creer les nouveaux champs Bubble (voir 6.4)
- [ ] Configurer l'API Connector avec les endpoints Inqom
- [ ] Tester l'authentification

### Phase 2 : Lecture
- [ ] Migrer GET journaux
- [ ] Migrer GET exercices
- [ ] Migrer GET comptes (plan comptable)
- [ ] Migrer GET factures (entry-lines)

### Phase 3 : Ecriture
- [ ] Migrer creation de comptes fournisseurs
- [ ] Migrer creation de comptes clients
- [ ] Migrer creation de factures fournisseurs
- [ ] Migrer creation de factures clients
- [ ] Migrer creation d'avoirs
- [ ] Migrer upload de documents PDF

### Phase 4 : Reconciliation
- [ ] Migrer creation de reglements
- [ ] Migrer lettrage automatique

### Phase 5 : Nettoyage
- [ ] Supprimer les workflows Chift
- [ ] Supprimer les champs Chift
- [ ] Tester le flow complet

---

## Support

**Documentation Inqom:** https://docs.chift.eu (via proxy Chift) ou contacter le support Inqom directement.

**Dossier de test:** TEST SCC (Id: 80548) - Utiliser pour tous les tests avant mise en production.

---

*Document genere le 3 decembre 2025 - Simple Comme Ca*
