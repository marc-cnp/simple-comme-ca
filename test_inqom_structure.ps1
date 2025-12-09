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

Write-Output "=== Structure complete d'une entry-line Inqom ==="

$url = "https://wa-fred-accounting-services-prod.azurewebsites.net/v1/dossiers/80548/entry-lines?startDate=2024-01-01&endDate=2025-12-31&pageNumber=1"
$result = Invoke-RestMethod -Uri $url -Method Get -Headers $headers

# Montrer la structure complete d'une ligne LETTREE
Write-Output ""
Write-Output "=== Exemple ligne LETTREE (facture payee) ==="
$ligneLettree = $result.EntryLines | Where-Object { $_.LetterId -ne $null -and $_.LetterId -ne 0 } | Select-Object -First 1
if ($ligneLettree) {
    $ligneLettree | ConvertTo-Json -Depth 5
} else {
    Write-Output "Aucune ligne lettree trouvee"
}

# Montrer la structure complete d'une ligne NON LETTREE
Write-Output ""
Write-Output "=== Exemple ligne NON LETTREE (facture non payee) ==="
$ligneNonLettree = $result.EntryLines | Where-Object { ($_.LetterId -eq $null -or $_.LetterId -eq 0) -and $_.AccountNumber -like "401*" } | Select-Object -First 1
if ($ligneNonLettree) {
    $ligneNonLettree | ConvertTo-Json -Depth 5
} else {
    Write-Output "Aucune ligne non lettree trouvee"
}

# Montrer comment identifier une facture par son AccountingDocument.Reference
Write-Output ""
Write-Output "=== Toutes les lignes 401* avec leur statut de lettrage ==="
$lignes401 = $result.EntryLines | Where-Object { $_.AccountNumber -like "401*" }
$lignes401 | ForEach-Object {
    $statut = if ($_.LetterId -and $_.LetterId -ne 0) { "PAYE (LetterId: $($_.LetterId))" } else { "NON PAYE" }
    Write-Output "Facture: $($_.AccountingDocument.Reference) | Compte: $($_.AccountNumber) | Montant: $($_.CreditAmount)C | $statut"
}
