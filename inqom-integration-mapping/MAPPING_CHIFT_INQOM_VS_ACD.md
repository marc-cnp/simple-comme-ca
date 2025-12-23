# MAPPING COMPLET : CHIFT/INQOM vs ACD (SuiteExpert)

Ce document présente la correspondance entre les endpoints Chift/Inqom et ACD pour l'intégration SCC.

## Configuration ACD

```
Base URL: https://isuiteexco.coaxis.com/CNX/api
Auth Header: UUID: {token}
Dossier Test: ZZCCA
```

---

## 1. AUTHENTIFICATION

### INQOM (via Chift)
```
POST https://auth.inqom.com/identity/connect/token
Content-Type: application/x-www-form-urlencoded

Body:
  username=xxx
  password=xxx
  grant_type=password
  scope=apidata openid
  client_id=simplecommecav2
  client_secret=xxx

Response: { "access_token": "xxx", ... }
Header à utiliser: Authorization: Bearer {access_token}
```

### ACD
```
POST https://isuiteexco.coaxis.com/CNX/api/v1/authentification
Content-Type: application/json

Body:
{
  "identifiant": "EVODEV",
  "motDePasse": "Evodev123!"
}

Response:
{
  "codeRetour": 1,
  "description": "OK",
  "token": "313WKK886770FAN4TJENAI1K668S39"
}

Header à utiliser: UUID: {token}
```

**LOGIQUE METIER:**
- Inqom utilise OAuth2 password grant
- ACD utilise authentification propriétaire avec header UUID

---

## 2. LISTE DES DOSSIERS/ENTREPRISES

### INQOM
```
GET https://api.inqom.com/api/app/enterprises
Headers: Authorization: Bearer {token}

Response: [
  {
    "Id": 80548,
    "Name": "Nom Entreprise",
    "Siren": "123456789",
    ...
  }
]
```

### ACD
```
GET https://isuiteexco.coaxis.com/CNX/api/v1/dossiers
Headers: UUID: {token}

Response: [
  {
    "Id": "ZZCCA",
    "Titre": "Formation",
    "Genre": "...",
    "Societe": "...",
    "DateCreation": "...",
    "DateModification": "..."
  }
]
```

**CORRESPONDANCE CHAMPS:**
| Inqom | ACD |
|-------|-----|
| Id (numérique) | Id (code alphanumérique) |
| Name | Titre |
| Siren | (via infosplus) |

---

## 3. JOURNAUX COMPTABLES

### INQOM
```
GET https://api.inqom.com/api/app/enterprises/{id}/journals/all
Headers: Authorization: Bearer {token}

Response: [
  {
    "Id": 123,
    "Code": "AC",
    "Name": "Achats",
    "Type": "Purchase"
  }
]
```

### ACD
```
GET https://isuiteexco.coaxis.com/CNX/api/v1/compta/journal?CodeDossier={code}
Headers: UUID: {token}

Response: [
  {
    "Code": "AC",
    "Libelle": "Achats",
    "Nature": "Achat",
    "TypeDeSaisie": "P",
    "CompteDeTresorerie": null,
    "NumeroFacture": true
  }
]
```

**CORRESPONDANCE CHAMPS:**
| Inqom | ACD |
|-------|-----|
| Code | Code |
| Name | Libelle |
| Type | Nature |

**Nature ACD:** Achat, Vente, Tresorerie, OperationDiverse

---

## 4. FOURNISSEURS

### INQOM - Liste
```
GET https://api.inqom.com/api/app/enterprises/{id}/BookAccount/All
Headers: Authorization: Bearer {token}
Filtrer: Number.startsWith('401')

Response: [
  {
    "Id": 568,
    "Number": "4010001",
    "Label": "Fournisseur A",
    "AccountName": "FOURN001",
    "SubAccountId": 123
  }
]
```

### ACD - Liste
```
GET https://isuiteexco.coaxis.com/CNX/api/v1/compta/comptes/fournisseurs?CodeDossier={code}
Headers: UUID: {token}

Response: [
  {
    "Code": "F00001",
    "Categ": "F",
    "Lib": "Fournisseur A",
    "Let": "O",
    "CodeTVA": "",
    "CptInactif": false,
    "ActivationAnalytique": true
  }
]
```

### INQOM - Création
```
POST https://api.inqom.com/api/app/enterprises/{id}/accounts
Headers: Authorization: Bearer {token}
Body:
{
  "Account": "401",
  "AccountName": "NEWFOUR",
  "Label": "Nouveau Fournisseur"
}

Response: "NEWFOUR" (string)
```

### ACD - Création
```
POST https://isuiteexco.coaxis.com/CNX/api/v1/compta/comptes/fournisseur
Headers: UUID: {token}
Body:
{
  "CodeDossier": "ZZCCA",
  "Code": "FNEW001",
  "Lib": "Nouveau Fournisseur"
}

Response:
{
  "codeRetour": 1,
  "description": "OK",
  "listeErreurs": []
}
```

**CORRESPONDANCE CHAMPS:**
| Inqom | ACD |
|-------|-----|
| AccountName | Code |
| Label | Lib |
| Number (401xxx) | Auto-généré |

**LOGIQUE METIER:**
- Inqom: AccountName sert d'identifiant unique pour sync
- ACD: Code sert d'identifiant unique (format FXXXXX)
- Pour sync: mapper AccountName Inqom <-> Code ACD

---

## 5. CLIENTS

### INQOM - Liste
```
GET https://api.inqom.com/api/app/enterprises/{id}/BookAccount/All
Headers: Authorization: Bearer {token}
Filtrer: Number.startsWith('411')

Response: [
  {
    "Id": 569,
    "Number": "4110001",
    "Label": "Client A",
    "AccountName": "CLIENT001",
    "SubAccountId": 124
  }
]
```

### ACD - Liste
```
GET https://isuiteexco.coaxis.com/CNX/api/v1/compta/comptes/clients?CodeDossier={code}
Headers: UUID: {token}

Response: [
  {
    "Code": "C00001",
    "Categ": "C",
    "Lib": "Client A",
    "Let": "O",
    "CodeTVA": "",
    "CptInactif": false
  }
]
```

### ACD - Création
```
POST https://isuiteexco.coaxis.com/CNX/api/v1/compta/comptes/client
Headers: UUID: {token}
Body:
{
  "CodeDossier": "ZZCCA",
  "Code": "CNEW001",
  "Lib": "Nouveau Client"
}

Response:
{
  "codeRetour": 1,
  "description": "OK",
  "listeErreurs": []
}
```

**GESTION DES DOUBLONS:**
```json
// Si le client existe déjà:
{
  "codeRetour": 0,
  "description": "KO",
  "listeErreurs": [
    {"erreur": "compteExisteDeja", "description": "Le compte existe déjà"}
  ]
}
```

---

## 6. FACTURES

### INQOM
```
GET https://wa-fred-payment-prod.azurewebsites.net/api/v1/supplier-payments/enterprises/{id}/suppliers/suppliers-invoices-external
Headers: Authorization: Bearer {token}

Response: [
  {
    "Id": "...",
    "InvoiceNumber": "FAC001",
    "Amount": 1200.00,
    "DueDate": "2024-12-31",
    "SupplierId": "..."
  }
]
```

### ACD
```
POST https://isuiteexco.coaxis.com/CNX/api/v1/factures
Headers: UUID: {token}
Body: {}

Response: [
  {
    "IdFacture": 1076,
    "IdDocument": 185565,
    "NumeroFacture": "1",
    "Date": "2023-04-25T00:00:00",
    "Echeance": "2023-05-25T00:00:00",
    "MontantHT": 128.86,
    "MontantTTC": 142.86,
    "MontantTVA": 14.00,
    "FactureReglee": false,
    "NumeroCompte": "CZZCCA",
    "NumeroCompteCollectif": "41100000"
  }
]
```

**NOTE:** Dans ACD, les factures sont liées aux écritures comptables et aux documents GED.

---

## 7. CREATION D'ECRITURES COMPTABLES

### INQOM
```
POST https://api.inqom.com/api/app/enterprises/{id}/AccountingEntries
Headers: Authorization: Bearer {token}
Body:
{
  "JournalCode": "AC",
  "Date": "2024-12-15",
  "Description": "Achat fournitures",
  "Lines": [
    {
      "Account": "607000",
      "DebitAmount": 100.00,
      "CreditAmount": 0,
      "Description": "Fournitures"
    },
    {
      "Account": "445660",
      "DebitAmount": 20.00,
      "CreditAmount": 0,
      "Description": "TVA déductible"
    },
    {
      "Account": "4010001",
      "DebitAmount": 0,
      "CreditAmount": 120.00,
      "Description": "Fournisseur"
    }
  ]
}
```

### ACD
```
POST https://isuiteexco.coaxis.com/CNX/api/v1/compta/ecriture
Headers: UUID: {token}
Body:
{
  "CodeDossier": "ZZCCA",
  "Journal": "AC",
  "Mois": 12,
  "Annee": 2024,
  "ReferenceGed": "DOC123",  // Optionnel
  "LignesEcriture": [
    {
      "Jour": 15,
      "NumeroPiece": "PIECE001",
      "NumeroFacture": "FAC2024001",
      "Compte": "60700000",
      "CodeTVA": "",
      "Libelle": "Fournitures",
      "Debit": 100.00,
      "Credit": 0,
      "ModeReglement": ""
    },
    {
      "Jour": 15,
      "NumeroPiece": "PIECE001",
      "NumeroFacture": "FAC2024001",
      "Compte": "44566000",
      "Libelle": "TVA déductible",
      "Debit": 20.00,
      "Credit": 0
    },
    {
      "Jour": 15,
      "NumeroPiece": "PIECE001",
      "NumeroFacture": "FAC2024001",
      "Compte": "F00001",  // Code auxiliaire fournisseur
      "Libelle": "Fournisseur",
      "Debit": 0,
      "Credit": 120.00
    }
  ]
}

Response (succès):
{
  "codeRetour": 1,
  "description": "OK",
  "listeErreurs": []
}

Response (erreur):
{
  "codeRetour": 0,
  "description": "KO",
  "listeErreurs": [
    {"erreur": "compteInexistant", "description": "Le compte n'existe pas"},
    {"erreur": "analytiqueCleRepartitionInexistante", "description": "..."}
  ]
}
```

**CORRESPONDANCE CHAMPS:**
| Inqom | ACD |
|-------|-----|
| JournalCode | Journal |
| Date | Mois + Annee + Jour |
| Lines[].Account | LignesEcriture[].Compte |
| Lines[].DebitAmount | LignesEcriture[].Debit |
| Lines[].CreditAmount | LignesEcriture[].Credit |
| Lines[].Description | LignesEcriture[].Libelle |
| InvoiceNumber | LignesEcriture[].NumeroFacture |

**ModeReglement ACD:**
- R = Chèque
- B = Virement
- C = Carte bancaire
- E = Espèces
- L = LCR
- O = Prélèvement
- P = Prélèvement
- T = Traite
- V = Virement
- A = Autre
- X = Non renseigné

---

## 8. CODES TVA

### INQOM
```
GET https://api.inqom.com/api/app/Referentials/Enterprise/Vats
Headers: Authorization: Bearer {token}

Response: [
  {
    "Code": "TVA20",
    "Rate": 20.0,
    "Label": "TVA 20%"
  }
]
```

### ACD
```
GET https://isuiteexco.coaxis.com/CNX/api/v1/compta/paramètres/codesTVA?CodeDossier={code}
Headers: UUID: {token}
Note: URL-encoder "paramètres" -> "param%C3%A8tres"

Response: [
  {
    "Code": "AI20",
    "Lib": "AIC 20 %",
    "Taux": 20.0,
    "CptDedu": "445661000000",
    "CptColl": "445200000000",
    "Datefin": null
  },
  {
    "Code": "TVA20",
    "Lib": "TVA 20 %",
    "Taux": 20.0,
    "CptDedu": "...",
    "CptColl": "..."
  }
]
```

**CORRESPONDANCE CHAMPS:**
| Inqom | ACD |
|-------|-----|
| Code | Code |
| Rate | Taux |
| Label | Lib |
| - | CptDedu (compte TVA déductible) |
| - | CptColl (compte TVA collectée) |

---

## 9. GED (GESTION ELECTRONIQUE DE DOCUMENTS)

### INQOM - Upload
```
POST https://wa-fred-document-prod.azurewebsites.net/documents/{enterpriseId}/upload/binary
Headers: Authorization: Bearer {token}
Content-Type: multipart/form-data

Body: file (binary)
```

### ACD - Arborescence
```
GET https://isuiteexco.coaxis.com/CNX/api/v1/ged/arborescence?CodeDossier={code}
Headers: UUID: {token}

Response:
{
  "Arborescences": [
    {
      "Id": 25,
      "Libelle": "1.1 - Points en suspens",
      "LibelleComplet": "Racine\\1 - Dossier Annuel\\1 - Suivi mission\\1.1 - Points en suspens",
      "Diffusable": false,
      "VisibleEnComptabilite": false,
      "Arborescences": [...]
    }
  ]
}
```

### ACD - Liste documents
```
POST https://isuiteexco.coaxis.com/CNX/api/v1/ged/documents/filtrer
Headers: UUID: {token}
Body:
{
  "CodeDossier": "ZZCCA"
}

Response: [
  {
    "Id": 8364,
    "IdAdresse": 15365,
    "Arborescence": {...},
    "NomFichier": "document.pdf",
    "DateCreation": "..."
  }
]
```

### ACD - Upload document
```
POST https://isuiteexco.coaxis.com/CNX/api/v1/ged/documents
Headers: UUID: {token}
Content-Type: multipart/form-data

Body:
  - CodeDossier: string
  - IdArborescence: integer
  - Fichier: binary
```

### ACD - Panières (documents en attente)
```
GET https://isuiteexco.coaxis.com/CNX/api/v1/panieres/documents?CodeDossier={code}
Headers: UUID: {token}

Response: [
  {
    "Id": ...,
    "NomFichier": "...",
    "DateDepot": "..."
  }
]
```

**NOTE:** ACD a un système GED plus complet avec:
- Arborescence configurable
- Classement automatique
- OCR intégré
- Workflow de validation
- Archivage légal

---

## 10. LETTRAGE

### INQOM
```
GET https://wa-fred-payment-prod.azurewebsites.net/api/v1/supplier-payments/enterprises/{id}/matchings
Headers: Authorization: Bearer {token}
```

### ACD
**Pas d'endpoint dédié.** Le lettrage dans ACD:
- Est géré via le module comptabilité
- Les comptes ont un champ `Let` (O/N) indiquant s'ils sont lettrables
- Les écritures portent une référence de lettrage
- Se fait principalement depuis l'interface SuiteExpert

---

## 11. EXPORT FEC

### INQOM
Non disponible directement via API (export manuel depuis l'interface)

### ACD
```
POST https://isuiteexco.coaxis.com/CNX/api/v1/compta/fec
Headers: UUID: {token}
Body:
{
  "CodeDossier": "ZZCCA",
  "Annee": 2024
}

Response: Fichier TSV (Tab-Separated Values)
Colonnes standard FEC:
- JournalCode, JournalLib
- EcritureNum, EcritureDate
- CompteNum, CompteLib
- CompAuxNum, CompAuxLib
- PieceRef, PieceDate
- EcritureLib
- Debit, Credit
- EcritureLet, DateLet
- ValidDate
- Montantdevise, Idevise
```

**NOTE:** L'exercice doit être sur une seule année civile (sinon erreur `periodeMultiExercice`)

---

## 12. EXERCICES COMPTABLES

### INQOM
```
GET https://api.inqom.com/api/app/enterprises/{id}/exercices
```

### ACD
```
GET https://isuiteexco.coaxis.com/CNX/api/v1/compta/exercices?CodeDossier={code}
Headers: UUID: {token}

Response: [
  {
    "DateDebut": "2024-08-01",
    "DateFin": "2025-07-31",
    "Courant": 1
  }
]
```

---

## RESUME COMPARATIF

| Fonctionnalité | Inqom | ACD | Notes |
|----------------|-------|-----|-------|
| Authentification | OAuth2 Bearer | UUID propriétaire | |
| Dossiers | GET /enterprises | GET /v1/dossiers | ID numérique vs code |
| Journaux | GET /journals/all | GET /v1/compta/journal | |
| Fournisseurs | GET/POST /BookAccount + filter | GET/POST /v1/compta/comptes/fournisseurs | Code F* |
| Clients | GET/POST /BookAccount + filter | GET/POST /v1/compta/comptes/clients | Code C* |
| Écritures | POST /AccountingEntries | POST /v1/compta/ecriture | Date split en Mois/Annee/Jour |
| TVA | GET /Referentials/Enterprise/Vats | GET /v1/compta/paramètres/codesTVA | Avec comptes liés |
| Documents | POST /upload/binary | POST /v1/ged/documents | GED plus complet |
| FEC | Non dispo | POST /v1/compta/fec | Export direct |
| Lettrage | GET /matchings | Non dispo via API | Interface uniquement |

---

## LOGIQUE DE SYNCHRONISATION SCC -> ACD

### Sync Clients/Fournisseurs
1. Récupérer liste ACD
2. Récupérer liste SCC
3. Pour chaque client/fournisseur SCC non présent dans ACD:
   - POST création avec Code unique
4. Stocker mapping SCC_ID <-> ACD_Code

### Sync Écritures
1. Récupérer/créer les comptes nécessaires
2. Convertir date SCC en Mois/Annee/Jour
3. POST écriture avec toutes les lignes
4. Gérer les erreurs (compte inexistant, analytique manquante)

### Upload Documents
1. Récupérer arborescence GED
2. Identifier le dossier cible
3. POST document avec IdArborescence
4. Récupérer Id document pour lier à l'écriture
