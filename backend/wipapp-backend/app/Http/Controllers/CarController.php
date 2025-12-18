<?php

namespace App\Http\Controllers;

use App\Models\Car;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Intervention\Image\Facades\Image;
use Illuminate\Validation\Rule;
class CarController extends Controller
{
    /**
     * Obtener todos los coches del usuario
     */
    public function getUserCars(Request $request)
    {
        try {
            $user = $request->user();
            
            $cars = $user->cars()
                ->orderBy('user_car.last_used_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'cars' => $cars,
                    'last_used_car' => $cars->first(), // El más reciente por last_used_at
                    'primary_car' => $user->primaryCar(),
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los coches',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Vincular un coche existente al usuario
     */
    public function linkCar(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'license_plate' => 'required|string|max:20',
            'pin_code' => 'required|string|digits_between:4,6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = $request->user();

            // Buscar el coche por matrícula
            $car = Car::byLicensePlate($request->license_plate)->first();

            if (!$car) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontró ningún coche con esa matrícula'
                ], 404);
            }

            // Verificar el PIN
            if (!$car->verifyPin($request->pin_code)) {
                return response()->json([
                    'success' => false,
                    'message' => 'PIN incorrecto'
                ], 401);
            }

            // Verificar si el usuario ya tiene este coche vinculado
            if ($user->cars()->where('car_id', $car->id)->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ya tienes este coche vinculado'
                ], 409);
            }

            // Vincular el coche al usuario
            $user->linkCar($car);

            return response()->json([
                'success' => true,
                'message' => 'Coche vinculado correctamente',
                'data' => [
                    'car' => $car,
                    'is_primary' => $user->cars()->where('car_id', $car->id)->first()->pivot->is_primary
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al vincular el coche',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear un nuevo coche y vincularlo al usuario (con imagen)
     */
    public function createCar(Request $request)
    {
        // Validar datos básicos
        $validator = Validator::make($request->all(), [
            'license_plate' => 'required|string|max:20|unique:cars',
            'pin_code' => 'required|string|digits_between:4,6',
            'brand' => 'nullable|string|max:50',
            'model' => 'nullable|string|max:50',
            'year' => 'nullable|integer|min:1900|max:' . (date('Y') + 1),
            'color' => 'nullable|string|max:30',
            'vin' => 'nullable|string|max:17|unique:cars',
            'car_image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:5120'],
        ], [
            'car_image.image' => 'El archivo debe ser una imagen válida',
            'car_image.mimes' => 'Solo se aceptan imágenes JPEG, PNG, JPG, GIF o WEBP',
            'car_image.max' => 'La imagen no debe pesar más de 5MB',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();

        try {
            $user = $request->user();
            
            // Log para debugging
            Log::info('Creando coche para usuario: ' . $user->id);
            Log::info('Datos recibidos: ', $request->except(['pin_code']));

            // Crear el coche con los datos básicos
            $carData = $request->only([
                'license_plate', 'pin_code', 'brand', 'model', 
                'year', 'color', 'vin'
            ]);
            
            Log::info('Datos del coche a crear: ', $carData);
            
            $car = Car::create($carData);
            Log::info('Coche creado con ID: ' . $car->id);

            // Procesar imagen si se envió
            if ($request->hasFile('car_image')) {
                Log::info('Procesando imagen adjunta...');
                $this->processCarImage($car, $request->file('car_image'));
            }
            // También verificar si viene como base64 (para React Native)
            elseif ($request->has('car_image') && !$request->file('car_image')) {
                // Si es una cadena, podría ser base64
                $base64Image = $request->input('car_image');
                Log::info('Recibido campo car_image (no file): ' . substr($base64Image, 0, 100) . '...');
                if ($this->isBase64Image($base64Image)) {
                    Log::info('Es una imagen base64, procesando...');
                    $this->processBase64CarImage($car, $base64Image);
                } else {
                    Log::warning('El campo car_image no es una imagen base64 válida');
                }
            }

            // Vincular el coche al usuario
            Log::info('Vinculando coche al usuario...');
            $user->linkCar($car);

            DB::commit();
            Log::info('Transacción completada exitosamente');

            // Recargar el coche con la URL de la imagen
            $car->refresh();

            return response()->json([
                'success' => true,
                'message' => 'Coche creado y vinculado correctamente',
                'data' => [
                    'car' => $car,
                    'is_primary' => $user->cars()->where('car_id', $car->id)->first()->pivot->is_primary,
                    'image_url' => $car->car_image_url
                ]
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al crear coche: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            
            if (isset($car) && $car->exists) {
                $car->delete();
            }
            
            return response()->json([
                'success' => false,
                'message' => 'Error al crear el coche: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar imagen de un coche existente
     */
    /*
    public function updateCarImage(Request $request, Car $car)
    {
        // Validar que el usuario tiene acceso al coche
        $user = $request->user();
        if (!$user->cars()->where('car_id', $car->id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes acceso a este coche'
            ], 403);
        }

        // Validar la imagen
        $validator = Validator::make($request->all(), [
            'car_image' => ['required', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:5120'],
        ], [
            'car_image.required' => 'La imagen es requerida',
            'car_image.image' => 'El archivo debe ser una imagen válida',
            'car_image.mimes' => 'Solo se aceptan imágenes JPEG, PNG, JPG, GIF o WEBP',
            'car_image.max' => 'La imagen no debe pesar más de 5MB',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();

        try {
            // Procesar imagen si se envió
            if ($request->hasFile('car_image')) {
                Log::info('Actualizando imagen del coche ID: ' . $car->id);
                $this->processCarImage($car, $request->file('car_image'));
            }
            // También verificar si viene como base64 (para React Native)
            elseif ($request->has('car_image') && !$request->file('car_image')) {
                // Si es una cadena, podría ser base64
                $base64Image = $request->input('car_image');
                if ($this->isBase64Image($base64Image)) {
                    Log::info('Procesando imagen base64 para coche ID: ' . $car->id);
                    $this->processBase64CarImage($car, $base64Image);
                } else {
                    Log::warning('El campo car_image no es una imagen base64 válida');
                    return response()->json([
                        'success' => false,
                        'message' => 'La imagen proporcionada no es válida'
                    ], 422);
                }
            }

            DB::commit();
            Log::info('Imagen del coche actualizada exitosamente');

            // Recargar el coche con la URL de la imagen
            $car->refresh();

            return response()->json([
                'success' => true,
                'message' => 'Imagen del coche actualizada correctamente',
                'data' => [
                    'car' => $car,
                    'image_url' => $car->car_image_url
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al actualizar imagen del coche: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar la imagen del coche: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }

     */

    /**
     * Procesar imagen en base64 desde React Native
     */
    private function processBase64CarImage(Car $car, $base64Image)
    {
        try {
            // Eliminar imagen anterior si existe
            if ($car->car_image && Storage::exists('public/' . $car->car_image)) {
                Storage::delete('public/' . $car->car_image);
            }

            // Decodificar base64
            $imageData = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $base64Image));
            
            // Generar nombre único para la imagen
            $imageName = 'car_' . $car->id . '_' . time() . '.jpg';
            $imagePath = 'car_images/' . $imageName;
            
            // Guardar imagen
            Storage::disk('public')->put($imagePath, $imageData);
            
            // Redimensionar imagen
            $image = Image::make(storage_path('app/public/' . $imagePath));
            $image->fit(600, 400, function ($constraint) {
                $constraint->upsize();
                $constraint->aspectRatio();
            });
            
            // Guardar con calidad optimizada
            $image->save(storage_path('app/public/' . $imagePath), 80);

            // Actualizar coche
            $car->car_image = $imagePath;
            $car->save();

        } catch (\Exception $e) {
            throw new \Exception('Error procesando imagen: ' . $e->getMessage());
        }
    }

    /**
     * Verificar si es una imagen en base64
     */
    private function isBase64Image($string)
    {
        if (!is_string($string)) {
            return false;
        }
        
        if (preg_match('/^data:image\/(\w+);base64,/', $string, $type)) {
            return true;
        }
        
        return false;
    }

        /**
     * Procesar imagen de coche desde archivo
     */
    private function processCarImage(Car $car, $imageFile)
    {
        try {
            Log::info('Iniciando processCarImage para coche ID: ' . $car->id);
            Log::info('Nombre del archivo: ' . $imageFile->getClientOriginalName());
            Log::info('Tamaño: ' . $imageFile->getSize());
            Log::info('Tipo MIME: ' . $imageFile->getMimeType());

            // Eliminar imagen anterior si existe
            if ($car->car_image && Storage::exists('public/' . $car->car_image)) {
                Storage::delete('public/' . $car->car_image);
            }

            // Generar nombre único para la imagen
            $imageName = 'car_' . $car->id . '_' . time() . '.' . $imageFile->getClientOriginalExtension();
            $imagePath = 'car_images/' . $imageName;
            
            Log::info('Guardando imagen en: ' . $imagePath);
            
            // Guardar imagen original
            $imageFile->storeAs('car_images', $imageName, 'public');
            Log::info('Imagen guardada en storage');
            
            // Verificar que el archivo existe
            $fullPath = storage_path('app/public/car_images/' . $imageName);
            Log::info('Ruta completa: ' . $fullPath);
            Log::info('¿Existe el archivo?: ' . (file_exists($fullPath) ? 'Sí' : 'No'));
            
            // Redimensionar imagen (manteniendo proporciones)
            try {
                Log::info('Intentando redimensionar imagen...');
                $image = Image::make($fullPath);
                $image->fit(600, 400, function ($constraint) {
                    $constraint->upsize(); // No agrandar imágenes pequeñas
                    $constraint->aspectRatio(); // Mantener proporción
                });
                
                // Guardar con calidad optimizada
                $image->save($fullPath, 80);
                Log::info('Imagen redimensionada y guardada');
            } catch (\Exception $e) {
                Log::warning('Error al redimensionar imagen: ' . $e->getMessage());
                // Continuar aunque falle el redimensionamiento
            }

            // Actualizar coche
            $car->car_image = $imagePath;
            $car->save();
            Log::info('Coche actualizado con imagen: ' . $imagePath);

        } catch (\Exception $e) {
            Log::error('Error en processCarImage: ' . $e->getMessage());
            throw new \Exception('Error procesando imagen: ' . $e->getMessage());
        }
    }


    /**
     * Establecer un coche como principal
     */
    public function setPrimaryCar(Request $request, Car $car)
    {
        try {
            $user = $request->user();

            // Verificar que el usuario tiene acceso al coche
            if (!$user->cars()->where('car_id', $car->id)->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes acceso a este coche'
                ], 403);
            }

            $user->setPrimaryCar($car);

            return response()->json([
                'success' => true,
                'message' => 'Coche establecido como principal',
                'data' => [
                    'car' => $car
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al establecer el coche como principal',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Marcar un coche como último usado
     */
    public function setLastUsedCar(Request $request, Car $car)
    {
        try {
            $user = $request->user();

            // Verificar que el usuario tiene acceso al coche
            if (!$user->cars()->where('car_id', $car->id)->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes acceso a este coche'
                ], 403);
            }

            $user->setLastUsedCar($car);

            return response()->json([
                'success' => true,
                'message' => 'Último coche actualizado',
                'data' => [
                    'car' => $car
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el último coche usado',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Desvincular un coche del usuario
     */
    public function unlinkCar(Request $request, Car $car)
    {
        try {
            $user = $request->user();

            // Verificar que el usuario tiene acceso al coche
            if (!$user->cars()->where('car_id', $car->id)->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes acceso a este coche'
                ], 403);
            }

            // No permitir desvincular si es el único coche
            if ($user->cars()->count() === 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'No puedes desvincular tu único coche'
                ], 422);
            }

            $wasPrimary = $user->cars()->where('car_id', $car->id)->first()->pivot->is_primary;

            // Desvincular el coche
            $user->cars()->detach($car->id);

            // Si era el principal, establecer otro coche como principal
            if ($wasPrimary) {
                $newPrimary = $user->cars()->first();
                if ($newPrimary) {
                    $user->setPrimaryCar($newPrimary);
                }
            }

            // Si era el último coche usado, limpiar el campo
            if ($user->last_used_car_id === $car->id) {
                $user->update(['last_used_car_id' => null]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Coche desvinculado correctamente'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al desvincular el coche',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}