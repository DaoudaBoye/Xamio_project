<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_embeddings', function (Blueprint $table) {
            $table->id('emb_id');
            $table->json('emb_vecteur')
                  ->comment('Vecteur float[] — 1536 dims pour OpenAI, 1024 pour Claude');
            $table->string('emb_modele', 100)
                  ->comment('Ex: text-embedding-3-small, embed-multilingual-v3');
            $table->foreignId('chunk_id')
                  ->constrained('document_chunks', 'chunk_id')
                  ->onDelete('cascade');
            $table->foreignId('org_id')
                  ->constrained('organisations', 'org_id')
                  ->onDelete('cascade')
                  ->comment('Multi-tenant strict — toujours filtrer par org_id');
            $table->timestamp('created_at')->useCurrent();

            // Index pour la recherche par organisation
            $table->index(['org_id', 'chunk_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_embeddings');
    }
};
