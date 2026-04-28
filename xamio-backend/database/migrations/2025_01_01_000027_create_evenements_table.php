<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('evenements', function (Blueprint $table) {
            $table->id('evt_id');
            $table->string('evt_titre');
            $table->date('evt_date');
            $table->string('evt_type')->nullable();
            $table->enum('evt_statut', ['planifie', 'en_cours', 'termine', 'annule'])
                  ->default('planifie');
            $table->unsignedInteger('evt_nb_participants')->default(0);
            $table->foreignId('org_id')
                  ->constrained('organisations', 'org_id')
                  ->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evenements');
    }
};
