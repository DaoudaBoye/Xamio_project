<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('participant_reunions', function (Blueprint $table) {
            $table->id('part_id');
            $table->string('part_email');
            $table->enum('part_statut', ['invite', 'confirme', 'refuse', 'present'])
                  ->default('invite');
            $table->enum('part_statut_invitation', ['en_attente', 'accepte', 'refuse'])
                  ->default('en_attente');
            $table->foreignId('reun_id')
                  ->constrained('reunions', 'reun_id')
                  ->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('participant_reunions');
    }
};
