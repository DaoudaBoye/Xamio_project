<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
  public function up(): void
{
    // tache_colonne
    DB::statement("ALTER TABLE taches MODIFY tache_colonne 
        ENUM('todo','inprogress','done','a_faire','en_cours','termine') 
        NOT NULL DEFAULT 'todo'");

    DB::statement("UPDATE taches SET tache_colonne = 'todo'       WHERE tache_colonne = 'a_faire'");
    DB::statement("UPDATE taches SET tache_colonne = 'inprogress' WHERE tache_colonne = 'en_cours'");
    DB::statement("UPDATE taches SET tache_colonne = 'done'       WHERE tache_colonne = 'termine'");

    DB::statement("ALTER TABLE taches MODIFY tache_colonne 
        ENUM('todo','inprogress','done') NOT NULL DEFAULT 'todo'");

    // tache_priorite — 'urgente' mappée vers 'high'
    DB::statement("ALTER TABLE taches MODIFY tache_priorite 
        ENUM('low','medium','high','basse','normale','haute','urgente') 
        NOT NULL DEFAULT 'medium'");

    DB::statement("UPDATE taches SET tache_priorite = 'low'    WHERE tache_priorite = 'basse'");
    DB::statement("UPDATE taches SET tache_priorite = 'medium' WHERE tache_priorite = 'normale'");
    DB::statement("UPDATE taches SET tache_priorite = 'high'   WHERE tache_priorite IN ('haute','urgente')");

    DB::statement("ALTER TABLE taches MODIFY tache_priorite 
        ENUM('low','medium','high') NOT NULL DEFAULT 'medium'");
}

public function down(): void
{
    // Restaurer tache_colonne
    DB::statement("ALTER TABLE taches MODIFY tache_colonne 
        ENUM('todo','inprogress','done','a_faire','en_cours','termine') 
        NOT NULL DEFAULT 'todo'");

    DB::statement("UPDATE taches SET tache_colonne = 'a_faire'  WHERE tache_colonne = 'todo'");
    DB::statement("UPDATE taches SET tache_colonne = 'en_cours' WHERE tache_colonne = 'inprogress'");
    DB::statement("UPDATE taches SET tache_colonne = 'done'     WHERE tache_colonne = 'termine'");

    DB::statement("ALTER TABLE taches MODIFY tache_colonne 
        ENUM('a_faire','en_cours','termine') NOT NULL DEFAULT 'a_faire'");

    // Restaurer tache_priorite (urgente perdue, on la laisse en haute)
    DB::statement("ALTER TABLE taches MODIFY tache_priorite 
        ENUM('low','medium','high','basse','normale','haute','urgente') 
        NOT NULL DEFAULT 'medium'");

    DB::statement("UPDATE taches SET tache_priorite = 'basse'   WHERE tache_priorite = 'low'");
    DB::statement("UPDATE taches SET tache_priorite = 'normale' WHERE tache_priorite = 'medium'");
    DB::statement("UPDATE taches SET tache_priorite = 'haute'   WHERE tache_priorite = 'high'");

    DB::statement("ALTER TABLE taches MODIFY tache_priorite 
        ENUM('basse','normale','haute','urgente') NOT NULL DEFAULT 'normale'");
}
   
};
