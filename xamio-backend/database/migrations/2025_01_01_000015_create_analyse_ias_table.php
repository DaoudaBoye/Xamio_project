<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('analyse_ias', function (Blueprint $table) {
            $table->id('ia_id');
            $table->string('ia_modele')
                  ->comment('Ex: gpt-4, claude-3-sonnet');
            $table->text('ia_resume')->nullable();
            $table->json('ia_points_cles')->nullable();
            $table->enum('ia_statut', ['en_cours', 'termine', 'erreur'])
                  ->default('en_cours');
            $table->foreignId('cr_id')
                  ->constrained('compte_rendus', 'cr_id')
                  ->onDelete('cascade');
            $table->foreignId('org_id')
                  ->constrained('organisations', 'org_id')
                  ->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('analyse_ias');
    }
};
