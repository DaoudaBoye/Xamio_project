<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('point_ordre_jours', function (Blueprint $table) {
            $table->id('poj_id');
            $table->string('poj_intitule');
            $table->unsignedTinyInteger('poj_ordre');
            $table->foreignId('reun_id')
                  ->constrained('reunions', 'reun_id')
                  ->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('point_ordre_jours');
    }
};
