<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('actions', function (Blueprint $table) {
            $table->id('action_id');
            $table->text('action_texte');
            $table->date('action_echeance')->nullable();
            $table->enum('action_statut', ['a_faire', 'en_cours', 'termine', 'annule'])
                  ->default('a_faire');
            $table->foreignId('cr_id')
                  ->constrained('compte_rendus', 'cr_id')
                  ->onDelete('cascade');
            $table->foreignId('user_id')
                  ->constrained('users')
                  ->onDelete('restrict')
                  ->comment('Responsable de l\'action');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('actions');
    }
};
