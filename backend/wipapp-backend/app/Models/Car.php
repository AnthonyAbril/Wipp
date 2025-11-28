<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Hash;

class Car extends Model
{
    use HasFactory;

    protected $fillable = [
        'license_plate',
        'pin_code',
        'brand',
        'model',
        'year',
        'color',
        'vin',
    ];

    protected $hidden = [
        'pin_code',
    ];

    /**
     * Relación muchos a muchos con User
     */
    public function users()
    {
        return $this->belongsToMany(User::class, 'user_car')
                    ->withPivot('is_primary', 'last_used_at')
                    ->withTimestamps();
    }

    /**
     * Hash del PIN code al asignarlo
     */
    public function setPinCodeAttribute($value)
    {
        $this->attributes['pin_code'] = Hash::make($value);
    }

    /**
     * Verificar el PIN code
     */
    public function verifyPin($pin)
    {
        return Hash::check($pin, $this->pin_code);
    }

    /**
     * Scope para buscar por matrícula
     */
    public function scopeByLicensePlate($query, $licensePlate)
    {
        return $query->where('license_plate', $licensePlate);
    }

    /**
     * Obtener usuarios que tienen este coche como principal
     */
    public function primaryUsers()
    {
        return $this->wherePivot('is_primary', true);
    }
}