<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage; // ← AGREGAR ESTA LÍNEA

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    return view('welcome');
});

Route::get('/test-storage', function() {
    try {
        // Prueba de escritura
        Storage::disk('public')->put('test.txt', 'Testing storage');
        
        // Listar archivos
        $files = Storage::disk('public')->files('car_images');
        
        return response()->json([
            'success' => true,
            'storage_path' => storage_path('app/public'),
            'public_storage_path' => public_path('storage'),
            'test_file_exists' => Storage::disk('public')->exists('test.txt'),
            'car_images_count' => count($files),
            'car_images' => $files,
            'is_writable' => is_writable(storage_path('app/public')),
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
});