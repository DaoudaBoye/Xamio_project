<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ateliers', function (Blueprint $table) {
            $table->id('atelier_id');
            $table->string('atelier_titre');
            $table->date('atelier_date');
            $table->string('atelier_categorie')->nullable();
            $table->enum('atelier_statut', [
                'planifie', 'ouvert', 'complet', 'termine', 'annule'
            ])->default('planifie');
            $table->unsignedInteger('atelier_max_participants')->nullable();
            $table->foreignId('org_id')
                  ->constrained('organisations', 'org_id')
                  ->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ateliers');
    }
};
