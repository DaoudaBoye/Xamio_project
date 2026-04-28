<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reunions', function (Blueprint $table) {
            $table->id('reun_id');
            $table->string('reun_titre');
            $table->date('reun_date');
            $table->time('reun_heure');
            $table->unsignedInteger('reun_duree_min')->nullable();
            $table->string('reun_lieu')->nullable();
            $table->enum('reun_statut', ['planifiee', 'en_cours', 'terminee', 'annulee'])
                  ->default('planifiee');
            $table->enum('reun_visibilite', ['privee', 'organisation'])
                  ->default('organisation');
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
        Schema::dropIfExists('reunions');
    }
};
