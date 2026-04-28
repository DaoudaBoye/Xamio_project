<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('taches', function (Blueprint $table) {
            // 1. Ajouter description
            $table->text('description')->nullable()->after('tache_titre');

            // 2. Modifier tache_priorite (supprimer l'ancien enum, recréer)
            $table->dropColumn('tache_priorite');
        });

        Schema::table('taches', function (Blueprint $table) {
            $table->enum('tache_priorite', ['low', 'medium', 'high'])
                  ->default('medium')
                  ->after('description');
        });

        Schema::table('taches', function (Blueprint $table) {
            // 3. Modifier tache_colonne
            $table->dropColumn('tache_colonne');
        });

        Schema::table('taches', function (Blueprint $table) {
            $table->enum('tache_colonne', ['todo', 'inprogress', 'done'])
                  ->default('todo')
                  ->after('tache_priorite');
        });

        Schema::table('taches', function (Blueprint $table) {
            // 4. Rendre user_id nullable
            $table->foreignId('user_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('taches', function (Blueprint $table) {
            $table->dropColumn('description');
            $table->dropColumn('tache_priorite');
        });

        Schema::table('taches', function (Blueprint $table) {
            $table->enum('tache_priorite', ['basse', 'normale', 'haute', 'urgente'])
                  ->default('normale');
        });

        Schema::table('taches', function (Blueprint $table) {
            $table->dropColumn('tache_colonne');
        });

        Schema::table('taches', function (Blueprint $table) {
            $table->string('tache_colonne')->default('a_faire');
            $table->foreignId('user_id')->nullable(false)->change();
        });
    }
};