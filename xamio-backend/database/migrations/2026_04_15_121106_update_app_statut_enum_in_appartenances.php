<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('appartenances', function (Blueprint $table) {
    $table->enum('app_statut', ['actif', 'inactif', 'suspendu', 'invite'])
          ->default('actif')
          ->change();
});
    }

    /**
     * Reverse the migrations.
     */
   public function down(): void
{
    Schema::table('appartenances', function (Blueprint $table) {
        $table->enum('app_statut', ['actif', 'suspendu', 'invite'])
              ->default('actif')
              ->change();
    });
}
};
