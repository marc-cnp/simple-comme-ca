# Spécifications Techniques - Intégration Inqom

## Guide d'implémentation pour les développeurs Bubble

**Version:** 1.0
**Date:** Décembre 2024
**Projet:** Simple Comme Ca - Intégration directe Inqom

---

## Vue d'ensemble

### Objectif
Remplacer l'intégration actuelle `Bubble → Chift → Inqom` par une intégration directe `Bubble → Inqom`.

### Scope
- Authentification OAuth2
- Gestion des dossiers comptables
- CRUD Fournisseurs/Clients (via comptes comptables)
- Upload et suivi des factures
- Création d'écritures comptables
- Synchronisation des données

---

## 1. Configuration initiale

### 1.1 API Connector Bubble

**Créer un nouveau API Connector "Inqom API":**

```
Name: Inqom API
Authentication: None (géré manuellement via token)
```

### 1.2 Endpoints à configurer

#### A. Authentication
```
Name: Get Token
URL: https://auth.inqom.com/identity/connect/token
Method: POST
Headers:
  Content-Type: application/x-www-form-urlencoded
Body type: Form-data parameters
Parameters:
  - username (text, not private)
  - password (text, private)
  - grant_type (text, private) = "password"
  - scope (text, private) = "openid apidata"
  - client_id (text, private) = "simplecommecav2"
  - client_secret (text, private) = "DBjTzLWLFE94jSt6Cix9"
```

#### B. Get Accounting Folders
```
Name: Get Accounting Folders
URL: https://wa-fred-accounting-services-prod.azurewebsites.net/provisioning/companies/[companyId]/accounting-folders
Method: GET
Headers:
  Authorization: Bearer [token]
  Content-Type: application/json
Path parameters:
  - companyId (integer)
Header parameters:
  - token (text, private)
```

#### C. Get Journals
```
Name: Get Journals
URL: https://wa-fred-accounting-services-prod.azurewebsites.net/v1/dossiers/[dossierId]/journals
Method: GET
Headers:
  Authorization: Bearer [token]
Path parameters:
  - dossierId (integer)
Header parameters:
  - token (text, private)
```

#### D. Get Accounts
```
Name: Get Accounts
URL: https://wa-fred-accounting-services-prod.azurewebsites.net/v1/dossiers/[dossierId]/accounts
Method: GET
Headers:
  Authorization: Bearer [token]
Query parameters:
  - accountNumberPrefix (text, optional)
  - accountType (text, optional) = "All" ou "Impactable"
Path parameters:
  - dossierId (integer)
Header parameters:
  - token (text, private)
```

#### E. Create Account
```
Name: Create Account
URL: https://wa-fred-accounting-services-prod.azurewebsites.net/v1/dossiers/[dossierId]/accounts
Method: POST
Headers:
  Authorization: Bearer [token]
  Content-Type: application/json
Body: JSON
  {
    "AccountNumber": "[accountNumber]",
    "Name": "[name]",
    "Auxiliarize": [auxiliarize]
  }
Path parameters:
  - dossierId (integer)
Body parameters:
  - accountNumber (text)
  - name (text)
  - auxiliarize (boolean) = true
```

#### F. Upload Document
```
Name: Upload Document
URL: https://wa-fred-accounting-documents-prod.azurewebsites.net/api/accounting-documents/accounting-folders/[accountingFolderId]/Documents/
Method: POST
Headers:
  Authorization: Bearer [token]
Body type: Form-data
Parameters:
  - TypeScan (text) = "Supplier" ou "Client"
  - FileSource (text) = "Api"
  - Document (file)
  - DocRef (text, optional)
  - SourceId (text, optional)
  - WithoutWorkflow (text) = "false"
  - DocumentName (text)
Path parameters:
  - accountingFolderId (integer)
```

#### G. Create Entries
```
Name: Create Entries
URL: https://wa-fred-accounting-services-prod.azurewebsites.net/v1/dossiers/[dossierId]/entries
Method: POST
Headers:
  Authorization: Bearer [token]
  Content-Type: application/json
Body: JSON (array d'écritures)
Path parameters:
  - dossierId (integer)
```

---

## 2. Modifications de la base de données Bubble

### 2.1 Table: Society

**Champs à ajouter:**
| Champ | Type | Description |
|-------|------|-------------|
| `Inqom_company_ID` | Number | ID Company Inqom (= 28118) |
| `Inqom_folder_ID` | Number | ID AccountingFolder Inqom |
| `Inqom_connection_state` | Text | Active, Inactive, Pending |
| `Inqom_external_ID` | Text | ExternalId optionnel |
| `Inqom_last_sync` | Date | Dernière synchronisation |

**Champs à conserver (migration):**
| Champ ancien | Action |
|--------------|--------|
| `Chift_consumer_ID` | Garder pour historique, marquer obsolète |
| `Chift_folder_ID` | Garder pour historique, marquer obsolète |
| `Chift_connection_state` | Garder pour historique, marquer obsolète |

### 2.2 Table: Fournisseur

**Champs à ajouter:**
| Champ | Type | Description |
|-------|------|-------------|
| `Inqom_account_number` | Text | Ex: "4011AMAZON" |
| `Inqom_account_id` | Number | ID interne compte |
| `Inqom_folder_ID` | Number | Lien vers le dossier |

**Champs à conserver:**
| Champ ancien | Action |
|--------------|--------|
| `chift_id` | Garder pour historique |
| `Chift_folder_ID` | Garder pour historique |

### 2.3 Table: Client

**Champs à ajouter:**
| Champ | Type | Description |
|-------|------|-------------|
| `Inqom_account_number` | Text | Ex: "4111CLIENTXYZ" |
| `Inqom_account_id` | Number | ID interne compte |
| `Inqom_folder_ID` | Number | Lien vers le dossier |

### 2.4 Table: Facture

**Champs à ajouter:**
| Champ | Type | Description |
|-------|------|-------------|
| `Inqom_document_ID` | Number | ID document Inqom |
| `Inqom_entry_ID` | Number | ID écriture Inqom |
| `Inqom_status` | Text | Received, Processing, Done, etc. |
| `Inqom_journal_ID` | Number | ID journal utilisé |
| `Inqom_folder_ID` | Number | Lien vers le dossier |
| `Inqom_entry_lines` | List of texts | IDs des lignes d'écriture |

### 2.5 Table: Journal

**Champs à ajouter:**
| Champ | Type | Description |
|-------|------|-------------|
| `Inqom_journal_ID` | Number | ID journal Inqom |
| `Inqom_journal_code` | Text | Code court (HA, VT...) |
| `Inqom_journal_type` | Text | Buy, Sell, Bank, etc. |
| `Inqom_folder_ID` | Number | Lien vers le dossier |

### 2.6 Nouvelle Table: Inqom_Token

**Pour gérer les tokens par société:**
| Champ | Type | Description |
|-------|------|-------------|
| `society` | Society | Lien vers la société |
| `access_token` | Text (private) | Token JWT |
| `token_expiry` | Date | Expiration |
| `created_at` | Date | Création |

---

## 3. Workflows à implémenter

### 3.1 Workflow: Connect to Inqom

**Trigger:** Button click "Connecter la comptabilité"

**Steps:**
```
1. API Call: Get Token
   - username = Input_Email's value
   - password = Input_Password's value

2. Si Result's access_token n'est pas vide:

   2.1 Create Inqom_Token:
       - society = Current Page's Society
       - access_token = Result's access_token
       - token_expiry = Current date/time + 1 hour
       - created_at = Current date/time

   2.2 API Call: Get Accounting Folders
       - companyId = 28118
       - token = Step 1's access_token

   2.3 Display data in Repeating Group (liste dossiers)

3. Sinon:
   - Alert: "Identifiants incorrects"
```

### 3.2 Workflow: Select Accounting Folder

**Trigger:** Click on RG cell (dossier sélectionné)

**Steps:**
```
1. Make changes to Current Page's Society:
   - Inqom_company_ID = 28118
   - Inqom_folder_ID = Current cell's Id
   - Inqom_connection_state = "Active"
   - Inqom_external_ID = Current cell's ExternalId

2. Schedule API Workflow: Sync Journals
   - society = Current Page's Society

3. Schedule API Workflow: Sync Accounts
   - society = Current Page's Society

4. Navigate to: Page Dashboard
   - Data: Current Page's Society
```

### 3.3 Backend Workflow: Sync Journals

**Type:** API Workflow (backend)

**Parameters:**
- society (Society)

**Steps:**
```
1. Get Valid Token (sous-workflow)
   - society = society
   → Retourne token

2. API Call: Get Journals
   - dossierId = society's Inqom_folder_ID
   - token = Step 1's token

3. Pour chaque journal dans Result:

   3.1 Search for Journals:
       - Constraint: Inqom_journal_ID = This journal's Id
       - Constraint: society = society

   3.2 Si count = 0:
       - Create Journal:
         - Nom = This journal's Description
         - Abreviation = This journal's Name
         - Type = This journal's Type
         - Inqom_journal_ID = This journal's Id
         - Inqom_journal_code = This journal's Name
         - Inqom_journal_type = This journal's Type
         - Inqom_folder_ID = society's Inqom_folder_ID
         - society = society

   3.3 Sinon:
       - Make changes to Result of step 3.1's first item:
         (mettre à jour si nécessaire)
```

### 3.4 Backend Workflow: Sync Accounts (Fournisseurs)

**Steps:**
```
1. Get Valid Token

2. API Call: Get Accounts
   - dossierId = society's Inqom_folder_ID
   - accountNumberPrefix = "401"
   - accountType = "All"
   - token = Step 1's token

3. Pour chaque account dans Result où IsAux = true:

   3.1 Search for Fournisseurs:
       - Constraint: Inqom_account_number = This account's Number

   3.2 Si count = 0 ET account contient un code auxiliaire:
       - Create Fournisseur:
         - name = This account's Name
         - account_number = This account's Number
         - Inqom_account_number = This account's Number
         - Inqom_folder_ID = society's Inqom_folder_ID
         - society = society

   3.3 Sinon si count > 0:
       - Make changes to existing Fournisseur:
         - Inqom_account_number = This account's Number
```

### 3.5 Workflow: Upload Facture Fournisseur

**Trigger:** Après upload fichier facture

**Steps:**
```
1. Get Valid Token

2. API Call: Upload Document
   - accountingFolderId = Current Facture's society's Inqom_folder_ID
   - token = Step 1's token
   - TypeScan = "Supplier"
   - FileSource = "Api"
   - Document = Uploaded file
   - SourceId = Current Facture's unique id
   - DocumentName = File's name

3. Make changes to Current Facture:
   - Inqom_document_ID = Result's Id
   - Inqom_status = Result's Status
   - Inqom_folder_ID = Current Facture's society's Inqom_folder_ID

4. Si Result's Status = "Received" ou "Processing":
   - Schedule workflow: Check Document Status
   - Delay: 30 seconds
```

### 3.6 Backend Workflow: Create Accounting Entry

**Trigger:** Facture validée et prête à comptabiliser

**Parameters:**
- facture (Facture)

**Steps:**
```
1. Get Valid Token

2. Préparer le JSON des écritures:

   entries = [
     {
       "JournalId": facture's journal's Inqom_journal_ID,
       "Date": facture's date_facture formatted as YYYY-MM-DD,
       "Document": {
         "Reference": facture's reference,
         "Date": facture's date_facture formatted as YYYY-MM-DD
       },
       "ExternalId": facture's unique id,
       "Lines": [
         {
           "Label": facture's libelle,
           "DebitAmount": facture's montant_ht,
           "CreditAmount": 0,
           "Currency": "EUR",
           "AccountNumber": facture's compte_charge,
           "ExternalId": facture's unique id + "_HT"
         },
         {
           "Label": "TVA déductible",
           "DebitAmount": facture's montant_tva,
           "CreditAmount": 0,
           "Currency": "EUR",
           "AccountNumber": "44566",
           "ExternalId": facture's unique id + "_TVA"
         },
         {
           "Label": facture's fournisseur's name,
           "DebitAmount": 0,
           "CreditAmount": facture's montant_ttc,
           "Currency": "EUR",
           "AccountNumber": facture's fournisseur's Inqom_account_number,
           "ExternalId": facture's unique id + "_FRN"
         }
       ]
     }
   ]

3. API Call: Create Entries
   - dossierId = facture's society's Inqom_folder_ID
   - token = Step 1's token
   - body = entries (JSON)

4. Si Result contient EntryId:
   - Make changes to facture:
     - Inqom_entry_ID = Result's first item's EntryId
     - Inqom_status = "Done"
     - Inqom_entry_lines = Result's first item's Lines's Ids

5. Sinon (erreur):
   - Make changes to facture:
     - Inqom_status = "Error"
   - Log error
```

### 3.7 Sous-workflow: Get Valid Token

**Type:** API Workflow retournant un texte

**Parameters:**
- society (Society)

**Steps:**
```
1. Search for Inqom_Token:
   - society = society
   - token_expiry > Current date/time

2. Si count > 0:
   - Return: Result's first item's access_token

3. Sinon:
   - API Call: Get Token (avec credentials stockés)

   - Create Inqom_Token:
     - society = society
     - access_token = Result's access_token
     - token_expiry = Current date/time + 1 hour

   - Return: Result's access_token
```

---

## 4. Gestion des erreurs

### 4.1 Erreurs API à gérer

| Code | Situation | Action |
|------|-----------|--------|
| 400 | Requête mal formée | Log + notification admin |
| 401 | Token expiré | Refresh token + retry |
| 403 | Pas d'accès | Vérifier permissions |
| 404 | Ressource non trouvée | Log + notification |
| 500 | Erreur serveur Inqom | Retry après délai |

### 4.2 Pattern de retry

```
Workflow: API Call With Retry
Parameters:
  - api_call_name (text)
  - retry_count (number) = 0

Steps:
1. Run API Call

2. Si status = 401 et retry_count < 1:
   - Refresh Token
   - Schedule: API Call With Retry
     - retry_count = retry_count + 1

3. Si status = 500 et retry_count < 3:
   - Wait 5 seconds
   - Schedule: API Call With Retry
     - retry_count = retry_count + 1

4. Si status autre erreur ou retry_count >= max:
   - Log error
   - Notify admin
   - Update record avec status "Error"
```

---

## 5. Tests et validation

### 5.1 Checklist de tests

**Authentification:**
- [ ] Login avec credentials valides
- [ ] Login avec credentials invalides
- [ ] Token refresh automatique
- [ ] Expiration du token

**Dossiers comptables:**
- [ ] Liste des dossiers disponibles
- [ ] Sélection et liaison d'un dossier
- [ ] Changement de dossier

**Comptes:**
- [ ] Sync des comptes fournisseurs (401)
- [ ] Sync des comptes clients (411)
- [ ] Création d'un nouveau compte
- [ ] Détection des doublons

**Documents:**
- [ ] Upload facture PDF
- [ ] Upload facture image (JPG, PNG)
- [ ] Suivi du statut de traitement
- [ ] Gestion des doublons

**Écritures:**
- [ ] Création écriture simple (2 lignes)
- [ ] Création écriture avec TVA (3 lignes)
- [ ] Validation du solde (débit = crédit)
- [ ] Gestion des erreurs de création

### 5.2 Données de test (Recette)

**Environnement de recette:**
```
Auth URL: https://auth-staging.inqom.com/identity/connect/token
API URL: https://fredstagingapi.azurewebsites.net
Documents URL: https://wa-fred-accounting-documents-staging.azurewebsites.net
```

---

## 6. Migration des données existantes

### 6.1 Script de migration Chift → Inqom

**Étape 1: Identifier les sociétés avec Chift actif**
```
Search for Societys:
  - Chift_connection_state = "connected"
  - Chift_folder_ID is not empty
```

**Étape 2: Pour chaque société**
```
1. Récupérer les accounting folders Inqom
2. Matcher par nom ou SIREN
3. Si match trouvé:
   - Inqom_folder_ID = matched folder's Id
   - Inqom_connection_state = "Active"
4. Sinon:
   - Inqom_connection_state = "Pending"
   - Notifier admin
```

**Étape 3: Migration des fournisseurs**
```
Pour chaque Fournisseur avec chift_id:
1. Récupérer les comptes 401* du dossier Inqom
2. Matcher par nom
3. Si match:
   - Inqom_account_number = matched account's Number
4. Sinon:
   - Créer le compte via API
   - Stocker le numéro retourné
```

### 6.2 Rollback

**En cas de problème, revenir à Chift:**
```
1. Les champs Chift sont conservés
2. Désactiver les workflows Inqom
3. Réactiver les workflows Chift
4. Inqom_connection_state = "Inactive"
```

---

## 7. Monitoring

### 7.1 Logs à implémenter

**Table: Inqom_Log**
| Champ | Type |
|-------|------|
| `timestamp` | Date |
| `society` | Society |
| `action` | Text |
| `endpoint` | Text |
| `status_code` | Number |
| `request_body` | Text |
| `response_body` | Text |
| `error_message` | Text |

### 7.2 Alertes

- Token refresh failure → Email admin
- API 500 errors (3+ consécutifs) → Email admin
- Document stuck in "Processing" > 24h → Email admin

---

## 8. Annexes

### 8.1 Mapping des types de journaux

| Type Bubble actuel | Code Inqom | Type Inqom |
|-------------------|------------|------------|
| "Achat" | "HA" | "Buy" |
| "Vente" | "VT" | "Sell" |
| "Banque" | "BQ" | "Bank" |
| "OD" | "OD" | "Misc" |
| "Caisse" | "CA" | "Cash" |
| "Salaire" | "SA" | "Salary" |

### 8.2 Mapping des statuts facture

| Status Chift | Status Inqom | Description |
|--------------|--------------|-------------|
| "pending" | "Received" | En attente |
| "processing" | "Processing" | En traitement OCR |
| "ready" | "ToReview" | Prêt à valider |
| "done" | "Done" | Comptabilisé |
| "error" | "ManualProcessing" | Erreur |

### 8.3 Format des numéros de compte

**Fournisseurs (classe 40):**
```
Format: 401[1][CODE_AUXILIAIRE]
Exemple: 4011AMAZON
         4011FNAC
         4011OVH
```

**Clients (classe 41):**
```
Format: 411[1][CODE_AUXILIAIRE]
Exemple: 4111CLIENTA
         4111CLIENTB
```

**Règles:**
- Code auxiliaire: max 17 caractères alphanumériques
- Pas d'espaces, pas de caractères spéciaux
- Majuscules uniquement
