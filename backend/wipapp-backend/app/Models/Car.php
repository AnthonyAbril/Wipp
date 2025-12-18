<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Support\Facades\Storage;
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
        'car_image',
    ];

    protected $hidden = [
        'pin_code',
    ];

    // Agregar atributo calculado para URL completa de imagen
    protected $appends = ['car_image_url'];

    /**
     * Obtener la URL completa de la imagen del coche
     */
    protected function carImageUrl(): Attribute
    {
        return Attribute::make(
            get: function () {
                if (!$this->car_image) {
                    return null;
                }
                
                // Si ya es una URL completa, devolverla
                if (filter_var($this->car_image, FILTER_VALIDATE_URL)) {
                    return $this->car_image;
                }
                
                try {
                    // De lo contrario, generar URL desde Storage
                    $url = Storage::url($this->car_image);
                    
                    // Para desarrollo local, asegurar URL completa
                    if (strpos($url, 'http') !== 0) {
                        $baseUrl = rtrim(config('app.url', 'http://localhost:8000'), '/');
                        $url = $baseUrl . '/' . ltrim($url, '/');
                    }
                    
                    return $url;
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error('Error generando car_image_url: ' . $e->getMessage());
                    return null;
                }
            }
        );
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
     * Relación muchos a muchos con User
     */
    public function users()
    {
        return $this->belongsToMany(User::class, 'user_car')
                    ->withPivot('is_primary', 'last_used_at')
                    ->withTimestamps();
    }

    /**
     * Obtener usuarios que tienen este coche como principal
     */
    public function primaryUsers()
    {
        return $this->wherePivot('is_primary', true);
    }
}