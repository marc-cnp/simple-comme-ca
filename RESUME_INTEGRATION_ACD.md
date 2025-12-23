# Résumé de l'Intégration ACD (SuiteExpert/Coaxis)

## Objectif
Intégration directe de l'API ACD (SuiteExpert/Coaxis) pour synchroniser les données comptables depuis Inqom/Chift vers le logiciel de comptabilité ACD.

## Travail Réalisé

### 1. Exploration et Documentation de l'API ACD

**Endpoints testés et validés :**

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/v1/authentification` | POST | Authentification, retourne UUID valide 60 min |
| `/v1/compta/comptes/fournisseur` | POST | Création fournisseur (singulier!) |
| `/v1/compta/comptes/client` | POST | Création client (singulier!) |
| `/v1/compta/comptes/fournisseurs` | GET | Liste fournisseurs (pluriel!) |
| `/v1/compta/comptes/clients` | GET | Liste clients |
| `/v1/compta/comptes/generaux` | GET | Plan comptable (544 comptes) |
| `/v1/compta/ecriture` | POST | Création écriture comptable |
| `/v1/compta/journal` | GET | Liste des journaux (22) |
| `/v1/compta/exercices` | GET | Exercices comptables |
| `/v1/compta/paramètres/codesTVA` | GET | Codes TVA (12) - URL encodée |
| `/v1/panieres/documents` | POST/GET | Upload/Liste documents |
| `/v1/factures` | POST | Statut paiement factures |

### 2. Schémas Comptables Validés

#### Facture Client (Journal VE)
```
DEBIT   Client (411xxx)     1200.00  <- Le client nous doit
CREDIT  Ventes (70xxx)      1000.00  <- Chiffre d'affaires
CREDIT  TVA collectée (4457) 200.00  <- TVA pour l'État
```

#### Avoir Client (Journal VE - Inversé)
```
CREDIT  Client (411xxx)      240.00  <- Réduction dette client
DEBIT   Ventes (70xxx)       200.00  <- Annulation CA
DEBIT   TVA collectée (4457)  40.00  <- Réduction TVA
```

#### Facture Fournisseur (Journal AC)
```
CREDIT  Fournisseur (401xxx) 1200.00  <- On doit au fournisseur
DEBIT   Achats (60xxx)       1000.00  <- Charge + Analytiques
DEBIT   TVA déductible (4456) 200.00  <- TVA récupérable
```

#### Avoir Fournisseur (Journal AC - Inversé)
```
DEBIT   Fournisseur (401xxx)  240.00  <- Le fournisseur nous doit
CREDIT  Achats (60xxx)        200.00  <- Réduction charge
CREDIT  TVA déductible (4456)  40.00  <- Réduction TVA récup.
```

### 3. Points Techniques Découverts

#### Conventions d'endpoints
- **Création** : endpoint SINGULIER (`/fournisseur`, `/client`, `/ecriture`)
- **Lecture** : endpoint PLURIEL (`/fournisseurs`, `/clients`)

#### Authentification
- Token UUID dans header (pas Bearer)
- Durée de validité : 60 minutes
- Blocage temporaire après trop de tentatives (10 min)

#### Analytiques
- Obligatoires sur comptes classe 6/7 avec `ActivationAnalytique: true`
- Format : `{"Section1": "1", "Debit": x, "Credit": y}`

#### Upload Documents
- Multipart/form-data
- NE PAS mettre Content-Type dans headers
- Retourne status 201 (Created)

#### URL Encoding
- `paramètres` → `param%C3%A8tres`

#### Pas de PUT/UPDATE
- Vérifier existence avant création
- Erreur `compteExisteDeja` si doublon

### 4. Fichiers Créés

| Fichier | Description |
|---------|-------------|
| `API_ACD_DOCUMENTATION.md` | Documentation complète de l'API |
| `API_ACD_FLOWS_DETAILS.md` | Détails des flux avec exemples |
| `test_acd_complete.py` | Tests complets de tous les endpoints |
| `test_facture_fournisseur.py` | Tests factures/avoirs fournisseur |
| `find_accounts.py` | Recherche comptes classe 6 et TVA |

### 5. Comptes Utilisés (Dossier ZZCCA)

| Compte | Description | Analytique |
|--------|-------------|------------|
| C10000 | Client existant | Non |
| F00000 | Fournisseur existant | Non |
| 60102000 | Achats mp 20% | Oui (Section1) |
| 70100000 | Ventes marchandises | Non |
| 44566000 | TVA déductible | Non |
| 44571000 | TVA collectée | Non |

### 6. Journaux Principaux

| Code | Libellé | Usage |
|------|---------|-------|
| VE | Ventes | Factures/avoirs clients |
| AC | Achats | Factures/avoirs fournisseurs |
| BQ | Banque | Mouvements bancaires |
| CA | Caisse | Espèces |
| OD | Opérations diverses | Autres |

## Prochaines Étapes

1. **Mapping Inqom → ACD** : Définir la correspondance des champs
2. **Gestion des erreurs** : Retry, logging, alertes
3. **Synchronisation bidirectionnelle** : Statuts paiement
4. **Tests d'intégration** : Scénarios complets

## Credentials Test

```
URL: https://isuiteexco.coaxis.com/CNX/api
Identifiant: EVODEV
Mot de passe: Evodev123!
Dossier: ZZCCA
```

---
*Documentation générée le 22/12/2024*
