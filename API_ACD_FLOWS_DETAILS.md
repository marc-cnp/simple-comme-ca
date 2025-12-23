# API ACD - Flows Detailles

## Configuration

```
BASE_URL: https://isuiteexco.coaxis.com/CNX/api
DOSSIER: ZZCCA
```

---

## 1. AUTHENTIFICATION

### Logique Metier
Obtenir un token UUID necessaire pour toutes les requetes suivantes. Le token expire apres une periode d'inactivite.

### Endpoint
```
POST /v1/authentification
```

### Headers
```
Content-Type: application/json
```

### Body
```json
{
  "identifiant": "EVODEV",
  "motDePasse": "Evodev123!"
}
```

### Response (200 OK)
```json
{
  "UUID": "0MPR7I09O7IS781J32N75FE176ZBBU"
}
```

### Headers pour toutes les requetes suivantes
```
UUID: {token}
Content-Type: application/json
```

---

## 2. CREATION FOURNISSEUR

### Logique Metier
Creer un compte auxiliaire fournisseur (classe 401) dans le plan comptable. Le code doit etre unique.

### Endpoint
```
POST /v1/compta/comptes/fournisseur
```
> **ATTENTION**: Endpoint au SINGULIER (pas `/fournisseurs`)

### Headers
```
UUID: {token}
Content-Type: application/json
```

### Body
```json
{
  "CodeDossier": "ZZCCA",
  "Code": "FAPI161535",
  "Lib": "Fournisseur Test API 161535"
}
```

### Response Succes (200 OK)
```json
{
  "codeRetour": 1,
  "description": "OK",
  "listeErreurs": []
}
```

### Response Erreur (compte existe)
```json
{
  "codeRetour": 0,
  "description": "KO",
  "listeErreurs": [
    {
      "erreur": "compteExisteDeja",
      "description": "Le compte FAPI161535 existe deja"
    }
  ]
}
```

---

## 3. CREATION CLIENT

### Logique Metier
Creer un compte auxiliaire client (classe 411) dans le plan comptable. Le code doit etre unique.

### Endpoint
```
POST /v1/compta/comptes/client
```
> **ATTENTION**: Endpoint au SINGULIER (pas `/clients`)

### Headers
```
UUID: {token}
Content-Type: application/json
```

### Body
```json
{
  "CodeDossier": "ZZCCA",
  "Code": "CAPI161535",
  "Lib": "Client Test API 161535"
}
```

### Response Succes (200 OK)
```json
{
  "codeRetour": 1,
  "description": "OK",
  "listeErreurs": []
}
```

---

## 4. FACTURE CLIENT (VENTE)

### Logique Metier
Enregistrer une facture de vente avec:
- Debit du compte client (TTC)
- Credit du compte produit (HT) + analytique obligatoire
- Credit du compte TVA collectee

### Endpoint
```
POST /v1/compta/ecriture
```

### Headers
```
UUID: {token}
Content-Type: application/json
```

### Body
```json
{
  "CodeDossier": "ZZCCA",
  "Journal": "VE",
  "Mois": 12,
  "Annee": 2024,
  "LignesEcriture": [
    {
      "Jour": 22,
      "NumeroPiece": "FAC-161535",
      "NumeroFacture": "FAC-161535",
      "Compte": "C10000",
      "Libelle": "Facture client test API",
      "Debit": 1200.00,
      "Credit": 0
    },
    {
      "Jour": 22,
      "NumeroPiece": "FAC-161535",
      "NumeroFacture": "FAC-161535",
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
      "NumeroPiece": "FAC-161535",
      "NumeroFacture": "FAC-161535",
      "Compte": "44570200",
      "Libelle": "TVA 20%",
      "Debit": 0,
      "Credit": 200.00
    }
  ]
}
```

### Schema Comptable
| Compte | Libelle | Debit | Credit |
|--------|---------|-------|--------|
| C10000 (Client) | Facture client | 1200.00 | - |
| 70102000 (Produit) | Prestation conseil | - | 1000.00 |
| 44570200 (TVA collectee) | TVA 20% | - | 200.00 |

### Response Succes (200 OK)
```json
{
  "codeRetour": 1,
  "description": "OK",
  "listeErreurs": []
}
```

---

## 5. AVOIR CLIENT

### Logique Metier
Enregistrer un avoir client (annulation partielle ou totale de vente):
- Credit du compte client (TTC) - inverse de la facture
- Debit du compte produit (HT) + analytique obligatoire
- Debit du compte TVA collectee

### Endpoint
```
POST /v1/compta/ecriture
```

### Headers
```
UUID: {token}
Content-Type: application/json
```

### Body
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
      "Libelle": "Avoir client - retour marchandise",
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
      "Analytiques": [
        {
          "Section1": "1",
          "Debit": 200.00,
          "Credit": 0
        }
      ]
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

### Schema Comptable
| Compte | Libelle | Debit | Credit |
|--------|---------|-------|--------|
| C10000 (Client) | Avoir client | - | 240.00 |
| 70102000 (Produit) | Annulation | 200.00 | - |
| 44570200 (TVA collectee) | TVA avoir | 40.00 | - |

### Response Succes (200 OK)
```json
{
  "codeRetour": 1,
  "description": "OK",
  "listeErreurs": []
}
```

---

## 6. FACTURE FOURNISSEUR (ACHAT)

### Logique Metier
Enregistrer une facture d'achat avec:
- Credit du compte fournisseur (TTC)
- Debit du compte charge/achat (HT) + analytique obligatoire
- Debit du compte TVA deductible

### Endpoint
```
POST /v1/compta/ecriture
```

### Headers
```
UUID: {token}
Content-Type: application/json
```

### Body
```json
{
  "CodeDossier": "ZZCCA",
  "Journal": "AC",
  "Mois": 12,
  "Annee": 2024,
  "LignesEcriture": [
    {
      "Jour": 22,
      "NumeroPiece": "FF-163421",
      "NumeroFacture": "FF-163421",
      "Compte": "F00000",
      "Libelle": "Facture fournisseur test API",
      "Debit": 0,
      "Credit": 1200.00
    },
    {
      "Jour": 22,
      "NumeroPiece": "FF-163421",
      "NumeroFacture": "FF-163421",
      "Compte": "60102000",
      "Libelle": "Achat marchandises 20%",
      "Debit": 1000.00,
      "Credit": 0,
      "Analytiques": [
        {
          "Section1": "1",
          "Debit": 1000.00,
          "Credit": 0
        }
      ]
    },
    {
      "Jour": 22,
      "NumeroPiece": "FF-163421",
      "NumeroFacture": "FF-163421",
      "Compte": "44566000",
      "Libelle": "TVA deductible 20%",
      "Debit": 200.00,
      "Credit": 0
    }
  ]
}
```

### Schema Comptable
| Compte | Libelle | Debit | Credit |
|--------|---------|-------|--------|
| F00000 (Fournisseur) | Facture fournisseur | - | 1200.00 |
| 60102000 (Achat) | Achat marchandises | 1000.00 | - |
| 44566000 (TVA ded.) | TVA deductible | 200.00 | - |

### Response Succes (200 OK)
```json
{
  "codeRetour": 1,
  "description": "OK",
  "listeErreurs": []
}
```

---

## 7. AVOIR FOURNISSEUR

### Logique Metier
Enregistrer un avoir fournisseur (retour marchandise, remise):
- Debit du compte fournisseur (TTC) - inverse de la facture
- Credit du compte charge/achat (HT) + analytique obligatoire
- Credit du compte TVA deductible

### Endpoint
```
POST /v1/compta/ecriture
```

### Headers
```
UUID: {token}
Content-Type: application/json
```

### Body
```json
{
  "CodeDossier": "ZZCCA",
  "Journal": "AC",
  "Mois": 12,
  "Annee": 2024,
  "LignesEcriture": [
    {
      "Jour": 22,
      "NumeroPiece": "AVF-163421",
      "NumeroFacture": "AVF-163421",
      "Compte": "F00000",
      "Libelle": "Avoir fournisseur - retour",
      "Debit": 240.00,
      "Credit": 0
    },
    {
      "Jour": 22,
      "NumeroPiece": "AVF-163421",
      "NumeroFacture": "AVF-163421",
      "Compte": "60102000",
      "Libelle": "Retour marchandises",
      "Debit": 0,
      "Credit": 200.00,
      "Analytiques": [
        {
          "Section1": "1",
          "Debit": 0,
          "Credit": 200.00
        }
      ]
    },
    {
      "Jour": 22,
      "NumeroPiece": "AVF-163421",
      "NumeroFacture": "AVF-163421",
      "Compte": "44566000",
      "Libelle": "TVA avoir fournisseur",
      "Debit": 0,
      "Credit": 40.00
    }
  ]
}
```

### Schema Comptable
| Compte | Libelle | Debit | Credit |
|--------|---------|-------|--------|
| F00000 (Fournisseur) | Avoir fournisseur | 240.00 | - |
| 60102000 (Achat) | Retour marchandises | - | 200.00 |
| 44566000 (TVA ded.) | TVA avoir | - | 40.00 |

### Response Succes (200 OK)
```json
{
  "codeRetour": 1,
  "description": "OK",
  "listeErreurs": []
}
```

---

## 8. CODES TVA

### Logique Metier
Recuperer la liste des codes TVA configures dans le dossier pour mapper les taux de TVA.

### Endpoint
```
GET /v1/compta/param%C3%A8tres/codesTVA?CodeDossier={code}
```
> **ATTENTION**: URL encodee pour `parametres` -> `param%C3%A8tres`

### Headers
```
UUID: {token}
Content-Type: application/json
```

### Body
Aucun (GET)

### Response (200 OK)
```json
[
  {
    "Code": "C02",
    "Taux": 2.1,
    "Libelle": "TVA 2.1%"
  },
  {
    "Code": "C05",
    "Taux": 5.5,
    "Libelle": "TVA 5.5%"
  },
  {
    "Code": "C10",
    "Taux": 10.0,
    "Libelle": "TVA 10%"
  },
  {
    "Code": "C20",
    "Taux": 20.0,
    "Libelle": "TVA 20%"
  }
]
```

---

## 9. UPLOAD DOCUMENT (GED)

### Logique Metier
Envoyer un document (PDF, image) vers la paniere du dossier. Le document sera ensuite classe manuellement ou par OCR dans la GED.

### Endpoint
```
POST /v1/panieres/documents?CodeDossier={code}
```

### Headers
```
UUID: {token}
```
> **ATTENTION**: Ne PAS mettre `Content-Type: application/json` - laisser requests gerer le multipart

### Body (multipart/form-data)
```
file: <binary content>
```

### Code Python
```python
upload_url = f'{BASE_URL}/v1/panieres/documents?CodeDossier={DOSSIER}'
files = {'file': ('facture.pdf', pdf_bytes, 'application/pdf')}
headers = {'UUID': uuid}  # Pas de Content-Type!
r = requests.post(upload_url, headers=headers, files=files)
```

### Response (201 Created)
```json
{
  "Id": 111960,
  "Nom": "test_api_161535.txt",
  "DateHeureDepot": "2025-12-22T16:15:00",
  "EtatOcerisation": "_OCERISE"
}
```

---

## 10. LISTE DES JOURNAUX

### Logique Metier
Recuperer la liste des journaux comptables pour connaitre les codes a utiliser dans les ecritures (VE pour ventes, AC pour achats, etc.)

### Endpoint
```
GET /v1/compta/journal?CodeDossier={code}
```

### Headers
```
UUID: {token}
Content-Type: application/json
```

### Body
Aucun (GET)

### Response (200 OK)
```json
[
  {
    "Code": "01",
    "Libelle": "GENERAL",
    "Nature": "OperationDiverse"
  },
  {
    "Code": "AC",
    "Libelle": "Achats",
    "Nature": "Achat"
  },
  {
    "Code": "VE",
    "Libelle": "Ventes",
    "Nature": "Vente"
  },
  {
    "Code": "BQ",
    "Libelle": "Banque Caisse d'Epargne",
    "Nature": "Tresorerie"
  },
  {
    "Code": "OD",
    "Libelle": "Operations diverses",
    "Nature": "OperationDiverse"
  }
]
```

### Natures de Journaux
- `Vente` - Journal des ventes (VE)
- `Achat` - Journal des achats (AC)
- `Tresorerie` - Journaux de banque/caisse
- `OperationDiverse` - OD, paie, etc.
- `ANouveau` - Report a nouveau
- `SituationInventaire` - Situations

---

## 11. STATUT PAIEMENT FACTURES

### Logique Metier
Recuperer la liste des factures avec leur statut de paiement pour synchroniser l'etat "payee" entre les systemes.

### Endpoint
```
POST /v1/factures
```
> **ATTENTION**: C'est un POST avec body vide, pas un GET

### Headers
```
UUID: {token}
Content-Type: application/json
```

### Body
```json
{}
```

### Response (200 OK)
```json
[
  {
    "IdFacture": 1076,
    "NumeroFacture": "1",
    "MontantHT": 128.86,
    "MontantTTC": 142.86,
    "MontantTVA": 14.0,
    "FactureReglee": false,
    "NumeroCompte": "CZZCCA",
    "NumeroCompteCollectif": "41100000"
  },
  {
    "IdFacture": 1077,
    "NumeroFacture": "2",
    "MontantHT": 620.0,
    "MontantTTC": 744.0,
    "MontantTVA": 124.0,
    "FactureReglee": false,
    "NumeroCompte": "C10000",
    "NumeroCompteCollectif": "41100000"
  }
]
```

### Champs Importants
- `FactureReglee`: `true` = facture payee, `false` = non payee
- `NumeroFacture`: Numero de la facture
- `NumeroCompte`: Code du compte client

---

## 12. LISTE DES CLIENTS

### Logique Metier
Recuperer tous les comptes auxiliaires clients pour verification ou synchronisation.

### Endpoint
```
GET /v1/compta/comptes/clients?CodeDossier={code}
```

### Headers
```
UUID: {token}
Content-Type: application/json
```

### Body
Aucun (GET)

### Response (200 OK)
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
  },
  {
    "Code": "CAPI161535",
    "Categ": "C",
    "Lib": "Client Test API 161535",
    "Let": "N",
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

---

## 13. LISTE DES FOURNISSEURS

### Logique Metier
Recuperer tous les comptes auxiliaires fournisseurs pour verification ou synchronisation.

### Endpoint
```
GET /v1/compta/comptes/fournisseurs?CodeDossier={code}
```

### Headers
```
UUID: {token}
Content-Type: application/json
```

### Body
Aucun (GET)

### Response (200 OK)
```json
[
  {
    "Code": "F00000",
    "Categ": "F",
    "Lib": "Fournisseurs divers",
    "Let": "N",
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

---

## 14. PLAN COMPTABLE (Comptes Generaux)

### Logique Metier
Recuperer tous les comptes generaux pour connaitre les comptes de produits (7), charges (6), TVA (445), etc.

### Endpoint
```
GET /v1/compta/comptes/generaux?CodeDossier={code}
```

### Headers
```
UUID: {token}
Content-Type: application/json
```

### Body
Aucun (GET)

### Response (200 OK)
```json
[
  {
    "Code": "60102000",
    "Categ": "",
    "Lib": "Achats mp 20%",
    "Let": "N",
    "Coll": false,
    "CptCptCol": "",
    "CodeTVA": "",
    "CptInactif": false,
    "EcritureId": false,
    "ActivationAnalytique": true
  },
  {
    "Code": "70102000",
    "Categ": "",
    "Lib": "Ventes prestations 20%",
    "Let": "N",
    "Coll": false,
    "CptCptCol": "",
    "CodeTVA": "",
    "CptInactif": false,
    "EcritureId": false,
    "ActivationAnalytique": true
  },
  {
    "Code": "44566000",
    "Categ": "",
    "Lib": "Tva / achats",
    "Let": "N",
    "Coll": false,
    "CptCptCol": "",
    "CodeTVA": "",
    "CptInactif": false,
    "EcritureId": false,
    "ActivationAnalytique": false
  },
  {
    "Code": "44570200",
    "Categ": "",
    "Lib": "TVA collectee 20%",
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

### Note sur ActivationAnalytique
Si `ActivationAnalytique: true`, le compte necessite une ventilation analytique dans les ecritures.

---

## 15. DOCUMENTS EN PANIERE

### Logique Metier
Lister les documents en attente de classement dans la paniere.

### Endpoint
```
GET /v1/panieres/documents?CodeDossier={code}
```

### Headers
```
UUID: {token}
Content-Type: application/json
```

### Body
Aucun (GET)

### Response (200 OK)
```json
[
  {
    "Id": 111960,
    "Nom": "test_api_161535.txt",
    "DateHeureDepot": "2025-12-22T16:15:00",
    "EtatOcerisation": "_OCERISE"
  },
  {
    "Id": 111956,
    "Nom": "FACTURE_LOREM_2024-005.pdf",
    "DateHeureDepot": "2025-12-22T15:51:00",
    "EtatOcerisation": "_OCERISE"
  }
]
```

---

## CODES ERREUR

### HTTP Status
| Code | Description |
|------|-------------|
| 200 | Succes |
| 201 | Cree (upload document) |
| 401 | Token expire ou invalide |
| 404 | Endpoint non trouve |
| 405 | Methode non autorisee |

### Erreurs Metier (dans la response JSON)
| Erreur | Description |
|--------|-------------|
| `compteExisteDeja` | Le compte existe deja |
| `compteInexistant` | Le compte n'existe pas |
| `jetonNonRecu` | Token non fourni |
| `analytiqueCleRepartitionInexistante` | Ventilation analytique manquante sur compte classe 6/7 |

### Exemple Response Erreur
```json
{
  "codeRetour": 0,
  "description": "KO",
  "listeErreurs": [
    {
      "erreur": "analytiqueCleRepartitionInexistante",
      "description": "l'analytique est active, pas de ventilation et la clef de repartition automatique est manquante sur le compte 60102000"
    }
  ]
}
```

---

## RESUME RAPIDE

| Operation | Methode | Endpoint |
|-----------|---------|----------|
| Authentification | POST | `/v1/authentification` |
| Creer fournisseur | POST | `/v1/compta/comptes/fournisseur` |
| Creer client | POST | `/v1/compta/comptes/client` |
| Facture/Avoir | POST | `/v1/compta/ecriture` |
| Upload document | POST | `/v1/panieres/documents?CodeDossier={code}` |
| Liste factures | POST | `/v1/factures` |
| Codes TVA | GET | `/v1/compta/param%C3%A8tres/codesTVA?CodeDossier={code}` |
| Journaux | GET | `/v1/compta/journal?CodeDossier={code}` |
| Clients | GET | `/v1/compta/comptes/clients?CodeDossier={code}` |
| Fournisseurs | GET | `/v1/compta/comptes/fournisseurs?CodeDossier={code}` |
| Plan comptable | GET | `/v1/compta/comptes/generaux?CodeDossier={code}` |
| Documents paniere | GET | `/v1/panieres/documents?CodeDossier={code}` |
