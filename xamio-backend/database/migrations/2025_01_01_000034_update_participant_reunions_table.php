<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('participant_reunions', function (Blueprint $table) {

            // ── Supprimer part_email (maintenant dans contact_externes) ──
            // Vérifier d'abord si la colonne existe
            if (Schema::hasColumn('participant_reunions', 'part_email')) {
                $table->dropColumn('part_email');
            }

            // ── Ajouter FK vers contact_externes (participant externe) ──
            $table->foreignId('contact_id')
                  ->nullable()
                  ->after('part_statut_invitation')
                  ->constrained('contact_externes', 'contact_id')
                  ->onDelete('cascade')
                  ->comment('Participant externe → contact_externes.contact_id');

            // ── Ajouter FK vers users (participant interne) ──
            $table->foreignId('user_id')
                  ->nullable()
                  ->after('contact_id')
                  ->constrained('users')
                  ->onDelete('cascade')
                  ->comment('Participant interne → users.id');
        });
    }

    public function down(): void
    {
        Schema::table('participant_reunions', function (Blueprint $table) {

            // Supprimer les FK ajoutées
            $table->dropForeign(['contact_id']);
            $table->dropForeign(['user_id']);
            $table->dropColumn(['contact_id', 'user_id']);

            // Remettre part_email
            $table->string('part_email', 191)
                  ->nullable()
                  ->after('part_id');
        });
    }
};
