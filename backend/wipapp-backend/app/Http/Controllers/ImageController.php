<?php

namespace App\Http\Controllers;

use App\Models\Car;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Intervention\Image\Facades\Image;

class ImageController extends Controller
{

    /**
     * Elimina una imagen del storage de forma segura
     * Maneja diferentes formatos de ruta y discos
     * 
     * @param string|null $imagePath La ruta de la imagen a eliminar
     * @param string $context Contexto para logs (ej: 'car', 'profile')
     * @return bool True si se eliminó, false si no
     */
    private function deleteImageFromStorage(?string $imagePath, string $context = 'image'): bool
    {
        if (!$imagePath) {
            \Log::info("[$context] No hay ruta de imagen para eliminar");
            return false;
        }
        
        \Log::info("[$context] Intentando eliminar imagen: " . $imagePath);
        
        // Lista de discos a probar (en orden de prioridad)
        $disksToTry = ['public', 'local'];
        
        // Lista de posibles formatos de ruta (sin modificar, con/sin prefijo)
        $pathVariations = [
            $imagePath, // Original
            ltrim($imagePath, '/'), // Sin slash inicial
            str_replace('public/', '', $imagePath), // Sin 'public/'
            'public/' . ltrim($imagePath, '/'), // Con 'public/'
        ];
        
        // Eliminar duplicados y valores vacíos
        $pathVariations = array_unique(array_filter($pathVariations));
        
        foreach ($disksToTry as $disk) {
            foreach ($pathVariations as $path) {
                try {
                    if (Storage::disk($disk)->exists($path)) {
                        Storage::disk($disk)->delete($path);
                        \Log::info("[$context] ✅ Imagen eliminada - Disco: $disk, Ruta: $path");
                        
                        // Verificar que realmente se eliminó
                        if (!Storage::disk($disk)->exists($path)) {
                            \Log::info("[$context] ✅ Verificación: imagen ya no existe en storage");
                        } else {
                            \Log::warning("[$context] ⚠️  La imagen aún existe después de eliminarla");
                        }
                        
                        return true;
                    }
                } catch (\Exception $e) {
                    \Log::warning("[$context] Error al verificar/eliminar en disco $disk, ruta $path: " . $e->getMessage());
                }
            }
        }
        
        // Si llegamos aquí, no se encontró la imagen en ningún disco/ruta
        \Log::warning("[$context] ❌ No se pudo encontrar la imagen en ningún disco/ruta: " . $imagePath);
        
        // DEBUG: Listar archivos en directorios comunes
        $this->debugStorageContents($imagePath, $context);
        
        return false;
    }

    /**
     * Subir imagen de perfil de usuario
     */
    public function uploadUserProfile(Request $request)
    {
        \Log::info('👤 Entrando a uploadUserProfile');
        
        $validator = Validator::make($request->all(), [
            'profile_image' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json([...], 422);
        }

        try {
            $user = $request->user();
            \Log::info('✅ Usuario ID: ' . $user->id);
            
            // ✅ ELIMINAR IMAGEN ANTERIOR USANDO LA FUNCIÓN HELPER
            if ($user->profile_image) {
                $this->deleteImageFromStorage($user->profile_image, 'user_' . $user->id);
            }
            
            // ... resto del código igual
            $imagePath = $request->file('profile_image')->store('profile_images', 'public');
            
            // Redimensionar
            $image = Image::make(storage_path('app/public/' . $imagePath));
            $image->fit(400, 400);
            $image->save();
            
            $user->profile_image = $imagePath;
            $user->save();
            
            return response()->json([
                'success' => true,
                'message' => 'Imagen de perfil actualizada',
                'data' => [
                    'profile_image' => Storage::url($imagePath)
                ]
            ]);
            
        } catch (\Exception $e) {
            \Log::error('💥 ERROR en uploadUserProfile: ' . $e->getMessage());
            return response()->json([...], 500);
        }
    }

    /**
     * Subir imagen de coche
     */
    public function uploadCarImage(Request $request, $carId)
    {
        \Log::info('🚗 Entrando a uploadCarImage. Car ID: ' . $carId);
        
        $validator = Validator::make($request->all(), [
            'car_image' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120', // Aumentado a 5MB
        ], [
            'car_image.required' => 'La imagen es requerida',
            'car_image.image' => 'El archivo debe ser una imagen',
            'car_image.mimes' => 'Formatos permitidos: JPEG, PNG, JPG, GIF',
            'car_image.max' => 'La imagen no debe pesar más de 5MB',
        ]);

        if ($validator->fails()) {
            \Log::warning('❌ Validación fallida: ' . json_encode($validator->errors()->all()));
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = $request->user();
            \Log::info('👤 Usuario autenticado ID: ' . $user->id);

            // Obtener el coche correctamente
            $car = $user->cars()->where('cars.id', $carId)->first();
            
            if (!$car) {
                \Log::error('🚫 Coche no encontrado o sin acceso. User ID: ' . $user->id . ', Car ID: ' . $carId);
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes acceso a este coche o no existe'
                ], 404);
            }

            \Log::info('✅ Coche encontrado: ' . $car->license_plate . ' (ID: ' . $car->id . ')');
            \Log::info('📷 Imagen actual en BD: ' . ($car->car_image ?: 'NULL'));

            // ✅ ELIMINAR IMAGEN ANTERIOR USANDO LA FUNCIÓN HELPER
            if ($car->car_image) {
                $this->deleteImageFromStorage($car->car_image, 'car_' . $car->id);
            }

            // Guardar nueva imagen
            $imageFile = $request->file('car_image');
            \Log::info('📤 Guardando nueva imagen: ' . $imageFile->getClientOriginalName() . ' (' . $imageFile->getSize() . ' bytes)');
            
            $imagePath = $imageFile->store('car_images', 'public');
            \Log::info('✅ Imagen guardada en: ' . $imagePath);
            
            // Redimensionar imagen (opcional, puedes comentar si hay problemas)
            try {
                $image = Image::make(storage_path('app/public/' . $imagePath));
                $image->fit(600, 400, function ($constraint) {
                    $constraint->upsize();
                    $constraint->aspectRatio();
                });
                $image->save(null, 80); // 80% calidad
                \Log::info('🖼️  Imagen redimensionada a 600x400');
            } catch (\Exception $e) {
                \Log::warning('⚠️  No se pudo redimensionar la imagen: ' . $e->getMessage());
                // Continuar aunque falle el redimensionado
            }

            // Actualizar coche en la base de datos
            $car->car_image = $imagePath;
            $car->save();
            
            // Recargar para obtener datos frescos
            $car->refresh();
            
            \Log::info('💾 Base de datos actualizada. Nueva ruta: ' . $car->car_image);

            return response()->json([
                'success' => true,
                'message' => 'Imagen del coche actualizada correctamente',
                'data' => [
                    'car_image' => Storage::url($imagePath),
                    'car_image_url' => $car->car_image_url,
                    'car' => $car->only(['id', 'license_plate', 'brand', 'model'])
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('💥 ERROR CRÍTICO en uploadCarImage: ' . $e->getMessage());
            \Log::error('📋 Traza: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Error al subir la imagen del coche',
                'error' => env('APP_DEBUG') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Eliminar imagen de perfil
     */
    public function deleteUserProfile(Request $request)
    {
        try {
            $user = $request->user();
            \Log::info('🗑️  Eliminando imagen de perfil para usuario ID: ' . $user->id);
            
            // ✅ ELIMINAR IMAGEN USANDO LA FUNCIÓN HELPER
            $deleted = false;
            if ($user->profile_image) {
                $deleted = $this->deleteImageFromStorage($user->profile_image, 'user_' . $user->id);
                $user->profile_image = null;
                $user->save();
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Imagen de perfil eliminada',
                'deleted_from_storage' => $deleted
            ]);
            
        } catch (\Exception $e) {
            \Log::error('💥 ERROR en deleteUserProfile: ' . $e->getMessage());
            return response()->json([...], 500);
        }
    }

    /**
     * Eliminar imagen de coche
     */
    public function deleteCarImage(Request $request, $carId)
    {
        \Log::info('🗑️  Entrando a deleteCarImage. Car ID: ' . $carId);
        
        try {
            $user = $request->user();
            \Log::info('👤 Usuario autenticado ID: ' . $user->id);
            
            // Obtener el coche
            $car = $user->cars()->where('cars.id', $carId)->first();
            
            if (!$car) {
                \Log::warning('🚫 Coche no encontrado o sin acceso');
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes acceso a este coche o no existe'
                ], 404);
            }
            
            \Log::info('✅ Coche encontrado: ' . $car->license_plate);
            \Log::info('📷 Imagen actual en BD: ' . ($car->car_image ?: 'NULL'));

            // ✅ ELIMINAR IMAGEN USANDO LA FUNCIÓN HELPER
            $deletedFromStorage = false;
            if ($car->car_image) {
                $deletedFromStorage = $this->deleteImageFromStorage($car->car_image, 'car_' . $car->id);
            } else {
                \Log::info('ℹ️  El coche no tiene imagen asignada en la BD');
            }

            // Actualizar la base de datos (establecer a NULL)
            $car->car_image = null;
            $car->save();
            
            \Log::info('💾 Base de datos actualizada (campo car_image = NULL)');

            return response()->json([
                'success' => true,
                'message' => 'Imagen del coche eliminada correctamente',
                'data' => [
                    'deleted_from_storage' => $deletedFromStorage,
                    'car' => $car->fresh()->only(['id', 'license_plate', 'car_image', 'car_image_url'])
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('💥 ERROR en deleteCarImage: ' . $e->getMessage());
            \Log::error('📋 Traza: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar la imagen del coche',
                'error' => env('APP_DEBUG') ? $e->getMessage() : null
            ], 500);
        }
    }
}