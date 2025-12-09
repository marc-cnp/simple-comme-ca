# Analyse de Conformite et Anomalies

## Migration Chift vers Inqom - Simple Comme Ca

**Date:** 3 decembre 2025
**Auteur:** Analyse automatique Claude
**Base:** Document de cadrage (multi-modules) + Tests API Inqom

---

## 1. Conformite avec le cadrage

### 1.1 Fonctionnalites couvertes par Inqom

| Fonctionnalite (Cadrage) | Chift API | Inqom API | Statut |
|--------------------------|-----------|-----------|--------|
| Creation de consumer/company | POST /consumers | Pre-configure (CompanyId 28118) | OK - Different |
| Liste dossiers comptables | GET /accounting/folders | GET /accounting-folders | OK |
| Connexion logiciel compta | Via redirect Chift | Direct (credentials) | OK - Plus simple |
| Synchronisation journaux | GET /journals | GET /journals | OK |
| Synchronisation fournisseurs | GET /suppliers | GET /accounts?prefix=401 | OK - Modele different |
| Creation fournisseur | POST /suppliers | POST /accounts | OK |
| Synchronisation clients | GET /clients | GET /accounts?prefix=411 | OK - Modele different |
| Creation client | POST /clients | POST /accounts | OK |
| Synchronisation factures achats | GET /invoices/type/supplier_invoice | GET /entry-lines | OK |
| Synchronisation factures ventes | GET /invoices/type/customer_invoice | GET /entry-lines | OK |
| Synchronisation avoirs | GET /invoices/type/*_refund | GET /entry-lines | OK |
| Creation facture/ecriture | POST /invoices | POST /entries | OK |
| Upload document PDF | POST /invoices/pdf | POST /Documents | OK |
| Lettrage/matching | POST /matching | POST /letterings | OK |
| Codes TVA | GET /vat-codes | N/A (comptes 445*) | ATTENTION |
| Plan comptable | GET /chart-of-accounts | GET /accounts | OK |
| Balance des comptes | POST /chart-of-accounts/balance | Non teste | A VERIFIER |
| Transactions bancaires | POST /bank-transactions | POST /entries (journal BQ) | OK - Modele different |
| Ecritures journal | POST /journal-entries | POST /entries | OK |
| Export FEC | GET /export-fec | Non teste | A VERIFIER |

### 1.2 Fonctionnalites NON couvertes par Inqom API

| Fonctionnalite | Chift | Inqom | Impact |
|----------------|-------|-------|--------|
| **Webhooks** | Natifs (account.connection.*) | Non disponible | CRITIQUE - Polling requis |
| **Statut connexion temps reel** | Via webhook | Pas de notification | MOYEN - UI a adapter |
| **Liste logiciels compta** | GET /connections | N/A (direct Inqom) | MINEUR - Plus de choix |
| **Suppression compte** | DELETE /accounts | Non disponible | MINEUR - Via UI Inqom |

---

## 2. Anomalies detectees dans l'implementation actuelle

### 2.1 Champs Bubble sans equivalent Inqom

| Table | Champ | Type actuel | Probleme |
|-------|-------|-------------|----------|
| Article | chift_chart_account_number | api.apiconnector2... | Reference API Chift directe |
| VAT Linked Chart of Account Number | VAT Code Chift | api.apiconnector2... | Reference API Chift directe |

**Impact:** Ces champs font reference directement a l'API Chift. Ils devront etre remplaces par des references aux comptes TVA Inqom (445*).

### 2.2 Statuts a mapper

Le cadrage definit les statuts suivants :

**Statuts Chift (statut_chift):**
- canceled
- draft
- posted
- paid

**Statuts SCC (statut_scc):**
- annulee
- brouillon
- a payer
- bon a payer
- programme
- paiement en cours
- paye

**Inqom n'a pas ces statuts.** Le statut sera deduit de :
- Presence/absence de lettrage
- TypeOfChange (Creation, Update, Delete)
- Logique metier cote Bubble

### 2.3 Informations non disponibles dans Inqom

| Information | Dispo Chift | Dispo Inqom | Solution |
|-------------|-------------|-------------|----------|
| due_date (echeance) | Oui | Non directement | Calculer depuis invoice_date + delai |
| partner_id (lien facture/fournisseur) | Oui | Via AccountNumber | Deduire du compte 401*/411* |
| payment_lines | Oui | Via lettrage | Utiliser /letterings |
| invoice_lines (lignes de facture) | Oui | Via entry-lines | Filtrer par Entry.Id |

---

## 3. Recommandations

### 3.1 Priorite CRITIQUE

#### 3.1.1 Remplacement des webhooks par polling

**Situation actuelle:**
```
Chift envoie des webhooks:
- account.connection.created
- account.connection.updated
- account.connection.deleted
```

**Solution Inqom:**
```
Inqom n'a pas de webhooks. Options:
1. Polling periodique (recommande)
   - Verifier /entry-lines/changes toutes les X minutes
   - Stocker last_sync_date dans Society

2. Polling a la demande
   - Bouton "Synchroniser" dans l'UI
```

**Implementation recommandee:**
- Creer un workflow Bubble schedule (toutes les 15-30 min)
- Pour chaque Society avec Inqom_folder_ID:
  - Appeler GET /entry-lines?changedAfter={last_sync}
  - Mettre a jour les factures modifiees
  - Mettre a jour last_sync_date

#### 3.1.2 Adaptation du modele Fournisseur/Client

**Situation actuelle (Chift):**
```
Fournisseur = entite separee avec:
- id
- name
- iban
- email
- etc.
```

**Situation Inqom:**
```
Fournisseur = compte auxiliaire 401* avec:
- Number (ex: 4011AMAZON)
- Name
- (pas d'IBAN, email, etc. dans le compte)
```

**Solution:**
1. Garder les tables Fournisseur/Client dans Bubble
2. Ajouter champ `Inqom_account_number`
3. Les informations detaillees (IBAN, email, etc.) restent dans Bubble
4. Seul le numero de compte et le nom sont synchronises avec Inqom

### 3.2 Priorite HAUTE

#### 3.2.1 Mapping des codes TVA

**Situation actuelle:**
```
Bubble utilise des "VAT Codes Chift" qui sont des references abstraites
```

**Solution Inqom:**
| Taux TVA | Compte Inqom (Achats) | Compte Inqom (Ventes) |
|----------|----------------------|----------------------|
| 20% | 44566 | 44571 |
| 10% | 44566 | 44571 |
| 5.5% | 44566 | 44571 |
| 0% | Pas de ligne TVA | Pas de ligne TVA |

**Implementation:**
1. Creer une table de mapping dans Bubble
2. Stocker taux_tva -> compte_inqom
3. Utiliser ce mapping lors de la creation des ecritures

#### 3.2.2 Gestion des statuts de facture

**Regles de mapping:**
```
// Determiner statut_scc depuis Inqom
Si facture non lettree:
  Si pas de date_paiement dans Bubble: "a payer"
  Si date_paiement future: "programme"
  Si date_paiement passee: "paiement en cours"
Si facture lettree: "paye"
```

### 3.3 Priorite MOYENNE

#### 3.3.1 Synchronisation incrementale

L'endpoint `/entry-lines/changes` existe mais retourne des resultats vides dans nos tests.

**Hypothese:** Le parametre `changedAfter` filtre sur la date de modification serveur, pas sur la date de l'ecriture.

**Solution alternative:**
1. Stocker les IDs des entry-lines deja synchronisees
2. Comparer avec GET /entry-lines (pagination)
3. Identifier les nouvelles/modifiees par diff

#### 3.3.2 Upload de documents

Le cadrage mentionne l'envoi des factures PDF a Inqom.

**Workflow recommande:**
1. Lors de la creation d'une facture dans Bubble:
   - Generer le PDF
   - POST /Documents (multipart/form-data)
   - Stocker Inqom_document_ID
2. Lors de la creation de l'ecriture:
   - Utiliser la reference du document (DocRef)

### 3.4 Priorite BASSE

#### 3.4.1 Export FEC

Non teste dans cette analyse. A verifier si necessaire pour le module comptabilite.

#### 3.4.2 Balance des comptes

Non teste. Utile pour l'onglet Tresorerie.

---

## 4. Points d'attention pour les developpeurs

### 4.1 Format des numeros de compte

**ATTENTION:** Inqom modifie les numeros de compte lors de la creation.

```
Envoye: 401AMAZON
Retourne: 4011AMAZON (avec un 1 supplementaire)
```

**Regle:** Toujours stocker le numero RETOURNE par l'API, pas celui envoye.

### 4.2 Limite de 50 ecritures par appel

```
POST /entries accepte un array de max 50 ecritures
```

**Si plus de 50 factures a creer:** Batcher les appels.

### 4.3 Format du lettrage

Le format du body pour POST /letterings n'est pas trivial:

```json
// CORRECT
{
  "CreateLetterringCommands": [
    {"EntryLineIds": [123, 456]}
  ]
}

// INCORRECT (ne fonctionne pas)
[[123, 456]]
```

### 4.4 Exercices comptables

Les ecritures ne peuvent etre creees que dans un exercice NON verrouille (Locked: false).

**Verifier avant creation:**
```
GET /accounting-periods
Verifier que la date de facture tombe dans un exercice ouvert
```

---

## 5. Checklist de conformite

### 5.1 Fonctionnalites obligatoires du cadrage

- [x] Connexion au logiciel comptable (Inqom direct au lieu de Chift)
- [x] Synchronisation des journaux
- [x] Synchronisation des fournisseurs
- [x] Synchronisation des factures d'achat
- [x] Creation de factures avec envoi au logiciel compta
- [x] Synchronisation des clients
- [x] Synchronisation des factures de vente
- [x] Lettrage des factures
- [ ] Webhooks pour mise a jour temps reel (NON DISPONIBLE - alternative polling)
- [ ] Balance des comptes pour tresorerie (A TESTER)
- [ ] Export FEC (A TESTER)

### 5.2 Adaptations requises

1. **UI:** Supprimer le choix du logiciel compta (direct Inqom)
2. **Backend:** Remplacer tous les calls Chift par Inqom
3. **DB:** Ajouter les nouveaux champs Inqom_*
4. **DB:** Migrer les champs Chift existants (ou conserver en parallele pendant transition)
5. **Workflows:** Implementer le polling pour remplacer les webhooks
6. **Logique metier:** Adapter le calcul des statuts

---

## 6. Questions en suspens

1. **Refresh token:** Inqom utilise un token longue duree (~1 an). Faut-il stocker les credentials pour regenerer le token a l'expiration ?

2. **Multi-dossiers:** Une Society peut-elle etre connectee a plusieurs dossiers Inqom ? Le cadrage actuel semble supposer 1:1.

3. **Permissions:** Le token donne acces a tous les dossiers de la Company. Faut-il verifier les permissions au niveau utilisateur dans Bubble ?

4. **Migration des donnees:** Les factures existantes avec chift_id devront-elles etre re-synchronisees avec Inqom ?

---

*Document genere le 3 decembre 2025*
