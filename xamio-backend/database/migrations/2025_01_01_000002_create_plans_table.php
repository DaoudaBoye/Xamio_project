<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->id('plan_id');
            $table->string('plan_nom');
            $table->unsignedInteger('plan_prix_fcfa')->default(0);
            $table->unsignedInteger('plan_max_users')->nullable()
                  ->comment('NULL = illimité');
            $table->boolean('plan_ia_actif')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
