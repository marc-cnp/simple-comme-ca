"""
Trouve les comptes de classe 6 (achats) et 4456 (TVA deductible)
"""

import requests
import json

BASE_URL = 'https://isuiteexco.coaxis.com/CNX/api'
DOSSIER = 'ZZCCA'

def auth():
    r = requests.post(f'{BASE_URL}/v1/authentification',
                      json={'identifiant': 'EVODEV', 'motDePasse': 'Evodev123!'})
    return r.json().get('UUID')

def main():
    uuid = auth()
    hdrs = {'UUID': uuid, 'Content-Type': 'application/json'}

    print('COMPTES DE CLASSE 6 (ACHATS/CHARGES)')
    print('=' * 80)

    r = requests.get(f'{BASE_URL}/v1/compta/comptes/generaux?CodeDossier={DOSSIER}', headers=hdrs)
    comptes = r.json()

    # Filtrer classe 6
    comptes_6 = [c for c in comptes if c.get('Code', '').startswith('6')]
    print(f'Nombre de comptes classe 6: {len(comptes_6)}')
    print()
    for c in comptes_6[:20]:
        code = c.get('Code', '')
        lib = c.get('Lib', '')
        print(f'  {code:10} | {lib[:50]}')

    print()
    print('COMPTES DE TVA DEDUCTIBLE (4456)')
    print('=' * 80)
    comptes_tva = [c for c in comptes if c.get('Code', '').startswith('4456')]
    for c in comptes_tva:
        code = c.get('Code', '')
        lib = c.get('Lib', '')
        print(f'  {code:10} | {lib}')

if __name__ == '__main__':
    main()
