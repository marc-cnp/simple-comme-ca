# Test API Chift - Lister les connexions

Write-Output "=== Test API Chift - Connexions ==="

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

# 2. Lister les consumers
Write-Output ""
Write-Output "=== Consumers ==="
try {
    $consumers = Invoke-RestMethod -Uri 'https://api.chift.eu/consumers' -Method Get -Headers $headers
    Write-Output "Reponse consumers:"
    $consumers | ConvertTo-Json -Depth 5
} catch {
    Write-Output "Erreur consumers: $_"
}

# 3. Lister les connexions
Write-Output ""
Write-Output "=== Connections ==="
try {
    $connections = Invoke-RestMethod -Uri 'https://api.chift.eu/connections' -Method Get -Headers $headers
    Write-Output "Reponse connections:"
    $connections | ConvertTo-Json -Depth 5
} catch {
    Write-Output "Erreur connections: $_"
}

# 4. Info sur le consumer specifique
$accountId = 'ee88a152-b970-491a-b147-03ec7bdefd3a'
Write-Output ""
Write-Output "=== Consumer $accountId ==="
try {
    $consumer = Invoke-RestMethod -Uri "https://api.chift.eu/consumers/$accountId" -Method Get -Headers $headers
    Write-Output "Reponse consumer:"
    $consumer | ConvertTo-Json -Depth 5
} catch {
    Write-Output "Erreur consumer: $_"
}
