<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_chunks', function (Blueprint $table) {
            $table->id('chunk_id');
            $table->text('chunk_contenu')
                  ->comment('Texte brut du morceau');
            $table->unsignedSmallInteger('chunk_ordre')
                  ->comment('Position du chunk dans le document');
            $table->unsignedInteger('chunk_tokens')->nullable()
                  ->comment('Nombre de tokens pour le billing IA');
            $table->enum('chunk_statut', ['en_attente', 'indexe', 'erreur'])
                  ->default('en_attente');
            $table->foreignId('doc_id')
                  ->constrained('documents', 'doc_id')
                  ->onDelete('cascade');
            $table->foreignId('org_id')
                  ->constrained('organisations', 'org_id')
                  ->onDelete('cascade')
                  ->comment('Multi-tenant strict');
            $table->timestamps();

            // Index pour la recherche par document et statut
            $table->index(['doc_id', 'chunk_statut']);
            $table->index(['org_id', 'chunk_statut']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_chunks');
    }
};
