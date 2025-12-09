# Test API Chift - Tester avec un consumer actif

Write-Output "=== Test API Chift - Consumer actif ==="

# 1. Obtention du token
$tokenBody = @{
    clientId = 'YrffYabj6L3JGwf'
    clientSecret = 'qPGJogkQNwGeqpKjyzEm'
    accountId = 'ee88a152-b970-491a-b147-03ec7bdefd3a'
} | ConvertTo-Json

$tokenResponse = Invoke-RestMethod -Uri 'https://api.chift.eu/token' -Method Post -Body $tokenBody -ContentType 'application/json'
$token = $tokenResponse.access_token
Write-Output "Token obtenu!"

$headers = @{
    'Authorization' = "Bearer $token"
}

# 2. Lister les connexions pour trouver un consumer avec connexion active
Write-Output ""
Write-Output "=== Connexions actives ==="
try {
    $connections = Invoke-RestMethod -Uri 'https://api.chift.eu/connections' -Method Get -Headers $headers
    Write-Output "Nombre de connexions: $($connections.Count)"

    if ($connections.Count -gt 0) {
        $connections | Select-Object -First 10 | ForEach-Object {
            Write-Output "  Consumer: $($_.consumer_id) | Status: $($_.status) | Software: $($_.software)"
        }

        # Prendre le premier consumer avec connexion active
        $activeConnection = $connections | Where-Object { $_.status -eq 'active' } | Select-Object -First 1
        if ($activeConnection) {
            $activeConsumerId = $activeConnection.consumer_id
            Write-Output ""
            Write-Output "=== Test avec consumer actif: $activeConsumerId ==="

            # Tester les factures fournisseurs
            Write-Output ""
            Write-Output "=== Factures Fournisseurs ==="
            try {
                $supplierUrl = "https://api.chift.eu/consumers/$activeConsumerId/accounting/invoices/type/supplier_invoice"
                $supplierInvoices = Invoke-RestMethod -Uri $supplierUrl -Method Get -Headers $headers

                Write-Output "Nombre de factures: $($supplierInvoices.items.Count)"

                if ($supplierInvoices.items.Count -gt 0) {
                    # Grouper par statut
                    $statuts = $supplierInvoices.items | Group-Object -Property status
                    Write-Output "Repartition par statut:"
                    foreach ($s in $statuts) {
                        Write-Output "  - '$($s.Name)': $($s.Count)"
                    }

                    # Exemples
                    Write-Output ""
                    Write-Output "Exemples (5 premieres):"
                    $supplierInvoices.items | Select-Object -First 5 | ForEach-Object {
                        $payments = if ($_.payments -and $_.payments.Count -gt 0) { "Payments: $($_.payments.Count)" } else { "Pas de payments" }
                        Write-Output "  ID: $($_.id) | Status: $($_.status) | Total: $($_.total) | $payments"
                    }

                    # Factures paid
                    $paidInvoices = $supplierInvoices.items | Where-Object { $_.status -eq 'paid' }
                    Write-Output ""
                    Write-Output "Factures 'paid': $($paidInvoices.Count)"
                    if ($paidInvoices.Count -gt 0) {
                        $paidInvoices | Select-Object -First 3 | ForEach-Object {
                            Write-Output "  Ref: $($_.invoice_number) | Total: $($_.total)"
                            if ($_.payments) {
                                $_.payments | ForEach-Object {
                                    Write-Output "    -> Payment: $($_.amount) | Date: $($_.payment_date) | Reconciled: $($_.reconciled)"
                                }
                            }
                        }
                    }
                }
            } catch {
                Write-Output "Erreur factures: $_"
            }
        } else {
            Write-Output "Aucune connexion active trouvee"
        }
    }
} catch {
    Write-Output "Erreur connexions: $_"
}

Write-Output ""
Write-Output "=== FIN ==="
