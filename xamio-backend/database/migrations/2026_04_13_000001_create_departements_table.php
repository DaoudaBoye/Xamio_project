<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('departements', function (Blueprint $table) {
            $table->id('dept_id');
            $table->string('dept_nom', 100);
            $table->string('dept_description', 255)->nullable();
            $table->boolean('dept_actif')->default(true);

            $table->foreignId('org_id')
                  ->constrained('organisations', 'org_id')
                  ->onDelete('cascade');

            $table->foreignId('user_id')
                  ->nullable()
                  ->constrained('users', 'id')
                  ->onDelete('set null')
                  ->comment('Manager responsable du département');

            $table->timestamps();

            // Un nom de département est unique au sein d'une organisation
            $table->unique(['org_id', 'dept_nom']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('departements');
    }
};
