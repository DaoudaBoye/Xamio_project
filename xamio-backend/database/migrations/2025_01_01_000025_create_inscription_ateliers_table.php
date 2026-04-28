<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inscription_ateliers', function (Blueprint $table) {
            $table->id('insc_id');
            $table->string('insc_nom');
            $table->string('insc_email');
            $table->timestamp('insc_date_inscription')->useCurrent();
            $table->foreignId('atelier_id')
                  ->constrained('ateliers', 'atelier_id')
                  ->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inscription_ateliers');
    }
};
