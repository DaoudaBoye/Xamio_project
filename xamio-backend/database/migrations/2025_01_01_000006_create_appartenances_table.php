<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appartenances', function (Blueprint $table) {
            $table->id('app_id');
            $table->date('app_date_ajout');
            $table->enum('app_statut', ['actif', 'suspendu', 'invite'])
                  ->default('actif');
            $table->foreignId('org_id')
                  ->constrained('organisations', 'org_id')
                  ->onDelete('cascade');
            $table->foreignId('user_id')
                  ->constrained('users')
                  ->onDelete('cascade');
            $table->foreignId('role_id')
                  ->constrained('roles', 'role_id')
                  ->onDelete('restrict');
            $table->unique(['org_id', 'user_id']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appartenances');
    }
};
