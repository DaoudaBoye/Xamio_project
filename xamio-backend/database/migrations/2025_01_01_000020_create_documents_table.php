<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->id('doc_id');
            $table->string('doc_nom');
            $table->string('doc_type_mime', 100);
            $table->unsignedBigInteger('doc_taille_octets');
            $table->string('doc_chemin')
                  ->comment('Chemin stockage cloud S3/Azure');
            $table->string('doc_categorie')->nullable();
            $table->boolean('doc_partage')->default(false);
            $table->enum('doc_visibilite', ['prive', 'equipe', 'organisation'])
                  ->default('prive');

            // ── Colonnes RAG ──────────────────────────────────────────────
            $table->boolean('doc_indexe')->default(false)
                  ->comment('Document vectorisé et prêt pour le RAG');
            $table->unsignedInteger('doc_nb_chunks')->default(0)
                  ->comment('Nombre de chunks générés');
            $table->timestamp('doc_indexe_at')->nullable()
                  ->comment('Date de la dernière vectorisation');
            // ─────────────────────────────────────────────────────────────

            $table->foreignId('org_id')
                  ->constrained('organisations', 'org_id')
                  ->onDelete('cascade');
            $table->foreignId('user_id')
                  ->constrained('users')
                  ->onDelete('restrict')
                  ->comment('Utilisateur ayant téléversé le document');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
