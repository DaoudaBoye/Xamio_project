<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('entree_agendas', function (Blueprint $table) {
            $table->id('agenda_id');
            $table->string('agenda_titre');
            $table->date('agenda_date');
            $table->string('agenda_type')->nullable()
                  ->comment('Ex: reunion, rdv, atelier, personnel');
            $table->enum('agenda_visibilite', ['prive', 'organisation'])
                  ->default('prive');
            $table->foreignId('org_id')
                  ->constrained('organisations', 'org_id')
                  ->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('entree_agendas');
    }
};
