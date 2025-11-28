<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    // ... código existente ...

    protected $fillable = [
        'name',
        'email',
        'password',
        'last_used_car_id', // ← Añadir este campo
    ];

    // ... resto del código existente ...

    /**
     * Relación muchos a muchos con Car
     */
    public function cars()
    {
        return $this->belongsToMany(Car::class, 'user_car')
                    ->withPivot('is_primary', 'last_used_at')
                    ->withTimestamps();
    }

    /**
     * Relación con el último coche usado
     */
    public function lastUsedCar()
    {
        return $this->belongsTo(Car::class, 'last_used_car_id');
    }

    /**
     * Obtener el coche principal del usuario
     */
    public function primaryCar()
    {
        return $this->cars()->wherePivot('is_primary', true)->first();
    }

    /**
     * Obtener el último coche usado (del pivote)
     */
    public function lastUsedCarFromPivot()
    {
        return $this->cars()->orderBy('user_car.last_used_at', 'desc')->first();
    }

    /**
     * Vincular un coche al usuario
     */
    public function linkCar(Car $car, $isPrimary = false)
    {
        // Si es el primer coche, hacerlo principal
        if ($this->cars()->count() === 0) {
            $isPrimary = true;
        }

        // Si se marca como principal, quitar el anterior principal
        if ($isPrimary) {
            $this->cars()->updateExistingPivot(
                $this->primaryCar()?->id, 
                ['is_primary' => false]
            );
        }

        $this->cars()->attach($car->id, [
            'is_primary' => $isPrimary,
            'last_used_at' => now()
        ]);

        // Actualizar último coche usado
        $this->update(['last_used_car_id' => $car->id]);
    }

    /**
     * Establecer un coche como principal
     */
    public function setPrimaryCar(Car $car)
    {
        // Quitar principal anterior
        $this->cars()->update(['user_car.is_primary' => false]);

        // Establecer nuevo principal
        $this->cars()->updateExistingPivot($car->id, [
            'is_primary' => true
        ]);
    }

    /**
     * Marcar un coche como último usado
     */
    public function setLastUsedCar(Car $car)
    {
        // Actualizar en la tabla pivote
        $this->cars()->updateExistingPivot($car->id, [
            'last_used_at' => now()
        ]);

        // Actualizar en el usuario
        $this->update(['last_used_car_id' => $car->id]);
    }
}