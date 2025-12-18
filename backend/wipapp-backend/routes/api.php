<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CarController;
use App\Http\Controllers\ImageController;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::get('/test', function () {
    return response()->json([
        'success' => true,
        'message' => 'API WIPapp funcionando correctamente',
        'timestamp' => now()
    ]);
});

// Rutas públicas de autenticación
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Rutas protegidas con Sanctum
Route::middleware('auth:sanctum')->group(function () {
    // Autenticación
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    
    // Imágenes de usuario
    Route::post('/user/profile-image', [ImageController::class, 'uploadUserProfile']);
    Route::delete('/user/profile-image', [ImageController::class, 'deleteUserProfile']);
    
    // Coches - RUTAS SIMPLIFICADAS
    Route::prefix('cars')->group(function () {
        Route::get('/user', [CarController::class, 'getUserCars']);
        Route::post('/link', [CarController::class, 'linkCar']);
        Route::post('/create', [CarController::class, 'createCar']);
        
        // Rutas específicas de coche
        Route::post('/{car}/primary', [CarController::class, 'setPrimaryCar']);
        Route::post('/{car}/last-used', [CarController::class, 'setLastUsedCar']);
        Route::delete('/{car}/unlink', [CarController::class, 'unlinkCar']);
        
        // ✅ SOLO ESTA RUTA PARA IMÁGENES DE COCHE
        Route::post('/{car}/image', [ImageController::class, 'uploadCarImage']);
        Route::delete('/{car}/image', [ImageController::class, 'deleteCarImage']);
    });

    // Ruta protegida de ejemplo
    Route::get('/protected-test', function (Request $request) {
        return response()->json([
            'success' => true,
            'message' => 'Acceso autorizado',
            'user' => $request->user()->only(['id', 'name', 'email'])
        ]);
    });
});