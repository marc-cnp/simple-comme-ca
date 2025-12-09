# Mapping Chift → Inqom pour Simple Comme Ca

## Document de spécifications pour l'intégration directe avec Inqom

**Version:** 1.0
**Date:** Décembre 2024
**Projet:** Simple Comme Ca - Migration Bubble → Inqom (sans Chift)

---

## Table des matières

1. [Contexte](#contexte)
2. [Architecture d'authentification](#architecture-dauthentification)
3. [Mapping des entités principales](#mapping-des-entités-principales)
4. [Endpoints et flows détaillés](#endpoints-et-flows-détaillés)
5. [Correspondance des champs](#correspondance-des-champs)
6. [Codes et référentiels](#codes-et-référentiels)

---

## Contexte

### Situation actuelle
- **Chemin actuel:** Bubble.io → Chift API → Inqom
- **Chemin cible:** Bubble.io → Inqom API (direct)

### Identifiants Inqom fournis
| Paramètre | Valeur |
|-----------|--------|
| client_id | `simplecommecav2` |
| client_secret | `DBjTzLWLFE94jSt6Cix9` |
| CompanyId | `28118` |

### URLs de base

| Environnement | Service | URL |
|---------------|---------|-----|
| **Production** | Auth | `https://auth.inqom.com/identity/connect/token` |
| **Production** | Accounting Services | `https://wa-fred-accounting-services-prod.azurewebsites.net` |
| **Production** | Accounting Documents | `https://wa-fred-accounting-documents-prod.azurewebsites.net` |
| **Production** | Banking | `https://wa-fred-banking-prod.azurewebsites.net` |
| **Recette** | Auth | `https://auth-staging.inqom.com/identity/connect/token` |
| **Recette** | Accounting Services | `https://fredstagingapi.azurewebsites.net` |
| **Recette** | Accounting Documents | `https://wa-fred-accounting-documents-staging.azurewebsites.net` |
| **Recette** | Banking | `https://wa-fred-banking-staging.azurewebsites.net` |

---

## Architecture d'authentification

### Flow OAuth2 (Resource Owner Password Grant)

```
POST {AUTH_URL}/identity/connect/token
Content-Type: application/x-www-form-urlencoded

username={email}
password={password}
grant_type=password
scope=openid apidata
client_id=simplecommecav2
client_secret=DBjTzLWLFE94jSt6Cix9
```

### Réponse
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

### Utilisation du token
```
Authorization: Bearer {access_token}
```

---

## Mapping des entités principales

### Vue d'ensemble

| Entité Bubble (avec Chift) | Entité Inqom | API Inqom |
|---------------------------|--------------|-----------|
| Society | Company + AccountingFolder | Provisioning API |
| Fournisseur | Supplier (via Account 401*) | Accounting API |
| Client | Customer (via Account 411*) | Accounting API |
| Facture | Document / Entry | Documents API + Accounting API |
| Journal | Journal | Accounting API |
| Exercice | AccountingPeriod | Accounting API |
| Compte | Account | Accounting API |

---

## Endpoints et flows détaillés

### 1. SOCIETY → COMPANY + ACCOUNTING FOLDER

#### Champs Bubble actuels (liés à Chift)
| Champ Bubble | Description |
|--------------|-------------|
| `Chift_consumer_ID` | ID du consumer Chift |
| `Chift_folder_ID` | ID du dossier comptable Chift |
| `Chift_connection_state` | État de la connexion |
| `Current_connection_ID` | ID de connexion courante |
| `Logiciel compta` | Logiciel comptable utilisé |

#### Nouveaux champs Bubble (pour Inqom direct)
| Nouveau champ Bubble | Type | Description |
|---------------------|------|-------------|
| `Inqom_company_ID` | Integer | ID de la Company Inqom |
| `Inqom_folder_ID` | Integer | ID du AccountingFolder Inqom (= dossierId) |
| `Inqom_connection_state` | Text | État de connexion (Active, Inactive) |
| `Inqom_external_ID` | Text | ExternalId optionnel pour référence |

#### Endpoints Inqom

**Récupérer les dossiers comptables d'une Company:**
```
GET /provisioning/companies/{companyId}/accounting-folders
```

**Réponse:**
```json
[
  {
    "Id": 12345,
    "Name": "Mon Entreprise SARL",
    "Siren": "123456789",
    "Nic": "00001",
    "ExternalId": "EXT-001",
    "Status": "Active",
    "AccountingType": "Engagement",
    "CompanyId": 28118
  }
]
```

**Mapping des champs:**
| Réponse Inqom | Champ Bubble |
|---------------|--------------|
| `Id` | `Inqom_folder_ID` |
| `CompanyId` | `Inqom_company_ID` |
| `Status` | `Inqom_connection_state` |
| `ExternalId` | `Inqom_external_ID` |
| `Name` | `nom_societe` |
| `Siren` | `siren` |

---

### 2. FOURNISSEUR → ACCOUNT (401*)

#### Champs Bubble actuels (liés à Chift)
| Champ Bubble | Type | Description |
|--------------|------|-------------|
| `chift_id` | Text | ID Chift du fournisseur |
| `Chift_folder_ID` | Text | ID dossier Chift |
| `name` | Text | Nom du fournisseur |
| `account_number` | Text | Numéro de compte |
| `moyen_paiement` | Text | Moyen de paiement |
| `delai_paiement` | Number | Délai de paiement |

#### Nouveaux champs Bubble (pour Inqom direct)
| Nouveau champ Bubble | Type | Description |
|---------------------|------|-------------|
| `Inqom_account_number` | Text | Numéro de compte Inqom (ex: 4011AMAZON) |
| `Inqom_account_id` | Integer | ID interne du compte Inqom |
| `Inqom_folder_ID` | Integer | ID du dossier Inqom |

#### Endpoints Inqom

**Récupérer les comptes fournisseurs:**
```
GET /v1/dossiers/{dossierId}/accounts?accountNumberPrefix=401&accountType=All
```

**Créer un compte fournisseur:**
```
POST /v1/dossiers/{dossierId}/accounts
Content-Type: application/json

{
  "AccountNumber": "401AMAZON",
  "Name": "AMAZON FRANCE",
  "Auxiliarize": true
}
```

**Réponse création:**
```json
"4011AMAZON"
```

> **Note importante:** Inqom applique une logique de mapping automatique. Un compte `401FOURNISSEUR` sera transformé en `4011FOURNISSEUR`.

**Mapping des champs:**
| Champ Bubble | Attribut JSON Inqom | Notes |
|--------------|---------------------|-------|
| `name` | `Name` | Libellé du compte |
| `account_number` | `AccountNumber` | Préfixé par 401 |
| - | `Number` | Numéro retourné (peut différer) |
| - | `IsImpactable` | true/false |
| - | `ParentAccountNumber` | "401" pour auxiliaire |

---

### 3. CLIENT → ACCOUNT (411*)

#### Champs Bubble actuels (liés à Chift)
| Champ Bubble | Type | Description |
|--------------|------|-------------|
| `chift_id` | Text | ID Chift du client |
| `Chift_folder_ID` | Text | ID dossier Chift |
| `name` | Text | Nom du client |
| `account_number` | Text | Numéro de compte |
| `delai_paiement` | Number | Délai de paiement |

#### Nouveaux champs Bubble (pour Inqom direct)
| Nouveau champ Bubble | Type | Description |
|---------------------|------|-------------|
| `Inqom_account_number` | Text | Numéro de compte Inqom (ex: 4111CLIENT) |
| `Inqom_account_id` | Integer | ID interne du compte Inqom |
| `Inqom_folder_ID` | Integer | ID du dossier Inqom |

#### Endpoints Inqom

**Récupérer les comptes clients:**
```
GET /v1/dossiers/{dossierId}/accounts?accountNumberPrefix=411&accountType=All
```

**Créer un compte client:**
```
POST /v1/dossiers/{dossierId}/accounts
Content-Type: application/json

{
  "AccountNumber": "411CLIENTXYZ",
  "Name": "CLIENT XYZ SARL",
  "Auxiliarize": true
}
```

---

### 4. FACTURE → DOCUMENT + ENTRY

#### Champs Bubble actuels (liés à Chift)
| Champ Bubble | Type | Description |
|--------------|------|-------------|
| `chift_id` | Text | ID Chift de la facture |
| `chift_status` | Text | Statut Chift |
| `chift_journal_id` | Text | ID journal Chift |
| `[??] chift_partner_id` | Text | ID partenaire Chift |
| `invoice_type` | Text | Type (achat/vente) |
| `scc_status` | Text | Statut SCC |

#### Nouveaux champs Bubble (pour Inqom direct)
| Nouveau champ Bubble | Type | Description |
|---------------------|------|-------------|
| `Inqom_document_ID` | Integer | ID du document Inqom |
| `Inqom_entry_ID` | Integer | ID de l'écriture Inqom |
| `Inqom_status` | Text | Statut Inqom (voir liste) |
| `Inqom_journal_ID` | Integer | ID du journal Inqom |
| `Inqom_folder_ID` | Integer | ID du dossier Inqom |

#### A. Upload d'un document (facture)

**Endpoint:**
```
POST /api/accounting-documents/accounting-folders/{accountingFolderId}/Documents/
Content-Type: multipart/form-data
```

**Paramètres form-data:**
| Paramètre | Type | Description |
|-----------|------|-------------|
| `TypeScan` | String | `Client` (vente), `Supplier` (achat), `Others` |
| `FileSource` | String | `Api` |
| `Document` | File | La pièce jointe |
| `DocRef` | String | Référence si voulue |
| `SourceId` | String | ID de la facture dans Bubble |
| `WithoutWorkflow` | String | `true` si pas besoin d'OCR |
| `DocumentName` | String | Nom du fichier |

**Réponse:**
```json
{
  "Id": 9518529,
  "AccountingFolderId": 11287,
  "Name": "Facture_FR55104451.pdf",
  "Type": "Supplier",
  "Status": "Received",
  "CreatedAt": "2023-03-24T17:05:21.38Z",
  "Source": "Api",
  "FileUrl": "https://fredprodstorage.blob.core.windows.net/...",
  "ThumbUrl": "https://fredprodstorage.blob.core.windows.net/..."
}
```

**Statuts possibles du document:**
| Status | Description |
|--------|-------------|
| `Received` | Document reçu |
| `ToReview` | À réviser |
| `Processing` | En cours de traitement OCR |
| `Duplicate` | Doublon détecté |
| `Done` | Traité |
| `ManualProcessing` | Traitement manuel requis |
| `Deleted` | Supprimé |

#### B. Création d'écritures comptables

**Endpoint:**
```
POST /v1/dossiers/{dossierId}/entries
Content-Type: application/json
```

**Body (exemple facture fournisseur):**
```json
[
  {
    "JournalId": 32677,
    "Date": "2024-01-15",
    "Document": {
      "Reference": "FAC-2024-001",
      "Date": "2024-01-15"
    },
    "ExternalId": "bubble_facture_12345",
    "Lines": [
      {
        "Label": "Achat marchandises AMAZON",
        "DebitAmount": 100.00,
        "CreditAmount": 0,
        "Currency": "EUR",
        "AccountNumber": "607",
        "ExternalId": "ligne_ht"
      },
      {
        "Label": "TVA déductible",
        "DebitAmount": 20.00,
        "CreditAmount": 0,
        "Currency": "EUR",
        "AccountNumber": "44566",
        "ExternalId": "ligne_tva"
      },
      {
        "Label": "AMAZON FRANCE",
        "DebitAmount": 0,
        "CreditAmount": 120.00,
        "Currency": "EUR",
        "AccountNumber": "4011AMAZON",
        "ExternalId": "ligne_fournisseur"
      }
    ]
  }
]
```

**Réponse:**
```json
[
  {
    "EntryId": 629332,
    "EntryRef": "FAC-2024-001",
    "ExternalId": "bubble_facture_12345",
    "Lines": [
      {"Id": 2556690, "ExternalId": "ligne_ht"},
      {"Id": 2556691, "ExternalId": "ligne_tva"},
      {"Id": 2556692, "ExternalId": "ligne_fournisseur"}
    ]
  }
]
```

**Mapping des champs facture:**
| Champ Bubble | Attribut JSON Inqom | Notes |
|--------------|---------------------|-------|
| `invoice_type` | `Type` (Document) / `JournalId` | Détermine Supplier/Client et le journal |
| `date_facture` | `Date`, `Document.Date` | Format YYYY-MM-DD |
| `reference` | `Document.Reference` | Max 256 caractères |
| `_id` | `ExternalId` | ID Bubble pour traçabilité |
| `montant_ht` | `Lines[].DebitAmount/CreditAmount` | Ligne de charge/produit |
| `montant_tva` | `Lines[].DebitAmount/CreditAmount` | Ligne de TVA |
| `montant_ttc` | `Lines[].DebitAmount/CreditAmount` | Ligne fournisseur/client |

---

### 5. JOURNAL → JOURNAL

#### Champs Bubble actuels (liés à Chift)
| Champ Bubble | Type | Description |
|--------------|------|-------------|
| `id_chift` | Text | ID Chift du journal |
| `Chift_folder_ID` | Text | ID dossier Chift |
| `Nom` | Text | Nom du journal |
| `Type` | Text | Type de journal |
| `Abreviation` | Text | Code abrégé |

#### Nouveaux champs Bubble (pour Inqom direct)
| Nouveau champ Bubble | Type | Description |
|---------------------|------|-------------|
| `Inqom_journal_ID` | Integer | ID du journal Inqom |
| `Inqom_journal_code` | Text | Code du journal (HA, VT, BQ...) |
| `Inqom_journal_type` | Text | Type Inqom |
| `Inqom_folder_ID` | Integer | ID du dossier Inqom |

#### Endpoints Inqom

**Récupérer les journaux:**
```
GET /v1/dossiers/{dossierId}/journals
```

**Réponse:**
```json
[
  {
    "Id": 32677,
    "Name": "HA",
    "Description": "Achat",
    "Type": "Buy"
  },
  {
    "Id": 32678,
    "Name": "VT",
    "Description": "Vente",
    "Type": "Sell"
  },
  {
    "Id": 32679,
    "Name": "BQ",
    "Description": "Banque",
    "Type": "Bank"
  }
]
```

**Créer un journal:**
```
POST /api/app/enterprises/{enterpriseId}/journals
Content-Type: application/json

{
  "Type": "Buy",
  "Name": "HA2",
  "Description": "Achat secondaire",
  "EnterpriseId": 12345
}
```

**Types de journaux Inqom:**
| Code | Type | Description |
|------|------|-------------|
| `Other` | Autre | Journal divers |
| `Buy` | Achat | Factures fournisseurs |
| `Sell` | Vente | Factures clients |
| `Bank` | Banque | Opérations bancaires |
| `Misc` | OD | Opérations diverses |
| `Cash` | Caisse | Opérations de caisse |
| `Salary` | Salaire | Paie |
| `ANouveaux` | AN | À-nouveaux |
| `Depreciation` | Amortissement | Dotations |
| `CutOff` | Cut-off | Régularisations |

**Journaux par défaut Inqom:**
| Type | Code | Description |
|------|------|-------------|
| Buy | HA | Achat |
| Sell | VT | Vente |
| Bank | BQ | Banque |
| Misc | OD | Opérations Diverses |
| Cash | CA | Caisse |
| Salary | SA | Salaire |
| ANouveaux | AN | À Nouveaux |
| Depreciation | IM | Dotations aux amortissements |
| Situation | SIT | Situations |
| CutOff | CO | Cut-off |

---

### 6. EXERCICE → ACCOUNTING PERIOD

#### Champs Bubble
| Champ Bubble | Type | Description |
|--------------|------|-------------|
| `date_debut` | Date | Date de début |
| `date_fin` | Date | Date de fin |
| `nom` | Text | Nom de l'exercice |
| `cloture` | Boolean | Exercice clôturé |

#### Nouveaux champs Bubble (pour Inqom direct)
| Nouveau champ Bubble | Type | Description |
|---------------------|------|-------------|
| `Inqom_period_ID` | Integer | ID de l'exercice Inqom |
| `Inqom_folder_ID` | Integer | ID du dossier Inqom |
| `Inqom_locked` | Boolean | Exercice verrouillé |

#### Endpoints Inqom

**Récupérer les exercices:**
```
GET /v1/dossiers/{dossierId}/accounting-periods
```

**Réponse:**
```json
[
  {
    "Id": 8382,
    "dossierId": 4552,
    "BeginDate": "2023-01-01T00:00:00Z",
    "EndDate": "2023-12-31T00:00:00Z",
    "Locked": false,
    "Name": "2023-12",
    "PreviousAccountingPeriod": 8381
  }
]
```

**Créer un exercice:**
```
POST /api/app/enterprises/{dossierId}/exercices/v2
Content-Type: application/json

{
  "beginDate": "2024-01-01",
  "endDate": "2024-12-31"
}
```

**Mapping des champs:**
| Champ Bubble | Attribut JSON Inqom |
|--------------|---------------------|
| `date_debut` | `BeginDate` |
| `date_fin` | `EndDate` |
| `nom` | `Name` (généré automatiquement) |
| `cloture` | `Locked` |
| `Inqom_period_ID` | `Id` |

---

### 7. NOTES DE FRAIS → EXPENSE BILLS

**Endpoint:**
```
POST /api/v1/accounting-folders/{accountingFolderId}/expense-bills
Content-Type: multipart/form-data
```

**Paramètres:**
| Paramètre | Type | Description |
|-----------|------|-------------|
| `File` | File | Note de frais en pièce jointe |
| `BeneficiaryFullName` | String | Nom du bénéficiaire |
| `FileNameWithExtension` | String | Nom du fichier |
| `DocumentReference` | String | Référence pour la note |

**Réponse:**
```json
{
  "DocumentId": 12345
}
```

---

## Correspondance des champs - Tableau récapitulatif

### Champs à migrer de Chift vers Inqom

| Entité | Champ Chift (à supprimer) | Nouveau champ Inqom | Type |
|--------|--------------------------|---------------------|------|
| **Society** | `Chift_consumer_ID` | `Inqom_company_ID` | Integer |
| | `Chift_folder_ID` | `Inqom_folder_ID` | Integer |
| | `Chift_connection_state` | `Inqom_connection_state` | Text |
| | `Current_connection_ID` | *(non nécessaire)* | - |
| **Fournisseur** | `chift_id` | `Inqom_account_number` | Text |
| | `Chift_folder_ID` | `Inqom_folder_ID` | Integer |
| **Client** | `chift_id` | `Inqom_account_number` | Text |
| | `Chift_folder_ID` | `Inqom_folder_ID` | Integer |
| **Facture** | `chift_id` | `Inqom_document_ID` | Integer |
| | `chift_status` | `Inqom_status` | Text |
| | `chift_journal_id` | `Inqom_journal_ID` | Integer |
| | `[??] chift_partner_id` | *(via account_number)* | - |
| **Journal** | `id_chift` | `Inqom_journal_ID` | Integer |
| | `Chift_folder_ID` | `Inqom_folder_ID` | Integer |

---

## Codes et référentiels

### Récupérer les référentiels Inqom

Ces endpoints permettent de récupérer les données de référence nécessaires à la création d'un dossier comptable.

| Référentiel | Endpoint |
|-------------|----------|
| Types de TVA | `GET /provisioning/references/vats` |
| Régimes d'imposition | `GET /provisioning/references/tax-system` |
| Formes légales | `GET /provisioning/references/legal-forms` |
| Codes NAF | `GET /provisioning/references/naf-codes` |

### Exemple - Formes légales
```json
[
  {
    "CountryCodeId": 0,
    "Code": "SARL",
    "Description": "Société à responsabilité limitée",
    "SinglePerson": false
  },
  {
    "CountryCodeId": 0,
    "Code": "SAS",
    "Description": "Société par actions simplifiée",
    "SinglePerson": false
  }
]
```

---

## Gestion des erreurs

### Codes HTTP standards
| Code | Message | Signification |
|------|---------|---------------|
| 200 | OK | Requête réussie |
| 201 | Created | Ressource créée |
| 204 | No Content | Action effectuée sans contenu de retour |
| 400 | Bad Request | Requête mal formulée |
| 403 | Forbidden | Token invalide ou droits insuffisants |
| 404 | Not Found | Ressource non trouvée |
| 500 | Server Error | Erreur côté Inqom |

### StatusReasons pour les documents
| Code | Description |
|------|-------------|
| `None` | Aucun problème |
| `ExerciseLockedForDates` | Exercice verrouillé pour ces dates |
| `ExercisesNotFound` | Exercice non trouvé |
| `CannotCreateEntriesBeforeFirstOpennedExercise` | Impossible de créer des écritures avant le premier exercice ouvert |
| `SituationNotImpactable` | Situation non impactable |
| `InsertEntryIsForbidden` | Insertion d'écriture interdite |
| `JournalNotFound` | Journal non trouvé |
| `UserManuallyUnsetDuplicate` | Doublon supprimé manuellement |
| `BookEntriesDeletedByUser` | Écritures supprimées par l'utilisateur |

---

## Annexe: Flow de connexion complet

### Étape 1: Authentification
```
1. Bubble appelle l'endpoint d'authentification Inqom
2. Récupère le token JWT
3. Stocke le token (durée de vie: 1h)
```

### Étape 2: Récupération du dossier comptable
```
1. GET /provisioning/companies/28118/accounting-folders
2. Identifier le bon AccountingFolder par ExternalId ou Name
3. Stocker l'Inqom_folder_ID dans la Society Bubble
```

### Étape 3: Synchronisation des journaux
```
1. GET /v1/dossiers/{dossierId}/journals
2. Créer les entrées Journal dans Bubble avec Inqom_journal_ID
```

### Étape 4: Synchronisation des comptes (Fournisseurs/Clients)
```
1. GET /v1/dossiers/{dossierId}/accounts?accountNumberPrefix=401
2. GET /v1/dossiers/{dossierId}/accounts?accountNumberPrefix=411
3. Matcher avec les Fournisseurs/Clients Bubble existants
4. Créer les comptes manquants via POST
```

### Étape 5: Upload des factures
```
1. POST /api/accounting-documents/.../Documents/ (upload fichier)
2. Attendre le traitement OCR (polling sur Status)
3. POST /v1/dossiers/{dossierId}/entries (créer l'écriture)
4. Stocker Inqom_document_ID et Inqom_entry_ID
```

---

## Notes pour les développeurs

1. **Toujours utiliser dossierId (= Inqom_folder_ID)** pour les appels API accounting
2. **Les comptes sont préfixés automatiquement** : `401AMAZON` → `4011AMAZON`
3. **Le token expire après 1 heure** : prévoir un mécanisme de refresh
4. **Les écritures sont transactionnelles** : tout ou rien
5. **Limite de 50 écritures par appel** POST /entries
6. **Limite de 100 lettrages par appel** POST /letterings
