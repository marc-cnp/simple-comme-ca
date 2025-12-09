# Test API Chift - Verification du statut "paid" des factures

Write-Output "=== Test API Chift ==="

# 1. Obtention du token (avec JSON body)
Write-Output ""
Write-Output "=== 1. Obtention du token Chift ==="

$tokenBody = @{
    client_id = 'YrffYabj6L3JGwf'
    client_secret = 'qPGJogkQNwGeqpKjyzEm'
    grant_type = 'client_credentials'
} | ConvertTo-Json

try {
    $tokenResponse = Invoke-RestMethod -Uri 'https://api.chift.eu/token' -Method Post -Body $tokenBody -ContentType 'application/json'
    $token = $tokenResponse.access_token
    Write-Output "Token obtenu! (premiers 50 car): $($token.Substring(0, [Math]::Min(50, $token.Length)))..."
    Write-Output "Expires in: $($tokenResponse.expires_in) secondes"
} catch {
    Write-Output "Erreur token: $_"
    Write-Output "Essai avec Basic Auth..."

    # Essayer avec Basic Auth
    $credentials = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("YrffYabj6L3JGwf:qPGJogkQNwGeqpKjyzEm"))
    $authHeaders = @{
        'Authorization' = "Basic $credentials"
    }
    $tokenBody2 = @{ grant_type = 'client_credentials' } | ConvertTo-Json

    try {
        $tokenResponse = Invoke-RestMethod -Uri 'https://api.chift.eu/token' -Method Post -Body $tokenBody2 -ContentType 'application/json' -Headers $authHeaders
        $token = $tokenResponse.access_token
        Write-Output "Token obtenu avec Basic Auth!"
    } catch {
        Write-Output "Erreur Basic Auth: $_"
        exit
    }
}

$headers = @{
    'Authorization' = "Bearer $token"
}

$accountId = 'ee88a152-b970-491a-b147-03ec7bdefd3a'

# 2. Test GET Invoices - Factures fournisseurs (supplier_invoice)
Write-Output ""
Write-Output "=== 2. Factures Fournisseurs (supplier_invoice) ==="

try {
    $supplierInvoicesUrl = "https://api.chift.eu/consumers/$accountId/accounting/invoices/type/supplier_invoice"
    $supplierInvoices = Invoke-RestMethod -Uri $supplierInvoicesUrl -Method Get -Headers $headers

    Write-Output "Nombre de factures fournisseurs: $($supplierInvoices.items.Count)"

    if ($supplierInvoices.items.Count -gt 0) {
        Write-Output ""
        Write-Output "=== Statuts des factures fournisseurs ==="

        # Grouper par statut
        $statuts = $supplierInvoices.items | Group-Object -Property status
        foreach ($s in $statuts) {
            Write-Output "  Status '$($s.Name)': $($s.Count) factures"
        }

        Write-Output ""
        Write-Output "=== Exemples de factures ==="
        $supplierInvoices.items | Select-Object -First 10 | ForEach-Object {
            $paiements = if ($_.payments -and $_.payments.Count -gt 0) { "Payments: $($_.payments.Count)" } else { "Pas de paiements" }
            Write-Output "  ID: $($_.id) | Status: $($_.status) | Total: $($_.total) | $paiements | Ref: $($_.invoice_number)"
        }

        # Chercher specifiquement les factures "paid"
        $paidInvoices = $supplierInvoices.items | Where-Object { $_.status -eq 'paid' }
        Write-Output ""
        Write-Output "=== Factures avec status 'paid': $($paidInvoices.Count) ==="
        if ($paidInvoices.Count -gt 0) {
            $paidInvoices | Select-Object -First 5 | ForEach-Object {
                Write-Output "  ID: $($_.id) | Total: $($_.total) | Ref: $($_.invoice_number)"
                if ($_.payments) {
                    $_.payments | ForEach-Object {
                        Write-Output "    -> Payment: $($_.amount) | Date: $($_.payment_date) | Reconciled: $($_.reconciled)"
                    }
                }
            }
        }
    }
} catch {
    Write-Output "Erreur supplier_invoice: $_"
}

# 3. Test GET Invoices - Factures clients (customer_invoice)
Write-Output ""
Write-Output "=== 3. Factures Clients (customer_invoice) ==="

try {
    $customerInvoicesUrl = "https://api.chift.eu/consumers/$accountId/accounting/invoices/type/customer_invoice"
    $customerInvoices = Invoke-RestMethod -Uri $customerInvoicesUrl -Method Get -Headers $headers

    Write-Output "Nombre de factures clients: $($customerInvoices.items.Count)"

    if ($customerInvoices.items.Count -gt 0) {
        # Grouper par statut
        $statuts = $customerInvoices.items | Group-Object -Property status
        foreach ($s in $statuts) {
            Write-Output "  Status '$($s.Name)': $($s.Count) factures"
        }

        # Chercher les factures "paid"
        $paidInvoices = $customerInvoices.items | Where-Object { $_.status -eq 'paid' }
        Write-Output ""
        Write-Output "Factures clients 'paid': $($paidInvoices.Count)"
    }
} catch {
    Write-Output "Erreur customer_invoice: $_"
}

Write-Output ""
Write-Output "=== FIN DES TESTS CHIFT ==="
