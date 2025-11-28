# test_cars.ps1 - Pruebas Completas del Sistema WIPapp

# Configuración
$BASE_URL = "http://localhost:8000/api"
$EMAIL = "testuser@example.com"
$PASSWORD = "password123"
$CAR1_PLATE = "ABC-123"
$CAR1_PIN = "1234"
$CAR2_PLATE = "XYZ-789"
$CAR2_PIN = "5678"

Write-Host "🔍 INICIANDO PRUEBAS COMPLETAS DEL SISTEMA WIPapp" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

# Función para mostrar respuestas de forma legible
function Show-JsonResponse {
    param($Response)
    $Response | ConvertTo-Json -Depth 10
}

# 1. REGISTRAR NUEVO USUARIO
Write-Host "`n1. 🆕 REGISTRANDO NUEVO USUARIO..." -ForegroundColor Yellow
$registerBody = @{
    name = "Usuario Test"
    email = $EMAIL
    password = $PASSWORD
    password_confirmation = $PASSWORD
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "$BASE_URL/register" -Method POST -Body $registerBody -ContentType "application/json"
    Write-Host "✅ Registro exitoso" -ForegroundColor Green
    $TOKEN = $registerResponse.data.access_token
    Write-Host "   Token: $($TOKEN.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "⚠️  El usuario ya existe, haciendo LOGIN..." -ForegroundColor Yellow
    $loginBody = @{
        email = $EMAIL
        password = $PASSWORD
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "$BASE_URL/login" -Method POST -Body $loginBody -ContentType "application/json"
    $TOKEN = $loginResponse.data.access_token
    Write-Host "✅ Login exitoso" -ForegroundColor Green
    Write-Host "   Token: $($TOKEN.Substring(0, 20))..." -ForegroundColor Gray
}

# Headers con autenticación
$headers = @{
    "Authorization" = "Bearer $TOKEN"
    "Content-Type" = "application/json"
    "Accept" = "application/json"
}

# 2. CREAR PRIMER COCHE
Write-Host "`n2. 🚗 CREANDO PRIMER COCHE..." -ForegroundColor Yellow
$car1Body = @{
    license_plate = $CAR1_PLATE
    pin_code = $CAR1_PIN
    brand = "Toyota"
    model = "Corolla"
    year = 2023
    color = "Rojo"
} | ConvertTo-Json

try {
    $car1Response = Invoke-RestMethod -Uri "$BASE_URL/cars/create" -Method POST -Body $car1Body -Headers $headers
    Write-Host "✅ Coche 1 creado exitosamente" -ForegroundColor Green
    Write-Host "   Matrícula: $($car1Response.data.car.license_plate)" -ForegroundColor Gray
    Write-Host "   Es principal: $($car1Response.data.is_primary)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Error creando coche 1: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. CREAR SEGUNDO COCHE
Write-Host "`n3. 🚙 CREANDO SEGUNDO COCHE..." -ForegroundColor Yellow
$car2Body = @{
    license_plate = $CAR2_PLATE
    pin_code = $CAR2_PIN
    brand = "Honda"
    model = "Civic"
    year = 2022
    color = "Azul"
} | ConvertTo-Json

try {
    $car2Response = Invoke-RestMethod -Uri "$BASE_URL/cars/create" -Method POST -Body $car2Body -Headers $headers
    Write-Host "✅ Coche 2 creado exitosamente" -ForegroundColor Green
    Write-Host "   Matrícula: $($car2Response.data.car.license_plate)" -ForegroundColor Gray
    Write-Host "   Es principal: $($car2Response.data.is_primary)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Error creando coche 2: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. OBTENER COCHES DEL USUARIO
Write-Host "`n4. 📋 OBTENIENDO COCHES DEL USUARIO..." -ForegroundColor Yellow
try {
    $userCarsResponse = Invoke-RestMethod -Uri "$BASE_URL/cars/user" -Method GET -Headers $headers
    Write-Host "✅ Coches obtenidos exitosamente" -ForegroundColor Green
    Write-Host "   Total de coches: $($userCarsResponse.data.cars.Count)" -ForegroundColor Gray
    
    # Extraer IDs de los coches para usar en pruebas siguientes
    $car1Id = $userCarsResponse.data.cars | Where-Object { $_.license_plate -eq $CAR1_PLATE } | Select-Object -First 1 -ExpandProperty id
    $car2Id = $userCarsResponse.data.cars | Where-Object { $_.license_plate -eq $CAR2_PLATE } | Select-Object -First 1 -ExpandProperty id
    
    Write-Host "   ID Coche 1: $car1Id" -ForegroundColor Gray
    Write-Host "   ID Coche 2: $car2Id" -ForegroundColor Gray
    
    # Mostrar información del último coche usado y principal
    if ($userCarsResponse.data.last_used_car) {
        Write-Host "   Último coche usado: $($userCarsResponse.data.last_used_car.license_plate)" -ForegroundColor Cyan
    }
    if ($userCarsResponse.data.primary_car) {
        Write-Host "   Coche principal: $($userCarsResponse.data.primary_car.license_plate)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Error obteniendo coches: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. ESTABLECER COCHE 2 COMO PRINCIPAL
Write-Host "`n5. ⭐ ESTABLECIENDO COCHE 2 COMO PRINCIPAL..." -ForegroundColor Yellow
try {
    $primaryResponse = Invoke-RestMethod -Uri "$BASE_URL/cars/$car2Id/primary" -Method POST -Headers $headers
    Write-Host "✅ $($primaryResponse.message)" -ForegroundColor Green
    Write-Host "   Coche principal ahora: $CAR2_PLATE" -ForegroundColor Gray
} catch {
    Write-Host "❌ Error estableciendo principal: $($_.Exception.Message)" -ForegroundColor Red
}

# 6. MARCAR COCHE 1 COMO ÚLTIMO USADO
Write-Host "`n6. 🕐 MARCANDO COCHE 1 COMO ÚLTIMO USADO..." -ForegroundColor Yellow
try {
    $lastUsedResponse = Invoke-RestMethod -Uri "$BASE_URL/cars/$car1Id/last-used" -Method POST -Headers $headers
    Write-Host "✅ $($lastUsedResponse.message)" -ForegroundColor Green
    Write-Host "   Último coche usado: $CAR1_PLATE" -ForegroundColor Gray
} catch {
    Write-Host "❌ Error marcando último usado: $($_.Exception.Message)" -ForegroundColor Red
}

# 7. PROBAR VINCULAR COCHE EXISTENTE (debería fallar)
Write-Host "`n7. 🔄 INTENTANDO VINCULAR COCHE EXISTENTE (debería fallar)..." -ForegroundColor Yellow
$linkExistingBody = @{
    license_plate = $CAR1_PLATE
    pin_code = $CAR1_PIN
} | ConvertTo-Json

try {
    $linkExistingResponse = Invoke-RestMethod -Uri "$BASE_URL/cars/link" -Method POST -Body $linkExistingBody -Headers $headers
    Write-Host "❌ Comportamiento inesperado: Debería haber fallado" -ForegroundColor Red
} catch {
    Write-Host "✅ Comportamiento esperado: $($_.ErrorDetails.Message)" -ForegroundColor Green
}

# 8. OBTENER DATOS ACTUALIZADOS DEL USUARIO
Write-Host "`n8. 👤 OBTENIENDO DATOS ACTUALIZADOS DEL USUARIO..." -ForegroundColor Yellow
try {
    $userResponse = Invoke-RestMethod -Uri "$BASE_URL/user" -Method GET -Headers $headers
    Write-Host "✅ Datos del usuario obtenidos" -ForegroundColor Green
    Write-Host "   Nombre: $($userResponse.data.user.name)" -ForegroundColor Gray
    Write-Host "   Email: $($userResponse.data.user.email)" -ForegroundColor Gray
    if ($userResponse.data.last_used_car) {
        Write-Host "   Último coche usado: $($userResponse.data.last_used_car.license_plate)" -ForegroundColor Cyan
    }
    if ($userResponse.data.primary_car) {
        Write-Host "   Coche principal: $($userResponse.data.primary_car.license_plate)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Error obteniendo datos usuario: $($_.Exception.Message)" -ForegroundColor Red
}

# 9. PROBAR DESVINCULAR COCHE 1
Write-Host "`n9. 🗑️  DESVINCULANDO COCHE 1..." -ForegroundColor Yellow
try {
    $unlinkResponse = Invoke-RestMethod -Uri "$BASE_URL/cars/$car1Id/unlink" -Method DELETE -Headers $headers
    Write-Host "✅ $($unlinkResponse.message)" -ForegroundColor Green
} catch {
    Write-Host "❌ Error desvinculando: $($_.Exception.Message)" -ForegroundColor Red
}

# 10. VER COCHES FINALES
Write-Host "`n10. 📊 COCHES FINALES DEL USUARIO..." -ForegroundColor Yellow
try {
    $finalCarsResponse = Invoke-RestMethod -Uri "$BASE_URL/cars/user" -Method GET -Headers $headers
    Write-Host "✅ Coches finales obtenidos" -ForegroundColor Green
    Write-Host "   Total de coches restantes: $($finalCarsResponse.data.cars.Count)" -ForegroundColor Gray
    $finalCarsResponse.data.cars | ForEach-Object {
        Write-Host "   - $($_.license_plate) ($($_.brand) $($_.model))" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Error obteniendo coches finales: $($_.Exception.Message)" -ForegroundColor Red
}

# 11. PROBAR CON COCHE INEXISTENTE
Write-Host "`n11. ❌ PROBANDO CON COCHE INEXISTENTE..." -ForegroundColor Yellow
$missingCarBody = @{
    license_plate = "NO-EXISTE"
    pin_code = "9999"
} | ConvertTo-Json

try {
    $missingCarResponse = Invoke-RestMethod -Uri "$BASE_URL/cars/link" -Method POST -Body $missingCarBody -Headers $headers
    Write-Host "❌ Comportamiento inesperado: Debería haber fallado" -ForegroundColor Red
} catch {
    Write-Host "✅ Comportamiento esperado: $($_.ErrorDetails.Message)" -ForegroundColor Green
}

# 12. PROBAR CON PIN INCORRECTO
Write-Host "`n12. 🔐 PROBANDO CON PIN INCORRECTO..." -ForegroundColor Yellow
$wrongPinBody = @{
    license_plate = $CAR2_PLATE
    pin_code = "0000"
} | ConvertTo-Json

try {
    $wrongPinResponse = Invoke-RestMethod -Uri "$BASE_URL/cars/link" -Method POST -Body $wrongPinBody -Headers $headers
    Write-Host "❌ Comportamiento inesperado: Debería haber fallado" -ForegroundColor Red
} catch {
    Write-Host "✅ Comportamiento esperado: $($_.ErrorDetails.Message)" -ForegroundColor Green
}

Write-Host "`n==================================================" -ForegroundColor Green
Write-Host "✅ PRUEBAS COMPLETADAS" -ForegroundColor Green
Write-Host "Revisa los resultados arriba para verificar el funcionamiento." -ForegroundColor Yellow