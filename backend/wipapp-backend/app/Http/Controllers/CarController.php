<?php

namespace App\Http\Controllers;

use App\Models\Car;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
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
     * Crear un nuevo coche y vincularlo al usuario
     */
    public function createCar(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'license_plate' => 'required|string|max:20|unique:cars',
            'pin_code' => 'required|string|digits_between:4,6',
            'brand' => 'nullable|string|max:50',
            'model' => 'nullable|string|max:50',
            'year' => 'nullable|integer|min:1900|max:' . (date('Y') + 1),
            'color' => 'nullable|string|max:30',
            'vin' => 'nullable|string|max:17|unique:cars',
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

            // Crear el coche
            $car = Car::create($request->all());

            // Vincular el coche al usuario
            $user->linkCar($car);

            return response()->json([
                'success' => true,
                'message' => 'Coche creado y vinculado correctamente',
                'data' => [
                    'car' => $car,
                    'is_primary' => $user->cars()->where('car_id', $car->id)->first()->pivot->is_primary
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear el coche',
                'error' => $e->getMessage()
            ], 500);
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