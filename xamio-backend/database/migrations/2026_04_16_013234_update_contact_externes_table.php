<?php
// update_contact_externes_table

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contact_externes', function (Blueprint $table) {
            // Ajouts
            $table->enum('contact_type', ['personne', 'entreprise'])
                  ->default('personne')
                  ->after('contact_id');
            $table->string('contact_referent')->nullable()
                  ->after('contact_societe')
                  ->comment('Personne de contact si entreprise');

            // contact_nom devient nullable
            // car une entreprise peut ne pas avoir de nom de personne
            $table->string('contact_nom', 100)
                  ->nullable()
                  ->change();
        });
    }

    public function down(): void
    {
        Schema::table('contact_externes', function (Blueprint $table) {
            $table->dropColumn(['contact_type', 'contact_referent']);
            $table->string('contact_nom', 100)
                  ->nullable(false)
                  ->change();
        });
    }
};