# Documentation API ACD (SuiteExpert/Coaxis)

**Pour le projet Simple Comme Ca**
**Date**: 22 Decembre 2024

## Configuration

```
BASE_URL: https://isuiteexco.coaxis.com/CNX/api
DOSSIER: ZZCCA
```

## Authentification

### POST /v1/authentification

Obtient un token UUID pour toutes les requetes suivantes.

**Request:**
```json
{
  "identifiant": "EVODEV",
  "motDePasse": "Evodev123!"
}
```

**Response:**
```json
{
  "UUID": "827357I46SZ83B119K8N7C93U3717Q"
}
```

**Headers pour toutes les requetes:**
```
UUID: {token}
Content-Type: application/json
```

> **Note**: Le token expire apres une periode d'inactivite. Un nouveau token doit etre obtenu si une requete retourne 401.

---

## Endpoints de LECTURE (GET)

### 1. Journaux Comptables

**GET** `/v1/compta/journal?CodeDossier={code}`

Retourne la liste des journaux comptables (22 journaux dans ZZCCA).

**Response:**
```json
[
  {
    "Code": "VE",
    "Libelle": "VENTES",
    "Nature": "Vente"
  },
  {
    "Code": "AC",
    "Libelle": "ACHATS",
    "Nature": "Achat"
  }
]
```

### 2. Clients (Comptes Auxiliaires 411)

**GET** `/v1/compta/comptes/clients?CodeDossier={code}`

**Response:**
```json
[
  {
    "Code": "C10000",
    "Categ": "C",
    "Lib": "Clients en compte",
    "Let": "O",
    "RegEc": "",
    "Qte": "N",
    "Coll": false,
    "CptCptCol": "",
    "CodeTVA": "",
    "CptInactif": false,
    "EcritureId": false,
    "ActivationAnalytique": false
  }
]
```

### 3. Fournisseurs (Comptes Auxiliaires 401)

**GET** `/v1/compta/comptes/fournisseurs?CodeDossier={code}`

Retourne 343 fournisseurs dans ZZCCA.

**Response:** Meme structure que clients avec `Categ: "F"`

### 4. Plan Comptable (Comptes Generaux)

**GET** `/v1/compta/comptes/generaux?CodeDossier={code}`

Retourne 544 comptes dans ZZCCA.

**Response:**
```json
[
  {
    "Code": "10100000",
    "Categ": "",
    "Lib": "Capital social",
    "Let": "N",
    "Coll": false,
    "CptCptCol": "",
    "CodeTVA": "",
    "CptInactif": false,
    "EcritureId": false,
    "ActivationAnalytique": false
  }
]
```

### 5. Exercices Comptables

**GET** `/v1/exercices?CodeDossier={code}`

**Response:**
```json
[
  {
    "Code": "2024",
    "DateDebut": "2024-01-01",
    "DateFin": "2024-12-31",
    "Courant": true,
    "Cloture": false
  }
]
```

### 6. Codes TVA

**GET** `/v1/compta/parametres/codesTVA?CodeDossier={code}`

> **Important**: URL avec caractere accentue - utiliser `param%C3%A8tres` (paramètres)

**Response:**
```json
[
  {
    "Code": "C20",
    "Taux": 20.0,
    "Libelle": "TVA 20%"
  }
]
```

### 7. Documents en Paniere (GED)

**GET** `/v1/panieres/documents?CodeDossier={code}`

Documents en attente de classement.

**Response:**
```json
[
  {
    "Id": 111956,
    "Nom": "FACTURE_LOREM_2024-005.pdf",
    "DateHeureDepot": "2025-12-22T15:51:00",
    "EtatOcerisation": "_OCERISE"
  }
]
```

### 8. Arborescence GED

**GET** `/v1/ged/arborescence?CodeDossier={code}`

Structure des dossiers dans la GED.

---

## Endpoints de CREATION (POST)

### 1. Creer un Fournisseur

**POST** `/v1/compta/comptes/fournisseur`

> **Important**: Endpoint au SINGULIER (pas `/fournisseurs`)

**Request:**
```json
{
  "CodeDossier": "ZZCCA",
  "Code": "FTEST001",
  "Lib": "Fournisseur Test API"
}
```

**Response Succes:**
```json
{
  "codeRetour": 1,
  "description": "OK",
  "listeErreurs": []
}
```

**Response Erreur (compte existe):**
```json
{
  "codeRetour": 0,
  "description": "KO",
  "listeErreurs": [
    {
      "erreur": "compteExisteDeja",
      "description": "Le compte FTEST001 existe deja"
    }
  ]
}
```

### 2. Creer un Client

**POST** `/v1/compta/comptes/client`

> **Important**: Endpoint au SINGULIER (pas `/clients`)

**Request:**
```json
{
  "CodeDossier": "ZZCCA",
  "Code": "CTEST001",
  "Lib": "Client Test API"
}
```

**Response:** Meme format que fournisseur.

### 3. Creer une Ecriture Comptable

**POST** `/v1/compta/ecriture`

Cree une ecriture complete avec plusieurs lignes.

**Facture Client (Vente):**
```json
{
  "CodeDossier": "ZZCCA",
  "Journal": "VE",
  "Mois": 12,
  "Annee": 2024,
  "LignesEcriture": [
    {
      "Jour": 22,
      "NumeroPiece": "FAC-2024-001",
      "NumeroFacture": "FAC-2024-001",
      "Compte": "C10000",
      "Libelle": "Facture client test",
      "Debit": 1200.00,
      "Credit": 0
    },
    {
      "Jour": 22,
      "NumeroPiece": "FAC-2024-001",
      "NumeroFacture": "FAC-2024-001",
      "Compte": "70102000",
      "Libelle": "Prestation conseil",
      "Debit": 0,
      "Credit": 1000.00,
      "Analytiques": [
        {
          "Section1": "1",
          "Credit": 1000.00,
          "Debit": 0
        }
      ]
    },
    {
      "Jour": 22,
      "NumeroPiece": "FAC-2024-001",
      "NumeroFacture": "FAC-2024-001",
      "Compte": "44570200",
      "Libelle": "TVA 20%",
      "Debit": 0,
      "Credit": 200.00
    }
  ]
}
```

> **Note**: Les comptes de classe 6 (charges) et 7 (produits) necessitent une ventilation analytique avec Section1.

**Avoir Client:**
```json
{
  "CodeDossier": "ZZCCA",
  "Journal": "VE",
  "Mois": 12,
  "Annee": 2024,
  "LignesEcriture": [
    {
      "Jour": 22,
      "NumeroPiece": "AVC-001",
      "NumeroFacture": "AVC-001",
      "Compte": "C10000",
      "Libelle": "Avoir client - retour",
      "Debit": 0,
      "Credit": 240.00
    },
    {
      "Jour": 22,
      "NumeroPiece": "AVC-001",
      "NumeroFacture": "AVC-001",
      "Compte": "70102000",
      "Libelle": "Annulation prestation",
      "Debit": 200.00,
      "Credit": 0,
      "Analytiques": [{"Section1": "1", "Debit": 200.00, "Credit": 0}]
    },
    {
      "Jour": 22,
      "NumeroPiece": "AVC-001",
      "NumeroFacture": "AVC-001",
      "Compte": "44570200",
      "Libelle": "TVA avoir",
      "Debit": 40.00,
      "Credit": 0
    }
  ]
}
```

**Facture Fournisseur (Achat):**
```json
{
  "CodeDossier": "ZZCCA",
  "Journal": "AC",
  "Mois": 12,
  "Annee": 2024,
  "LignesEcriture": [
    {
      "Jour": 22,
      "NumeroPiece": "FF-001",
      "NumeroFacture": "FF-001",
      "Compte": "F00000",
      "Libelle": "Facture fournisseur",
      "Debit": 0,
      "Credit": 1200.00
    },
    {
      "Jour": 22,
      "NumeroPiece": "FF-001",
      "NumeroFacture": "FF-001",
      "Compte": "60102000",
      "Libelle": "Achat marchandises 20%",
      "Debit": 1000.00,
      "Credit": 0,
      "Analytiques": [{"Section1": "1", "Debit": 1000.00, "Credit": 0}]
    },
    {
      "Jour": 22,
      "NumeroPiece": "FF-001",
      "NumeroFacture": "FF-001",
      "Compte": "44566000",
      "Libelle": "TVA deductible 20%",
      "Debit": 200.00,
      "Credit": 0
    }
  ]
}
```

**Avoir Fournisseur:**
```json
{
  "CodeDossier": "ZZCCA",
  "Journal": "AC",
  "Mois": 12,
  "Annee": 2024,
  "LignesEcriture": [
    {
      "Jour": 22,
      "NumeroPiece": "AVF-001",
      "NumeroFacture": "AVF-001",
      "Compte": "F00000",
      "Libelle": "Avoir fournisseur - retour",
      "Debit": 240.00,
      "Credit": 0
    },
    {
      "Jour": 22,
      "NumeroPiece": "AVF-001",
      "NumeroFacture": "AVF-001",
      "Compte": "60102000",
      "Libelle": "Retour marchandises",
      "Debit": 0,
      "Credit": 200.00,
      "Analytiques": [{"Section1": "1", "Debit": 0, "Credit": 200.00}]
    },
    {
      "Jour": 22,
      "NumeroPiece": "AVF-001",
      "NumeroFacture": "AVF-001",
      "Compte": "44566000",
      "Libelle": "TVA avoir fournisseur",
      "Debit": 0,
      "Credit": 40.00
    }
  ]
}
```

**Response Succes:**
```json
{
  "codeRetour": 1,
  "description": "OK",
  "listeErreurs": []
}
```

### 4. Upload Document (Paniere)

**POST** `/v1/panieres/documents?CodeDossier={code}`

Upload un document vers la paniere (file d'attente GED).

**Request:** `multipart/form-data`
```
Headers: UUID: {token}  (sans Content-Type!)
Body: file = <fichier binaire>
```

**Code Python:**
```python
upload_url = f'{BASE_URL}/v1/panieres/documents?CodeDossier={DOSSIER}'
files = {'file': ('facture.pdf', pdf_bytes, 'application/pdf')}
headers = {'UUID': uuid}  # Pas de Content-Type!
r = requests.post(upload_url, headers=headers, files=files)
```

**Response:**
```json
{
  "Id": 111960,
  "Nom": "facture.pdf",
  "DateHeureDepot": "2025-12-22T16:15:00"
}
```

### 5. Liste des Factures

**POST** `/v1/factures`

Retourne la liste des factures avec leur statut de paiement.

**Request:**
```json
{}
```

**Response:**
```json
[
  {
    "IdFacture": 1076,
    "NumeroFacture": "FAC-2024-001",
    "MontantHT": 1000.00,
    "MontantTTC": 1200.00,
    "MontantTVA": 200.00,
    "FactureReglee": false,
    "NumeroCompte": "C10000",
    "NumeroCompteCollectif": "41100000"
  }
]
```

> **Important**: Le champ `FactureReglee` indique si la facture est payee (true/false).

---

## Schemas d'Ecritures Comptables

### Facture Client (Vente)
| Compte | Type | Debit | Credit |
|--------|------|-------|--------|
| Client (411xxx) | Auxiliaire | Montant TTC | - |
| Produit (70xxxx) | General | - | Montant HT |
| TVA (4457xxxx) | General | - | Montant TVA |

### Avoir Client
| Compte | Type | Debit | Credit |
|--------|------|-------|--------|
| Client (411xxx) | Auxiliaire | - | Montant TTC |
| Produit (70xxxx) | General | Montant HT | - |
| TVA (4457xxxx) | General | Montant TVA | - |

### Facture Fournisseur (Achat)
| Compte | Type | Debit | Credit |
|--------|------|-------|--------|
| Fournisseur (401xxx) | Auxiliaire | - | Montant TTC |
| Achat (60xxxx) | General | Montant HT | - |
| TVA ded. (4456xxxx) | General | Montant TVA | - |

### Avoir Fournisseur
| Compte | Type | Debit | Credit |
|--------|------|-------|--------|
| Fournisseur (401xxx) | Auxiliaire | Montant TTC | - |
| Achat (60xxxx) | General | - | Montant HT |
| TVA ded. (4456xxxx) | General | - | Montant TVA |

---

## Endpoints NON DISPONIBLES

Ces endpoints ont ete testes mais ne sont pas disponibles:

| Endpoint | Status | Note |
|----------|--------|------|
| PUT /v1/compta/comptes/fournisseur | 405 | Pas de mise a jour directe |
| PUT /v1/compta/comptes/client | 405 | Pas de mise a jour directe |
| GET /v1/avoirs | 404 | Pas d'endpoint specifique avoirs |
| POST /v1/avoirs | 404 | Utiliser /v1/compta/ecriture |

> **Note**: Pour mettre a jour un client/fournisseur, il faut verifier s'il existe avant creation. S'il existe deja, l'erreur `compteExisteDeja` est retournee.

---

## Codes Erreur

| Code | Description |
|------|-------------|
| 200/201 | Succes |
| 401 | Token expire ou invalide |
| 404 | Endpoint non trouve |
| 405 | Methode non autorisee |

**Erreurs metier (dans la reponse):**
- `compteExisteDeja`: Le compte existe deja
- `jetonNonRecu`: Token non fourni ou invalide
- `compteInexistant`: Le compte specifie n'existe pas
- `analytiqueCleRepartitionInexistante`: L'analytique est active mais pas de ventilation fournie (ajouter `Analytiques` sur les comptes 6/7)

---

## Resume des Endpoints

### LECTURE (GET)
```
/v1/compta/journal?CodeDossier={code}              - Journaux (22)
/v1/compta/comptes/clients?CodeDossier={code}      - Clients (10)
/v1/compta/comptes/fournisseurs?CodeDossier={code} - Fournisseurs (343)
/v1/compta/comptes/generaux?CodeDossier={code}     - Plan comptable (544)
/v1/exercices?CodeDossier={code}                   - Exercices (2)
/v1/compta/parametres/codesTVA?CodeDossier={code}  - Codes TVA (12)
/v1/panieres/documents?CodeDossier={code}          - Documents paniere
/v1/ged/arborescence?CodeDossier={code}            - Arborescence GED
```

### CREATION (POST)
```
/v1/compta/comptes/fournisseur   - Creer fournisseur (singulier!)
/v1/compta/comptes/client        - Creer client (singulier!)
/v1/compta/ecriture              - Creer ecriture comptable
/v1/factures                     - Liste des factures (POST!)
/v1/panieres/documents           - Upload document (multipart)
```

---

## Scripts de Test

Les scripts suivants sont disponibles pour tester l'API:

- `test_acd_complete.py` - Test complet de tous les endpoints de base
- `explore_acd_api.py` - Exploration initiale de l'API
- `test_avoirs_fournisseurs.py` - Test avoirs clients (OK)
- `test_facture_fournisseur.py` - Test factures et avoirs fournisseurs (OK)
- `find_accounts.py` - Recherche des comptes de classe 6/7 et TVA

---

## Mapping Chift/Inqom vers ACD

| Fonctionnalite Chift | Endpoint ACD |
|---------------------|--------------|
| Creer client | POST /v1/compta/comptes/client |
| Creer fournisseur | POST /v1/compta/comptes/fournisseur |
| Facture client | POST /v1/compta/ecriture (journal VE) |
| Avoir client | POST /v1/compta/ecriture (journal VE, sens inverse) |
| Facture fournisseur | POST /v1/compta/ecriture (journal AC) |
| Avoir fournisseur | POST /v1/compta/ecriture (journal AC, sens inverse) |
| Upload document | POST /v1/panieres/documents |
| Statut paiement | POST /v1/factures -> FactureReglee |
| Codes TVA | GET /v1/compta/parametres/codesTVA |
| Journaux | GET /v1/compta/journal |
