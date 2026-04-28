<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('compte_rendus', function (Blueprint $table) {
            $table->id('cr_id');
            $table->string('cr_fichier')->nullable()
                  ->comment('Chemin fichier si uploadé manuellement');
            $table->text('cr_resume')->nullable()
                  ->comment('Résumé généré par IA');
            $table->text('cr_note')->nullable();
            $table->date('cr_date_creation');
            $table->foreignId('reun_id')
                  ->unique()
                  ->constrained('reunions', 'reun_id')
                  ->onDelete('cascade')
                  ->comment('Une réunion a au plus un CR');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('compte_rendus');
    }
};
