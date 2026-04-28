<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('etiquettes', function (Blueprint $table) {
            $table->id('etiq_id');
            $table->string('etiq_libelle');
            $table->string('etiq_couleur', 7)->default('#3B82F6')
                  ->comment('Couleur hex ex: #FF5733');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('etiquettes');
    }
};
