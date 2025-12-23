"""
Test creation facture et avoir fournisseur avec les bons comptes
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

def main():
    uuid = auth()
    hdrs = {'UUID': uuid, 'Content-Type': 'application/json'}

    print('=' * 100)
    print('TEST FACTURE ET AVOIR FOURNISSEUR')
    print('=' * 100)
    print()

    timestamp = datetime.now().strftime('%H%M%S')

    # Comptes corrects trouves dans le plan comptable
    COMPTE_ACHAT = '60102000'  # Achats mp 20%
    COMPTE_TVA_DED = '44566000'  # Tva / achats
    FOURNISSEUR = 'F00000'

    # 1. Facture fournisseur
    print('1. CREATION FACTURE FOURNISSEUR')
    print('-' * 80)

    facture_fournisseur = {
        'CodeDossier': DOSSIER,
        'Journal': 'AC',
        'Mois': 12,
        'Annee': 2024,
        'LignesEcriture': [
            {
                'Jour': 22,
                'NumeroPiece': f'FF-{timestamp}',
                'NumeroFacture': f'FF-{timestamp}',
                'Compte': FOURNISSEUR,
                'Libelle': 'Facture fournisseur test API',
                'Debit': 0,
                'Credit': 1200.00
            },
            {
                'Jour': 22,
                'NumeroPiece': f'FF-{timestamp}',
                'NumeroFacture': f'FF-{timestamp}',
                'Compte': COMPTE_ACHAT,
                'Libelle': 'Achat marchandises 20%',
                'Debit': 1000.00,
                'Credit': 0,
                'Analytiques': [{'Section1': '1', 'Debit': 1000.00, 'Credit': 0}]
            },
            {
                'Jour': 22,
                'NumeroPiece': f'FF-{timestamp}',
                'NumeroFacture': f'FF-{timestamp}',
                'Compte': COMPTE_TVA_DED,
                'Libelle': 'TVA deductible 20%',
                'Debit': 200.00,
                'Credit': 0
            }
        ]
    }

    print(f'Comptes utilises:')
    print(f'  Fournisseur: {FOURNISSEUR}')
    print(f'  Achat:       {COMPTE_ACHAT}')
    print(f'  TVA ded:     {COMPTE_TVA_DED}')
    print()
    print(f'Body: {json.dumps(facture_fournisseur, indent=2)}')
    print()

    r = requests.post(f'{BASE_URL}/v1/compta/ecriture', headers=hdrs, json=facture_fournisseur)
    print(f'Status: {r.status_code}')
    result = r.json()
    print(f'Response: {result}')

    if result.get('codeRetour') == 1:
        print('>>> FACTURE FOURNISSEUR CREEE AVEC SUCCES!')
    print()

    # 2. Avoir fournisseur
    print('2. CREATION AVOIR FOURNISSEUR')
    print('-' * 80)

    avoir_fournisseur = {
        'CodeDossier': DOSSIER,
        'Journal': 'AC',
        'Mois': 12,
        'Annee': 2024,
        'LignesEcriture': [
            {
                'Jour': 22,
                'NumeroPiece': f'AVF-{timestamp}',
                'NumeroFacture': f'AVF-{timestamp}',
                'Compte': FOURNISSEUR,
                'Libelle': 'Avoir fournisseur - retour',
                'Debit': 240.00,  # Fournisseur debite = avoir recu
                'Credit': 0
            },
            {
                'Jour': 22,
                'NumeroPiece': f'AVF-{timestamp}',
                'NumeroFacture': f'AVF-{timestamp}',
                'Compte': COMPTE_ACHAT,
                'Libelle': 'Retour marchandises',
                'Debit': 0,
                'Credit': 200.00,  # Achat credite = annulation
                'Analytiques': [{'Section1': '1', 'Debit': 0, 'Credit': 200.00}]
            },
            {
                'Jour': 22,
                'NumeroPiece': f'AVF-{timestamp}',
                'NumeroFacture': f'AVF-{timestamp}',
                'Compte': COMPTE_TVA_DED,
                'Libelle': 'TVA avoir fournisseur',
                'Debit': 0,
                'Credit': 40.00  # TVA creditee = annulation
            }
        ]
    }

    print(f'Body: {json.dumps(avoir_fournisseur, indent=2)}')
    print()

    r = requests.post(f'{BASE_URL}/v1/compta/ecriture', headers=hdrs, json=avoir_fournisseur)
    print(f'Status: {r.status_code}')
    result = r.json()
    print(f'Response: {result}')

    if result.get('codeRetour') == 1:
        print('>>> AVOIR FOURNISSEUR CREE AVEC SUCCES!')
    print()

    # Resume
    print('=' * 100)
    print('RESUME - COMPTES UTILISES')
    print('=' * 100)
    print()
    print('FACTURE FOURNISSEUR:')
    print(f'  {FOURNISSEUR:15} (Fournisseur)    CREDIT  1200.00')
    print(f'  {COMPTE_ACHAT:15} (Achat 20%)      DEBIT   1000.00')
    print(f'  {COMPTE_TVA_DED:15} (TVA ded.)       DEBIT    200.00')
    print()
    print('AVOIR FOURNISSEUR:')
    print(f'  {FOURNISSEUR:15} (Fournisseur)    DEBIT    240.00')
    print(f'  {COMPTE_ACHAT:15} (Achat 20%)      CREDIT   200.00')
    print(f'  {COMPTE_TVA_DED:15} (TVA ded.)       CREDIT    40.00')

if __name__ == '__main__':
    main()
