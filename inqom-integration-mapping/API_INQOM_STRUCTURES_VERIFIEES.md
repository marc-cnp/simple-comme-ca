# Structures JSON API Inqom - VERIFIEES

**Date de verification:** 3 decembre 2025
**Environnement:** Production
**Dossier test:** TEST SCC (Id: 80548)

> **IMPORTANT:** Toutes les structures ci-dessous ont ete obtenues par des appels API reels.
> Ne pas modifier sans re-tester l'API.

---

## 1. Authentification

**Endpoint:** `POST https://auth.inqom.com/identity/connect/token`

**Request Body (x-www-form-urlencoded):**
```
username=new@simplecommeca.io
password=scN@RN8Kx7GjSz?4
grant_type=password
scope=openid apidata
client_id=simplecommecav2
client_secret=DBjTzLWLFE94jSt6Cix9
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIs...",
  "expires_in": 31104000,
  "token_type": "Bearer"
}
```

| Attribut | Type | Description |
|----------|------|-------------|
| access_token | string | Token JWT a utiliser dans Authorization header |
| expires_in | integer | Duree de validite en secondes (~1 an) |
| token_type | string | Toujours "Bearer" |

---

## 2. Dossiers Comptables (Accounting Folders)

**Endpoint:** `GET /provisioning/companies/{companyId}/accounting-folders`

**URL:** `https://wa-fred-accounting-services-prod.azurewebsites.net/provisioning/companies/28118/accounting-folders`

**Response (extrait):**
```json
[
  {
    "ExternalId": "",
    "Id": 80548,
    "Siren": "878762145",
    "Nic": "00018",
    "Name": "TEST SCC",
    "UniqueName": "test-scc",
    "ContractType": "Normal",
    "CreatedAt": "2024-12-05T15:00:03.83Z",
    "Status": "Active",
    "AccountingType": "Engagement",
    "CompanyId": 28118
  }
]
```

| Attribut | Type | Description | Mapping Bubble |
|----------|------|-------------|----------------|
| **Id** | integer | ID unique du dossier | Inqom_folder_ID |
| **Name** | string | Nom du dossier | Society.Nom_societe |
| ExternalId | string | ID externe (optionnel) | - |
| Siren | string | Numero SIREN | Society.SIREN |
| Nic | string | NIC (complement SIRET) | - |
| UniqueName | string | Slug unique | - |
| ContractType | string | Type de contrat | - |
| CreatedAt | datetime | Date de creation | - |
| **Status** | string | "Active", "Archived" | Inqom_connection_state |
| AccountingType | string | "Engagement" ou "Tresorerie" | - |
| CompanyId | integer | ID de la company parente | Inqom_company_ID |

---

## 3. Journaux Comptables

**Endpoint:** `GET /v1/dossiers/{dossierId}/journals`

**URL:** `https://wa-fred-accounting-services-prod.azurewebsites.net/v1/dossiers/80548/journals`

**Response:**
```json
[
  {"Id": 948155, "Name": "HA", "Description": "Achat", "Type": "Buy"},
  {"Id": 948156, "Name": "VT", "Description": "Vente", "Type": "Sell"},
  {"Id": 948157, "Name": "BQ", "Description": "Banque", "Type": "Bank"},
  {"Id": 948158, "Name": "OD", "Description": "Operations Diverses", "Type": "Misc"},
  {"Id": 948159, "Name": "SA", "Description": "Salaire", "Type": "Salary"},
  {"Id": 948160, "Name": "AN", "Description": "A Nouveaux", "Type": "ANouveaux"},
  {"Id": 948161, "Name": "IM", "Description": "Dotation aux amortissements", "Type": "Depreciation"},
  {"Id": 948162, "Name": "SIT", "Description": "Situations", "Type": "Situation"},
  {"Id": 948163, "Name": "CO", "Description": "Cut-off", "Type": "CutOff"},
  {"Id": 948164, "Name": "EM", "Description": "Emprunts", "Type": "Loan"},
  {"Id": 948165, "Name": "CB", "Description": "Credits-baux", "Type": "Lease"},
  {"Id": 1163754, "Name": "REV", "Description": "Revision", "Type": "Revision"},
  {"Id": 1394522, "Name": "STO", "Description": "Stock", "Type": "Stock"}
]
```

| Attribut | Type | Description | Mapping Bubble (Table Journal) |
|----------|------|-------------|--------------------------------|
| **Id** | integer | ID unique du journal | id_inqom |
| **Name** | string | Code du journal (HA, VT, BQ...) | Abreviation |
| **Description** | string | Libelle du journal | Nom |
| **Type** | string | Type technique (Buy, Sell, Bank...) | Type |

### Types de Journaux Inqom

| Type Inqom | Description | Usage SCC |
|------------|-------------|-----------|
| Buy | Achats | Factures fournisseurs |
| Sell | Ventes | Factures clients |
| Bank | Banque | Operations bancaires |
| Misc | Operations Diverses | OD, notes de frais |
| Salary | Salaires | Paie |
| ANouveaux | A nouveaux | Reprise soldes |
| Depreciation | Amortissements | Dotations |
| Situation | Situations | Bilans intermediaires |
| CutOff | Cut-off | Regularisations |
| Loan | Emprunts | Echeances prets |
| Lease | Credits-baux | Leasing |
| Revision | Revision | Ecritures de revision |
| Stock | Stock | Mouvements de stock |

---

## 4. Exercices Comptables (Accounting Periods)

**Endpoint:** `GET /v1/dossiers/{dossierId}/accounting-periods`

**URL:** `https://wa-fred-accounting-services-prod.azurewebsites.net/v1/dossiers/80548/accounting-periods`

**Response:**
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
    "Name": "2025-12",
    "PreviousAccountingPeriodId": 240810
  }
]
```

| Attribut | Type | Description |
|----------|------|-------------|
| **Id** | integer | ID unique de l'exercice |
| DossierId | integer | ID du dossier |
| **BeginDate** | datetime | Date de debut |
| **EndDate** | datetime | Date de fin |
| **Locked** | boolean | Exercice verrouille ? |
| Name | string | Nom de l'exercice |
| PreviousAccountingPeriodId | integer | ID exercice precedent (optionnel) |

> **IMPORTANT:** Ne pas creer d'ecritures dans un exercice ou `Locked: true`

---

## 5. Comptes (Plan Comptable)

**Endpoint:** `GET /v1/dossiers/{dossierId}/accounts`

**Parametres:**
- `accountNumberPrefix` : Prefixe du compte (ex: "401", "411", "445")
- `accountType` : "All", "Auxiliary", "General"

### 5.1 Comptes Fournisseurs (401*)

**URL:** `GET /v1/dossiers/80548/accounts?accountNumberPrefix=401&accountType=All`

**Response (extrait):**
```json
[
  {
    "Number": "401",
    "Name": "Fournisseurs",
    "IsImpactable": false,
    "IsDivisible": false,
    "IsManaged": false
  },
  {
    "Number": "4011",
    "Name": "Fournisseurs Achats de biens et prestations de services",
    "IsImpactable": false,
    "IsDivisible": true,
    "IsManaged": false
  },
  {
    "Number": "4011TESTMARC",
    "Name": "FOURNISSEUR TEST MARC",
    "IsImpactable": true,
    "IsDivisible": false,
    "IsManaged": false,
    "ParentAccountNumber": "4011"
  }
]
```

| Attribut | Type | Description | Mapping Bubble (Fournisseur/Client) |
|----------|------|-------------|-------------------------------------|
| **Number** | string | Numero de compte | Inqom_account_number |
| **Name** | string | Libelle du compte | Nom |
| IsImpactable | boolean | Peut recevoir des ecritures | - |
| IsDivisible | boolean | Peut avoir des sous-comptes | - |
| IsManaged | boolean | Gere automatiquement | - |
| ParentAccountNumber | string | Compte parent (pour auxiliaires) | - |

### 5.2 Comptes TVA (445*)

**URL:** `GET /v1/dossiers/80548/accounts?accountNumberPrefix=445&accountType=All`

**Comptes TVA principaux:**

| Number | Name | Usage |
|--------|------|-------|
| 44566 | TVA sur autres biens et services | **TVA deductible (achats)** |
| 44571 | TVA collectee | **TVA collectee (ventes)** |
| 4452 | TVA due intracommunautaire | Autoliquidation UE |
| 44551 | TVA a decaisser | TVA a payer |
| 44567 | Credit de TVA a reporter | Credit TVA |

---

## 6. Lignes d'Ecritures (Entry Lines)

**Endpoint:** `GET /v1/dossiers/{dossierId}/entry-lines`

**Parametres obligatoires:**
- `startDate` : Date debut (format YYYY-MM-DD)
- `endDate` : Date fin (format YYYY-MM-DD)
- `pageNumber` : Numero de page (commence a 1)

**Parametres optionnels:**
- `accountNumber` : Filtrer par compte

**URL:** `GET /v1/dossiers/80548/entry-lines?startDate=2025-01-01&endDate=2025-12-31&pageNumber=1`

**Response (extrait):**
```json
{
  "EntryLines": [
    {
      "TypeOfChange": "Update",
      "Id": 2105484455,
      "Label": "FOURNISSEUR TEST MARC",
      "DebitAmount": 0.0,
      "CreditAmount": 120.00000,
      "LetterId": 136341101,
      "Letter": "A",
      "LetterDate": "2025-12-03T00:00:00Z",
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
        "Id": 40877030,
        "Reference": "FACT-MARC-001"
      }
    }
  ],
  "CurrentPage": 1
}
```

| Attribut | Type | Description | Mapping Bubble (Facture) |
|----------|------|-------------|--------------------------|
| **Id** | integer | ID unique de la ligne | Inqom_entry_line_id |
| **Label** | string | Libelle de la ligne | Description |
| **DebitAmount** | decimal | Montant debit | Montant (si debit) |
| **CreditAmount** | decimal | Montant credit | Montant (si credit) |
| TypeOfChange | string | "Creation", "Update", "Delete" | - |
| LetterId | integer | ID du lettrage (si lettre) | Inqom_letter_id |
| Letter | string | Code lettre (A, B, C...) | - |
| LetterDate | datetime | Date du lettrage | - |
| Currency | string | Devise (EUR) | - |
| **Entry.Id** | integer | ID de l'ecriture parente | Inqom_entry_id |
| **Entry.Date** | datetime | Date de l'ecriture | Date_facture |
| **AccountNumber** | string | Numero de compte | - |
| **Journal.Id** | integer | ID du journal | Journal_id |
| Journal.Code | string | Code du journal | - |
| AccountingDocument.Id | integer | ID du document | Inqom_document_id |
| **AccountingDocument.Reference** | string | Reference piece | Numero_facture |

### Pagination

La reponse contient `CurrentPage`. Incrementer `pageNumber` jusqu'a obtenir une liste vide.

---

## 7. Documents

**Endpoint:** `GET /api/accounting-documents/accounting-folders/{folderId}/Documents`

**Base URL:** `https://wa-fred-accounting-documents-prod.azurewebsites.net`

**URL:** `GET /api/accounting-documents/accounting-folders/80548/Documents`

**Response (extrait):**
```json
[
  {
    "Id": 40877030,
    "AccountingFolderId": 80548,
    "Name": "F25110015.pdf",
    "Type": "Others",
    "Size": 193,
    "CreatedAt": "2025-11-19T10:43:22.83Z",
    "Source": "Api",
    "ClientSource": "Api",
    "DocRef": "F-25-11-0015",
    "Checksum": "EEB55E5F51115F696194F7EDC25348B1D4319CA6",
    "Status": "Done",
    "StatusUpdatedAt": "2025-11-19T10:47:39.36Z",
    "StatusResponsibleUserId": 250,
    "FileUrl": "https://fredprodstorage.blob.core.windows.net/...",
    "ThumbUrl": "https://fredprodstorage.blob.core.windows.net/...",
    "OwnerId": 27151,
    "OriginalName": "F25110015.pdf",
    "ContentSource": "DocData",
    "EffectifDate": "2025-11-19T00:00:00Z",
    "EntryGenerationProvider": "Inqom",
    "HasRevisedStatus": false,
    "Provider": "simplecommeca"
  }
]
```

| Attribut | Type | Description | Mapping Bubble (Facture) |
|----------|------|-------------|--------------------------|
| **Id** | integer | ID unique du document | Inqom_document_id |
| AccountingFolderId | integer | ID du dossier | - |
| **Name** | string | Nom du fichier | - |
| **Type** | string | Type de document | Type_facture |
| Size | integer | Taille en KB | - |
| CreatedAt | datetime | Date d'upload | - |
| Source | string | Source (Api, SendGrid, Web) | - |
| **DocRef** | string | Reference du document | Numero_facture |
| Checksum | string | Hash du fichier | - |
| **Status** | string | Statut du document | - |
| **FileUrl** | string | URL du fichier PDF | URL_facture_pdf |
| ThumbUrl | string | URL de la miniature | - |
| CounterParty | string | Tiers detecte (OCR) | Fournisseur/Client |
| Amount | decimal | Montant detecte (OCR) | Montant_TTC |
| EffectifDate | datetime | Date effective | Date_facture |
| TargetDate | datetime | Date d'echeance (OCR) | Date_echeance |

### Types de Documents

| Type | Description |
|------|-------------|
| Supplier | Facture fournisseur |
| Client | Facture client |
| ExpenseReport | Note de frais |
| Others | Autres |

### Statuts de Documents

| Status | Description |
|--------|-------------|
| Received | Recu |
| Processing | OCR en cours |
| ToReview | A verifier |
| Done | Traite |
| Duplicate | Doublon |

---

## 8. Creation d'Ecritures

**Endpoint:** `POST /v1/dossiers/{dossierId}/entries`

**URL:** `https://wa-fred-accounting-services-prod.azurewebsites.net/v1/dossiers/80548/entries`

**Request Body (array max 50 ecritures):**
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

**Response:**
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

### Champs de la requete

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| JournalId | integer | OUI | ID du journal |
| Date | string | OUI | Date de l'ecriture (YYYY-MM-DD) |
| Document.Reference | string | OUI | Reference de la piece |
| Document.Date | string | OUI | Date du document |
| ExternalId | string | NON | ID externe (pour retrouver l'ecriture) |
| Lines | array | OUI | Lignes de l'ecriture (min 2) |
| Lines[].Label | string | OUI | Libelle de la ligne |
| Lines[].DebitAmount | decimal | OUI* | Montant debit |
| Lines[].CreditAmount | decimal | OUI* | Montant credit |
| Lines[].Currency | string | OUI | Devise (EUR) |
| Lines[].AccountNumber | string | OUI | Numero de compte |

> *Une ligne doit avoir soit DebitAmount > 0, soit CreditAmount > 0, jamais les deux.

---

## 9. Lettrage

**Endpoint:** `POST /v1/dossiers/{dossierId}/letterings`

**URL:** `https://wa-fred-accounting-services-prod.azurewebsites.net/v1/dossiers/80548/letterings`

**Request Body:**
```json
{
  "CreateLetterringCommands": [
    {
      "EntryLineIds": [2105484455, 2105616480]
    }
  ]
}
```

**Response:**
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

### Regles du lettrage

1. Les lignes doivent etre sur le **meme compte**
2. La somme des debits doit egaler la somme des credits
3. Un lettrage partiel est possible (solde non nul)

---

## 10. Creation de Compte

**Endpoint:** `POST /v1/dossiers/{dossierId}/accounts`

**URL:** `https://wa-fred-accounting-services-prod.azurewebsites.net/v1/dossiers/80548/accounts`

**Request Body:**
```json
{
  "AccountNumber": "4011NOUVEAUFOURNISSEUR",
  "Name": "NOUVEAU FOURNISSEUR SARL",
  "Auxiliarize": true
}
```

**Response:**
```
"4011NOUVEAUFOURNISSEUR"
```

> **ATTENTION:** Inqom peut modifier le numero de compte (ex: ajouter un "1" apres le prefixe).
> Toujours stocker le numero **retourne** par l'API, pas celui envoye.

---

## 11. Synchronisation Incrementale

**Endpoint:** `GET /v1/dossiers/{dossierId}/entry-lines/changes`

**Parametres:**
- `startDate` : Date debut
- `endDate` : Date fin
- `changedAfter` : Datetime ISO (filtre les modifications serveur)

**URL:** `GET /v1/dossiers/80548/entry-lines/changes?startDate=2025-01-01&endDate=2025-12-31&changedAfter=2025-12-03T00:00:00Z`

**Note:** Cet endpoint retourne les lignes modifiees cote serveur apres la date specifiee.
Utile pour la synchronisation incrementale (polling).

---

## Resume des Base URLs

| API | URL Production |
|-----|---------------|
| Authentification | https://auth.inqom.com |
| Accounting Services | https://wa-fred-accounting-services-prod.azurewebsites.net |
| Accounting Documents | https://wa-fred-accounting-documents-prod.azurewebsites.net |
| Banking | https://wa-fred-banking-prod.azurewebsites.net |

---

---

## 12. Referentiel TVA (Regimes)

**Endpoint:** `GET /provisioning/references/vats`

**URL:** `https://wa-fred-accounting-services-prod.azurewebsites.net/provisioning/references/vats`

**Response:**
```json
[
  {"Code": "CA12", "Description": "Annuel - CA12", "Id": 2},
  {"Code": "CA3M", "Description": "Mensuel - CA3", "Id": 3},
  {"Code": "CA3T", "Description": "Trimestriel - CA3", "Id": 4},
  {"Code": "None", "Description": "Franchise de base", "Id": 5},
  {"Code": "None", "Description": "Non Assujetti", "Id": 6}
]
```

> **Note:** Ce sont les **regimes de TVA** (CA12, CA3), pas les taux (20%, 10%, 5.5%).
> Le paramétrage TVA spécifique à un dossier n'est pas exposé via API.
> Pour les taux, utiliser les comptes 445* standards du PCG.

---

## 13. Details d'un Document (avec OCR)

**Endpoint:** `GET /api/accounting-documents/accounting-folders/{folderId}/Documents/{documentId}`

**URL:** `https://wa-fred-accounting-documents-prod.azurewebsites.net/api/accounting-documents/accounting-folders/80548/Documents/40726023`

**Response (document avec OCR):**
```json
{
  "Id": 40726023,
  "AccountingFolderId": 80548,
  "Name": "LNKD_INVOICE_78981999738.pdf",
  "Type": "ExpenseReport",
  "Size": 156,
  "CreatedAt": "2025-11-17T14:56:49.88Z",
  "Source": "Api",
  "ClientSource": "Web",
  "DocRef": "78981999738",
  "Checksum": "339E6870665582D26BA2B98BFE3493248AD6416D",
  "Status": "Done",
  "FileUrl": "https://fredprodstorage.blob.core.windows.net/.../lnkd_invoice.pdf",
  "ThumbUrl": "https://fredprodstorage.blob.core.windows.net/.../thumb.png",
  "GoogleJsonUrl": "https://fredprodstorage.blob.core.windows.net/.../GoogleOcr/40726023_g.json",
  "CounterParty": "LinkedIn Ireland Unlimited Company",
  "Amount": 14.87,
  "EffectifDate": "2025-03-12T00:00:00Z",
  "EntryGenerationProvider": "Inqom",
  "Provider": "Inqom"
}
```

| Attribut | Type | Description |
|----------|------|-------------|
| **GoogleJsonUrl** | string | URL vers le JSON d'extraction OCR (Google Vision) |
| CounterParty | string | Tiers detecte par OCR |
| Amount | decimal | Montant detecte par OCR |
| EffectifDate | datetime | Date de la facture detectee par OCR |

> **Note:** Le champ `GoogleJsonUrl` n'est present que pour les documents traites par OCR (Source: SendGrid, Web).
> Les documents uploades via API sans traitement OCR n'ont pas ce champ.

---

## Informations de l'echange email Inqom (Dec 2025)

### Contacts Inqom
- **Anne-Helene PLEVIN** - Specialiste API

### Points cles confirmes
1. **Base URL:** `https://api.inqom.com` (redirige vers services Azure)
2. **CompanyId SCC:** 28118
3. **Credentials RessourceOwner (prod):**
   - client_id: simplecommecav2
   - client_secret: DBjTzLWLFE94jSt6Cix9

### Endpoints mentionnes
- `/provisioning/companies/{companyId}/accounting-folders` - Liste dossiers
- `/provisioning/references/vats` - Referentiel TVA (regimes, pas taux)
- `/api/accounting-documents/.../Documents/{id}` - Details document avec GoogleJsonUrl (OCR)

### Limitations confirmees
- Le parametrage TVA specifique a un dossier n'est **pas expose via API**
- Les taux de TVA doivent etre geres via les comptes 445* du PCG

---

## 14. Balances Comptables

**Endpoint:** `GET /v1/dossiers/{dossierId}/balances`

**Parametres obligatoires:**
- `startDate` : Date debut (format YYYY-MM-DD)
- `endDate` : Date fin (format YYYY-MM-DD)

**URL:** `GET /v1/dossiers/80548/balances?startDate=2024-01-01&endDate=2024-12-31`

**Response (extrait):**
```json
[
  {
    "Account": {
      "Number": "4111",
      "Label": "Clients Ventes de biens ou de prestations de services"
    },
    "LineCount": 3,
    "DebitBalance": 30800.00000,
    "CreditBalance": 0.0,
    "DebitAmount": 30800.00000,
    "CreditAmount": 0.00000,
    "CreditAmountBroughtForward": 0.0,
    "DebitAmountBroughtForward": 0.0,
    "UnletteredOrCrossLetteredLineCount": 3,
    "AuxiliaryBalance": [
      {
        "Account": {
          "Number": "4111CLIENTX",
          "Label": "CLIENTX",
          "ParentAccountNumber": "4111"
        },
        "LineCount": 1,
        "DebitBalance": 100.00000,
        "CreditBalance": 0.0,
        "DebitAmount": 100.00000,
        "CreditAmount": 0.00000
      }
    ]
  }
]
```

| Attribut | Type | Description |
|----------|------|-------------|
| Account.Number | string | Numero du compte |
| Account.Label | string | Libelle du compte |
| LineCount | integer | Nombre de lignes d'ecritures |
| DebitBalance | decimal | Solde debiteur |
| CreditBalance | decimal | Solde crediteur |
| DebitAmount | decimal | Total des debits |
| CreditAmount | decimal | Total des credits |
| DebitAmountBroughtForward | decimal | A nouveaux debit |
| CreditAmountBroughtForward | decimal | A nouveaux credit |
| UnletteredOrCrossLetteredLineCount | integer | Lignes non lettrees |
| AuxiliaryBalance | array | Balance des comptes auxiliaires (si applicable) |

---

## RESUME DES TESTS API - 3 Decembre 2025

### Tests valides avec succes

| # | Endpoint | Status | Structure verifiee |
|---|----------|--------|-------------------|
| 1 | `POST /identity/connect/token` | OK | Token JWT obtenu |
| 2 | `GET /provisioning/companies/{id}/accounting-folders` | OK | Liste 119 dossiers |
| 3 | `GET /v1/dossiers/{id}/journals` | OK | 13 journaux - **Name, Description, Type** |
| 4 | `GET /v1/dossiers/{id}/accounting-periods` | OK | 2 exercices (2024, 2025) |
| 5 | `GET /v1/dossiers/{id}/accounts?prefix=401` | OK | Comptes fournisseurs (40 comptes) |
| 6 | `GET /v1/dossiers/{id}/accounts?prefix=411` | OK | Comptes clients (50 comptes) |
| 7 | `GET /v1/dossiers/{id}/accounts?prefix=445` | OK | Comptes TVA (29 comptes) |
| 8 | `GET /v1/dossiers/{id}/entry-lines?dates` | OK | Lignes avec Entry, Journal, Document |
| 9 | `GET /v1/dossiers/{id}/balances?dates` | OK | Balance avec AuxiliaryBalance |
| 10 | `GET /provisioning/references/vats` | OK | 5 regimes TVA (CA12, CA3M, CA3T...) |

### Endpoints sans donnees (normal pour dossier test)

| Endpoint | Raison |
|----------|--------|
| `GET /api/.../Documents` | Aucun document dans dossier test |
| `GET /v1/.../entries` | Aucune ecriture complete retournee |
| `GET /v1/.../letterings` | Aucun lettrage dans periode testee |

---

*Document genere et verifie le 3 decembre 2025*
*Mis a jour avec tests API complets et informations de l'echange email Inqom*
