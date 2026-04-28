<?php
// create_rdv_participants_table

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rdv_participants', function (Blueprint $table) {
            $table->id('rdv_part_id');
            $table->enum('part_statut', ['invite', 'accepte', 'refuse'])
                  ->default('invite');
            $table->string('part_statut_invitation')->nullable();
            $table->string('part_token')->nullable();

            $table->foreignId('user_id')
                  ->nullable()
                  ->constrained('users')
                  ->onDelete('cascade');
            $table->foreignId('contact_id')
                  ->nullable()
                  ->constrained('contact_externes', 'contact_id')
                  ->onDelete('cascade');
            $table->foreignId('rdv_id')
                  ->constrained('rendez_vous', 'rdv_id')
                  ->onDelete('cascade');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rdv_participants');
    }
};