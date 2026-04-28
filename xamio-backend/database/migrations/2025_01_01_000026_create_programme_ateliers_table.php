<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('programme_ateliers', function (Blueprint $table) {
            $table->id('prog_id');
            $table->time('prog_heure');
            $table->string('prog_intitule');
            $table->unsignedTinyInteger('prog_ordre');
            $table->foreignId('atelier_id')
                  ->constrained('ateliers', 'atelier_id')
                  ->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('programme_ateliers');
    }
};
