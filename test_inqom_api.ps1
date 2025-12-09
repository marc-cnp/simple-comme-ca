$body = @{
    username = 'new@simplecommeca.io'
    password = 'scN@RN8Kx7GjSz?4'
    grant_type = 'password'
    scope = 'apidata openid'
    client_id = 'simplecommecav2'
    client_secret = 'DBjTzLWLFE94jSt6Cix9'
}

Write-Output "=== Obtention du token Inqom ==="
$response = Invoke-RestMethod -Uri 'https://auth.inqom.com/identity/connect/token' -Method Post -Body $body -ContentType 'application/x-www-form-urlencoded'
$token = $response.access_token
Write-Output "Token obtenu (premiers 50 car): $($token.Substring(0, 50))..."

# Sauvegarder le token
$token | Out-File -FilePath 'C:\Users\Marco\simple-comme-ca\inqom_token.txt' -NoNewline

# Test 1: GET Entry-Lines avec filtrage sur comptes fournisseurs (401*)
Write-Output ""
Write-Output "=== Test Entry-Lines (comptes 401* fournisseurs) ==="
$headers = @{
    'Authorization' = "Bearer $token"
}
$entryLinesUrl = 'https://wa-fred-accounting-services-prod.azurewebsites.net/v1/dossiers/80548/entry-lines?startDate=2024-01-01&endDate=2025-12-31&accountNumber=401&pageNumber=1'
$entryLines = Invoke-RestMethod -Uri $entryLinesUrl -Method Get -Headers $headers
Write-Output "Nombre de lignes recues: $($entryLines.Count)"
Write-Output ""
Write-Output "=== Exemple de lignes avec/sans lettrage ==="
$entryLines | Select-Object -First 10 | ForEach-Object {
    $lettrage = if ($_.LetterId) { "LETTRE (Id: $($_.LetterId), Letter: $($_.Letter))" } else { "NON LETTRE" }
    Write-Output "Entry $($_.Entry.Id) | Compte: $($_.AccountNumber) | Montant: $($_.DebitAmount)D / $($_.CreditAmount)C | $lettrage | Doc: $($_.AccountingDocument.Reference)"
}

# Statistiques lettrage
$lettres = $entryLines | Where-Object { $_.LetterId -ne $null }
$nonLettres = $entryLines | Where-Object { $_.LetterId -eq $null }
Write-Output ""
Write-Output "=== Statistiques Lettrage ==="
Write-Output "Lignes lettrees: $($lettres.Count)"
Write-Output "Lignes non lettrees: $($nonLettres.Count)"
