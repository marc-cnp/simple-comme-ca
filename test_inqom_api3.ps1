$body = @{
    username = 'new@simplecommeca.io'
    password = 'scN@RN8Kx7GjSz?4'
    grant_type = 'password'
    scope = 'apidata openid'
    client_id = 'simplecommecav2'
    client_secret = 'DBjTzLWLFE94jSt6Cix9'
}

$response = Invoke-RestMethod -Uri 'https://auth.inqom.com/identity/connect/token' -Method Post -Body $body -ContentType 'application/x-www-form-urlencoded'
$token = $response.access_token
$headers = @{ 'Authorization' = "Bearer $token" }

Write-Output "=== Recherche de lignes LETTREES dans Inqom ==="

# Parcourir plusieurs pages
$allEntries = @()
for ($page = 1; $page -le 5; $page++) {
    $url = "https://wa-fred-accounting-services-prod.azurewebsites.net/v1/dossiers/80548/entry-lines?startDate=2024-01-01&endDate=2025-12-31&pageNumber=$page"
    $result = Invoke-RestMethod -Uri $url -Method Get -Headers $headers
    if ($result.EntryLines.Count -eq 0) { break }
    $allEntries += $result.EntryLines
    Write-Output "Page $page : $($result.EntryLines.Count) lignes"
}

Write-Output ""
Write-Output "Total lignes recuperees: $($allEntries.Count)"

# Chercher les lignes lettrees
$lettrees = $allEntries | Where-Object { $_.LetterId -ne $null -and $_.LetterId -ne 0 }
$nonLettrees = $allEntries | Where-Object { $_.LetterId -eq $null -or $_.LetterId -eq 0 }

Write-Output ""
Write-Output "=== STATISTIQUES LETTRAGE ==="
Write-Output "Lignes LETTREES: $($lettrees.Count)"
Write-Output "Lignes NON LETTREES: $($nonLettrees.Count)"

if ($lettrees.Count -gt 0) {
    Write-Output ""
    Write-Output "=== Exemples de lignes LETTREES ==="
    $lettrees | Select-Object -First 5 | ForEach-Object {
        Write-Output "  Compte: $($_.AccountNumber) | Letter: $($_.Letter) | LetterId: $($_.LetterId) | Doc: $($_.AccountingDocument.Reference)"
    }
}

# Chercher specifiquement les comptes 401 (fournisseurs)
Write-Output ""
Write-Output "=== Comptes 401* (Fournisseurs) ==="
$fournisseurs = $allEntries | Where-Object { $_.AccountNumber -like "401*" }
Write-Output "Nombre de lignes 401*: $($fournisseurs.Count)"
$fournLettrees = $fournisseurs | Where-Object { $_.LetterId -ne $null -and $_.LetterId -ne 0 }
$fournNonLettrees = $fournisseurs | Where-Object { $_.LetterId -eq $null -or $_.LetterId -eq 0 }
Write-Output "  - Lettrees: $($fournLettrees.Count)"
Write-Output "  - Non lettrees: $($fournNonLettrees.Count)"

# Afficher quelques exemples de factures fournisseurs
Write-Output ""
Write-Output "=== Exemples factures fournisseurs (401*) ==="
$fournisseurs | Select-Object -First 10 | ForEach-Object {
    $statut = if ($_.LetterId) { "PAYE (Letter: $($_.Letter))" } else { "NON PAYE" }
    Write-Output "  $($_.AccountNumber) | $($_.CreditAmount)C | $statut | Ref: $($_.AccountingDocument.Reference)"
}
