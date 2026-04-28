<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('session_rags', function (Blueprint $table) {
            $table->id('srag_id');
            $table->text('srag_question')
                  ->comment('Question posée par l\'utilisateur en langage naturel');
            $table->text('srag_reponse')->nullable()
                  ->comment('Réponse générée par le LLM');
            $table->json('srag_sources')->nullable()
                  ->comment('Chunks utilisés : [{chunk_id, doc_nom, extrait, score}]');
            $table->unsignedInteger('srag_tokens_prompt')->nullable()
                  ->comment('Tokens consommés pour le prompt');
            $table->unsignedInteger('srag_tokens_reponse')->nullable()
                  ->comment('Tokens consommés pour la réponse');
            $table->string('srag_modele', 100)->nullable()
                  ->comment('Ex: gpt-4o, claude-3-5-sonnet');
            $table->enum('srag_statut', ['en_cours', 'termine', 'erreur'])
                  ->default('en_cours');
            $table->foreignId('user_id')
                  ->constrained('users')
                  ->onDelete('cascade')
                  ->comment('Utilisateur ayant posé la question');
            $table->foreignId('org_id')
                  ->constrained('organisations', 'org_id')
                  ->onDelete('cascade')
                  ->comment('Organisation — isolation multi-tenant stricte');
            $table->timestamps();

            // Index pour l'historique par utilisateur et organisation
            $table->index(['user_id', 'org_id']);
            $table->index(['org_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('session_rags');
    }
};
