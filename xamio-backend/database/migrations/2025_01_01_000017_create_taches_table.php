<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('taches', function (Blueprint $table) {
            $table->id('tache_id');
            $table->string('tache_titre');
            $table->enum('tache_priorite', ['basse', 'normale', 'haute', 'urgente'])
                  ->default('normale');
            $table->string('tache_colonne')->default('a_faire')
                  ->comment('Kanban: a_faire | en_cours | en_revision | termine');
            $table->date('tache_echeance')->nullable();
            $table->foreignId('org_id')
                  ->constrained('organisations', 'org_id')
                  ->onDelete('cascade');
            $table->foreignId('user_id')
                  ->constrained('users')
                  ->onDelete('restrict');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('taches');
    }
};
