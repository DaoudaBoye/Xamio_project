<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('abonnements', function (Blueprint $table) {
            $table->id('abo_id');
            $table->date('abo_date_debut');
            $table->date('abo_date_fin')->nullable();
            $table->enum('abo_statut', ['actif', 'suspendu', 'expire', 'annule'])
                  ->default('actif');
            $table->unsignedInteger('abo_montant_fcfa');
            $table->foreignId('org_id')
                  ->constrained('organisations', 'org_id')
                  ->onDelete('cascade');
            $table->foreignId('plan_id')
                  ->constrained('plans', 'plan_id')
                  ->onDelete('restrict');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('abonnements');
    }
};
