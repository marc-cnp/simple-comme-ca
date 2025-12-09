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
Write-Output "Token obtenu!"

$headers = @{
    'Authorization' = "Bearer $token"
}

# Test 1: GET Entry-Lines SANS filtre de compte
Write-Output ""
Write-Output "=== Test 1: Entry-Lines (toutes) ==="
$entryLinesUrl = 'https://wa-fred-accounting-services-prod.azurewebsites.net/v1/dossiers/80548/entry-lines?startDate=2025-01-01&endDate=2025-12-31&pageNumber=1'
try {
    $entryLinesRaw = Invoke-WebRequest -Uri $entryLinesUrl -Method Get -Headers $headers
    Write-Output "Status: $($entryLinesRaw.StatusCode)"
    Write-Output "Content (premiers 2000 car):"
    Write-Output $entryLinesRaw.Content.Substring(0, [Math]::Min(2000, $entryLinesRaw.Content.Length))
} catch {
    Write-Output "Erreur: $_"
}

# Test 2: Verifier si c'est paginé differemment
Write-Output ""
Write-Output "=== Test 2: Entry-Lines avec EntryLines dans la reponse ==="
$entryLines = Invoke-RestMethod -Uri $entryLinesUrl -Method Get -Headers $headers
Write-Output "Type de reponse: $($entryLines.GetType().Name)"
Write-Output "Proprietes disponibles: $($entryLines | Get-Member -MemberType NoteProperty | Select-Object -ExpandProperty Name)"

if ($entryLines.EntryLines) {
    Write-Output "Nombre dans EntryLines: $($entryLines.EntryLines.Count)"
    $entryLines.EntryLines | Select-Object -First 5 | ForEach-Object {
        $lettrage = if ($_.LetterId) { "LETTRE (Id: $($_.LetterId))" } else { "NON LETTRE" }
        Write-Output "  - Compte: $($_.AccountNumber) | $($_.DebitAmount)D / $($_.CreditAmount)C | $lettrage"
    }
}

# Test 3: Documents
Write-Output ""
Write-Output "=== Test 3: Documents ==="
$docsUrl = 'https://wa-fred-accounting-documents-prod.azurewebsites.net/api/accounting-documents/accounting-folders/80548/Documents?pageNumber=1&pageSize=10'
try {
    $docs = Invoke-RestMethod -Uri $docsUrl -Method Get -Headers $headers
    Write-Output "Nombre de documents: $($docs.Count)"
    $docs | Select-Object -First 5 | ForEach-Object {
        Write-Output "  - Id: $($_.Id) | Type: $($_.Type) | Status: $($_.Status) | Ref: $($_.DocRef)"
    }
} catch {
    Write-Output "Erreur docs: $_"
}
