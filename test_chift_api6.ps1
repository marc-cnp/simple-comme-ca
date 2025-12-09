# Test API Chift - Tester plusieurs consumers

Write-Output "=== Test API Chift - Recherche consumer avec factures ==="

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

# 2. Recuperer les consumers
$consumers = Invoke-RestMethod -Uri 'https://api.chift.eu/consumers' -Method Get -Headers $headers
Write-Output "Nombre de consumers: $($consumers.Count)"

# 3. Tester les premiers consumers pour trouver ceux avec des factures
Write-Output ""
Write-Output "=== Test des consumers (premiers 20) ==="

$foundInvoices = $false
$testedCount = 0

foreach ($consumer in ($consumers | Select-Object -First 20)) {
    $consumerId = $consumer.consumerid
    $consumerName = $consumer.name
    $testedCount++

    try {
        $supplierUrl = "https://api.chift.eu/consumers/$consumerId/accounting/invoices/type/supplier_invoice"
        $supplierInvoices = Invoke-RestMethod -Uri $supplierUrl -Method Get -Headers $headers

        if ($supplierInvoices.items -and $supplierInvoices.items.Count -gt 0) {
            Write-Output ""
            Write-Output "=== TROUVE! Consumer: $consumerName ($consumerId) ==="
            Write-Output "Nombre de factures fournisseurs: $($supplierInvoices.items.Count)"

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
                Write-Output "  ID: $($_.id) | Status: $($_.status) | Total: $($_.total) | $payments | Ref: $($_.invoice_number)"
            }

            # Factures paid
            $paidInvoices = $supplierInvoices.items | Where-Object { $_.status -eq 'paid' }
            Write-Output ""
            Write-Output "Factures 'paid': $($paidInvoices.Count)"
            if ($paidInvoices.Count -gt 0) {
                Write-Output "Exemples factures paid:"
                $paidInvoices | Select-Object -First 3 | ForEach-Object {
                    Write-Output "  Ref: $($_.invoice_number) | Total: $($_.total) | Status: $($_.status)"
                    if ($_.payments) {
                        $_.payments | ForEach-Object {
                            Write-Output "    -> Payment: $($_.amount) | Date: $($_.payment_date) | Reconciled: $($_.reconciled)"
                        }
                    }
                }
            }

            $foundInvoices = $true
            break
        }
    } catch {
        # Pas de connexion active, continuer
    }

    if ($testedCount % 5 -eq 0) {
        Write-Output "Teste: $testedCount consumers..."
    }
}

if (-not $foundInvoices) {
    Write-Output ""
    Write-Output "Aucun consumer avec factures trouve dans les 20 premiers"
}

Write-Output ""
Write-Output "=== FIN ==="
