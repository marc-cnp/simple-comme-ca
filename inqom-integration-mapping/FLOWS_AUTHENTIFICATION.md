# Flows d'authentification et de connexion - Inqom

## Document technique pour Simple Comme Ca

**Version:** 1.0
**Date:** Décembre 2024

---

## Table des matières

1. [Architecture d'authentification](#architecture-dauthentification)
2. [Flow de première connexion](#flow-de-première-connexion)
3. [Flow de refresh du token](#flow-de-refresh-du-token)
4. [Gestion des rôles et permissions](#gestion-des-rôles-et-permissions)
5. [Diagrammes de séquence](#diagrammes-de-séquence)

---

## Architecture d'authentification

### Protocole utilisé
Inqom utilise **OAuth2** avec le grant type **Resource Owner Password Credentials** (ROPC).

### Composants
```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Bubble.io  │────▶│   Auth Server    │────▶│   API Inqom     │
│   (Client)  │     │    (Identity)    │     │   (Resources)   │
└─────────────┘     └──────────────────┘     └─────────────────┘
```

### Endpoints d'authentification

| Environnement | URL |
|---------------|-----|
| Production | `https://auth.inqom.com/identity/connect/token` |
| Recette | `https://auth-staging.inqom.com/identity/connect/token` |

---

## Flow de première connexion

### Étape 1: Obtention du token

**Requête:**
```http
POST https://auth.inqom.com/identity/connect/token
Content-Type: application/x-www-form-urlencoded

username=utilisateur@email.com
&password=motdepasse123
&grant_type=password
&scope=openid apidata
&client_id=simplecommecav2
&client_secret=DBjTzLWLFE94jSt6Cix9
```

**Paramètres obligatoires:**

| Paramètre | Valeur | Description |
|-----------|--------|-------------|
| `username` | Email | Adresse mail du compte d'accès |
| `password` | Mot de passe | Mot de passe du compte |
| `grant_type` | `password` | Littéral (obligatoire) |
| `scope` | `openid apidata` | Littéral (obligatoire) |
| `client_id` | `simplecommecav2` | ID client API fourni |
| `client_secret` | `DBjTzLWLFE94jSt6Cix9` | Secret client API fourni |

**Réponse succès (200):**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0...",
  "expires_in": 3600,
  "token_type": "Bearer",
  "scope": "openid apidata"
}
```

**Réponse erreur (400/401):**
```json
{
  "error": "invalid_grant",
  "error_description": "Invalid username or password"
}
```

### Étape 2: Stockage du token dans Bubble

**Champs recommandés dans la table User ou Session:**
| Champ | Type | Description |
|-------|------|-------------|
| `Inqom_access_token` | Text | Token JWT |
| `Inqom_token_expiry` | Date | Date/heure d'expiration |
| `Inqom_token_created` | Date | Date/heure de création |

**Calcul de l'expiration:**
```javascript
token_expiry = current_datetime + (expires_in * 1000) // en millisecondes
// ou
token_expiry = current_datetime + 3600 seconds
```

### Étape 3: Utilisation du token

**Header d'authentification:**
```http
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Exemple de requête authentifiée:**
```http
GET https://wa-fred-accounting-services-prod.azurewebsites.net/v1/dossiers/12345/journals
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

---

## Flow de refresh du token

### Important: Inqom n'utilise PAS de refresh_token

Contrairement à OAuth2 standard, Inqom utilise le grant type ROPC qui ne fournit pas de refresh_token.

### Stratégie de renouvellement

**Option 1: Renouvellement proactif (recommandé)**
```
SI token_expiry - current_time < 5 minutes ALORS
    Obtenir nouveau token
    Mettre à jour stockage
FIN SI
```

**Option 2: Renouvellement réactif**
```
SI requête retourne 401/403 ALORS
    Obtenir nouveau token
    Réessayer la requête
FIN SI
```

### Implémentation Bubble recommandée

**Workflow "Check Token Validity":**
```
1. Condition: Current date/time > User's Inqom_token_expiry - 5 min
2. Si OUI:
   - API Call: POST auth.inqom.com/identity/connect/token
   - Make changes to User:
     - Inqom_access_token = Result's access_token
     - Inqom_token_expiry = Current date/time + 1 hour
     - Inqom_token_created = Current date/time
3. Si NON:
   - Continuer avec le token existant
```

---

## Gestion des rôles et permissions

### Terminologie Inqom

| Terme | Description |
|-------|-------------|
| **Company** | Cabinet comptable ou PME (conteneur de dossiers) |
| **AccountingFolder** | Dossier comptable d'une entreprise |
| **User** | Compte utilisateur dans Inqom |

### Rôles dans une Company

| Code | Rôle | Description |
|------|------|-------------|
| `CA` | Expert-comptable | Accès complet |
| `A` | Chef de mission comptable | Accès comptabilité |
| `S` | Chef de mission sociale | Accès paie/social |

### Rôles clients dans un AccountingFolder

| Code | Rôle | Description |
|------|------|-------------|
| `CEO` | Dirigeant | Accès complet au dossier |
| `DAF` | Directeur financier | Accès comptable complet |
| `DAF_READONLY` | DAF lecture seule | Consultation uniquement |
| `E` | Employé | Accès limité |

### Qui peut initier la connexion?

**Depuis Simple Comme Ca (Bubble):**

| Rôle SCC | Peut connecter? | Permissions Inqom requises |
|----------|-----------------|---------------------------|
| Admin SCC | Oui | Compte System avec accès Company |
| Gérant société | Oui | CEO ou DAF sur AccountingFolder |
| Collaborateur | Non | - |

### Vérification des permissions

**Endpoint pour lister les accès d'un utilisateur:**
```http
GET /provisioning/users/internal-access
```

**Réponse:**
```json
[
  {
    "Id": 28118,
    "Name": "Mon Cabinet",
    "ExternalId": "CAB-001",
    "AccessType": "Company"
  },
  {
    "Id": 12345,
    "Name": "Entreprise ABC",
    "ExternalId": "ENT-001",
    "AccessType": "AccountingFolder",
    "Status": "Active",
    "CompanyName": "Mon Cabinet"
  }
]
```

---

## Diagrammes de séquence

### Flow 1: Première connexion d'une société

```
┌────────┐          ┌────────┐          ┌────────┐          ┌────────┐
│ User   │          │ Bubble │          │  Auth  │          │ Inqom  │
│ (SCC)  │          │        │          │ Server │          │  API   │
└───┬────┘          └───┬────┘          └───┬────┘          └───┬────┘
    │                   │                   │                   │
    │ Clic "Connecter   │                   │                   │
    │ comptabilité"     │                   │                   │
    │──────────────────▶│                   │                   │
    │                   │                   │                   │
    │                   │ POST /token       │                   │
    │                   │ (credentials)     │                   │
    │                   │──────────────────▶│                   │
    │                   │                   │                   │
    │                   │ access_token      │                   │
    │                   │◀──────────────────│                   │
    │                   │                   │                   │
    │                   │ GET /companies/{id}/accounting-folders│
    │                   │───────────────────────────────────────▶│
    │                   │                   │                   │
    │                   │ Liste des dossiers comptables          │
    │                   │◀───────────────────────────────────────│
    │                   │                   │                   │
    │ Sélection dossier │                   │                   │
    │──────────────────▶│                   │                   │
    │                   │                   │                   │
    │                   │ Stocke Inqom_folder_ID dans Society    │
    │                   │──────────────────────────────────────▶ │
    │                   │                   │                   │
    │ "Connexion réussie"│                   │                   │
    │◀──────────────────│                   │                   │
    │                   │                   │                   │
```

### Flow 2: Upload d'une facture

```
┌────────┐          ┌────────┐          ┌────────┐          ┌────────┐
│ User   │          │ Bubble │          │  Auth  │          │ Inqom  │
│ (SCC)  │          │        │          │ Server │          │  API   │
└───┬────┘          └───┬────┘          └───┬────┘          └───┬────┘
    │                   │                   │                   │
    │ Upload facture    │                   │                   │
    │ (fichier PDF)     │                   │                   │
    │──────────────────▶│                   │                   │
    │                   │                   │                   │
    │                   │ Vérif token valide│                   │
    │                   │ (interne)         │                   │
    │                   │                   │                   │
    │                   │ [Si expiré]       │                   │
    │                   │ POST /token       │                   │
    │                   │──────────────────▶│                   │
    │                   │ access_token      │                   │
    │                   │◀──────────────────│                   │
    │                   │                   │                   │
    │                   │ POST /Documents/  │                   │
    │                   │ (multipart/form)  │                   │
    │                   │───────────────────────────────────────▶│
    │                   │                   │                   │
    │                   │ Document créé     │                   │
    │                   │ (Id, Status)      │                   │
    │                   │◀───────────────────────────────────────│
    │                   │                   │                   │
    │                   │ Stocke Inqom_document_ID dans Facture  │
    │                   │                   │                   │
    │ "Facture envoyée" │                   │                   │
    │◀──────────────────│                   │                   │
    │                   │                   │                   │
```

### Flow 3: Synchronisation des écritures

```
┌────────┐          ┌────────┐          ┌────────┐
│ Bubble │          │ Inqom  │          │ Bubble │
│ (Cron) │          │  API   │          │  (DB)  │
└───┬────┘          └───┬────┘          └───┬────┘
    │                   │                   │
    │ Toutes les X min  │                   │
    │                   │                   │
    │ GET /entry-lines/ │                   │
    │ changes?changedAfter={last_sync}      │
    │──────────────────▶│                   │
    │                   │                   │
    │ Lignes modifiées  │                   │
    │◀──────────────────│                   │
    │                   │                   │
    │ Pour chaque ligne:│                   │
    │                   │ MAJ Facture       │
    │                   │ (status, lettrage)│
    │───────────────────────────────────────▶│
    │                   │                   │
    │ MAJ last_sync_date│                   │
    │───────────────────────────────────────▶│
    │                   │                   │
```

---

## Gestion des erreurs d'authentification

### Erreurs courantes

| Code HTTP | Erreur | Cause | Action |
|-----------|--------|-------|--------|
| 400 | `invalid_grant` | Credentials incorrects | Vérifier username/password |
| 400 | `invalid_client` | Client ID/Secret incorrect | Vérifier config |
| 401 | `Unauthorized` | Token expiré | Renouveler le token |
| 403 | `Forbidden` | Pas d'accès à la ressource | Vérifier permissions |

### Implémentation de la gestion d'erreur

**Pseudo-code Bubble:**
```
API Call vers Inqom:
  Si Status = 401 ou 403:
    - Renouveler le token
    - Réessayer l'appel (max 1 fois)
    - Si échec: Afficher "Reconnexion nécessaire"

  Si Status = 400:
    - Logger l'erreur
    - Afficher message approprié à l'utilisateur

  Si Status = 500:
    - Logger l'erreur
    - Afficher "Service temporairement indisponible"
```

---

## Sécurité

### Bonnes pratiques

1. **Ne jamais exposer le client_secret côté client**
   - Tous les appels auth doivent passer par le backend Bubble

2. **Stocker le token de manière sécurisée**
   - Utiliser les champs privés Bubble
   - Ne pas logger les tokens

3. **Utiliser HTTPS uniquement**
   - Toutes les APIs Inqom exigent TLS

4. **Valider les permissions avant chaque action**
   - Vérifier que l'utilisateur a bien accès au dossier

### Configuration Bubble recommandée

**Privacy Rules pour les champs Inqom:**
```
Champ Inqom_access_token:
  - Visible: Only current user
  - Searchable: No
  - Modifiable: Only by workflows

Champ Inqom_folder_ID:
  - Visible: Users with role >= Manager
  - Searchable: No
```

---

## Checklist d'implémentation

### Backend Bubble
- [ ] Créer le workflow d'authentification
- [ ] Créer le workflow de refresh token
- [ ] Créer les champs de stockage token
- [ ] Configurer les privacy rules
- [ ] Créer les API Connectors vers Inqom

### UI Bubble
- [ ] Bouton "Connecter la comptabilité"
- [ ] Modal de sélection du dossier comptable
- [ ] Indicateur d'état de connexion
- [ ] Message d'erreur en cas d'échec

### Tests
- [ ] Test connexion réussie
- [ ] Test credentials incorrects
- [ ] Test expiration du token
- [ ] Test permissions insuffisantes
