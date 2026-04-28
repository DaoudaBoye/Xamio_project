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
    Schema::table('participant_reunions', function (Blueprint $table) {
        $table->string('part_token', 64)->nullable()->unique()->after('part_statut_invitation');
    });
}

public function down(): void
{
    Schema::table('participant_reunions', function (Blueprint $table) {
        $table->dropColumn('part_token');
    });
}
};
