"""
Test complet de tous les endpoints API ACD pour Simple Comme Ca
Avec creation de dummy data
"""

import requests
import json
from datetime import datetime

BASE_URL = 'https://isuiteexco.coaxis.com/CNX/api'
DOSSIER = 'ZZCCA'

def auth():
    r = requests.post(f'{BASE_URL}/v1/authentification',
                      json={'identifiant': 'EVODEV', 'motDePasse': 'Evodev123!'})
    return r.json().get('UUID')

def headers(uuid):
    return {'UUID': uuid, 'Content-Type': 'application/json'}

def test_get(hdrs, endpoint, desc):
    url = f'{BASE_URL}{endpoint}'
    r = requests.get(url, headers=hdrs)
    status = 'OK' if r.status_code == 200 else f'FAIL({r.status_code})'
    print(f'[{status}] GET {endpoint}')
    print(f'         {desc}')
    if r.status_code == 200:
        data = r.json()
        if isinstance(data, list):
            print(f'         -> {len(data)} elements')
            return data
        else:
            print(f'         -> dict with keys: {list(data.keys())[:5]}')
            return data
    else:
        print(f'         -> Error: {r.text[:150]}')
    return None

def test_post(hdrs, endpoint, body, desc):
    url = f'{BASE_URL}{endpoint}'
    r = requests.post(url, headers=hdrs, json=body)
    status = 'OK' if r.status_code in [200, 201] else f'FAIL({r.status_code})'
    print(f'[{status}] POST {endpoint}')
    print(f'         {desc}')
    if r.status_code in [200, 201]:
        data = r.json()
        if isinstance(data, list):
            print(f'         -> {len(data)} elements')
        elif isinstance(data, dict):
            code_retour = data.get('codeRetour')
            if code_retour is not None:
                if code_retour == 1:
                    print(f'         -> SUCCESS: {data.get("description")}')
                else:
                    print(f'         -> ERREUR: {data.get("listeErreurs")}')
            else:
                print(f'         -> {str(data)[:200]}')
        return data
    else:
        print(f'         -> Error: {r.text[:150]}')
    return None

def main():
    print('=' * 80)
    print('API ACD - Test Complet des Endpoints')
    print('=' * 80)
    print()

    # Auth
    uuid = auth()
    hdrs = headers(uuid)
    print(f'Authentification OK - UUID: {uuid}')
    print()

    # =========================================================================
    print('=' * 80)
    print('1. LECTURE DES DONNEES DE REFERENCE')
    print('=' * 80)
    print()

    # Journaux
    journaux = test_get(hdrs, f'/v1/compta/journal?CodeDossier={DOSSIER}', 'Liste des journaux comptables')
    if journaux:
        print('         Journaux: ' + ', '.join([j['Code'] for j in journaux[:10]]))
    print()

    # Clients
    clients = test_get(hdrs, f'/v1/compta/comptes/clients?CodeDossier={DOSSIER}', 'Liste des clients (comptes auxiliaires)')
    print()

    # Fournisseurs
    fournisseurs = test_get(hdrs, f'/v1/compta/comptes/fournisseurs?CodeDossier={DOSSIER}', 'Liste des fournisseurs (comptes auxiliaires)')
    print()

    # Comptes generaux
    comptes = test_get(hdrs, f'/v1/compta/comptes/generaux?CodeDossier={DOSSIER}', 'Liste des comptes generaux')
    print()

    # Exercices
    exercices = test_get(hdrs, f'/v1/exercices?CodeDossier={DOSSIER}', 'Exercices comptables')
    print()

    # Factures
    factures = test_post(hdrs, '/v1/factures', {}, 'Liste des factures')
    print()

    # Codes TVA
    tva = test_get(hdrs, f'/v1/compta/param%C3%A8tres/codesTVA?CodeDossier={DOSSIER}', 'Codes TVA')
    print()

    # =========================================================================
    print('=' * 80)
    print('2. CREATION FOURNISSEUR')
    print('=' * 80)
    print()

    timestamp = datetime.now().strftime('%H%M%S')
    new_fournisseur = {
        'CodeDossier': DOSSIER,
        'Code': f'FAPI{timestamp}',
        'Lib': f'Fournisseur Test API {timestamp}'
    }
    print(f'Body: {json.dumps(new_fournisseur, indent=2)}')
    result = test_post(hdrs, '/v1/compta/comptes/fournisseur', new_fournisseur, 'Creation fournisseur')
    print()

    # =========================================================================
    print('=' * 80)
    print('3. CREATION CLIENT')
    print('=' * 80)
    print()

    new_client = {
        'CodeDossier': DOSSIER,
        'Code': f'CAPI{timestamp}',
        'Lib': f'Client Test API {timestamp}'
    }
    print(f'Body: {json.dumps(new_client, indent=2)}')
    result = test_post(hdrs, '/v1/compta/comptes/client', new_client, 'Creation client')
    print()

    # =========================================================================
    print('=' * 80)
    print('4. CREATION ECRITURE COMPTABLE (Facture vente)')
    print('=' * 80)
    print()

    # Prendre un client existant
    client_code = 'C10000'  # Clients en compte

    ecriture = {
        'CodeDossier': DOSSIER,
        'Journal': 'VE',
        'Mois': 12,
        'Annee': 2024,
        'LignesEcriture': [
            {
                'Jour': 22,
                'NumeroPiece': f'FAC-{timestamp}',
                'NumeroFacture': f'FAC-{timestamp}',
                'Compte': client_code,
                'Libelle': 'Facture client test API',
                'Debit': 1200.00,
                'Credit': 0
            },
            {
                'Jour': 22,
                'NumeroPiece': f'FAC-{timestamp}',
                'NumeroFacture': f'FAC-{timestamp}',
                'Compte': '70102000',
                'Libelle': 'Prestation conseil',
                'Debit': 0,
                'Credit': 1000.00,
                'Analytiques': [{'Section1': '1', 'Credit': 1000.00, 'Debit': 0}]
            },
            {
                'Jour': 22,
                'NumeroPiece': f'FAC-{timestamp}',
                'NumeroFacture': f'FAC-{timestamp}',
                'Compte': '44570200',
                'Libelle': 'TVA 20%',
                'Debit': 0,
                'Credit': 200.00
            }
        ]
    }

    print(f'Body: {json.dumps(ecriture, indent=2)}')
    result = test_post(hdrs, '/v1/compta/ecriture', ecriture, 'Creation ecriture comptable')
    print()

    # =========================================================================
    print('=' * 80)
    print('5. UPLOAD DOCUMENT GED (Paniere)')
    print('=' * 80)
    print()

    # Upload simple dans la paniere
    upload_url = f'{BASE_URL}/v1/panieres/documents?CodeDossier={DOSSIER}'
    print(f'POST {upload_url}')
    print('         Upload document dans la paniere')

    # Creer un fichier texte simple pour test
    test_content = f'Test document API {timestamp}'.encode()
    files = {'file': (f'test_api_{timestamp}.txt', test_content, 'text/plain')}
    hdrs_upload = {'UUID': uuid}  # Sans Content-Type pour multipart

    r = requests.post(upload_url, headers=hdrs_upload, files=files)
    if r.status_code in [200, 201]:
        print(f'[OK]     Status: {r.status_code}')
        data = r.json()
        print(f'         Document ID: {data.get("Id")}')
        print(f'         Nom: {data.get("Nom")}')
    else:
        print(f'[FAIL]   Status: {r.status_code} - {r.text[:100]}')
    print()

    # =========================================================================
    print('=' * 80)
    print('6. VERIFICATION - Liste documents paniere')
    print('=' * 80)
    print()

    docs = test_get(hdrs, f'/v1/panieres/documents?CodeDossier={DOSSIER}', 'Documents en attente')
    if docs:
        print('         Derniers documents:')
        for d in docs[:3]:
            print(f'           - {d["Id"]}: {d["Nom"]} ({d["DateHeureDepot"]})')
    print()

    # =========================================================================
    print('=' * 80)
    print('RESUME DES ENDPOINTS ACD')
    print('=' * 80)
    print()
    print('LECTURE (GET):')
    print('  /v1/compta/journal?CodeDossier={code}              - Journaux')
    print('  /v1/compta/comptes/clients?CodeDossier={code}      - Clients')
    print('  /v1/compta/comptes/fournisseurs?CodeDossier={code} - Fournisseurs')
    print('  /v1/compta/comptes/generaux?CodeDossier={code}     - Plan comptable')
    print('  /v1/exercices?CodeDossier={code}                   - Exercices')
    print('  /v1/compta/parametres/codesTVA?CodeDossier={code}  - Codes TVA')
    print('  /v1/panieres/documents?CodeDossier={code}          - Documents paniere')
    print('  /v1/ged/arborescence?CodeDossier={code}            - Arborescence GED')
    print()
    print('CREATION (POST):')
    print('  /v1/compta/comptes/fournisseur                     - Creer fournisseur')
    print('  /v1/compta/comptes/client                          - Creer client')
    print('  /v1/compta/ecriture                                - Creer ecriture')
    print('  /v1/factures                                       - Lister factures')
    print('  /v1/panieres/documents?CodeDossier={code}          - Upload document')
    print()
    print('STATUT PAIEMENT:')
    print('  Dans /v1/factures -> champ "FactureReglee" (true/false)')
    print()

if __name__ == '__main__':
    main()
