# Structure Base de Donnees Bubble - Simple Comme Ca

**Genere le:** 2025-12-03
**Source:** simple-comme-ca (1).bubble

---

## Legende des Types

| Type | Description |
|------|-------------|
| text | Chaine de caracteres |
| number | Nombre (entier ou decimal) |
| boolean | Vrai/Faux |
| date | Date et heure |
| file | Fichier uploade |
| image | Image uploadee |
| [REF] xxx | Reference vers la table xxx |
| option.xxx | Option Set (enumeration) |
| list.xxx | Liste de xxx |
| user | Reference vers User (type special Bubble) |

---

## Tables Principales (Integration Inqom)

### User (id: `user`)

| Champ | Type | Liste? |
|-------|------|--------|
| 2FA Required? | boolean |  |
| Account status | option.____account_status |  |
| Agencies | [REF] agency | Oui |
| birth_date | date |  |
| Chift_access_token | text |  |
| Chift_token_expiration_date | date |  |
| Cover photo | image |  |
| Date agreed to terms and privacy docs | date |  |
| Date deleted | date |  |
| Date email verified | date |  |
| Date last verified | date |  |
| Date phone verified | date |  |
| Date signup completed | date |  |
| Favourite_societies | [REF] society | Oui |
| First | text |  |
| First Last | text |  |
| Global_Profiles | option.global_profiles | Oui |
| invoice_ht_ttc? | option.invoice_ht_ttc |  |
| Is developer? | boolean |  |
| Language default | option.language |  |
| Last | text |  |
| Last active | date |  |
| paiement_en_ligne | boolean |  |
| Phone | text |  |
| plafond_mensuel | number |  |
| Profile picture | image |  |
| retraits_distributeur | boolean |  |
| Role | option.role |  |
| Selected_society | [REF] society |  |
| Signup method | text |  |
| Signup step | number |  |
| Societies | [REF] society | Oui |
| transaction_hors_euro | boolean |  |
| transaction_internationales | boolean |  |
| Verified phone formatted | text |  |
| Verified phone number | text |  |

### Society (id: `society`)

| Champ | Type | Liste? |
|-------|------|--------|
| Agency | [REF] agency |  |
| Alert_email | boolean |  |
| Alert_threshold | number |  |
| Alert_Viz | boolean |  |
| Archive? | boolean |  |
| card_count | number |  |
| Chift_connection_state | option.chift_connexion_state |  |
| Chift_consumer_ID | text |  |
| Chift_folder_ID | text |  |
| ComptePro_Created | boolean |  |
| Current_connection_ID | text |  |
| Dirigeant | user |  |
| factures_updated | boolean |  |
| fournisseur_updated | boolean |  |
| fournisseurs | [REF] fournisseur | Oui |
| ged_last_updated | date |  |
| invoice_bank_selected | [REF] compte___facturation |  |
| invoice_contact_address | text |  |
| invoice_contact_code_postale | text |  |
| invoice_contact_email | text |  |
| invoice_contact_email_visible? | boolean |  |
| invoice_contact_phone | text |  |
| invoice_contact_phone_visible? | boolean |  |
| invoice_contact_ville | text |  |
| invoice_contact_website | text |  |
| invoice_contact_website_visible? | boolean |  |
| Invoice_default_payment_method | option.moyen_paiement |  |
| invoice_general_additional_info | text |  |
| invoice_general_article_code | boolean |  |
| invoice_general_color_hex | text |  |
| invoice_general_color_hsl | text |  |
| invoice_general_color_hsv | text |  |
| invoice_general_color_optmimized | text |  |
| invoice_general_color_rgb | text |  |
| invoice_general_dnomination | text |  |
| invoice_general_footer_text | text |  |
| invoice_general_logo | image |  |
| Invoice_payment_due_period | option.invoice_payment_due_period |  |
| last_alert_update | date |  |
| last_bank_update | date |  |
| last_update_journaux | date |  |
| Lien_tableau_de_bord | text |  |
| Lien_ventes | text |  |
| Logiciel compta | text |  |
| Logo | image |  |
| mails_autres | text | Oui |
| mails_factures_achat | text | Oui |
| mails_factures_vente | text | Oui |
| mails_notes_frais | text | Oui |
| Name | text |  |
| Nb_Exercices | number |  |
| Nb_users | number |  |
| start_number_invoice | number |  |
| start_number_refund | number |  |
| swan_account_id | text |  |
| swan_AH_id | text |  |
| swan_AH_verification_status | option.___os__swan__verificationstatus |  |
| Swan_date_verified_AH | date |  |
| swan_onboarding_id | text |  |
| swan_onboarding_state | option.___os__swan__onboarding |  |
| swan_onboarding_status | option.___os__swan__onboardingstatus |  |
| swan_onboarding_step | number |  |
| sync_ged_en_cours | boolean |  |
| Sync_Paiement_Encaissement_last_update | date |  |
| Sync_Paiement_Encaissement_updated | boolean |  |
| update_bank | boolean |  |
| update_bank_for_synch | boolean |  |
| update_fournisseurs_invoices_from_tab | boolean |  |
| update_ged_from_tab | boolean |  |
| update_journaux | boolean |  |
| updated_ged | boolean |  |

### Facture (id: `facture`)

| Champ | Type | Liste? |
|-------|------|--------|
| [??] chift_partner_id | text |  |
| [not_used] scheduled_id | text |  |
| [not_used] SIREN/SIRET | text |  |
| additional_information | text |  |
| address | [REF] adresse_fournisseur |  |
| Chift_folder_ID | text |  |
| chift_id | text |  |
| chift_journal_id | text |  |
| chift_status | option.statut_chift |  |
| client | [REF] client |  |
| currency | [REF] currency |  |
| date_paiement | date |  |
| description | text |  |
| discount_type | option.discount_type |  |
| due_date | date |  |
| en_traitement? | boolean |  |
| Facture - Compte | [REF] compte___facturation |  |
| Facture initiale | [REF] facture |  |
| file | file |  |
| file_base_64 | text |  |
| fournisseur | [REF] fournisseur |  |
| invoice_date | date |  |
| invoice_number | text |  |
| invoice_number_bubble | number |  |
| invoice_source | option.invoice_source |  |
| invoice_type | option.invoice_type |  |
| libell virement | text |  |
| lien pdf | text |  |
| partner_type | option.stakeholder |  |
| payment_method | option.moyen_de_paiement |  |
| ready to pay | boolean |  |
| reverse | boolean |  |
| scc_status | option.statut_scc |  |
| scheduled_date | date |  |
| sent_client_date | date |  |
| society | [REF] society |  |
| soft_delete | boolean |  |
| swan_consent_id | text |  |
| swan_payment_id | text |  |
| swan_transaction_id | text |  |
| tax_amount | number |  |
| total | number |  |
| untaxed_amount | number |  |
| validated_date | date |  |

### Fournisseur (id: `fournisseur`)

| Champ | Type | Liste? |
|-------|------|--------|
| account_number | text |  |
| adresse | [REF] adresse_fournisseur | Oui |
| bank_account | text |  |
| bic | text |  |
| Chift_folder_ID | text |  |
| chift_id | text |  |
| currency | [REF] currency |  |
| delai_paiement | option.delai_paiement |  |
| email | text |  |
| iban | text |  |
| mobile | text |  |
| moyen_paiement | option.moyen_de_paiement |  |
| name | text |  |
| phone | text |  |
| siret | text |  |
| society | [REF] society |  |
| vat | text |  |
| website | text |  |

### Client (id: `client`)

| Champ | Type | Liste? |
|-------|------|--------|
| account_number | text |  |
| adresse | [REF] adresse_fournisseur | Oui |
| bank_account | text |  |
| bic | text |  |
| Chift_folder_ID | text |  |
| chift_id | text |  |
| company? | boolean |  |
| currency | [REF] currency |  |
| delai_paiement | option.delai_paiement |  |
| email | text |  |
| iban | text |  |
| mobile | text |  |
| name | text |  |
| not_company_first_name | text |  |
| not_company_function | text |  |
| not_company_last_name | text |  |
| phone | text |  |
| Siret | text |  |
| society | [REF] society |  |
| vat | text |  |
| website | text |  |

### Compte (id: `compte`)

| Champ | Type | Liste? |
|-------|------|--------|
| Bank | text |  |
| Bic | text |  |
| Chift_folder_ID | text |  |
| Dernieres_entrees | number |  |
| Dernieres_sorties | number |  |
| Iban | text |  |
| id | text |  |
| journal_id | text |  |
| Nom | text |  |
| pro? | boolean |  |
| RIB | text |  |
| society | [REF] society |  |
| Solde | number |  |

### Journal (id: `journal`)

| Champ | Type | Liste? |
|-------|------|--------|
| Abreviation | text |  |
| Chift_folder_ID | text |  |
| Folders | [REF] folder | Oui |
| id_chift | text |  |
| Nom | text |  |
| Society | [REF] society |  |
| Swan_card | [REF] carte |  |
| Type | text |  |

### Exercice (id: `exercice`)

| Champ | Type | Liste? |
|-------|------|--------|
| End_date | date |  |
| Name | text |  |
| Society | [REF] society |  |
| Start_date | date |  |

### Facture - Ligne (id: `facture___ligne`)

| Champ | Type | Liste? |
|-------|------|--------|
| Chift_folder_ID | text |  |
| description | text |  |
| discount_number | number |  |
| discounted_unit_price | number |  |
| facture | [REF] facture |  |
| index | number |  |
| product | [REF] article |  |
| quantity | number |  |
| society | [REF] society |  |
| tax_amount | number |  |
| total | number |  |
| unit | option.unit |  |
| unit_price | number |  |
| untaxed_amount | number |  |
| vat_rate | [REF] vat_linked_chart_of_account_number |  |

### Facture - Compte (id: `compte___facturation`)

| Champ | Type | Liste? |
|-------|------|--------|
| Bank_name | text |  |
| Bic | text |  |
| Chift_folder_ID | text |  |
| Iban | text |  |
| name | text |  |
| society | [REF] society |  |

### Bank statement (id: `bank_statement`)

| Champ | Type | Liste? |
|-------|------|--------|
| Compte | [REF] compte |  |
| File | [REF] file |  |
| Link | text |  |
| Priode dbut | date |  |
| Priode Fin | date |  |
| Society | [REF] society |  |
| Solde dbut | number |  |
| Solde Fin | number |  |

### transaction (id: `transaction`)

| Champ | Type | Liste? |
|-------|------|--------|
| card_id | text |  |
| Compte | [REF] compte |  |
| date | date |  |
| description | text |  |
| id | text |  |
| journal_id | text |  |
| methode | text |  |
| numCompte | text |  |
| sent_to_chift | boolean |  |
| solde | number |  |
| valeur | number |  |

### Adresse (id: `adresse_fournisseur`)

| Champ | Type | Liste? |
|-------|------|--------|
| address_type | option.address_type |  |
| city | text |  |
| client | [REF] client |  |
| country | [REF] country |  |
| email | text |  |
| fournisseur | [REF] fournisseur |  |
| mobile | text |  |
| name | text |  |
| partner_type | option.stakeholder |  |
| phone | text |  |
| postal_code | text |  |
| street_name | text |  |
| street_number | text |  |

### Product (id: `article`)

| Champ | Type | Liste? |
|-------|------|--------|
| chift_chart_account_number | api.apiconnector2.cmkQY0.cmyOv0.items |  |
| description | text |  |
| internal_code | text |  |
| name | text |  |
| price_untaxed | number |  |
| Product_group | [REF] product_group |  |
| society | [REF] society |  |
| unit | option.unit |  |
| vat_rate | [REF] vat_linked_chart_of_account_number |  |

### Currency (id: `currency`)

| Champ | Type | Liste? |
|-------|------|--------|
| code | text |  |
| name | text |  |
| number | text |  |

### Folder (id: `folder`)

| Champ | Type | Liste? |
|-------|------|--------|
| Active_creation? | boolean |  |
| add_months_folders? | boolean |  |
| add_months_folders_dynamic? | boolean |  |
| admin | boolean |  |
| Agence | [REF] agency |  |
| All_parent_folders | [REF] folder | Oui |
| Allowed_society_profiles | option.society_profiles | Oui |
| Allowed_users | user | Oui |
| Base_Name | text |  |
| Bin? | boolean |  |
| Chift_folder_ID | text |  |
| Compte | [REF] compte |  |
| Compte_yesNo | boolean |  |
| date | date |  |
| decomp_mens? | boolean |  |
| Default? | boolean |  |
| Editable? | boolean |  |
| essential? | boolean |  |
| Exercice | [REF] exercice |  |
| exercice_list? | boolean |  |
| First_exercice_file | boolean |  |
| index | number |  |
| invisible_for_agency | boolean |  |
| Invisible_if_empty? | boolean |  |
| Level | number |  |
| Name | text |  |
| Parent_folder | [REF] folder |  |
| Private? | boolean |  |
| reference | [REF] folder |  |
| Society | [REF] society |  |

### Agency (id: `agency`)

| Champ | Type | Liste? |
|-------|------|--------|
| Archived_societies | [REF] society | Oui |
| color | text |  |
| folders | [REF] folder | Oui |
| logo | image |  |
| name | text |  |
| Nb_users | number |  |
| Societies | [REF] society | Oui |
| updated_logo? | boolean |  |

### VAT Linked Chart of Account Number (id: `vat_linked_chart_of_account_number`)

| Champ | Type | Liste? |
|-------|------|--------|
| [old] admin? | boolean |  |
| society | [REF] society |  |
| VAT Code Chift | api.apiconnector2.cmkQY0.cndAP0.items |  |
| vat_rate | option.vat_rate |  |
