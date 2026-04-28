<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('membre_departements', function (Blueprint $table) {
            $table->id('membdept_id');
            $table->date('membdept_date_ajout');

            $table->foreignId('user_id')
                  ->constrained('users', 'id')
                  ->onDelete('cascade');

            $table->foreignId('dept_id')
                  ->constrained('departements', 'dept_id')
                  ->onDelete('cascade');

            $table->timestamps();

            // Un utilisateur ne peut appartenir qu'une fois au même département
            $table->unique(['user_id', 'dept_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('membre_departements');
    }
};
