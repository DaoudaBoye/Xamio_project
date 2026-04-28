<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Migrer les anciennes valeurs vers les nouvelles
        DB::statement("UPDATE actions SET action_statut = 'todo'     WHERE action_statut = 'a_faire'");
        DB::statement("UPDATE actions SET action_statut = 'fait'     WHERE action_statut = 'termine'");

        // Modifier le enum
        DB::statement("ALTER TABLE actions MODIFY COLUMN action_statut ENUM('todo', 'en_cours', 'fait', 'annule') NOT NULL DEFAULT 'todo'");
    }

    public function down(): void
    {
        DB::statement("UPDATE actions SET action_statut = 'a_faire'  WHERE action_statut = 'todo'");
        DB::statement("UPDATE actions SET action_statut = 'termine'  WHERE action_statut = 'fait'");
        DB::statement("ALTER TABLE actions MODIFY COLUMN action_statut ENUM('a_faire','en_cours','termine','annule') NOT NULL DEFAULT 'a_faire'");
    }
};