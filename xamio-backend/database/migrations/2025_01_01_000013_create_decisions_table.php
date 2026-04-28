<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('decisions', function (Blueprint $table) {
            $table->id('dec_id');
            $table->string('dec_intitule');
            $table->unsignedTinyInteger('dec_ordre');
            $table->foreignId('cr_id')
                  ->constrained('compte_rendus', 'cr_id')
                  ->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('decisions');
    }
};
