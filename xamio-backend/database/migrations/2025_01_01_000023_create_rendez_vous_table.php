<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rendez_vous', function (Blueprint $table) {
            $table->id('rdv_id');
            $table->string('rdv_titre');
            $table->date('rdv_date');
            $table->time('rdv_heure');
            $table->string('rdv_type')->nullable()
                  ->comment('Ex: client, interne, fournisseur');
            $table->enum('rdv_statut', ['planifie', 'confirme', 'annule', 'termine'])
                  ->default('planifie');
            $table->string('rdv_contact_email')->nullable();
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
        Schema::dropIfExists('rendez_vous');
    }
};
