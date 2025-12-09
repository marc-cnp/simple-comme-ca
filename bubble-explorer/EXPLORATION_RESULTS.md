# Exploration de l'application Simple Comme Ca

**Date:** 5 Décembre 2025
**URL:** https://simple-comme-ca.bubbleapps.io/version-test/

---

## Structure de l'application

### 1. Pages principales

| Page | URL | Description |
|------|-----|-------------|
| Login | `/version-test/` | Page de connexion avec MFA |
| Admin | `/version-test/admin` | Portail administrateur |
| Agence (liste) | `/version-test/agence` | Liste des agences |
| Agence (détail) | `/version-test/agence?agence={id}` | Détail d'une agence avec ses sociétés |
| Société | `/version-test/societe?tab={tab}` | Dashboard société avec onglets |

---

## 2. Page Login

**Screenshot:** `page-login.png`

### Éléments
- Champ Email
- Champ Mot de passe
- Checkbox "Se rappeler de moi"
- Lien "Mot de passe oublié ?"
- Bouton "Connexion"
- Lien "Pas encore de compte? S'inscrire"

### Flux MFA
1. Saisie email + mot de passe
2. Envoi code MFA par email
3. Saisie code 6 chiffres
4. Validation "Authentification réussie"
5. Redirection vers Admin ou Société

---

## 3. Page Agences (Liste)

**Screenshot:** `page-agence-liste.png`

### Structure
- Titre "Agences"
- Barre de recherche "Rechercher par nom"
- Bouton "Ajouter"

### Tableau
| Colonne | Description |
|---------|-------------|
| Nom | Nom de l'agence avec icône |
| Utilisateurs | Avatars colorés des utilisateurs |
| Sociétés | Logos/avatars des sociétés |
| Action | Flèche `>` pour accéder au détail |

### Agences listées
- Agence - A (achraf)
- Agence - B (Achraf)
- Agence - C - (Damien)
- Agence de Marc
- Agence - D (Victor)
- Agence - E (Sylvie)
- Agence - F - VALLIANCE
- Agence - Nonreg 18/07/2025
- Agence - QL
- Agence Sylvie
- Agence - TESTS/NONREG

---

## 4. Page Agence (Détail)

**Screenshot:** `page-agence-detail.png`

### Navigation
- Bouton retour `<`
- Nom de l'agence
- **Onglets:** Société | Équipe | Arborescence | Paramètres

### Onglet Société (par défaut)
- Compteur "X Sociétés"
- Bouton "Filtrer"
- Bouton "Ajouter une société"

### Tableau des sociétés
| Colonne | Description |
|---------|-------------|
| Nom | Nom de la société avec avatar |
| Utilisateurs | Nombre d'utilisateurs |
| Exercices | Nombre d'exercices |
| Favoris | Étoile pour marquer en favori |

---

## 5. Page Société (Dashboard)

**URL Pattern:** `/version-test/societe?tab={tab}`

### Menu latéral gauche
| Item | Tab URL |
|------|---------|
| Tableau de bord | `Tableau%20de%20bord` |
| Importer | `Importer` |
| Documents | `Documents` |
| Paiements | `Paiements` |
| Encaissements | `Encaissements` |
| Ventes | `Ventes` |
| Caisse | `Caisse` |
| Trésorerie | `comptes` (subtab: `vue_ensemble`, `comptes_bancaires`) |
| Paramètres | `Paramètres` |

### Pied de menu
- Avatar utilisateur + nom
- Logo "Simple x+="

---

## 6. Société > Tableau de bord

**Screenshot:** `page-societe-tableau-de-bord.png`

### Éléments
- Message "Bonjour {Prénom}"
- Toggle TTC/HT

### Widgets KPI
| Widget | Couleur | Description |
|--------|---------|-------------|
| Factures à payer | Rouge | Montant TTC |
| Factures à venir | Jaune | Montant TTC |
| Factures de ventes en retard | Rouge | Montant TTC |
| Factures de ventes à encaisser | Jaune | Montant TTC |

### Graphique Trésorerie
- Dropdown "Compte pro" / "Comptes en euros"
- Graphique linéaire par mois (Jan-Dec)

### Tableaux récapitulatifs
- **Principaux fournisseurs à payer** (Top 4)
- **Principaux clients à encaisser** (Top 4)

### CTA
- Encart "Tableau de bord personnalisé" avec bouton "S'inscrire"

---

## 7. Société > Importer

**Screenshot:** `page-societe-importer.png`

### Zone d'import documents
| Type | Action |
|------|--------|
| Factures de vente | Glisser-déposer ou ajouter fichier |
| Factures d'achat | Glisser-déposer ou ajouter fichier |
| Notes de frais | Glisser-déposer ou ajouter fichier |
| Autre | Glisser-déposer ou ajouter fichier |

### Zone relevé bancaire
- "Déposer un relevé"
- Dropdown "Comptes en euros"

### Historique
- "Historique des derniers envois par: Date/Client/Catégories"

---

## 8. Société > Documents (GED)

**Screenshot:** `page-societe-documents.png`

### Actions
- Bouton "Rechercher"
- Bouton "Nouveau dossier"

### Arborescence
| Dossier | Fichiers |
|---------|----------|
| COMPTABILITE | 0 |
| SOCIAL | 0 |
| FISCAL | 0 |
| JURIDIQUE | 0 |
| REVISION | 0 |
| CORBEILLE | 0 |

---

## 9. Société > Paiements

**Screenshot:** `page-societe-paiements.png`

### En-tête
- Factures à payer: X€ TTC
- Factures à venir: X€ TTC

### Filtres
- "Paiements par: Échéance / Fournisseur"
- Bouton "Filtrer"
- Recherche "Rechercher..."
- Bouton "Synchroniser"

### Tableau échéancier
| Colonne | Description |
|---------|-------------|
| Fournisseur | Nom du fournisseur |
| Nombre | Nombre de factures |
| Total | Montant total |
| > 90 jours | Montant en retard critique |
| 90 à 61 jours | Montant en retard |
| 60 à 31 jours | Montant en retard |
| 30 à 1 jour | Montant proche échéance |
| 0 à 30 jours | Montant à venir |
| 31 à 60 jours | Montant futur |
| > 60 jours | Montant futur lointain |

---

## 10. Société > Encaissements

**Screenshot:** `page-societe-encaissements.png`

### Structure identique à Paiements
- En retard: X€ TTC
- À encaisser: X€ TTC
- Tableau par Client avec colonnes échéancier

---

## 11. Société > Trésorerie

**URL:** `/version-test/societe?tab=comptes&subtab=vue_ensemble`
**Screenshot:** `page-societe-tresorerie.png`

### En-tête
- Titre "Trésorerie - Vue d'ensemble de vos comptes bancaires"
- Dernière synchronisation: date et heure
- Bouton "Synchroniser"

### Solde global consolidé
| Élément | Description |
|---------|-------------|
| Total | Somme de tous les comptes |
| Variation | Évolution du solde (vert/rouge) |
| Graphique | Courbe annuelle (Jan-Dec) |

### Mon compte Pro
| Élément | Description |
|---------|-------------|
| IBAN | FR76... |
| Solde | Montant actuel |
| Variation | Évolution (ex: -10 800,00 €) |
| Graphique | Courbe annuelle |

### Mes autres comptes bancaires
- Comptes en euros
- Comptes en devises

### Sous-menu Trésorerie
| Sous-onglet | URL subtab |
|-------------|------------|
| Vue d'ensemble | `vue_ensemble` |
| Comptes bancaires | `comptes_bancaires` |

---

## 11b. Société > Trésorerie > Comptes bancaires

**URL:** `/version-test/societe?tab=comptes&subtab=comptes_bancaires&pro=`
**Screenshot:** `page-societe-tresorerie-comptes-bancaires.png`

### En-tête
- Titre "Comptes bancaires - Détail des mouvements du compte sélectionné"
- Dropdown sélecteur de compte (ex: "Comptes en euros")

### KPIs
| Widget | Description |
|--------|-------------|
| Solde actuel | Montant + variation mensuelle |
| Entrées (30j) | Total des entrées sur 30 jours |
| Sorties (30j) | Total des sorties sur 30 jours |

### Tableau Mouvements du compte
| Colonne | Description |
|---------|-------------|
| Date | Date du mouvement |
| Libellé | Description |
| Journal | Code journal comptable |
| Débit | Montant débit |
| Crédit | Montant crédit |
| Solde | Solde après mouvement |

### Pagination
- Options : 10, 20, 30, 50, 100 résultats par page
- Navigation : Préc. / Suiv.

---

## 12. Société > Ventes

**Screenshot:** `page-societe-ventes.png`

### Onglets
- Facturations
- Clients

### Actions
- Bouton "Paramètres"
- Bouton "Filtrer"
- Bouton "Créer"

### Contenu
- Compteur "X Facture"
- Liste des factures (vide si aucune)

---

## 12. Société > Paramètres

**Screenshot:** `page-societe-parametres-logiciel-comptable.png`

### Onglets principaux
| Onglet | Description |
|--------|-------------|
| Logiciel comptable | Connexion Inqom/ACD |
| Exercices | Gestion des exercices comptables |
| Général | Paramètres généraux |
| Utilisateurs | Gestion des utilisateurs |

### Onglet Logiciel comptable

#### État connexion
| Champ | Valeur exemple |
|-------|----------------|
| État de la connexion | Active |
| Logiciel comptable | Inqom |
| Dossier | TEST SCC |

#### Actions
- Bouton "Déconnecter"
- Bouton "Modifier"

#### Sous-onglets
| Sous-onglet | Description |
|-------------|-------------|
| Emails d'envoi | Configuration des emails Inqombox |
| Journaux | Mapping des journaux comptables |
| Codes TVA | Mapping des codes TVA |
| Synchroniser | Synchronisation manuelle |

---

## 13. Paramètres > Emails d'envoi

**Screenshot:** `page-societe-parametres-logiciel-comptable.png`

| Type | Email |
|------|-------|
| Factures d'achat | achat.{dossier}@inqombox.com |
| Factures de vente | vente.{dossier}@inqombox.com |
| Notes de frais | ndf.{dossier}@inqombox.com |
| Autres | admin.{dossier}@inqombox.com |
| Email par défaut | new@simplecommeca.io |

---

## 14. Paramètres > Journaux

**Screenshot:** `page-societe-parametres-journaux.png`

### Mapping journaux
| Journal | Code | Catégorie associée |
|---------|------|-------------------|
| Cut-off | CO | Comptes en euros (banque) |
| Crédits-baux | CB | - |
| A Nouveaux | AN | Comptes en devises (banque) |
| Emprunts | EM | Comptes en euros (banque) |
| Banque | BQ | - |
| Opérations Diverses | OD | - |
| Dotation aux amortissements | IM | Comptes en devises (banque) |
| Vente | VT | Factures de ventes |
| Révision | REV | Comptes en euros (banque) |
| Stock | STO | - |
| Salaire | SA | Factures notes de frais et CB pro |
| Situations | SIT | Factures notes de frais et CB pro |
| Achat | HA | Factures d'achats |

---

## 15. Paramètres > Codes TVA

**Screenshot:** `page-societe-parametres-codes-tva.png`

### Taux disponibles
| Taux | Type |
|------|------|
| 20% | Standard |
| 10% | Réduit |
| 5.5% | Réduit |
| 2.1% | Super réduit |
| Intracom. | Intracommunautaire |
| 13% (Corse) | Corse |
| 0.9% (Corse) | Corse |
| 8.5% (DOM) | DOM |
| 1.75% (DOM) | DOM |
| 1.05% (DOM) | DOM |
| Export. | Exportation |
| Autre Exo. | Autres exonérations |
| Autoliquidation | Autoliquidation |

---

## Résumé des screenshots capturés

| Fichier | Page |
|---------|------|
| `page-agence-liste.png` | Liste des agences |
| `page-agence-detail.png` | Détail agence avec sociétés |
| `page-societe-importer.png` | Import documents |
| `page-societe-tableau-de-bord.png` | Dashboard société |
| `page-societe-paiements.png` | Échéancier fournisseurs |
| `page-societe-parametres-logiciel-comptable.png` | Paramètres connexion Inqom |
| `page-societe-parametres-journaux.png` | Mapping journaux |
| `page-societe-parametres-codes-tva.png` | Mapping codes TVA |
| `page-societe-ventes.png` | Module ventes |
| `page-societe-documents.png` | GED/Documents |
| `page-societe-encaissements.png` | Échéancier clients |
| `page-societe-tresorerie.png` | Trésorerie - Vue d'ensemble |
| `page-societe-tresorerie-comptes-bancaires.png` | Trésorerie - Comptes bancaires |

---

## Observations techniques

### Erreurs console détectées
- Plugin "Create ZIP from File URLs" non licencié
- Erreurs "Mixed Content" (HTTP/HTTPS)
- Erreurs "Circular reference" sur certains éléments
- Service Pappers en erreur 400

### Points d'attention UX
- Temps de chargement ~2 secondes par page
- MFA obligatoire pour connexion
- Page Trésorerie utilise `tab=comptes` (pas `tab=Trésorerie`)

---

## Chemin de navigation type

```
Login → MFA → Admin/Agence
                    ↓
              Agence (liste)
                    ↓
              Agence (détail)
                    ↓
                Société
                    ↓
    ┌───────────────┼───────────────┐
    ↓               ↓               ↓
Tableau de bord  Paiements    Paramètres
                    ↓               ↓
              Encaissements   Logiciel comptable
                    ↓               ↓
                 Ventes      Journaux/TVA
```
