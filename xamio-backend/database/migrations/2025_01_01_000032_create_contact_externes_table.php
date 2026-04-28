<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contact_externes', function (Blueprint $table) {
            $table->id('contact_id');
            $table->string('contact_nom', 100);
            $table->string('contact_email', 191)->unique();
            $table->string('contact_tel', 30)->nullable();
            $table->string('contact_societe', 100)->nullable();
            $table->foreignId('org_id')
                  ->constrained('organisations', 'org_id')
                  ->onDelete('cascade')
                  ->comment('Organisation propriétaire du contact — multi-tenant');
            $table->timestamps();

            // Index pour recherche rapide par email dans une organisation
            $table->index(['org_id', 'contact_email']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_externes');
    }
};
