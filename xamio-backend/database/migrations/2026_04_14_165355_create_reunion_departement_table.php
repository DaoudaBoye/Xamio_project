<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Créer la table pivot
        Schema::create('reunion_departement', function (Blueprint $table) {
            $table->unsignedBigInteger('reun_id');
            $table->unsignedBigInteger('dept_id');

            $table->foreign('reun_id')
                  ->references('reun_id')
                  ->on('reunions')
                  ->cascadeOnDelete();

            $table->foreign('dept_id')
                  ->references('dept_id')
                  ->on('departements')
                  ->cascadeOnDelete();

            $table->primary(['reun_id', 'dept_id']);
        });

        // 2. Migrer les données existantes
        DB::statement('
            INSERT INTO reunion_departement (reun_id, dept_id)
            SELECT reun_id, dept_id
            FROM reunions
            WHERE dept_id IS NOT NULL
        ');

        // 3. Supprimer l'ancienne colonne
        Schema::table('reunions', function (Blueprint $table) {
            $table->dropForeign(['dept_id']);
            $table->dropColumn('dept_id');
        });
    }

    public function down(): void
    {
        Schema::table('reunions', function (Blueprint $table) {
            $table->unsignedBigInteger('dept_id')->nullable()->after('org_id');
            $table->foreign('dept_id')
                  ->references('dept_id')
                  ->on('departements')
                  ->nullOnDelete();
        });

        DB::statement('
            UPDATE reunions r
            SET dept_id = (
                SELECT dept_id FROM reunion_departement
                WHERE reun_id = r.reun_id
                LIMIT 1
            )
        ');

        Schema::drop('reunion_departement');
    }
};