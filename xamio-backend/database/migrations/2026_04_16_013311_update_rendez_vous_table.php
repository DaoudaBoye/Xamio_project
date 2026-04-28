<?php
// update_rendez_vous_table

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rendez_vous', function (Blueprint $table) {
            // Suppression ancien champ
            $table->dropColumn('rdv_contact_email');

            // Ajouts
            $table->unsignedSmallInteger('rdv_duree')
                  ->default(60)
                  ->after('rdv_heure')
                  ->comment('Durée en minutes');
            $table->string('rdv_lieu')
                  ->nullable()
                  ->after('rdv_type');
            $table->text('rdv_description')
                  ->nullable()
                  ->after('rdv_lieu');
            $table->enum('rdv_visibilite', ['tous', 'direction'])
                  ->default('tous')
                  ->after('rdv_description');
            $table->json('rdv_rappels')
                  ->nullable()
                  ->after('rdv_visibilite')
                  ->comment('Ex: [60, 1440] = 1h et 24h avant');

            // FK vers contact_externe
            $table->foreignId('contact_id')
                  ->nullable()
                  ->after('rdv_rappels')
                  ->constrained('contact_externes', 'contact_id')
                  ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('rendez_vous', function (Blueprint $table) {
            $table->dropForeign(['contact_id']);
            $table->dropColumn([
                'rdv_duree',
                'rdv_lieu',
                'rdv_description',
                'rdv_visibilite',
                'rdv_rappels',
                'contact_id',
            ]);
            $table->string('rdv_contact_email')->nullable();
        });
    }
};