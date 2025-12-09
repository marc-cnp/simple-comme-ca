# APIs Chift utilisees dans Simple Comme Ca

**Genere le:** 2025-12-03
**Source:** Analyse du fichier .bubble + documentation Chift

---

## 1. Resume des appels Chift identifies dans Bubble

### Appels API (API Connector)

| Nom dans Bubble | Fonction |
|-----------------|----------|
| Chift - Get chart of accounts | Recuperer le plan comptable |
| Chift - Get clients | Recuperer la liste des clients |
| Chift - Get journals | Recuperer les journaux comptables |
| Chift - Get customer invoices | Recuperer les factures clients |
| Chift - Get customer refunds | Recuperer les avoirs clients |
| Chift - Get supplier invoices | Recuperer les factures fournisseurs |
| Chift - Get supplier refunds | Recuperer les avoirs fournisseurs |
| Chift - Get document facture | Recuperer le PDF d'une facture |
| Chift - Get connections (Action) | Recuperer les connexions |
| Chift - Create journal entry | Creer une ecriture journal |
| Chift - Create sale/purchase entry | Creer une ecriture vente/achat |
| Chift - Update client | Mettre a jour un client |
| Chift - Update client backend WF | Mise a jour client (backend) |
| Chift - Update connection | Mettre a jour une connexion |
| Chift - Delete connection | Supprimer une connexion |
| Dropdown - Get Chift VAT | Recuperer les codes TVA |
| RG - Chift Chart of account | Repeating Group plan comptable |
| RG - Chift VAT | Repeating Group TVA |
| RG - Chift VAT V2 | Repeating Group TVA v2 |

### Backend Workflows (API Workflows)

| Nom du Workflow | Fonction |
|-----------------|----------|
| chift_get_create_client_personne_morale | Creer/recuperer client entreprise |
| chift_get_create_client_personne_physique | Creer/recuperer client particulier |
| chift_update_client | Mettre a jour un client |
| chift_update_client_bis | Mettre a jour un client (bis) |
| create_chift_transactions | Creer des transactions Chift |
| get_chift_transactions | Recuperer des transactions |
| webhook_chift_created_connection_copy | Webhook connexion creee |
| webhook_chift_updated_connection | Webhook connexion mise a jour |
| sync_factures_1_customer_invoices | Sync factures clients |
| sync_factures_2_customer_refunds | Sync avoirs clients |
| sync_factures_3_supplier_invoices | Sync factures fournisseurs |
| sync_factures_4_supplier_refunds | Sync avoirs fournisseurs |
| sync_factures_5_final | Finalisation sync factures |

---

## 2. Endpoints Chift API (Base URL: https://api.chift.eu)

### Authentication
```
POST /token
```

### Consumers (Gestion des comptes)
```
POST /consumers
GET  /consumers
```

### Accounting - Folders
```
GET /consumers/{consumer_id}/accounting/folders
```

### Accounting - Book Years (Exercices)
```
GET /consumers/{consumer_id}/accounting/bookyears
```

### Accounting - Clients
```
POST  /consumers/{consumer_id}/accounting/clients
GET   /consumers/{consumer_id}/accounting/clients
GET   /consumers/{consumer_id}/accounting/clients/{client_id}
PATCH /consumers/{consumer_id}/accounting/clients/{client_id}
```

### Accounting - Suppliers (Fournisseurs)
```
POST  /consumers/{consumer_id}/accounting/suppliers
GET   /consumers/{consumer_id}/accounting/suppliers
GET   /consumers/{consumer_id}/accounting/suppliers/{supplier_id}
PATCH /consumers/{consumer_id}/accounting/suppliers/{supplier_id}
```

### Accounting - Invoices (Factures)
```
POST /consumers/{consumer_id}/accounting/invoices
GET  /consumers/{consumer_id}/accounting/invoices/type/{invoice_type}
GET  /consumers/{consumer_id}/accounting/invoices/{invoice_id}
POST /consumers/{consumer_id}/accounting/invoices/payments
GET  /consumers/{consumer_id}/accounting/payment-methods
```
**Types de factures (invoice_type):**
- `customer_invoice` - Facture client
- `customer_refund` - Avoir client
- `supplier_invoice` - Facture fournisseur
- `supplier_refund` - Avoir fournisseur

### Accounting - Chart of Accounts (Plan comptable)
```
GET  /consumers/{consumer_id}/accounting/chart-of-accounts
POST /consumers/{consumer_id}/accounting/accounts
POST /consumers/{consumer_id}/accounting/chart-of-accounts/balance
```

### Accounting - Journals
```
POST /consumers/{consumer_id}/accounting/journal
GET  /consumers/{consumer_id}/accounting/journals
```

### Accounting - Journal Entries (Ecritures)
```
POST /consumers/{consumer_id}/accounting/journal-entries
POST /consumers/{consumer_id}/accounting/financial-entries
GET  /consumers/{consumer_id}/accounting/journal/entries
GET  /consumers/{consumer_id}/accounting/journal/entries/{journal_entry_id}
POST /consumers/{consumer_id}/accounting/matching
POST /consumers/{consumer_id}/accounting/matching-multiple
```

### Accounting - VAT Codes
```
GET /consumers/{consumer_id}/accounting/vat-codes
```

### Accounting - Bank
```
POST /consumers/{consumer_id}/accounting/bank-accounts
GET  /consumers/{consumer_id}/accounting/bank-accounts
POST /consumers/{consumer_id}/accounting/bank-transactions
```

### Accounting - Attachments
```
POST /consumers/{consumer_id}/accounting/invoices/pdf/{invoice_id}
GET  /consumers/{consumer_id}/accounting/attachments
```

### Accounting - Export
```
GET /consumers/{consumer_id}/accounting/export-fec
```

---

## 3. Mapping Chift -> Inqom (Endpoints)

| Fonction | Chift Endpoint | Inqom Endpoint |
|----------|----------------|----------------|
| **Authentification** | POST /token | POST /identity/connect/token |
| **Liste dossiers** | GET /consumers/{id}/accounting/folders | GET /provisioning/companies/{id}/accounting-folders |
| **Exercices** | GET /consumers/{id}/accounting/bookyears | GET /v1/dossiers/{id}/accounting-periods |
| **Journaux** | GET /consumers/{id}/accounting/journals | GET /v1/dossiers/{id}/journals |
| **Plan comptable** | GET /consumers/{id}/accounting/chart-of-accounts | GET /v1/dossiers/{id}/accounts |
| **Creer compte** | POST /consumers/{id}/accounting/accounts | POST /v1/dossiers/{id}/accounts |
| **Clients** | GET/POST /consumers/{id}/accounting/clients | Comptes 411* via /accounts |
| **Fournisseurs** | GET/POST /consumers/{id}/accounting/suppliers | Comptes 401* via /accounts |
| **Factures (lecture)** | GET /consumers/{id}/accounting/invoices/type/{type} | GET /v1/dossiers/{id}/entry-lines |
| **Factures (creation)** | POST /consumers/{id}/accounting/invoices | POST /v1/dossiers/{id}/entries |
| **Ecritures** | POST /consumers/{id}/accounting/journal-entries | POST /v1/dossiers/{id}/entries |
| **Lettrage** | POST /consumers/{id}/accounting/matching | POST /v1/dossiers/{id}/letterings |
| **Codes TVA** | GET /consumers/{id}/accounting/vat-codes | N/A (codes standards PCG) |
| **Documents** | POST /consumers/{id}/accounting/invoices/pdf/{id} | POST /api/accounting-documents/.../Documents |
| **Export FEC** | GET /consumers/{id}/accounting/export-fec | Via Import FEC API |

---

## 4. Champs Bubble lies a Chift

### Table Society
| Champ | Type | Usage |
|-------|------|-------|
| Chift_consumer_ID | text | ID du consumer Chift |
| Chift_folder_ID | text | ID du dossier comptable Chift |
| Chift_connection_state | option | Etat de la connexion (Active, Inactive, etc.) |
| Current_connection_ID | text | ID de la connexion courante |

### Table User
| Champ | Type | Usage |
|-------|------|-------|
| Chift_access_token | text | Token d'acces Chift |
| Chift_token_expiration_date | date | Date d'expiration du token |

### Table Facture
| Champ | Type | Usage |
|-------|------|-------|
| chift_id | text | ID de la facture dans Chift |
| chift_status | option | Statut Chift de la facture |
| chift_journal_id | text | ID du journal Chift |
| Chift_folder_ID | text | ID du dossier Chift |

### Table Fournisseur
| Champ | Type | Usage |
|-------|------|-------|
| chift_id | text | ID du fournisseur dans Chift |
| Chift_folder_ID | text | ID du dossier Chift |

### Table Client
| Champ | Type | Usage |
|-------|------|-------|
| chift_id | text | ID du client dans Chift |
| Chift_folder_ID | text | ID du dossier Chift |

### Table Journal
| Champ | Type | Usage |
|-------|------|-------|
| id_chift | text | ID du journal dans Chift |
| Chift_folder_ID | text | ID du dossier Chift |

### Table Compte
| Champ | Type | Usage |
|-------|------|-------|
| Chift_folder_ID | text | ID du dossier Chift |
| journal_id | text | ID du journal lie |

### Table transaction
| Champ | Type | Usage |
|-------|------|-------|
| sent_to_chift | boolean | Transaction envoyee a Chift ? |
| journal_id | text | ID du journal |

---

## 5. Flux de donnees actuels (via Chift)

### Flux 1: Synchronisation des factures
```
1. Bubble declenche sync_factures_1_customer_invoices
2. Appel GET /consumers/{id}/accounting/invoices/type/customer_invoice
3. Pour chaque facture: MAJ ou creation dans Bubble
4. Repeat pour customer_refunds, supplier_invoices, supplier_refunds
5. Finalisation avec sync_factures_5_final
```

### Flux 2: Creation d'une facture
```
1. Utilisateur cree facture dans Bubble
2. Workflow backend create_facture_fournisseur ou create_facture_client
3. Appel POST /consumers/{id}/accounting/invoices
4. Stockage chift_id dans Bubble
```

### Flux 3: Creation/MAJ client
```
1. Utilisateur cree/modifie client
2. Workflow chift_get_create_client_personne_morale ou _physique
3. Appel POST ou PATCH /consumers/{id}/accounting/clients
4. Stockage chift_id dans Bubble
```

### Flux 4: Transactions bancaires
```
1. Transaction recue (Swan webhook)
2. Workflow create_chift_transactions
3. Appel POST /consumers/{id}/accounting/bank-transactions
4. MAJ sent_to_chift = true
```

---

## 6. Points d'attention pour la migration

### Identifiants a migrer
- `Chift_consumer_ID` -> `Inqom_company_ID`
- `Chift_folder_ID` -> `Inqom_folder_ID`
- `chift_id` (facture/client/fournisseur) -> IDs Inqom correspondants

### Differences conceptuelles
1. **Clients/Fournisseurs**: Chift = entites separees, Inqom = comptes auxiliaires (411*/401*)
2. **Factures**: Chift = objet facture, Inqom = ecriture comptable + document
3. **TVA**: Chift = codes TVA, Inqom = comptes TVA standards (445*)

### Webhooks
- Chift utilise des webhooks pour notifier les changements
- Inqom n'a pas de webhooks natifs -> polling avec `entry-lines/changes`
