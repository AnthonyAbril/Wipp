<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('user_car', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('car_id')->constrained()->onDelete('cascade');
            $table->boolean('is_primary')->default(false);
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();

            // Índices únicos
            $table->unique(['user_id', 'car_id']);
        });

        // Índice adicional para asegurar solo un coche principal por usuario
        Schema::table('user_car', function (Blueprint $table) {
            $table->index(['user_id', 'is_primary']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('user_car');
    }
};