# Guide Complet de Migration Chift → Inqom

## Documentation technique pour les développeurs Bubble.io

**Version:** 2.1
**Date:** 3 décembre 2025
**Projet:** Simple Comme Ca - Intégration directe Inqom
**Auteur:** Documentation automatique Claude
**Source des endpoints Chift:** API Connector Bubble + Documentation officielle Chift

---

## Table des matières

1. [Contexte et Objectifs](#1-contexte-et-objectifs)
2. [Référence au Document de Cadrage](#2-référence-au-document-de-cadrage)
3. [Architecture et Authentification](#3-architecture-et-authentification)
4. [Mapping Fonctionnel Complet](#4-mapping-fonctionnel-complet)
   - 4.1 [Connexion Logiciel Compta](#41-connexion-logiciel-compta)
   - 4.2 [Synchronisation des Journaux](#42-synchronisation-des-journaux)
   - 4.3 [Synchronisation des Fournisseurs](#43-synchronisation-des-fournisseurs)
   - 4.4 [Synchronisation des Clients](#44-synchronisation-des-clients)
   - 4.5 [Synchronisation des Factures](#45-synchronisation-des-factures)
   - 4.6 [Création de Factures / Écritures](#46-création-de-factures--écritures)
   - 4.7 [Gestion des Codes TVA](#47-gestion-des-codes-tva)
   - 4.8 [Upload de Documents](#48-upload-de-documents)
   - 4.9 [Lettrage (Matching)](#49-lettrage-matching)
   - 4.10 [Transactions Bancaires](#410-transactions-bancaires)
5. [Checklist de Migration](#5-checklist-de-migration)

---

# 0. Résumé des Appels API Chift dans Bubble

## Appels identifiés dans l'API Connector Bubble

| Nom dans Bubble | Endpoint Chift | Méthode |
|-----------------|----------------|---------|
| Chift - Get chart of accounts | `/consumers/{consumerId}/accounting/chart-of-accounts` | GET |
| Chift - Get clients | `/consumers/{consumerId}/accounting/clients` | GET |
| Chift - Get journals | `/consumers/{consumerId}/accounting/journals` | GET |
| Chift - Get customer invoices | `/consumers/{consumerId}/accounting/invoices/type/customer_invoice` | GET |
| Chift - Get customer refunds | `/consumers/{consumerId}/accounting/invoices/type/customer_refund` | GET |
| Chift - Get supplier invoices | `/consumers/{consumerId}/accounting/invoices/type/supplier_invoice` | GET |
| Chift - Get supplier refunds | `/consumers/{consumerId}/accounting/invoices/type/supplier_refund` | GET |
| Chift - Get document facture | `/consumers/{consumerId}/accounting/attachments` | GET |
| Chift - Get connections | `/consumers/{consumerId}/accounting/folders` | GET |
| Chift - Create journal entry | `/consumers/{consumerId}/accounting/journal-entries` | POST |
| Chift - Create sale/purchase entry | `/consumers/{consumerId}/accounting/invoices` | POST |
| Chift - Update client | `/consumers/{consumerId}/accounting/clients/{clientId}` | PATCH |
| Chift - Delete connection | `/consumers/{consumerId}/connections/{connectionId}` | DELETE |
| Dropdown - Get Chift VAT | `/consumers/{consumerId}/accounting/vat-codes` | GET |
| RG - Chift Chart of account | `/consumers/{consumerId}/accounting/chart-of-accounts` | GET |

## Base URL Chift
```
https://api.chift.eu
```

## Authentification Chift
```
POST https://api.chift.eu/token
Content-Type: application/x-www-form-urlencoded

client_id=your_client_id
client_secret=your_client_secret
grant_type=client_credentials
```

---

# 1. Contexte et Objectifs

## 1.1 Qu'est-ce que Simple Comme Ca ?

**Simple Comme Ca** est une plateforme de gestion financière pour PME/TPE développée en Bubble.io. Elle permet :

| Module | Fonctionnalité |
|--------|----------------|
| **GED** | Gestion Électronique des Documents (factures, notes de frais) |
| **Paiements** | Suivi des factures à payer et programmation des virements |
| **Encaissements** | Factures de vente et suivi des paiements clients |
| **Trésorerie** | Vision consolidée des mouvements bancaires |

## 1.2 Pourquoi migrer de Chift vers Inqom Direct ?

```
AVANT (via Chift)                    APRÈS (direct Inqom)
┌──────────┐     ┌───────┐     ┌───────┐     ┌──────────┐     ┌───────┐
│  Bubble  │ ──► │ CHIFT │ ──► │ INQOM │     │  Bubble  │ ──► │ INQOM │
└──────────┘     └───────┘     └───────┘     └──────────┘     └───────┘
     │                                              │
     └─ Coût Chift                                  └─ Direct, moins cher
     └─ Latence x2                                  └─ Contrôle total
     └─ Dépendance tierce                           └─ Webhooks NON dispo
```

**Avantages de la migration :**
- Réduction des coûts (suppression licence Chift)
- Performance améliorée (1 saut réseau au lieu de 2)
- Contrôle direct sur les erreurs et la logique métier

**Inconvénient majeur :**
- ⚠️ **Inqom n'a PAS de webhooks** → Nécessite du polling

---

# 2. Référence au Document de Cadrage

Ce document implémente les spécifications du **Document de cadrage (multi-modules)**, plus particulièrement :

## 2.1 Lot 2 : Chift (pages 460-759)

| Section Cadrage | Référence | Section Migration |
|-----------------|-----------|-------------------|
| Portail / Sociétés | Création consumer Chift | [4.1 Connexion](#41-connexion-logiciel-compta) |
| Paramètres / Logiciel Compta | Webhooks account.connection.* | [4.1 Connexion](#41-connexion-logiciel-compta) |
| Paramètres / Classement | Get Journals | [4.2 Journaux](#42-synchronisation-des-journaux) |
| Paramètres / Synchroniser | Sync fournisseurs/factures | [4.3 Fournisseurs](#43-synchronisation-des-fournisseurs), [4.5 Factures](#45-synchronisation-des-factures) |
| Paramètres / Fournisseurs | Get Suppliers + détails | [4.3 Fournisseurs](#43-synchronisation-des-fournisseurs) |
| Portail / Paiements | Get Invoice By Type, statuts | [4.5 Factures](#45-synchronisation-des-factures) |
| Création facture vente | POST invoices | [4.6 Création](#46-création-de-factures--écritures) |

## 2.2 Section INQOM (Marc) (pages 3138-3514)

| Section Cadrage | Référence | Section Migration |
|-----------------|-----------|-------------------|
| Contexte et Objectif | Architecture directe | [3. Architecture](#3-architecture-et-authentification) |
| Mapping des Entités | Society ↔ AccountingFolder | [4.1 Connexion](#41-connexion-logiciel-compta) |
| Endpoints Fonctionnels | Tableau complet | [4. Mapping](#4-mapping-fonctionnel-complet) |
| Upload flux | POST /Documents | [4.8 Upload](#48-upload-de-documents) |
| Extraction Fournisseurs | Via CounterParty | [4.3 Fournisseurs](#43-synchronisation-des-fournisseurs) |
| Création écritures | POST entries | [4.6 Création](#46-création-de-factures--écritures) |

---

# 3. Architecture et Authentification

## 3.1 URLs de Production Inqom

```
AUTHENTIFICATION:  https://auth.inqom.com/identity/connect/token
API COMPTABILITÉ:  https://wa-fred-accounting-services-prod.azurewebsites.net
API DOCUMENTS:     https://wa-fred-accounting-documents-prod.azurewebsites.net
API BANKING:       https://wa-fred-banking-prod.azurewebsites.net
```

## 3.2 Authentification

### Chift (AVANT)

**Endpoint:** `POST https://api.chift.eu/token`

**Body (x-www-form-urlencoded):**
```
client_id=your_client_id
client_secret=your_client_secret
grant_type=client_credentials
```

**Réponse Chift:**
```json
{
  "access_token": "eyJ...",
  "expires_in": 1800,
  "token_type": "Bearer",
  "refresh_token": "abc123..."
}
```

**Note:** Token valide 30 minutes, refresh_token disponible.

---

### Inqom (APRÈS)

**Endpoint:** `POST https://auth.inqom.com/identity/connect/token`

**Body (x-www-form-urlencoded):**
```
username=new@simplecommeca.io
password=scN@RN8Kx7GjSz?4
grant_type=password
scope=openid apidata
client_id=simplecommecav2
client_secret=DBjTzLWLFE94jSt6Cix9
```

**Réponse Inqom:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIs...",
  "expires_in": 31104000,
  "token_type": "Bearer",
  "scope": "apidata openid"
}
```

**⚠️ Différences critiques:**

| Aspect | Chift | Inqom |
|--------|-------|-------|
| Grant type | client_credentials | password (ROPC) |
| Durée token | 30 minutes | ~1 an (31 104 000 sec) |
| Refresh token | ✅ Oui | ❌ Non |
| Credentials | client_id/secret | + username/password |

**Stratégie Bubble:**
- Stocker `username` et `password` de façon sécurisée dans Society
- Stocker `Inqom_token_expiry` pour anticiper le renouvellement
- Re-authentifier en cas d'erreur 401

---

## 3.3 Hiérarchie des Entités

```
┌─────────────────────────────────────────────────────────────┐
│                    INQOM                                    │
├─────────────────────────────────────────────────────────────┤
│  Company (CompanyId: 28118)                                 │
│  └── = Cabinet comptable ou PME principale                  │
│       │                                                     │
│       ├── AccountingFolder (Id: 80548) = "TEST SCC"         │
│       │   └── = Society Bubble                              │
│       │                                                     │
│       ├── AccountingFolder (Id: 29703) = "SIMPLE COMME CA"  │
│       │   └── = Society Bubble                              │
│       │                                                     │
│       └── AccountingFolder (Id: 28288) = "HAPTE"            │
│           └── = Society Bubble                              │
└─────────────────────────────────────────────────────────────┘
```

**Mapping Bubble ↔ Inqom:**

| Bubble | Inqom |
|--------|-------|
| Agency | Company |
| Society | AccountingFolder |
| Facture | Entry (écriture) + Document (PDF) |
| Fournisseur | Account (401XXXX) |
| Client | Account (411XXXX) |

---

# 4. Mapping Fonctionnel Complet

---

## 4.1 CONNEXION LOGICIEL COMPTA

### 📋 Référence Cadrage
**Lot 2 - Portail / Paramètres / Logiciel Compta** (pages 468-494)

> *"L'onglet Logiciel Compta permet de voir l'état de la connexion et le logiciel de compta sélectionné. Ces informations sont mises à jour par le webhook de Chift."*

### 🎯 Objectif Fonctionnel
Permettre à un utilisateur Agence de connecter une Society à un dossier comptable Inqom et de voir l'état de cette connexion.

### ⚠️ Changement Majeur
**Chift utilise des webhooks** pour notifier les changements de connexion :
- `account.connection.created`
- `account.connection.updated`
- `account.connection.deleted`

**Inqom n'a PAS de webhooks.** Il faut donc :
1. Vérifier l'état à la demande (bouton "Synchroniser")
2. Ou implémenter un polling périodique

---

### Chift - Liste des logiciels compta disponibles

**Endpoint:** `GET https://api.chift.eu/connections`

**Réponse Chift:**
```json
{
  "items": [
    {
      "id": "inqom",
      "name": "Inqom",
      "status": "active",
      "logo_url": "https://..."
    },
    {
      "id": "acd",
      "name": "ACD",
      "status": "active"
    }
  ]
}
```

### Inqom - Liste des dossiers comptables

**Endpoint:** `GET /provisioning/companies/{companyId}/accounting-folders`

**URL complète:** `https://wa-fred-accounting-services-prod.azurewebsites.net/provisioning/companies/28118/accounting-folders`

**Réponse Inqom:**
```json
[
  {
    "Id": 80548,
    "Name": "TEST SCC",
    "Siren": "123456789",
    "Status": "Active",
    "AccountingType": "Engagement",
    "CompanyId": 28118,
    "CreatedAt": "2024-01-15T10:00:00Z"
  },
  {
    "Id": 29703,
    "Name": "SIMPLE COMME CA",
    "Siren": "987654321",
    "Status": "Active",
    "AccountingType": "Engagement",
    "CompanyId": 28118
  }
]
```

---

### Mapping des Champs

| Champ Bubble (ancien) | Champ Bubble (nouveau) | Chift JSON | Inqom JSON |
|-----------------------|------------------------|------------|------------|
| Chift_consumer_ID | Inqom_company_ID | consumer_id | CompanyId |
| Chift_folder_ID | Inqom_folder_ID | folder_id | Id |
| Chift_connection_state | Inqom_connection_state | connection.status | Status |
| Current_connection_ID | *(supprimer)* | connection_id | - |
| Logiciel_compta | *(hardcoder "Inqom")* | connection.name | "Inqom" |

### Adaptation UI

**Cadrage original:**
> *"Depuis le popup je peux choisir un logiciel comptable parmi la liste des logiciels compta disponibles (pour l'instant il n'y a que Inqom)"*

**Nouvelle implémentation:**
Puisqu'on connecte directement à Inqom, le choix du logiciel comptable disparaît. L'utilisateur choisit directement le **dossier comptable** Inqom parmi la liste retournée.

---

## 4.2 SYNCHRONISATION DES JOURNAUX

### 📋 Référence Cadrage
**Lot 2 - Paramètres / Classement** (pages 499-511)

> *"La synchronisation des journaux se fait comme dernière étape d'une connexion à un logiciel compta. Cette synchronisation consiste en un appel du call Get Journals qui met à jour la liste à disposition dans l'onglet Classement."*

### 🎯 Objectif Fonctionnel
Récupérer les journaux comptables du dossier Inqom pour permettre de relier chaque journal à un dossier de la GED (Factures d'achats, Factures de vente, Notes de frais).

---

### Chift - GET Journals

**Endpoint:** `GET https://api.chift.eu/consumers/{consumer_id}/accounting/journals`

**Paramètres query:**
- `folder_id` - ID du dossier comptable (optionnel si mono-dossier)
- `page` - Numéro de page (défaut: 1)
- `size` - Éléments par page (défaut: 50, max: 100)

**Réponse Chift (format officiel):**
```json
{
  "items": [
    {
      "id": "948155",
      "code": "HA",
      "name": "Achats",
      "journal_type": "supplier_invoice",
      "counterpart_account": "401",
      "unallocated_account": "471",
      "next_document_numbers": [
        {
          "bookyear_name": "2025",
          "next_document_number": "HA-2025-001",
          "start_date": "2025-01-01",
          "end_date": "2025-12-31"
        }
      ],
      "iban": null,
      "currency": "EUR",
      "other_currencies_allowed": false,
      "blocked": false
    },
    {
      "id": "948156",
      "code": "VT",
      "name": "Ventes",
      "journal_type": "customer_invoice",
      "counterpart_account": "411",
      "currency": "EUR",
      "blocked": false
    },
    {
      "id": "948157",
      "code": "BQ",
      "name": "Banque",
      "journal_type": "bank",
      "iban": "FR7630001007941234567890185",
      "currency": "EUR",
      "blocked": false
    }
  ],
  "total": 3,
  "page": 1,
  "size": 50
}
```

**Types de journal Chift (journal_type):**
- `customer_invoice` - Factures clients (ventes)
- `supplier_invoice` - Factures fournisseurs (achats)
- `bank` - Banque
- `cash` - Caisse
- `misc` - Opérations diverses
- `opening` - À nouveaux

---

### Inqom - GET Journals

**Endpoint:** `GET /v1/dossiers/{dossierId}/journals`

**URL complète:** `https://wa-fred-accounting-services-prod.azurewebsites.net/v1/dossiers/80548/journals`

**Réponse Inqom (testée et vérifiée le 03/12/2025):**
```json
[
  {
    "Id": 948155,
    "Name": "HA",
    "Description": "Achat",
    "Type": "Buy"
  },
  {
    "Id": 948156,
    "Name": "VT",
    "Description": "Vente",
    "Type": "Sell"
  },
  {
    "Id": 948157,
    "Name": "BQ",
    "Description": "Banque",
    "Type": "Bank"
  },
  {
    "Id": 948158,
    "Name": "OD",
    "Description": "Opérations Diverses",
    "Type": "Misc"
  },
  {
    "Id": 948159,
    "Name": "SA",
    "Description": "Salaire",
    "Type": "Salary"
  },
  {
    "Id": 948160,
    "Name": "AN",
    "Description": "A Nouveaux",
    "Type": "ANouveaux"
  },
  {
    "Id": 948161,
    "Name": "IM",
    "Description": "Dotation aux amortissements",
    "Type": "Depreciation"
  },
  {
    "Id": 948162,
    "Name": "SIT",
    "Description": "Situations",
    "Type": "Situation"
  },
  {
    "Id": 948163,
    "Name": "CO",
    "Description": "Cut-off",
    "Type": "CutOff"
  },
  {
    "Id": 948164,
    "Name": "EM",
    "Description": "Emprunts",
    "Type": "Loan"
  },
  {
    "Id": 948165,
    "Name": "CB",
    "Description": "Crédits-baux",
    "Type": "Lease"
  },
  {
    "Id": 1163754,
    "Name": "REV",
    "Description": "Révision",
    "Type": "Revision"
  },
  {
    "Id": 1394522,
    "Name": "STO",
    "Description": "Stock",
    "Type": "Stock"
  }
]
```

---

### Mapping des Champs

| Champ Bubble | Chift JSON | Inqom JSON |
|--------------|------------|------------|
| id_chift → id_inqom | id | Id |
| Abreviation | code | Name |
| Nom | name | Description |
| Type | type | Type |

### Correspondance des Types de Journal

| Usage SCC | Code (Name) | Chift type | Inqom Type |
|-----------|-------------|------------|------------|
| Factures d'achats | HA | purchase | Buy |
| Factures de vente | VT | sale | Sell |
| Banque | BQ | bank | Bank |
| Opérations diverses | OD | misc | Misc |
| Salaires | SA | payroll | Salary |
| À nouveaux | AN | opening | ANouveaux |
| Amortissements | IM | depreciation | Depreciation |
| Emprunts | EM | loan | Loan |
| Révision | REV | revision | Revision |
| Stock | STO | stock | Stock |

---

## 4.3 SYNCHRONISATION DES FOURNISSEURS

### 📋 Référence Cadrage
**Lot 2 - Portail / Paramètres / Fournisseurs** (pages 564-670)

> *"Je peux cliquer sur le bouton 'Synchroniser'. Le système récupère la liste des fournisseurs et leurs détails grâce à ce call API. Pour chaque fournisseur retourné il y a 2 cas : le fournisseur n'existe pas en base (il est ajouté) ou le fournisseur existe en base (on regarde si certains détails sont vides de notre côté)."*

### 🎯 Objectif Fonctionnel
Synchroniser la liste des fournisseurs depuis le logiciel comptable vers Bubble pour permettre :
- L'affichage dans l'onglet Fournisseurs
- La liaison avec les factures d'achat
- Le pré-remplissage des IBAN pour les paiements

---

### ⚠️ Différence Conceptuelle Majeure

| Concept | Chift | Inqom |
|---------|-------|-------|
| Fournisseur | **Entité dédiée** avec tous les détails | **Compte auxiliaire 401*** |
| Stockage | Objet complet (nom, IBAN, email, adresses...) | Juste un numéro de compte et un nom |
| Détails supplémentaires | Dans l'objet supplier | Dans documents (CounterParty) ou non disponibles |

**Conséquence:** Les informations détaillées (IBAN, email, téléphone, adresses) ne sont PAS stockées dans les comptes Inqom. Elles doivent rester dans Bubble.

---

### Chift - GET Suppliers

**Endpoint:** `GET https://api.chift.eu/consumers/{consumer_id}/accounting/suppliers`

**Réponse Chift:**
```json
{
  "items": [
    {
      "id": "SUP-001",
      "external_reference": "AMAZON",
      "name": "AMAZON FRANCE",
      "first_name": null,
      "last_name": null,
      "is_company": true,
      "company_id": "FR12345678901",
      "phone": "01 23 45 67 89",
      "mobile": "06 12 34 56 78",
      "email": "comptabilite@amazon.fr",
      "website": "https://www.amazon.fr",
      "vat": "FR12345678901",
      "iban": "FR7630001007941234567890185",
      "bank_account": "00010079400",
      "currency": "EUR",
      "active": true,
      "account_number": "401AMAZON",
      "last_updated_on": "2025-01-15T10:00:00Z",
      "addresses": [
        {
          "address_type": "main",
          "name": "Siège social",
          "street": "67 Boulevard du Général Leclerc",
          "city": "Clichy",
          "postal_code": "92110",
          "country": "FR",
          "phone": "01 23 45 67 89"
        }
      ]
    }
  ],
  "total": 1,
  "page": 1
}
```

---

### Inqom - GET Accounts (préfixe 401)

**Endpoint:** `GET /v1/dossiers/{dossierId}/accounts?accountNumberPrefix=401&accountType=All`

**URL complète:** `https://wa-fred-accounting-services-prod.azurewebsites.net/v1/dossiers/80548/accounts?accountNumberPrefix=401&accountType=All`

**Réponse Inqom (testée):**
```json
[
  {
    "Number": "401",
    "Name": "Fournisseurs",
    "IsImpactable": false,
    "IsDivisible": true,
    "IsManaged": false
  },
  {
    "Number": "4011AMAZON",
    "Name": "AMAZON FRANCE",
    "IsImpactable": true,
    "IsDivisible": false,
    "IsManaged": false,
    "ParentAccountNumber": "401"
  },
  {
    "Number": "4011TESTMARC",
    "Name": "FOURNISSEUR TEST MARC",
    "IsImpactable": true,
    "IsDivisible": false,
    "IsManaged": false,
    "ParentAccountNumber": "401"
  }
]
```

---

### Mapping des Champs

| Champ Bubble | Chift JSON | Inqom JSON | Note |
|--------------|------------|------------|------|
| chift_id → inqom_account_number | id | Number | Ex: "4011AMAZON" |
| name | name | Name | Identique |
| account_number | account_number | Number | Le numéro de compte |
| email | email | ❌ Non disponible | Garder en local |
| phone | phone | ❌ Non disponible | Garder en local |
| mobile | mobile | ❌ Non disponible | Garder en local |
| iban | iban | ❌ Non disponible | Garder en local |
| bic | - | ❌ Non disponible | Garder en local |
| vat | vat | ❌ Non disponible | Garder en local |
| siret | company_id | ❌ Non disponible | Garder en local |
| website | website | ❌ Non disponible | Garder en local |
| adresse | addresses[] | ❌ Non disponible | Garder en local |

### ⚠️ Point d'attention : Numéro de compte

Inqom ajoute automatiquement un préfixe lors de la création :
```
Envoyé:   401AMAZON
Retourné: 4011AMAZON   ← Notez le "1" ajouté après "401"
```

**Règle:** Toujours stocker le numéro RETOURNÉ par l'API, pas celui envoyé.

---

### Stratégie de Synchronisation Recommandée

1. **Récupérer tous les comptes 401*** via l'API Inqom
2. **Pour chaque compte retourné:**
   - Si `Number` n'existe pas dans Bubble → Créer le fournisseur (name + account_number uniquement)
   - Si `Number` existe → Vérifier si le `Name` a changé et mettre à jour
3. **Les détails (IBAN, email, adresses) restent gérés uniquement dans Bubble**

---

## 4.4 SYNCHRONISATION DES CLIENTS

### 📋 Référence Cadrage
**Lot 5 - Encaissements + Ventes** (voir section similaire aux fournisseurs)

### 🎯 Objectif Fonctionnel
Même logique que les fournisseurs, mais pour les comptes clients (411*).

---

### Chift - GET Clients

**Endpoint:** `GET https://api.chift.eu/consumers/{consumer_id}/accounting/clients`

**Réponse Chift:**
```json
{
  "items": [
    {
      "id": "CLI-001",
      "external_reference": "DURAND",
      "name": "DURAND SARL",
      "first_name": "Jean",
      "last_name": "Durand",
      "is_company": true,
      "phone": "01 98 76 54 32",
      "email": "contact@durand.fr",
      "vat": "FR98765432101",
      "iban": "FR7612345678901234567890123",
      "currency": "EUR",
      "active": true,
      "account_number": "411DURAND",
      "addresses": [
        {
          "address_type": "billing",
          "street": "123 Rue de la Paix",
          "city": "Paris",
          "postal_code": "75001",
          "country": "FR"
        }
      ]
    }
  ],
  "total": 1
}
```

---

### Inqom - GET Accounts (préfixe 411)

**Endpoint:** `GET /v1/dossiers/{dossierId}/accounts?accountNumberPrefix=411&accountType=All`

**Réponse Inqom:**
```json
[
  {
    "Number": "411",
    "Name": "Clients",
    "IsImpactable": false,
    "IsDivisible": true,
    "IsManaged": false
  },
  {
    "Number": "4111DURAND",
    "Name": "DURAND SARL",
    "IsImpactable": true,
    "IsDivisible": false,
    "IsManaged": false,
    "ParentAccountNumber": "411"
  }
]
```

---

### Mapping des Champs (identique aux fournisseurs)

| Champ Bubble | Chift JSON | Inqom JSON |
|--------------|------------|------------|
| chift_id → inqom_account_number | id | Number |
| name | name | Name |
| account_number | account_number | Number |
| Autres champs | ✅ Disponibles | ❌ Garder en local |

---

## 4.5 SYNCHRONISATION DES FACTURES

### 📋 Référence Cadrage
**Lot 2 - Portail / Paiements** (pages 672-759)

> *"Je peux cliquer sur Synchroniser. Le système récupère l'ensemble des factures non payées grâce au call Get Invoice By Type."*

> *"Statut d'une facture d'achat dans Chift (statut_chift): canceled, draft, posted, paid"*
> *"Statut d'une facture d'achat dans SCC (statut_scc): annulée, brouillon, à payer, bon à payer, programmé, paiement en cours, payé"*

### 🎯 Objectif Fonctionnel
Récupérer les factures depuis le logiciel comptable pour :
- Alimenter l'échéancier des paiements (factures à payer)
- Mettre à jour les statuts (payé/non payé via lettrage)
- Classer les PDF dans la GED

---

### ⚠️ Différence Conceptuelle Majeure

| Concept | Chift | Inqom |
|---------|-------|-------|
| Facture | **Objet facture** avec statut, lignes, partner | **Écriture comptable** (entry) |
| Statut | Champ `status` explicite | Déduit du **lettrage** |
| Lignes | Array `lines` avec détails | Array `Lines` dans entry |
| Lien fournisseur | `partner_id` | Déduit du compte 401* dans les lignes |

---

### Chift - GET Invoice By Type

**Endpoint:** `GET https://api.chift.eu/consumers/{consumer_id}/accounting/invoices/type/{invoice_type}`

**Types disponibles (invoice_type):**
- `supplier_invoice` - Facture fournisseur
- `supplier_refund` - Avoir fournisseur
- `customer_invoice` - Facture client
- `customer_refund` - Avoir client

**Paramètres query:**
- `folder_id` - ID du dossier comptable
- `page` - Numéro de page (défaut: 1)
- `size` - Éléments par page (défaut: 50, max: 100)
- `start_date` - Date début (YYYY-MM-DD)
- `end_date` - Date fin (YYYY-MM-DD)

**Réponse Chift (format officiel complet):**
```json
{
  "items": [
    {
      "id": "INV-2025-001",
      "invoice_type": "supplier_invoice",
      "invoice_number": "FACT-001",
      "currency": "EUR",
      "untaxed_amount": 100.00,
      "tax_amount": 20.00,
      "total": 120.00,
      "reference": "CMD-2025-001",
      "payment_communication": "FACT-001",
      "customer_memo": "Facture fournitures bureau",
      "invoice_date": "2025-12-01",
      "due_date": "2025-12-31",
      "partner_id": "SUP-001",
      "journal_id": "948155",
      "status": "posted",
      "last_updated_on": "2025-12-01T10:30:00Z",
      "payments": [
        {
          "id": "PAY-001",
          "amount": 120.00,
          "payment_date": "2025-12-15",
          "reconciled": true
        }
      ],
      "lines": [
        {
          "line_number": 1,
          "unit_price": 100.00,
          "quantity": 1,
          "untaxed_amount": 100.00,
          "tax_rate": 20.0,
          "total": 120.00,
          "description": "Fournitures bureau"
        }
      ],
      "attachments_info": {
        "status": "available",
        "attachments": [
          {
            "filename": "facture-amazon.pdf",
            "url": "https://..."
          }
        ]
      },
      "partner": {
        "id": "SUP-001",
        "name": "AMAZON FRANCE",
        "vat": "FR12345678901"
      }
    }
  ],
  "total": 1,
  "page": 1,
  "size": 50
}
```

**Statuts Chift (status):**
- `cancelled` - Annulée
- `draft` - Brouillon
- `posted` - Validée/Comptabilisée
- `paid` - Payée (déduit des payments)

---

### Inqom - GET Entry-Lines

**Endpoint:** `GET /v1/dossiers/{dossierId}/entry-lines`

**Paramètres:**
- `startDate` - Date de début (YYYY-MM-DD)
- `endDate` - Date de fin (YYYY-MM-DD)
- `accountNumber` - Filtrer par compte (optionnel)
- `pageNumber` - Pagination

**URL complète:** `https://wa-fred-accounting-services-prod.azurewebsites.net/v1/dossiers/80548/entry-lines?startDate=2025-01-01&endDate=2025-12-31&pageNumber=1`

**Réponse Inqom (testée):**
```json
{
  "EntryLines": [
    {
      "TypeOfChange": "Creation",
      "Id": 2105484453,
      "Label": "FOURNITURES BUREAU - TEST MARC",
      "DebitAmount": 100.00,
      "CreditAmount": 0.0,
      "Currency": "EUR",
      "Entry": {
        "Id": 570817716,
        "Date": "2025-12-03T00:00:00Z",
        "DocumentDate": "2025-12-03T00:00:00Z"
      },
      "AccountNumber": "6064",
      "Journal": {
        "Id": 948155,
        "Code": "HA"
      },
      "AccountingDocument": {
        "Reference": "FACT-MARC-001",
        "Date": "2025-12-03T00:00:00Z"
      },
      "Letterings": []
    },
    {
      "TypeOfChange": "Creation",
      "Id": 2105484454,
      "Label": "TVA DEDUCTIBLE 20%",
      "DebitAmount": 20.00,
      "CreditAmount": 0.0,
      "Currency": "EUR",
      "Entry": {
        "Id": 570817716,
        "Date": "2025-12-03T00:00:00Z"
      },
      "AccountNumber": "44566",
      "Journal": {
        "Id": 948155,
        "Code": "HA"
      }
    },
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
      "Letterings": [
        {
          "Id": 136341101
        }
      ]
    }
  ],
  "CurrentPage": 1,
  "TotalPages": 1
}
```

---

### Comment reconstruire une "Facture" depuis Inqom

Une facture Chift = **plusieurs entry-lines Inqom partageant le même Entry.Id**

```
Facture FACT-MARC-001 (Entry.Id: 570817716)
├── Ligne 1: 6064 (Charge) - Débit 100.00 €
├── Ligne 2: 44566 (TVA) - Débit 20.00 €
└── Ligne 3: 4011TESTMARC (Fournisseur) - Crédit 120.00 €
                                         ↑ Total TTC
```

**Pour identifier le fournisseur:** Chercher la ligne avec un compte 401* dans les lignes de l'écriture.

**Pour identifier le statut (payé/non payé):** Vérifier si la ligne 401* a des `Letterings` non vides.

---

### Mapping des Champs

| Champ Bubble | Chift JSON | Inqom JSON | Comment obtenir |
|--------------|------------|------------|-----------------|
| chift_id → inqom_entry_id | id | Entry.Id | ID de l'écriture |
| invoice_number | invoice_number | AccountingDocument.Reference | Référence pièce |
| invoice_date | date | Entry.Date | Date de l'écriture |
| due_date | due_date | ❌ Non disponible | Calculer: invoice_date + délai |
| chift_status → statut_lettrage | status | Letterings[] | Si vide: non payé |
| partner_id → inqom_account_number | partner_id | AccountNumber (401*) | Compte fournisseur |
| total | total | CreditAmount (ligne 401*) | Montant TTC |
| untaxed_amount | total_untaxed | DebitAmount (ligne 6*) | Montant HT |
| tax_amount | total_tax | DebitAmount (ligne 445*) | Montant TVA |
| journal_id | journal_id | Journal.Id | ID du journal |

### Mapping des Statuts

| Chift status | Inqom (déduction) | SCC statut_scc |
|--------------|-------------------|----------------|
| draft | ❌ Pas d'écritures brouillon | brouillon |
| posted | Letterings = [] | à payer |
| paid | Letterings ≠ [] | payé |
| canceled | ❌ Écriture supprimée | annulée |

**Logique de mapping SCC:**
```
SI Letterings non vide ALORS
    statut_scc = "payé"
SINON SI date_paiement définie dans Bubble ALORS
    SI date_paiement > aujourd'hui ALORS
        statut_scc = "programmé"
    SINON
        statut_scc = "paiement en cours"
    FIN SI
SINON
    statut_scc = "à payer"
FIN SI
```

---

## 4.6 CRÉATION DE FACTURES / ÉCRITURES

### 📋 Référence Cadrage
**Section INQOM (Marc) - NB complémentaire 2** (pages 3488-3511)

> *"Lorsqu'une facture de vente est validée dans SCC, une écriture comptable de type 'vente' doit être créée automatiquement dans le dossier comptable INQOM via l'API POST /accounting-folders/{id}/journal-entries"*

### 🎯 Objectif Fonctionnel
Quand un utilisateur valide une facture de vente dans Bubble :
1. Créer l'écriture comptable correspondante dans Inqom
2. Associer le PDF de la facture
3. Stocker l'ID Inqom pour la synchronisation future

---

### Chift - POST Invoice

**Endpoint:** `POST https://api.chift.eu/consumers/{consumer_id}/accounting/invoices`

**Body Chift:**
```json
{
  "invoice_type": "customer_invoice",
  "invoice_number": "FAC-2025-001",
  "date": "2025-12-03",
  "due_date": "2025-12-31",
  "partner_id": "CLI-001",
  "journal_id": "948156",
  "currency": "EUR",
  "lines": [
    {
      "description": "Prestation de services",
      "quantity": 1,
      "unit_price": 1000.00,
      "vat_code": "VAT-20",
      "account_number": "706"
    }
  ]
}
```

**Réponse Chift:**
```json
{
  "id": "INV-2025-001",
  "status": "posted",
  "total": 1200.00
}
```

---

### Inqom - POST Entries

**Endpoint:** `POST /v1/dossiers/{dossierId}/entries`

**URL complète:** `https://wa-fred-accounting-services-prod.azurewebsites.net/v1/dossiers/80548/entries`

**Body Inqom:**
```json
[
  {
    "JournalId": 948156,
    "Date": "2025-12-03",
    "Document": {
      "Reference": "FAC-2025-001",
      "Date": "2025-12-03"
    },
    "ExternalId": "SCC-FACTURE-001",
    "Lines": [
      {
        "Label": "Prestation de services",
        "DebitAmount": 0,
        "CreditAmount": 1000.00,
        "Currency": "EUR",
        "AccountNumber": "706"
      },
      {
        "Label": "TVA collectée 20%",
        "DebitAmount": 0,
        "CreditAmount": 200.00,
        "Currency": "EUR",
        "AccountNumber": "44571"
      },
      {
        "Label": "Client DURAND",
        "DebitAmount": 1200.00,
        "CreditAmount": 0,
        "Currency": "EUR",
        "AccountNumber": "4111DURAND"
      }
    ]
  }
]
```

**Réponse Inqom (testée):**
```json
[
  {
    "Id": 570817716,
    "ExternalId": "SCC-FACTURE-001",
    "Lines": [
      {
        "Id": 2105484453,
        "Label": "PRESTATION DE SERVICES",
        "CreditAmount": 1000.00,
        "AccountNumber": "706"
      },
      {
        "Id": 2105484454,
        "Label": "TVA COLLECTÉE 20%",
        "CreditAmount": 200.00,
        "AccountNumber": "44571"
      },
      {
        "Id": 2105484455,
        "Label": "CLIENT DURAND",
        "DebitAmount": 1200.00,
        "AccountNumber": "4111DURAND"
      }
    ]
  }
]
```

---

### ⚠️ Points d'attention

1. **Équilibre comptable obligatoire**
   ```
   Total Débits = Total Crédits
   1200.00 = 1000.00 + 200.00 ✓
   ```

2. **Maximum 50 écritures par appel**
   Si plus de 50 factures à créer, batcher les appels.

3. **ExternalId recommandé**
   Permet de retrouver l'écriture SCC correspondante lors de la synchronisation.

4. **Labels en MAJUSCULES**
   Inqom convertit automatiquement les labels en majuscules.

---

### Logique des sens (Débit/Crédit)

**Facture de VENTE (client nous doit de l'argent):**
```
Débit  411 Client     1200.00  ← Le client nous doit
Crédit 706 Ventes     1000.00  ← Nos revenus
Crédit 44571 TVA       200.00  ← TVA à reverser
```

**Facture d'ACHAT (on doit de l'argent au fournisseur):**
```
Débit  607 Achats      100.00  ← Nos charges
Débit  44566 TVA        20.00  ← TVA récupérable
Crédit 401 Fournisseur 120.00  ← On doit au fournisseur
```

---

## 4.7 GESTION DES CODES TVA

### 📋 Référence Cadrage
**Lot 2** - Mention des VAT codes dans les factures

### 🎯 Objectif Fonctionnel
Permettre de sélectionner le bon taux de TVA lors de la création d'une facture et d'utiliser le bon compte comptable.

---

### ⚠️ Différence Conceptuelle Majeure

| Concept | Chift | Inqom |
|---------|-------|-------|
| TVA | **Codes TVA abstraits** avec ID | **Comptes comptables 445*** |
| Sélection | Dropdown avec codes TVA | Dropdown avec taux → compte déduit |
| API | GET /vat-codes | GET /accounts?prefix=445 |

---

### Chift - GET VAT Codes

**Endpoint:** `GET https://api.chift.eu/consumers/{consumer_id}/accounting/vat-codes`

**Réponse Chift:**
```json
{
  "items": [
    {
      "id": "VAT-FR-20",
      "label": "TVA 20% France",
      "rate": 20.0,
      "type": "both",
      "code": "20",
      "active": true,
      "scope": "nat",
      "deductible_account": "44566",
      "payable_account": "44571",
      "reversed": false,
      "country": "FR"
    },
    {
      "id": "VAT-FR-10",
      "label": "TVA 10% France",
      "rate": 10.0,
      "type": "both",
      "code": "10",
      "active": true,
      "scope": "nat",
      "deductible_account": "44566",
      "payable_account": "44571",
      "country": "FR"
    },
    {
      "id": "VAT-FR-5.5",
      "label": "TVA 5.5% France",
      "rate": 5.5,
      "type": "both",
      "code": "5.5",
      "active": true,
      "scope": "nat",
      "deductible_account": "44566",
      "payable_account": "44571",
      "country": "FR"
    },
    {
      "id": "VAT-FR-0",
      "label": "Exonéré de TVA",
      "rate": 0.0,
      "type": "both",
      "code": "0",
      "active": true,
      "scope": "nat",
      "country": "FR"
    }
  ]
}
```

---

### Inqom - GET Accounts (préfixe 445)

**Endpoint:** `GET /v1/dossiers/{dossierId}/accounts?accountNumberPrefix=445&accountType=All`

**Réponse Inqom (testée):**
```json
[
  {
    "Number": "445",
    "Name": "Etat Taxes sur le chiffre d'affaires",
    "IsImpactable": false
  },
  {
    "Number": "44566",
    "Name": "TVA sur autres biens et services",
    "IsImpactable": true,
    "IsDivisible": true
  },
  {
    "Number": "44571",
    "Name": "TVA collectée",
    "IsImpactable": true,
    "IsDivisible": true
  },
  {
    "Number": "4456699",
    "Name": "TVA déductible sur opérations intérieures",
    "IsImpactable": true
  }
]
```

---

### 🎯 TABLE DE MAPPING TVA RECOMMANDÉE

Créer une table `TVA_Mapping` dans Bubble :

| taux_tva | label | compte_achat | compte_vente | scope |
|----------|-------|--------------|--------------|-------|
| 20 | TVA 20% France | 44566 | 44571 | national |
| 10 | TVA 10% France | 44566 | 44571 | national |
| 5.5 | TVA 5.5% France | 44566 | 44571 | national |
| 0 | Exonéré TVA | *(pas de ligne)* | *(pas de ligne)* | national |
| 20 | TVA Intracom 20% | 445662 | 4452 | eu |

### Utilisation lors de la création d'une écriture

```
POUR créer une facture d'ACHAT avec TVA 20%:
  - Ligne charge: compte selon nature (606, 607, etc.)
  - Ligne TVA: compte 44566 (TVA déductible)
  - Ligne fournisseur: compte 401XXXX

POUR créer une facture de VENTE avec TVA 20%:
  - Ligne vente: compte selon nature (706, 707, etc.)
  - Ligne TVA: compte 44571 (TVA collectée)
  - Ligne client: compte 411XXXX
```

---

### Adaptation de la table Bubble existante

**Table actuelle:** `VAT_Linked_Chart_of_Account_Number`

| Champ existant | Problème | Solution |
|----------------|----------|----------|
| VAT Code Chift | Référence API Chift | Remplacer par champs locaux |

**Nouveaux champs recommandés:**
```
- vat_rate (option.vat_rate) ← Garder
- compte_achat (text) ← "44566"
- compte_vente (text) ← "44571"
- label (text) ← "TVA 20% France"
- scope (option: national/eu/international)
```

---

## 4.8 UPLOAD DE DOCUMENTS

### 📋 Référence Cadrage
**Section INQOM (Marc) - Flux Upload** (pages 3256-3263)

> *"L'utilisateur dépose un fichier. SCC envoie le fichier à INQOM : POST /accounting-folders/{id}/Documents. INQOM retourne un documentId."*

### 🎯 Objectif Fonctionnel
Envoyer les PDF de factures vers Inqom pour archivage et OCR automatique.

---

### Chift - POST Attachment

**Endpoint:** `POST https://api.chift.eu/consumers/{consumer_id}/accounting/invoices/pdf/{invoice_id}`

**Body (multipart/form-data):**
```
file: [binary PDF content]
filename: facture-001.pdf
```

**Réponse Chift:**
```json
{
  "id": "ATT-001",
  "filename": "facture-001.pdf",
  "status": "uploaded"
}
```

---

### Inqom - POST Documents

**Endpoint:** `POST /api/accounting-documents/accounting-folders/{folderId}/Documents`

**URL complète:** `https://wa-fred-accounting-documents-prod.azurewebsites.net/api/accounting-documents/accounting-folders/80548/Documents`

**Body (multipart/form-data):**
```
Content-Type: multipart/form-data

file: [binary PDF content]
Type: Supplier | Client | ExpenseReport | Others
```

**Réponse Inqom:**
```json
{
  "Id": 40877030,
  "AccountingFolderId": 80548,
  "Name": "facture-001.pdf",
  "Type": "Supplier",
  "Status": "Received",
  "DocRef": "F-25-12-0001",
  "Source": "Api",
  "FileUrl": "https://fredprodstorage.blob.core.windows.net/..."
}
```

---

### Mapping des Champs

| Champ Bubble | Chift JSON | Inqom JSON |
|--------------|------------|------------|
| document_id | id | Id |
| filename | filename | Name |
| type | - | Type |
| status | status | Status |
| file_url | - | FileUrl |

### Types de Documents Inqom

| Type Inqom | Utilisation |
|------------|-------------|
| Supplier | Facture fournisseur |
| Client | Facture client |
| ExpenseReport | Note de frais |
| Others | Autre document |

### Statuts de Documents Inqom

| Status | Description |
|--------|-------------|
| Received | Document reçu |
| Processing | OCR en cours |
| ToReview | À vérifier manuellement |
| Done | Traité et validé |
| Duplicate | Doublon détecté |

---

## 4.9 LETTRAGE (MATCHING)

### 📋 Référence Cadrage
**Lot 2** - Lien facture/paiement implicite via statut "payé"

### 🎯 Objectif Fonctionnel
Rapprocher une facture et son règlement pour marquer la facture comme payée.

---

### Chift - POST Matching

**Endpoint:** `POST https://api.chift.eu/consumers/{consumer_id}/accounting/matching`

**Body Chift:**
```json
{
  "invoice_id": "INV-001",
  "payment_id": "PAY-001"
}
```

**Réponse Chift:**
```json
{
  "id": "MATCH-001",
  "status": "matched"
}
```

---

### Inqom - POST Letterings

**Endpoint:** `POST /v1/dossiers/{dossierId}/letterings`

**URL complète:** `https://wa-fred-accounting-services-prod.azurewebsites.net/v1/dossiers/80548/letterings`

**⚠️ Format EXACT du body (testé et validé):**
```json
{
  "CreateLetterringCommands": [
    {
      "EntryLineIds": [2105484455, 2105616480]
    }
  ]
}
```

**Réponse Inqom (testée):**
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

---

### ⚠️ Règles du Lettrage Inqom

1. **Les lignes doivent être sur le MÊME compte**
   ```
   ✓ Ligne facture: 4011AMAZON (crédit 120€)
   ✓ Ligne paiement: 4011AMAZON (débit 120€)
   ```

2. **Les montants doivent s'équilibrer**
   ```
   Total débits lettrés = Total crédits lettrés
   ```

3. **Une ligne ne peut être lettrée qu'une fois**

---

### Workflow complet : Payer une facture

```
1. CRÉER L'ÉCRITURE DE PAIEMENT
   POST /entries
   {
     "JournalId": 948157,  ← Journal Banque
     "Date": "2025-12-03",
     "Document": {"Reference": "VIR-001"},
     "Lines": [
       {
         "Label": "Paiement fournisseur",
         "DebitAmount": 120.00,
         "AccountNumber": "4011AMAZON"  ← Même compte que facture
       },
       {
         "Label": "Banque",
         "CreditAmount": 120.00,
         "AccountNumber": "5121"
       }
     ]
   }

2. RÉCUPÉRER LES IDs DES LIGNES
   - Ligne facture 401: 2105484455 (crédit 120€)
   - Ligne paiement 401: 2105616480 (débit 120€)

3. CRÉER LE LETTRAGE
   POST /letterings
   {
     "CreateLetterringCommands": [
       {"EntryLineIds": [2105484455, 2105616480]}
     ]
   }

4. METTRE À JOUR BUBBLE
   Facture.statut_scc = "payé"
```

---

## 4.10 TRANSACTIONS BANCAIRES

### 📋 Référence Cadrage
**Section INQOM (Marc) - NB3** (page 3513)

> *"Les flux bancaires sont envoyés par API de Inqom vers SCC, à l'exception des flux du compte PRO, directement pris chez Swan."*

### 🎯 Objectif Fonctionnel
Récupérer les mouvements bancaires depuis Inqom pour afficher dans le module Trésorerie.

---

### Chift - POST Bank Transactions

**Endpoint:** `POST https://api.chift.eu/consumers/{consumer_id}/accounting/bank-transactions`

**Body Chift (création):**
```json
{
  "bank_account_id": "BA-001",
  "date": "2025-12-03",
  "amount": -120.00,
  "description": "Virement fournisseur AMAZON",
  "reference": "VIR-001"
}
```

---

### Inqom - Mouvements via Entry-Lines (journal BQ)

Les transactions bancaires dans Inqom sont des écritures dans le journal Banque (BQ).

**Endpoint:** `GET /v1/dossiers/{dossierId}/entry-lines?journalCode=BQ`

**Réponse Inqom:**
```json
{
  "EntryLines": [
    {
      "Id": 2105616481,
      "Label": "PAIEMENT FOURNISSEUR AMAZON",
      "DebitAmount": 0.0,
      "CreditAmount": 120.00,
      "Entry": {
        "Id": 570859689,
        "Date": "2025-12-03T00:00:00Z"
      },
      "AccountNumber": "5121",
      "Journal": {
        "Id": 948157,
        "Code": "BQ"
      }
    }
  ]
}
```

---

### Mapping des Champs

| Champ Bubble (transaction) | Chift JSON | Inqom JSON |
|----------------------------|------------|------------|
| id | id | Entry.Id |
| date | date | Entry.Date |
| description | description | Label |
| valeur | amount | DebitAmount ou CreditAmount |
| sens | *(signe de amount)* | DebitAmount>0 = sortie, CreditAmount>0 = entrée |
| journal_id | - | Journal.Id |
| sent_to_chift → sent_to_inqom | *(flag local)* | *(flag local)* |

---

# 5. Checklist de Migration

## 5.1 Modifications Base de Données Bubble

### Table Society

| Action | Champ | Type | Valeur par défaut |
|--------|-------|------|-------------------|
| ➕ Ajouter | Inqom_company_ID | text | "28118" |
| ➕ Ajouter | Inqom_folder_ID | text | - |
| ➕ Ajouter | Inqom_access_token | text (privé) | - |
| ➕ Ajouter | Inqom_token_expiry | date | - |
| ➕ Ajouter | Inqom_last_sync | date | - |
| ➕ Ajouter | Inqom_username | text (privé) | - |
| ➕ Ajouter | Inqom_password | text (privé) | - |
| 🔄 Conserver | Chift_* | - | Pour migration progressive |

### Table Facture

| Action | Champ | Type |
|--------|-------|------|
| ➕ Ajouter | Inqom_entry_id | text |
| ➕ Ajouter | Inqom_entry_line_ids | list of text |
| ➕ Ajouter | Inqom_document_id | text |
| ➕ Ajouter | Inqom_lettrage_id | text |
| 🔄 Conserver | chift_id | Pour migration |

### Table Fournisseur / Client

| Action | Champ | Type |
|--------|-------|------|
| ➕ Ajouter | Inqom_account_number | text |
| 🔄 Conserver | chift_id | Pour migration |

### Table Journal

| Action | Champ | Type |
|--------|-------|------|
| ➕ Ajouter | Inqom_journal_id | number |
| 🔄 Conserver | id_chift | Pour migration |

### Table VAT_Linked_Chart_of_Account_Number

| Action | Champ | Type |
|--------|-------|------|
| ➕ Ajouter | compte_achat | text |
| ➕ Ajouter | compte_vente | text |
| ➕ Ajouter | label | text |
| ❌ Supprimer (plus tard) | VAT Code Chift | - |

---

## 5.2 API Connector à créer

### Groupe "Inqom - Auth"

| Nom | Méthode | URL |
|-----|---------|-----|
| Get Token | POST | https://auth.inqom.com/identity/connect/token |

### Groupe "Inqom - Accounting"

| Nom | Méthode | URL |
|-----|---------|-----|
| List Folders | GET | /provisioning/companies/{companyId}/accounting-folders |
| List Journals | GET | /v1/dossiers/{dossierId}/journals |
| List Accounts | GET | /v1/dossiers/{dossierId}/accounts |
| Create Account | POST | /v1/dossiers/{dossierId}/accounts |
| List Entry Lines | GET | /v1/dossiers/{dossierId}/entry-lines |
| Get Entry Lines Changes | GET | /v1/dossiers/{dossierId}/entry-lines/changes |
| Create Entries | POST | /v1/dossiers/{dossierId}/entries |
| Create Letterings | POST | /v1/dossiers/{dossierId}/letterings |
| List Accounting Periods | GET | /v1/dossiers/{dossierId}/accounting-periods |

### Groupe "Inqom - Documents"

| Nom | Méthode | URL |
|-----|---------|-----|
| List Documents | GET | /api/accounting-documents/accounting-folders/{folderId}/Documents |
| Upload Document | POST | /api/accounting-documents/accounting-folders/{folderId}/Documents |
| Get Document URL | GET | /api/accounting-documents/accounting-folders/{folderId}/Documents/{docId}/public-url |

---

## 5.3 Backend Workflows à modifier

| Workflow existant | Modification |
|-------------------|--------------|
| chift_get_create_client_* | → inqom_get_create_client (POST /accounts) |
| sync_factures_*_invoices | → inqom_sync_factures (GET /entry-lines) |
| create_chift_transactions | → inqom_create_transactions (POST /entries) |
| webhook_chift_* | ❌ Supprimer (pas de webhooks) |
| *(nouveau)* | → inqom_polling_sync (scheduled) |

---

## 5.4 Points de Vigilance

| ⚠️ Risque | Mitigation |
|-----------|------------|
| Pas de webhooks | Implémenter polling toutes les 15-30 min |
| Numéros de compte modifiés | Toujours utiliser le numéro retourné |
| Pas de due_date | Calculer: invoice_date + délai fournisseur |
| Pas de détails fournisseur | Garder IBAN/email en local dans Bubble |
| Token très long | Quand même vérifier expiration |
| Max 50 entries/call | Batcher si volume important |

---

## 5.5 Tests de Validation

| Test | Comment valider |
|------|-----------------|
| Authentification | Token obtenu sans erreur |
| Liste dossiers | Retourne les folders attendus |
| Sync journaux | Codes HA/VT/BQ présents |
| Sync fournisseurs | Comptes 401* récupérés |
| Sync factures | Entry-lines avec bons montants |
| Création écriture | Entry.Id retourné |
| Upload document | Document.Id retourné |
| Lettrage | Lettrage.Id retourné |
| Statut payé | Letterings[] non vide après lettrage |

---

**Document généré le 3 décembre 2025**
**Version 2.0 - Avec comparaison Chift/Inqom complète**
